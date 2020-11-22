/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Contains main rendering context for AudiOrbits
 */

import * as THREE from 'three';

import { ColorHolder } from './ColorHolder';
import { GeoHolder } from './GeoHolder';
import { LUTSetup } from './LUTSetup';
import { ShaderHolder } from './ShaderHolder';
import { VRButton } from './VRButton';

import { EffectComposer } from './three/postprocessing/EffectComposer';

import Stats from './we_utils/src/Stats';
import { WEAS } from './we_utils/src/WEAS';
import { WEICUE } from './we_utils/src/WEICUE';
import { Smallog } from './we_utils/src/Smallog';
import { CSettings } from "./we_utils/src/CSettings";
import { CComponent } from './we_utils/src/CComponent';

class CtxSettings extends CSettings {
	// Camera category
	parallax_option: number = 0;
	parallax_angle: number = 180;
	parallax_strength: number = 3;
	auto_parallax_speed: number = 2;
	field_of_view: number = 90;
	custom_fps: boolean = false;
	fps_value: number = 60;
	shader_quality: number = 1;
	cam_centered: boolean = false;

	// offtopic
	fog_thickness: number = 3;
	stats_option: number = -1;

	// mirrored setting
	scaling_factor: number = 1500;
	level_depth: number = 1000;
	num_levels: number = 8000;
}

export class CtxHolder extends CComponent {

	// global state
	isWebContext = false;
	PAUSED = false;

	// webvr user input data
	userData = {
		isSelecting: false,
		controller1: null,
		controller2: null
	};

	public settings: CtxSettings = new CtxSettings();

	// html elements
	container = null;
	mainCanvas = null;

	// mouse over canvas
	mouseX = 0;
	mouseY = 0;

	// Three.js objects
	renderer = null;
	composer = null;
	camera = null;
	scene = null;
	stats = null;
	clock = new THREE.Clock();

	// custom render timing
	renderTimeout = null;

	// window half size
	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	// important objects
	colorHolder: ColorHolder = new ColorHolder();
	shaderHolder: ShaderHolder = new ShaderHolder();

	weas: WEAS = new WEAS();
	geoHolder: GeoHolder = new GeoHolder(this.weas);
	weicue: WEICUE = new WEICUE(this.weas);

	lutSetup: LUTSetup = new LUTSetup();

