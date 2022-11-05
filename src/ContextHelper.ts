/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2022 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

import { ColorHelper } from "./ColorHelper";
import { GeometryHolder } from "./GeometryHelper";
import { ShaderHolder } from "./ShaderHelper";
import { FancyText } from "./FancyText";

import {
	CComponent,
	CSettings,
	EffectComposer,
	FPStats,
	Smallog,
	WEAS,
	WEICUE,
	XRHelper,
	LoadHelper,
} from "we_utils/src";

import {
	WebGLRenderer,
	Group,
	PerspectiveCamera,
	Scene,
	Clock,
	Color,
	Vector3,
	Fog,
} from "three.ts/src";

import { NEAR_DIST } from "./Consts";

/**
 * Renderer Settings
 * @public
 */
class ContextSettings extends CSettings {
	// Camera category
	parallax_option = 0;
	parallax_angle = 180;
	parallax_strength = 3;
	auto_parallax_speed = 2;
	parallax_cam = true;
	field_of_view = 90;
	custom_fps = false;
	fps_value = 60;
	shader_quality = 1;
	xr_mode = false;

	// AudiOrbits bg Color; used as "fog"-color aswell
	main_color = "0 0 0";

	// mirrored setting
	fog_thickness = 20;
	scaling_factor = 1500;
	level_depth = 1200;
	num_levels = 8000;

	// use low latency audio?
	low_latency = false;
	debugging = false;
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

	private loadHelper: LoadHelper;

	// webvr user input data
	private userData = {
		isSelecting: false,
		controller1: null as Group | null,
		controller2: null as Group | null,
	};

	// html elements
	private mainCanvas: HTMLCanvasElement | undefined;

	// mouse over canvas
	private mouseX = 0;
	private mouseY = 0;

	// Three.js objects
	private renderer?: WebGLRenderer;
	private camera?: PerspectiveCamera;
	private cameraPosition?: Vector3;
	private scene?: Scene;

	private composer?: EffectComposer;
	private clock: Clock = new Clock();

	// custom render timing
	private renderTimeout: NodeJS.Timeout | null = null;

	// window half size
	private windowHalfX = window.innerWidth / 2;
	private windowHalfY = window.innerHeight / 2;

	private textHolder?: FancyText;

	// important objects
	private weas: WEAS = new WEAS();
	private colorHolder: ColorHelper = new ColorHelper();
	private shaderHolder: ShaderHolder = new ShaderHolder(this.weas);
	private weicue: WEICUE = new WEICUE(this.weas);
	private stats: FPStats = new FPStats(this.weas);
	private xrHelper: XRHelper = new XRHelper();

	private geoHolder: GeometryHolder;

	/**
	 * add global listeners
	 * @param {LoadHelper} loadHelper LoadHelper
	 */
	constructor(loadHelper: LoadHelper) {
		super();
		this.loadHelper = loadHelper;
		this.geoHolder = new GeometryHolder(
			this.colorHolder,
			this.weas,
			this.loadHelper
		);

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
		document.addEventListener("touchstart", mouseUpdate, false);
		document.addEventListener("touchmove", mouseUpdate, false);
		document.addEventListener("mousemove", mouseUpdate, false);

		// scaling listener
		window.addEventListener("resize", () => this.onResize(), false);

		// keep track of children settings
		this.children.push(this.weas);
		this.children.push(this.colorHolder);
		this.children.push(this.shaderHolder);
		this.children.push(this.weicue);
		this.children.push(this.stats);
		this.children.push(this.geoHolder);
		this.children.push(this.xrHelper);
	}

	/**
	 * apply resizing
	 * @param {UIEvent} event resize event
	 * @return {void}
	 */
	private onResize(): void {
		const iW = window.innerWidth;
		const iH = window.innerHeight;
		this.windowHalfX = iW / 2;
		this.windowHalfY = iH / 2;
		if (!this.camera || !this.renderer) return;
		this.camera.aspect = iW / iH;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(iW, iH);
		this.composer?.setSize(iW, iH);
	}

