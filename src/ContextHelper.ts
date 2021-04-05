/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*
* @description
* Contains main rendering context for AudiOrbits
*
* @todo
* - fix camera parallax stuff
*/

import {Clock, FogExp2, PerspectiveCamera, Scene, Vector3, WebGLRenderer} from 'three';

import {ColorHelper} from './ColorHelper';
import {LevelHolder} from './LevelHelper';
import {ShaderHolder} from './ShaderHelper';
import {VRButton} from './VRButton';

import {EffectComposer} from './three/postprocessing/EffectComposer';

import Stats from './we_utils/src/Stats';
import {WEAS} from './we_utils/src/WEAS';
import {WEICUE} from './we_utils/src/WEICUE';
import {Smallog} from './we_utils/src/Smallog';
import {CSettings} from './we_utils/src/CSettings';
import {CComponent} from './we_utils/src/CComponent';
import {FancyText} from './FancyText';
import {RenderPass} from './three/postprocessing/RenderPass';

/**
* Renderer Settings
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
	cam_centered: boolean = false;

	// offtopic
	fog_thickness: number = 20;
	stats_option: number = -1;

	// mirrored setting
	scaling_factor: number = 1500;
	level_depth: number = 1200;
	num_levels: number = 8000;

	// use low latency audio?
	low_latency: boolean = false;
}

/**
* Renderer Context
*/
export class ContextHolder extends CComponent {
	// global state
	public isWebContext = false;
	public PAUSED = false;

	// webvr user input data
	private userData = {
		isSelecting: false,
		controller1: null,
		controller2: null,
	};

	public settings: ContextSettings = new ContextSettings();

	// html elements
	private mainCanvas: HTMLCanvasElement = null;

	// mouse over canvas
	private mouseX = 0;
	private mouseY = 0;

	// Three.js objects
	private renderer: WebGLRenderer = null;
	private camera: PerspectiveCamera = null;
	private scene: Scene = null;
	private stats: Stats = null;

	private composer: EffectComposer = null;
	private clock: Clock = new Clock();

	// custom render timing
	private renderTimeout = null;

	// window half size
	private windowHalfX = window.innerWidth / 2;
	private windowHalfY = window.innerHeight / 2;

	// important objects
	public textHolder: FancyText = null;

	private shaderHolder: ShaderHolder = new ShaderHolder();
	private colorHolder: ColorHelper = new ColorHelper();
	public weas: WEAS = new WEAS();

	public geoHolder: LevelHolder = new LevelHolder(this.colorHolder, this.weas);
	public weicue: WEICUE = new WEICUE(this.weas);

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
		window.addEventListener('resize', (event) => {
			this.windowHalfX = window.innerWidth / 2;
			this.windowHalfY = window.innerHeight / 2;
			if (!this.camera || !this.renderer) return;
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);

		// keep track of children settings
		this.children.push(this.colorHolder);
		this.children.push(this.shaderHolder);
		this.children.push(this.weas);
		this.children.push(this.geoHolder);
		this.children.push(this.weicue);
	}

