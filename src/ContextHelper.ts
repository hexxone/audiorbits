/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*/

import {Clock, Color, Fog, PerspectiveCamera, Scene, Vector3, WebGLRenderer, XRFrame} from 'three';

import {ColorHelper} from './ColorHelper';
import {GeometryHolder} from './GeometryHelper';
import {ShaderHolder} from './ShaderHelper';
import {FancyText} from './FancyText';

import {CComponent, CSettings, EffectComposer, FPStats, rgbToObj, Smallog, WEAS, WEICUE, XRHelper} from './we_utils';

export const NEAR_DIST = 3;

/**
* Renderer Settings
* @public
*/
class ContextSettings extends CSettings {
	// Camera category
	parallax_option: number = 0;
	parallax_angle: number = 180;
	parallax_strength: number = 3;
	auto_parallax_speed: number = 2;
	parallax_cam: boolean = true;
	field_of_view: number = 90;
	custom_fps: boolean = false;
	fps_value: number = 60;
	shader_quality: number = 1;
	xr_mode: boolean = false;

	// AudiOrbits bg Color; used as "fog"-color aswell
	public main_color: string = '0 0 0';

	// offtopic
	fog_thickness: number = 20;

	// mirrored setting
	scaling_factor: number = 1500;
	level_depth: number = 1200;
	num_levels: number = 8000;

	// use low latency audio?
	low_latency: boolean = false;
	debugging: boolean = false;
}

/**
* Contains main rendering context for AudiOrbits
* @public
*/
export class ContextHelper extends CComponent {
	/** @public global state */
	public PAUSED = false;

	/** @public */
	public settings: ContextSettings = new ContextSettings();

	// webvr user input data
	private userData = {
		isSelecting: false,
		controller1: null,
		controller2: null,
	};

	// html elements
	private mainCanvas: HTMLCanvasElement = null;

	// mouse over canvas
	private mouseX = 0;
	private mouseY = 0;

	// Three.js objects
	private renderer: WebGLRenderer = null;
	private camera: PerspectiveCamera = null;
	private scene: Scene = null;

	private composer: EffectComposer = null;
	private clock: Clock = new Clock();

	// custom render timing
	private renderTimeout = null;

	// window half size
	private windowHalfX = window.innerWidth / 2;
	private windowHalfY = window.innerHeight / 2;

	private textHolder: FancyText = null;

	// important objects
	private weas: WEAS = new WEAS();
	private colorHolder: ColorHelper = new ColorHelper();
	private lvlHolder: GeometryHolder = new GeometryHolder(this.colorHolder, this.weas);
	private shaderHolder: ShaderHolder = new ShaderHolder(this.weas);
	private weicue: WEICUE = new WEICUE(this.weas);
	private stats: FPStats = new FPStats(this.weas);
	private xrHelper: XRHelper = new XRHelper();


	/**
	* add global listeners
	*/
	constructor() {
		super();

		// mouse listener
		const mouseUpdate = (event) => {
			if (this.settings.parallax_option != 1) return;
			if (event.touches && event.touches.length == 1) {
				event.preventDefault();
				this.mouseX = event.touches[0].pageX - this.windowHalfX;
				this.mouseY = event.touches[0].pageY - this.windowHalfY;
			} else if (event.clientX) {
				this.mouseX = event.clientX - this.windowHalfX;
				this.mouseY = event.clientY - this.windowHalfY;
			}
		};
		document.addEventListener('touchstart', mouseUpdate, false);
		document.addEventListener('touchmove', mouseUpdate, false);
		document.addEventListener('mousemove', mouseUpdate, false);

		// scaling listener
		window.addEventListener('resize', (e) => this.onResize(e), false);

		// keep track of children settings
		this._internal_children.push(this.weas);
		this._internal_children.push(this.colorHolder);
		this._internal_children.push(this.shaderHolder);
		this._internal_children.push(this.weicue);
		this._internal_children.push(this.stats);
		this._internal_children.push(this.lvlHolder);
		this._internal_children.push(this.xrHelper);
	}