	/**
	 * initialize three-js context
	 * @public
	 * @param {Promise} waitFor (optional) wait for this promise before rendering
	 * @return {Promise} finish event
	 */
	public init(waitFor?: Promise<void>): Promise<void> {
		return new Promise((res, rej) => {
			Smallog.debug("init Context...");

			// get canvas container
			const cont = document.getElementById("renderContainer");
			if (!cont) throw new Error("Missing #renderContainer");

			// distance
			const viewDist =
				this.settings.num_levels *
				this.settings.level_depth *
				(this.settings.xr_mode ? 1 : 2);
			// precision
			const prec = this.getPrecisionPref();

			// destroy old context
			if (this.renderer) this.renderer.forceContextLoss();
			if (this.composer) this.composer.reset();
			if (this.mainCanvas) cont.removeChild(this.mainCanvas);

			// get canvases & contexts
			// ensure the canvas sizes are set !!!
			// these are independent from the style sizes
			this.mainCanvas = document.createElement("canvas");
			this.mainCanvas.id = "mainCvs";
			this.mainCanvas.width = window.innerWidth;
			this.mainCanvas.height = window.innerHeight;
			cont.appendChild(this.mainCanvas);

			// create camera
			this.camera = new PerspectiveCamera(
				this.settings.field_of_view,
				window.innerWidth / window.innerHeight,
				NEAR_DIST,
				viewDist
			);
			this.cameraPosition = this.camera.position;

			// create scene
			this.scene = new Scene();
			// this.scene.fog = new FogExp2(
			// 	this.colorHolder.colorObject.main.getHexString(),
			// 	0.00001 + this.settings.fog_thickness / viewDist / 15
			// );
			this.scene.fog = new Fog(
				new Color(0, 0, 0),
				NEAR_DIST,
				(viewDist * (100 - this.settings.fog_thickness)) / 250
			);

			// create render-context
			this.renderer = new WebGLRenderer({
				alpha: true,
				antialias: false,
				canvas: this.mainCanvas,
				logarithmicDepthBuffer: true,
				powerPreference: this.getPowerPreference(),
				precision: prec,
			});
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			this.renderer.setClearColor(0x000000, 0);

			// initialize VR mode
			this.initWebXR();

			// initialize shader composer
			this.composer = new EffectComposer(
				this.scene,
				this.camera,
				this.renderer,
				prec,
				0x000000
			);

			// add shaders
			this.shaderHolder.init(this.composer);

			// initialize colors if not done already
			this.colorHolder.updateSettings();

			// eslint-disable-next-line no-async-promise-executor
			const newWait = new Promise<void>(async (resolve) => {
				// precompile shaders
				this.composer?.precompile();

				// initialize weas
				if (this.weas.init) await this.weas.init();
				this.loadHelper.setProgress(this.loadHelper.progress + 5);

				// wait for seizure warning
				if (waitFor) await waitFor;

				// return Controlflow
				resolve();
			});

			this.loadHelper.setText("Objects");
			this.loadHelper.setProgress(10);

			// initialize main geometry
			this.geoHolder
				.init(this.scene, this.camera, newWait)
				.then(() => {
					this.loadHelper.show(false);
					// show fancy text
					this.showMessage(document.title);
					// start rendering
					this.setRenderer(true);
					// resolve promise
					res();
				})
				.catch(rej);
		});
	}

	/**
	 * clamp camera position
	 * @param {number} axis current value
	 * @return {number} clamped value
	 */
	private clampCam(axis) {
		return Math.min(
			this.settings.scaling_factor / 2,
			Math.max(-this.settings.scaling_factor / 2, axis)
		);
	}