	// add global listeners
	constructor() {
		super();

		// mouse listener
		var mouseUpdate = (event) => {
			if (this.settings.parallax_option != 1) return;
			if (event.touches && event.touches.length == 1) {
				event.preventDefault();
				this.mouseX = event.touches[0].pageX - this.windowHalfX;
				this.mouseY = event.touches[0].pageY - this.windowHalfY;
			}
			else if (event.clientX) {
				this.mouseX = event.clientX - this.windowHalfX;
				this.mouseY = event.clientY - this.windowHalfY;
			}
		}
		document.addEventListener("touchstart", mouseUpdate, false);
		document.addEventListener("touchmove", mouseUpdate, false);
		document.addEventListener("mousemove", mouseUpdate, false);

		// scaling listener
		window.addEventListener("resize", (event) => {
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

	// initialize three-js context
	init(callback) {
		// static element
		this.container = document.getElementById("renderContainer");

		// destroy old context
		if (this.renderer) this.renderer.forceContextLoss();
		if (this.composer) this.composer.reset();
		if (this.mainCanvas) {
			this.container.removeChild(this.mainCanvas);
			var cvs = document.createElement("canvas");
			cvs.id = "mainCvs";
			this.container.appendChild(cvs);
		}

		// get canvases & contexts
		// ensure the canvas sizes are set !!!
		// these are independent from the style sizes
		this.mainCanvas = document.getElementById("mainCvs");
		this.mainCanvas.width = window.innerWidth;
		this.mainCanvas.height = window.innerHeight;

		// dont use depth buffer on low quality
		const qual = this.settings.shader_quality < 3 ? (this.settings.shader_quality < 2 ? "low" : "medium") : "high";
		const dBuffer = this.settings.shader_quality > 1;
		const shaderP = qual + "p";


		// create camera
		const viewDist = this.settings.num_levels * this.settings.level_depth * (this.settings.cam_centered ? 0.5 : 1);
		this.camera = new THREE.PerspectiveCamera(this.settings.field_of_view, window.innerWidth / window.innerHeight, 3, viewDist * 1.2);
		// create scene
		this.scene = new THREE.Scene();
		// create distance fog
		this.scene.fog = new THREE.FogExp2(0x000000, this.settings.fog_thickness / 8000);
		// create render-context
		this.renderer = new THREE.WebGLRenderer({
			alpha: true,
			antialias: false,
			canvas: this.mainCanvas,
			logarithmicDepthBuffer: dBuffer,
			powerPreference: this.getPowerPreference(),
			precision: shaderP,
		});
		this.renderer.clearColor = 0x000000;
		this.renderer.clearAlpha = 1;
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		// initialize VR mode
		if (this.isWebContext) this.initWebXR();

		// initialize shader composer
		this.composer = new EffectComposer(this.renderer, shaderP);
		// initialize shaders
		this.shaderHolder.pipeline(this.scene, this.camera, this.composer);

		// initialize statistics
		if (this.settings.stats_option >= 0) {
			Smallog.Debug("Init stats: " + this.settings.stats_option);
			this.stats = Stats();
			this.stats.showPanel(this.settings.stats_option); // 0: fps, 1: ms, 2: mb, 3+: custom
			document.body.appendChild(this.stats.dom);
		}

		this.geoHolder.init(this.scene, this.camera, callback);
	}

	// update shader values
	update(ellapsed, deltaTime) {

		// calculate camera parallax with smoothing
		var clampCam = (axis) => Math.min(this.settings.scaling_factor / 2, Math.max(-this.settings.scaling_factor / 2, axis));
		var newCamX = clampCam(this.mouseX * this.settings.parallax_strength / 50);
		var newCamY = clampCam(this.mouseY * this.settings.parallax_strength / -50);
		if (this.camera.position.x != newCamX)
			this.camera.position.x += (newCamX - this.camera.position.x) * deltaTime * 0.05;
		if (this.camera.position.y != newCamY)
			this.camera.position.y += (newCamY - this.camera.position.y) * deltaTime * 0.05;

		// set camera view-target to scene-center
		this.camera.lookAt(this.scene.position);

		// TODO: WEBVR PROCESSING
		if (this.isWebContext) {
			this.handleVRController(this.userData.controller1);
			this.handleVRController(this.userData.controller1);
		}
	}

	// called after any setting changed
	updateSettings() {
		// fix for centered camera on Parallax "none"
		if (this.settings.parallax_option == 0) this.mouseX = this.mouseY = 0;
		// set Cursor for "fixed" parallax mode
		if (this.settings.parallax_option == 3) this.positionMouseAngle(this.settings.parallax_angle);

		// update preview visbility after setting possibly changed
		this.weicue.updatePreview();
	}


	///////////////////////////////////////////////
	// RENDERING
	///////////////////////////////////////////////

	// start or stop rendering
	setRenderer(render) {
		Smallog.Debug("setRenderer: " + render);

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
			this.PAUSED = false;
			// initialize rendering
			if (this.settings.custom_fps) {
				this.renderTimeout = setTimeout(() => this.renderLoop(), 1000 / this.settings.fps_value);
			}
			else if (this.renderer) {
				this.renderer.setAnimationLoop(() => this.renderLoop());
			}
			else Smallog.Error("not initialized!");
			// show again
			$("#mainCvs").addClass("show");
		}
		else {
			this.PAUSED = true;
			$("#mainCvs").removeClass("show");
		}
	}

	// root render frame call
	renderLoop() {
		// paused - stop render
		if (this.PAUSED) return;

		// custom rendering needs manual re-call
		if (this.renderTimeout)
			this.renderTimeout = setTimeout(() => this.renderLoop(), 1000 / this.settings.fps_value);

		// track FPS, mem etc.
		if (this.stats)
			this.stats.begin();
		// Figure out how much time passed since the last animation and calc delta
		// Minimum we should reach is 1 FPS
		var ellapsed = Math.min(1, Math.max(0.001, this.clock.getDelta()));
		var delta = ellapsed * 60;

		// render before updating
		this.composer.render();

		// update objects
		this.colorHolder.update(ellapsed, delta);
		this.geoHolder.update(ellapsed, delta);
		this.update(ellapsed, delta);

		// ICUE PROCESSING
		this.weicue.updateCanvas(this.mainCanvas);

		// end stats
		if (this.stats)
			this.stats.end();
	}


	///////////////////////////////////////////////
	// WEB-VR INTEGRATION
	///////////////////////////////////////////////

	// will initialize webvr components and rendering
	initWebXR() {
		this.renderer.xr.enabled = true;
		document.body.appendChild(new VRButton().createButton(this.renderer));

		this.userData.controller1 = this.renderer.vr.getController(0);
		this.userData.controller1.addEventListener("selectstart", this.onVRSelectStart);
		this.userData.controller1.addEventListener("selectend", this.onVRSelectEnd);
		this.scene.add(this.userData.controller1);

		this.userData.controller2 = this.renderer.vr.getController(1);
		this.userData.controller2.addEventListener("selectstart", this.onVRSelectStart);
		this.userData.controller2.addEventListener("selectend", this.onVRSelectEnd);
		this.scene.add(this.userData.controller2);
	}

	// controller starts selecting
	onVRSelectStart() {
		this.userData.isSelecting = true;
	}

	// controller stops selecting
	onVRSelectEnd() {
		this.userData.isSelecting = false;
	}

	// use VR controller like mouse & parallax
	handleVRController(controller) {
		/** @TODO
		controller.userData.isSelecting
		controller.position
		controller.quaternion
		*/
	}


	///////////////////////////////////////////////
	// HELPER
	///////////////////////////////////////////////

	// use overall "quality" setting to determine three.js "power" mode
	getPowerPreference() {
		switch (this.settings.shader_quality) {
			case 1: return "low-power";
			case 3: return "high-performance";
			default: return "default";
		}
	}

	// position Mouse with angle
	positionMouseAngle(degrees) {
		var ang = degrees * Math.PI / 180;
		var w = window.innerHeight;
		if (window.innerWidth < w) w = window.innerWidth;
		w /= 2;
		this.mouseX = w * Math.sin(ang);
		this.mouseY = w * Math.cos(ang);
	}
}