	/**
	 * apply resizing
	 * @param {UIEvent} event
	 */
	private onResize(event): void {
		const iW = window.innerWidth;
		const iH = window.innerHeight;
		this.windowHalfX = iW / 2;
		this.windowHalfY = iH / 2;
		if (!this.camera || !this.renderer) return;
		this.camera.aspect = iW / iH;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(iW, iH);
		this.composer.setSize(iW, iH);
	}

	/**
	* initialize three-js context
	* @public
	* @param {Promise} waitFor (optional) wait for this promise before rendering
	* @return {Promise} finish event
	*/
	public init(waitFor?: Promise<void>): Promise<void> {
		return new Promise(async (resolve) => {
			Smallog.debug('init Context...');

			// get canvas container
			const cont = document.getElementById('renderContainer');
			// distance
			const viewDist = this.settings.num_levels * this.settings.level_depth * (this.settings.xr_mode ? 1 : 2);
			// color
			const colObj = rgbToObj(this.settings.main_color);
			const fogCol = new Color(colObj.r, colObj.g, colObj.b).getHexString();
			// precision
			const prec = this.getPrecisionPref();


			// destroy old context
			if (this.renderer) this.renderer.forceContextLoss();
			if (this.composer) this.composer.reset();
			if (this.mainCanvas) cont.removeChild(this.mainCanvas);

			// get canvases & contexts
			// ensure the canvas sizes are set !!!
			// these are independent from the style sizes
			this.mainCanvas = document.createElement('canvas');
			this.mainCanvas.id = 'mainCvs';
			this.mainCanvas.width = window.innerWidth;
			this.mainCanvas.height = window.innerHeight;
			cont.appendChild(this.mainCanvas);

			// create camera
			this.camera = new PerspectiveCamera(this.settings.field_of_view, window.innerWidth / window.innerHeight, NEAR_DIST, viewDist);

			// create scene
			this.scene = new Scene();
			// this.scene.fog = new FogExp2(fogCol, 0.00001 + this.settings.fog_thickness / viewDist / 69);
			this.scene.fog = new Fog(fogCol, NEAR_DIST, this.settings.fog_thickness / viewDist / 21);

			// create render-context
			this.renderer = new WebGLRenderer({
				alpha: true,
				antialias: false,
				canvas: this.mainCanvas,
				logarithmicDepthBuffer: true,
				powerPreference: this.getPowerPreference(),
				precision: prec,
			});
			this.renderer.setClearColor(fogCol, 0);
			this.renderer.setSize(window.innerWidth, window.innerHeight);

			// initialize VR mode
			this.initWebXR();

			// initialize shader composer
			this.composer = new EffectComposer(this.scene, this.camera, this.renderer, prec, fogCol);

			// add shaders
			this.shaderHolder.init(this.composer);

			// initialize colors if not done already
			await this.colorHolder.updateSettings();

			// initialize main geometry
			await this.lvlHolder.init(this.scene, this.camera, waitFor);

			// precompile shaders
			this.composer.precompile();

			// show fancy text
			this.showMessage(document.title);

			// start rendering
			this.setRenderer(true);

			resolve();
		});
	}

	/**
	* clamp camera position
	* @param {number} axis current value
	* @return {number} clamped value
	*/
	private clampCam(axis) {
		return Math.min(this.settings.scaling_factor / 2, Math.max(-this.settings.scaling_factor / 2, axis));
	}