	/**
	 * update camera values
	 * @param {number} ellapsed ms
	 * @param {number} deltaTime multiplier ~1
	 * @return {void}
	 */
	private updateFrame(ellapsed, deltaTime) {
		if (!this.camera || !this.cameraPosition) {
			// eslint-disable-next-line no-debugger
			debugger;
			return;
		}

		if (this.settings.xr_mode) {
			// WEBVR PROCESSING
			// will automagically update the camera, no need to do it manually
			this.handleVRController(this.userData?.controller1);
			this.handleVRController(this.userData?.controller1);
		} else {
			// NORMAL PROCESSING
			// constantly use/control mouse position to make it smooth

			const newXPos = this.clampCam(
				(this.mouseX * this.settings.parallax_strength) / 70
			);
			const newYPos = this.clampCam(
				(this.mouseY * this.settings.parallax_strength) / -90
			);
			// lerp to new position
			const cPos = this.camera.position;
			if (cPos.x != newXPos) {
				cPos.x += (newXPos - cPos.x) * deltaTime * 0.05;
			}
			if (cPos.y != newYPos) {
				cPos.y += (newYPos - cPos.y) * deltaTime * 0.05;
			}

			const depthVector = new Vector3(0, 0, -this.settings.level_depth / 2);

			if (this.settings.parallax_cam) {
				// target is center origin - depth (parallax)
				this.camera.lookAt(depthVector.add(this.cameraPosition));
			} else {
				// target is camera position - depth (no parallax)
				this.camera.lookAt(depthVector.add(cPos));
			}
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
		if (this.settings.parallax_option == 3)
			this.positionMouseAngle(this.settings.parallax_angle);

		return Promise.resolve();
	}

	// /////////////////////////////////////////////
	// RENDERING
	// /////////////////////////////////////////////

	/**
	 * start or stop rendering
	 * @public
	 * @param {boolean} render Start | Stop
	 * @return {void}
	 */
	public setRenderer(render: boolean) {
		Smallog.debug("setRender: " + render);

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
				this.renderTimeout = setTimeout(
					() => this.renderLoop(),
					1000 / this.settings.fps_value
				);
			} else if (this.renderer) {
				this.renderer.setAnimationLoop((t, f) => this.renderLoop(t, f));
			} else {
				Smallog.error("not initialized!");
			}
			// show again
			this.mainCanvas.classList.add("show");
		} else {
			this.PAUSED = this.weicue.PAUSED = true;
			this.mainCanvas.classList.remove("show");
		}
	}

	/**
	 * repeated render frame call
	 * @param {number} time second fraction
	 * @param {XRFrame} frame XR Frame
	 * @return {void}
	 */
	private renderLoop(time?: number, frame?: XRFrame) {
		// paused - stop render
		if (this.PAUSED) return;
		const sett = this.settings;

		// custom rendering needs manual re-call
		if (this.renderTimeout) {
			this.renderTimeout = setTimeout(
				() => this.renderLoop(),
				1000 / sett.fps_value
			);
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
		this.geoHolder.updateFrame(ellapsed, delta);
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
	 * @param {number} ellapsed time
	 * @param {XRFrame} frame XR Frame
	 * @return {void}
	 */
	private timeRender(ellapsed: number, frame: XRFrame) {
		// track GPU
		this.stats.begin(false);

		// render without effects
		//this.renderer.render(this.scene, this.camera);

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
	 * @return {void}
	 */
	private initWebXR() {
		if (!this.settings.xr_mode) return;

		this.xrHelper
			.enableSession((xrs) => {
				const enable = xrs !== null;
				this.renderer.xr.setSession(xrs);
				this.renderer.xr.enabled = true; // TODO this correct?

				if (enable) {
					const regCon = (con: Group) => {
						con.addEventListener("selectstart", this.onVRSelectStart);
						con.addEventListener("selectend", this.onVRSelectEnd);
						this.scene.add(con);
					};
					// get first controller
					const c1 = this.renderer.xr.getController(0);
					if (c1) {
						regCon(c1);
						this.userData.controller1 = c1;
						// only need to check for a 2nd controller if there is a first?
						const c2 = this.renderer.xr.getController(1);
						if (c2) {
							regCon(c2);
							this.userData.controller2 = c2;
						}
					}
				} else {
					if (this.userData.controller1)
						this.scene.remove(this.userData.controller1);
					if (this.userData.controller2)
						this.scene.remove(this.userData.controller2);
				}
			})
			.then((succ) => {
				if (succ) Smallog.info("Initialized WebXR!");
				else Smallog.error("Initializing WebXR failed.");
			});
	}

	/**
	 * VR controller starts selecting
	 * @return {void}
	 */
	private onVRSelectStart() {
		this.userData.isSelecting = true;
	}

	/**
	 * VR controller stops selecting
	 * @return {void}
	 */
	private onVRSelectEnd() {
		this.userData.isSelecting = false;
	}

	/**
	 * @todo
	 * use VR controller like mouse & parallax
	 * @param {Group | null} controller left or right
	 * @return {void}
	 */
	private handleVRController(controller: Group | null) {
		/*
		controller.userData.isSelecting
		controller.position
		controller.quaternion
		*/
		// eslint-disable-next-line no-debugger
		if (controller) debugger;
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
			case 1:
				return "low-power";
			case 3:
				return "high-performance";
			default:
				return "default";
		}
	}

	/**
	 * use overall "quality" setting to determine three.js "power" mode
	 * @return {string} three.js power mode
	 */
	private getPrecisionPref() {
		switch (this.settings.shader_quality) {
			case 1:
				return "lowp";
			case 3:
				return "highp";
			default:
				return "mediump";
		}
	}

	/**
	 * @todo
	 * shows a fancy text mesage
	 * @param {string} msg text to show
	 * @return {void}
	 */
	private showMessage(msg: string) {
		// @TODO Fix
		const tPos = new Vector3(0, 0, this.settings.level_depth).add(
			this.camera.position
		);
		this.textHolder = new FancyText(this.scene, tPos, msg);
	}

	/**
	 * position Mouse with angle
	 * @public
	 * @param {number} degrees angle
	 * @return {void}
	 */
	public positionMouseAngle(degrees) {
		const ang = (degrees * Math.PI) / 180;
		let w = window.innerHeight;
		if (window.innerWidth < w) w = window.innerWidth;
		w /= 2;
		this.mouseX = w * Math.sin(ang);
		this.mouseY = w * Math.cos(ang);
	}
}
