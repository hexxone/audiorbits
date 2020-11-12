/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Contains render-relevant three-js objects
 * 
 * basically some code outsourcing to make main file more readable.
 * 
 * @todo
 * - use three.js "performance" mode?
 */


var ctxHolder = {

	once: false,
	// global state
	isWebContext: false,

	// webvr user input data
	userData: {
		isSelecting: false,
		controller1: null,
		controller2: null
	},

	settings: {
		// Camera category
		parallax_option: 0,
		parallax_angle: 180,
		parallax_strength: 3,
		auto_parallax_speed: 2,
		field_of_view: 90,
		camera_bound: 1000,
		custom_fps: false,
		fps_value: 60,
		// mirrored setting
		scaling_factor: 1800,
	},

	// html elements
	container: null,
	mainCanvas: null,

	// mouse over canvas
	mouseX: 0,
	mouseY: 0,

	// Three.js objects
	renderer: null,
	composer: null,
	camera: null,
	scene: null,
	clock: null,

	// custom render timing
	renderTimeout: null,

	// window half size
	windowHalfX: window.innerWidth / 2,
	windowHalfY: window.innerHeight / 2,

	// add global listeners
	initOnce: function () {
		var self = ctxHolder;
		var sett = self.settings;
		self.once = true;

		// static element
		self.container = document.getElementById("renderContainer");

		// deltaTime-calculation helper
		self.clock = new THREE.Clock();

		// mouse listener
		var mouseUpdate = (event) => {
			if (sett.parallax_option != 1) return;
			if (event.touches && event.touches.length == 1) {
				event.preventDefault();
				self.mouseX = event.touches[0].pageX - self.windowHalfX;
				self.mouseY = event.touches[0].pageY - self.windowHalfY;
			}
			else if (event.clientX) {
				self.mouseX = event.clientX - self.windowHalfX;
				self.mouseY = event.clientY - self.windowHalfY;
			}
		}
		document.addEventListener("touchstart", mouseUpdate, false);
		document.addEventListener("touchmove", mouseUpdate, false);
		document.addEventListener("mousemove", mouseUpdate, false);

		// scaling listener
		window.addEventListener("resize", (event) => {
			self.windowHalfX = window.innerWidth / 2;
			self.windowHalfY = window.innerHeight / 2;
			if (!self.camera || !self.renderer) return;
			self.camera.aspect = window.innerWidth / window.innerHeight;
			self.camera.updateProjectionMatrix();
			self.renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);
	},

	// initialize three-js context
	init: function () {
		var self = ctxHolder;
		var sett = self.settings;

		// setup event listeners once
		if (!self.once) self.initOnce();

		// destroy old context
		if (self.renderer) self.renderer.forceContextLoss();
		if (self.composer) self.composer.reset();
		if (self.mainCanvas) {
			self.container.removeChild(self.mainCanvas);
			var cvs = document.createElement("canvas");
			cvs.id = "mainCvs";
			self.container.appendChild(cvs);
		}

		// get canvases & contexts
		// ensure the canvas sizes are set !!!
		// these are independent from the style sizes
		self.mainCanvas = document.getElementById("mainCvs");
		self.mainCanvas.width = window.innerWidth;
		self.mainCanvas.height = window.innerHeight;

		// create camera
		self.camera = new THREE.PerspectiveCamera(sett.field_of_view, window.innerWidth / window.innerHeight, 1, 2 * sett.scaling_factor);
		self.camera.position.z = sett.scaling_factor / 2;
		// create scene
		self.scene = new THREE.Scene();
		// create distance fog
		self.scene.fog = new THREE.FogExp2(0x000000, sett.fog_thickness / 8000);
		// create render-context
		self.renderer = new THREE.WebGLRenderer({
			canvas: self.mainCanvas,
			clearColor: 0x000000,
			clearAlpha: 1,
			alpha: true,
			antialias: false,
			logarithmicDepthBuffer: true
		});
		self.renderer.setSize(window.innerWidth, window.innerHeight);
		// initialize VR mode
		if (self.isWebContext) self.initWebXR();
		// initialize shader composer
		self.composer = new THREE.EffectComposer(self.renderer);

		// initialize shaders
		shaderHolder.init(self.scene, self.camera, self.composer);

		// initialize statistics
		if (sett.stats_option >= 0) {
			print("Init stats: " + sett.stats_option);
			self.stats = new Stats();
			self.stats.showPanel(sett.stats_option); // 0: fps, 1: ms, 2: mb, 3+: custom
			document.body.appendChild(self.stats.dom);
		}

		return self.scene;
	},

	// update shader values
	update: function (ellapsed, deltaTime) {
		var self = ctxHolder;
		var sett = self.settings;

		// calculate camera parallax with smoothing
		var clampCam = (axis) => Math.min(sett.camera_bound, Math.max(-sett.camera_bound, axis));
		var newCamX = clampCam(self.mouseX * sett.parallax_strength / 50);
		var newCamY = clampCam(self.mouseY * sett.parallax_strength / -50);
		if (self.camera.position.x != newCamX)
			self.camera.position.x += (newCamX - self.camera.position.x) * deltaTime * 0.05;
		if (self.camera.position.y != newCamY)
			self.camera.position.y += (newCamY - self.camera.position.y) * deltaTime * 0.05;

		// set camera view-target to scene-center
		self.camera.lookAt(self.scene.position);

		// TODO: WEBVR PROCESSING
		if (self.isWebContext) {
			self.handleVRController(self.userData.controller1);
			self.handleVRController(self.userData.controller1);
		}
	},

	// called after any setting changed
	updateSettings: function () {
		var self = ctxHolder;
		var sett = self.settings;
		// fix for centered camera on Parallax "none"
		if (sett.parallax_option == 0) self.mouseX = self.mouseY = 0;
		// set Cursor for "fixed" parallax mode
		if (sett.parallax_option == 3) self.positionMouseAngle(sett.parallax_angle);
	},


	///////////////////////////////////////////////
	// RENDERING
	///////////////////////////////////////////////

	// start or stop rendering
	setRenderer: function (render) {
		print("setRenderer: " + render);
		var self = ctxHolder;
		var sett = self.settings;
		// clear all old renderers
		if (self.renderer) {
			self.renderer.setAnimationLoop(null);
		}
		if (self.renderTimeout) {
			clearTimeout(self.renderTimeout);
			self.renderTimeout = null;
		}
		// call new renderer ?
		if (render) {
			// set state to running
			audiOrbits.state = RunState.Running;
			// initialize rendering
			if (sett.custom_fps) {
				self.renderTimeout = setTimeout(self.renderLoop, 1000 / sett.fps_value);
			}
			else if (self.renderer) {
				self.renderer.setAnimationLoop(self.renderLoop);
			}
			else print("not initialized!", true);
			// show again
			$("#mainCvs").addClass("show");
		}
		else $("#mainCvs").removeClass("show");
	},

	// root render frame call
	renderLoop: function () {
		var self = ctxHolder;
		var sett = self.settings;
		// paused - stop render
		if (audiOrbits.state != RunState.Running) return;
		// custom rendering needs manual re-call
		if (self.renderTimeout) self.renderTimeout = setTimeout(self.renderLoop, 1000 / sett.fps_value);

		// track FPS, mem etc.
		if (self.stats) self.stats.begin();
		// Figure out how much time passed since the last animation and calc delta
		// Minimum we should reach is 1 FPS
		var ellapsed = Math.min(1, Math.max(0.001, self.clock.getDelta()));
		var delta = ellapsed * 60;

		// render before updating
		self.composer.render();
		// update objects
		colorHolder.update(ellapsed, delta);
		geoHolder.update(ellapsed, delta);
		self.update(ellapsed, delta);
		// ICUE PROCESSING
		weicue.updateCanvas(self.mainCanvas);
		// end stats
		if (self.stats) self.stats.end();
	},


	///////////////////////////////////////////////
	// WEB-VR INTEGRATION
	///////////////////////////////////////////////

	// will initialize webvr components and rendering
	initWebXR: function () {
		var self = ctxHolder;
		var userData = self.userData;

		self.renderer.xr.enabled = true;
		document.body.appendChild(VRButton.createButton(self.renderer));

		userData.controller1 = self.renderer.vr.getController(0);
		userData.controller1.addEventListener("selectstart", self.onVRSelectStart);
		userData.controller1.addEventListener("selectend", self.onVRSelectEnd);
		self.scene.add(userData.controller1);

		userData.controller2 = self.renderer.vr.getController(1);
		userData.controller2.addEventListener("selectstart", self.onVRSelectStart);
		userData.controller2.addEventListener("selectend", self.onVRSelectEnd);
		self.scene.add(userData.controller2);
	},
	// controller starts selecting
	onVRSelectStart: function () {
		this.userData.isSelecting = true;
	},
	// controller stops selecting
	onVRSelectEnd: function () {
		this.userData.isSelecting = false;
	},
	// use VR controller like mouse & parallax
	handleVRController: function (controller) {
		/** @TODO
		controller.userData.isSelecting
		controller.position
		controller.quaternion
		*/
	},


	///////////////////////////////////////////////
	// HELPER
	///////////////////////////////////////////////

	// position Mouse with angle
	positionMouseAngle: function (degrees) {
		var self = ctxHolder;
		var ang = degrees * Math.PI / 180;
		var w = window.innerHeight;
		if (window.innerWidth < w) w = window.innerWidth;
		w /= 2;
		self.mouseX = w * Math.sin(ang);
		self.mouseY = w * Math.cos(ang);
	}
}

// will be called first when wallpaper is run from wewwa
window.wewwaListener = {
	initWebContext: function () {
		ctxHolder.isWebContext = true;
	}
};