	/**
	* update camera values
	* @param {number} ellapsed ms
	* @param {number} deltaTime multiplier ~1
	*/
	private updateFrame(ellapsed, deltaTime) {
		// update camera
		const newXPos = this.clampCam(this.mouseX * this.settings.parallax_strength / 70);
		const newYPos = this.clampCam(this.mouseY * this.settings.parallax_strength / -90);

		const transformPosition = this.settings.parallax_cam ? this.camera.position : this.scene.position;
		if (transformPosition.x != newXPos) {
			transformPosition.x += (newXPos - transformPosition.x) * deltaTime * 0.05;
		}
		if (transformPosition.y != newYPos) {
			transformPosition.y += (newYPos - transformPosition.y) * deltaTime * 0.05;
		}

		if (this.settings.parallax_cam) {
			// calculated point is position (parallax)
			this.camera.position.set(transformPosition.x, transformPosition.y, transformPosition.z);
			this.camera.lookAt(new Vector3(0, 0, -this.settings.level_depth / 2).add(this.scene.position));
		} else {
			// calculated point is look-at (inverted)
			const pShort = this.scene.position;
			this.camera.position.set(pShort.x, pShort.y, pShort.z);
			this.camera.lookAt(transformPosition);
		}

		// WEBVR PROCESSING
		if (this.settings.xr_mode) {
			this.handleVRController(this.userData.controller1);
			this.handleVRController(this.userData.controller1);
		}
	}

	/**
	* called after any setting changed
	* @public
	* @return {Promise} finish event
	*/
	public updateSettings(): Promise<void> {
		// fix for centered camera on Parallax "none"
		if (this.settings.parallax_option == 0) this.mouseX = this.mouseY = 0;
		// set Cursor for "fixed" parallax mode
		if (this.settings.parallax_option == 3) this.positionMouseAngle(this.settings.parallax_angle);
		return Promise.resolve();
	}


	// /////////////////////////////////////////////
	// RENDERING
	// /////////////////////////////////////////////

	/**
	* start or stop rendering
	* @public
	* @param {boolean} render Start | Stop
	*/
	public setRenderer(render: boolean) {
		Smallog.debug('setRender: ' + render);

		// clear all old renderers
		if (this.renderer) {
			this.renderer.setAnimationLoop(null);
		}
		if (this.renderTimeout) {
			clearTimeout(this.renderTimeout);
			this.renderTimeout = null;
		}
		// call new renderer ?
		if (render) {
			// set state to running
			this.PAUSED = this.weicue.PAUSED = false;
			// initialize rendering
			if (this.settings.custom_fps) {
				this.renderTimeout = setTimeout(() => this.renderLoop(), 1000 / this.settings.fps_value);
			} else if (this.renderer) {
				this.renderer.setAnimationLoop((t, f) => this.renderLoop(t, f));
			} else Smallog.error('not initialized!');
			// show again
			this.mainCanvas.classList.add('show');
		} else {
			this.PAUSED = this.weicue.PAUSED = true;
			this.mainCanvas.classList.remove('show');
		}
	}

	/**
	* repeated render frame call
	* @param {number} time
	* @param {XRFrame} frame XR Frame
	*/
	private renderLoop(time?: number, frame?: XRFrame) {
		// paused - stop render
		if (this.PAUSED) return;
		const sett = this.settings;

		// custom rendering needs manual re-call
		if (this.renderTimeout) {
			this.renderTimeout = setTimeout(() => this.renderLoop(), 1000 / sett.fps_value);
		}

		// Figure out how much time passed since the last animation and calc delta
		// Minimum we should reach is 1 FPS
		const ellapsed = Math.min(1, Math.max(0.001, this.clock.getDelta()));
		const delta = ellapsed * 60;

		// render before updating
		if (!sett.low_latency) this.timeRender(ellapsed, frame);

		// track CPU
		this.stats.begin(true);

		// update objects
		this.colorHolder.updateFrame(ellapsed, delta);
		this.lvlHolder.updateFrame(ellapsed, delta);
		this.shaderHolder.updateFrame(ellapsed, delta);
		this.updateFrame(ellapsed, delta);

		// track CPU
		this.stats.end(true);

		// render after updating
		// this saves 1 frame (7-16 ms) audio delay but may cause stutter
		if (sett.low_latency) this.timeRender(ellapsed, frame);

		// update tracked stats
		if (sett.debugging) this.stats.update();
	}