	/**
	* initialize three-js context
	* @return {Promise} finish event
	*/
	public init(): Promise<void> {
		return new Promise(async (resolve) => {
			// get canvas container
			const cont = document.getElementById('renderContainer');

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

			// dont use depth buffer on low quality
			const qual = this.settings.shader_quality < 3 ? (this.settings.shader_quality < 2 ? 'low' : 'medium') : 'high';
			const dBuffer = this.settings.shader_quality > 1;
			const shaderP = qual + 'p';

			// create camera
			const viewDist = this.settings.num_levels * this.settings.level_depth * (this.settings.cam_centered ? 0.5 : 1);
			this.camera = new PerspectiveCamera(this.settings.field_of_view, window.innerWidth / window.innerHeight, 3, viewDist * 1.2);

			// create scene
			this.scene = new Scene();

			// create distance fog
			this.scene.fog = new FogExp2(0x000000, 0.00001 + this.settings.fog_thickness / viewDist / 69);

			// create render-context
			this.renderer = new WebGLRenderer({
				alpha: true,
				antialias: false,
				canvas: this.mainCanvas,
				logarithmicDepthBuffer: dBuffer,
				powerPreference: this.getPowerPreference(),
				precision: shaderP,
			});
			this.renderer.setClearColor(0x000000, 0);
			this.renderer.setSize(window.innerWidth, window.innerHeight);

			// initialize VR mode
			if (this.isWebContext) this.initWebXR();

			// initialize shader composer
			this.composer = new EffectComposer(this.renderer, shaderP);
			this.composer.addPass(new RenderPass(this.scene, this.camera, null, 0x000000, 1));

			// initialize shaders
			this.shaderHolder.init(this.composer);

			// initialize statistics
			if (this.settings.stats_option >= 0) {
				Smallog.debug('Init stats: ' + this.settings.stats_option);
				// eslint-disable-next-line new-cap
				this.stats = Stats();
				this.stats.showPanel(this.settings.stats_option); // 0: fps, 1: ms, 2: mb, 3+: custom
				document.body.appendChild(this.stats.dom);
			}

			// initialize fancy text
			this.showMessage(document.title);

			// initialize colors if not done already
			await this.colorHolder.updateSettings();

			// initialize main geometry
			await this.geoHolder.init(this.scene, this.camera);
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
	* update shader values
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
		if (this.isWebContext) {
			this.handleVRController(this.userData.controller1);
			this.handleVRController(this.userData.controller1);
		}
	}

	/**
	* called after any setting changed
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
	* @param {boolean} render Start | Stop
	*/
	public setRenderer(render: boolean) {
		Smallog.debug('setRenderer: ' + render);

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
				this.renderer.setAnimationLoop(() => this.renderLoop());
			} else Smallog.Error('not initialized!');
			// show again
			this.mainCanvas.classList.add('show');
		} else {
			this.PAUSED = this.weicue.PAUSED = true;
			this.mainCanvas.classList.remove('show');
		}
	}

	/**
	* repeated render frame call
	*/
	private renderLoop() {
		// paused - stop render
		if (this.PAUSED) return;

		// custom rendering needs manual re-call
		if (this.renderTimeout) {
			this.renderTimeout = setTimeout(() => this.renderLoop(), 1000 / this.settings.fps_value);
		}

		// track FPS, mem etc.
		if (this.stats) {
			this.stats.begin();
		}
		// Figure out how much time passed since the last animation and calc delta
		// Minimum we should reach is 1 FPS
		const ellapsed = Math.min(1, Math.max(0.001, this.clock.getDelta()));
		const delta = ellapsed * 60;

		// render before updating
		if (!this.settings.low_latency) this.composer.render(ellapsed);

		// update objects
		this.colorHolder.updateFrame(ellapsed, delta);
		this.geoHolder.updateFrame(ellapsed, delta);
		this.updateFrame(ellapsed, delta);

		// render after updating
		// this saves 1 frame (7-16 ms) audio delay but may cause stutter
		if (this.settings.low_latency) this.composer.render(ellapsed);

		// ICUE PROCESSING
		this.weicue.updateCanvas(this.mainCanvas);

		// end stats
		if (this.stats) {
			this.stats.end();
		}
	}


	// /////////////////////////////////////////////
	// WEB-VR INTEGRATION
	// /////////////////////////////////////////////

	/**
	* will initialize webvr components and rendering
	*/
	private initWebXR() {
		this.renderer.xr.enabled = true;
		document.body.appendChild(new VRButton().createButton(this.renderer));

		this.userData.controller1 = this.renderer.xr.getController(0);
		this.userData.controller1.addEventListener('selectstart', this.onVRSelectStart);
		this.userData.controller1.addEventListener('selectend', this.onVRSelectEnd);
		this.scene.add(this.userData.controller1);

		this.userData.controller2 = this.renderer.xr.getController(1);
		this.userData.controller2.addEventListener('selectstart', this.onVRSelectStart);
		this.userData.controller2.addEventListener('selectend', this.onVRSelectEnd);
		this.scene.add(this.userData.controller2);
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