	/**
	* Render timing wrapper
	* @param {number} ellapsed
	* @param {XRFrame} frame
	*/
	private timeRender(ellapsed: number, frame: XRFrame) {
		// track GPU
		this.stats.begin(false);

		// render with effects
		this.composer.render(ellapsed, frame);

		// ICUE PROCESSING
		this.weicue.updateCanvas(this.mainCanvas);
		// track GPU
		this.stats.end(false);
	}


	// /////////////////////////////////////////////
	// WEB-VR INTEGRATION
	// /////////////////////////////////////////////

	/**
	* will initialize webvr components and rendering
	*/
	private initWebXR() {
		if (!this.settings.xr_mode) return;

		this.xrHelper.enableSession((xrs) => {
			const enable = xrs !== null;
			this.renderer.xr.setSession(xrs);
			this.renderer.xr.enabled = true;

			if (enable) {
				this.userData.controller1 = this.renderer.xr.getController(0);
				this.userData.controller1.addEventListener('selectstart', this.onVRSelectStart);
				this.userData.controller1.addEventListener('selectend', this.onVRSelectEnd);
				this.scene.add(this.userData.controller1);

				this.userData.controller2 = this.renderer.xr.getController(1);
				this.userData.controller2.addEventListener('selectstart', this.onVRSelectStart);
				this.userData.controller2.addEventListener('selectend', this.onVRSelectEnd);
				this.scene.add(this.userData.controller2);
			} else {
				if (this.userData.controller1) this.scene.remove(this.userData.controller1);
				if (this.userData.controller2) this.scene.remove(this.userData.controller2);
			}
		}).then((succ) => {
			if (succ) Smallog.debug('Initialized WebXR !');
			else Smallog.error('Initializing WebXR failed.');
		});
	}

	/**
	* VR controller starts selecting
	*/
	private onVRSelectStart() {
		this.userData.isSelecting = true;
	}

	/**
	* VR controller stops selecting
	*/
	private onVRSelectEnd() {
		this.userData.isSelecting = false;
	}

	/**
	* @todo
	* use VR controller like mouse & parallax
	* @param {Object} controller left or right
	*/
	private handleVRController(controller) {
		/*
		controller.userData.isSelecting
		controller.position
		controller.quaternion
		*/
	}


	// /////////////////////////////////////////////
	// HELPER
	// /////////////////////////////////////////////

	/**
	* use overall "quality" setting to determine three.js "power" mode
	* @return {string} three.js power mode
	*/
	private getPowerPreference() {
		switch (this.settings.shader_quality) {
		case 1: return 'low-power';
		case 3: return 'high-performance';
		default: return 'default';
		}
	}

	/**
	* use overall "quality" setting to determine three.js "power" mode
	* @return {string} three.js power mode
	*/
	private getPrecisionPref() {
		switch (this.settings.shader_quality) {
		case 1: return 'lowp';
		case 3: return 'highp';
		default: return 'mediump';
		}
	}

	/**
	* @todo
	* shows a fancy text mesage
	* @param {string} msg text to show
	*/
	private showMessage(msg: string) {
		// TODO Fix
		const cPos = this.camera.position;
		const tPos = new Vector3(0, 0, this.settings.level_depth).add(cPos);
		this.textHolder = new FancyText(this.scene, tPos, cPos, msg);
	}

	/**
	* position Mouse with angle
	* @public
	* @param {number} degrees angle
	*/
	public positionMouseAngle(degrees) {
		const ang = degrees * Math.PI / 180;
		let w = window.innerHeight;
		if (window.innerWidth < w) w = window.innerWidth;
		w /= 2;
		this.mouseX = w * Math.sin(ang);
		this.mouseY = w * Math.cos(ang);
	}
}
