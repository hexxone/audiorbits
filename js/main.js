/*
 * Copyright (c) 2019 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * AudiOrbits 1.7
 * for Wallpaper Engine
 * by Hexxon
 * 
 * You dont have WE but wanna see this in action?
 * Go here:	https://experiment.hexxon.me
 * 
 * If you're reading this you're either pretty interested in the code or just bored :P
 * Either way thanks for using this Wallpaper I guess.
 * Leave me some feedback on the Workshop-Page for this item if you like!
 * https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780
 * 
 * PS.: pls dont blame me for bugs D:
 * 
*/

// custom logging function
function print(arg, force) {
	if (!audiOrbits.initialized || audiOrbits.debug || force) console.log("| AudiOrbits |" + JSON.stringify(arg));
}

/**
 * Provides requestAnimationFrame in a cross browser way.
 * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
 */
if (!window.requestAnimationFrame) {
	window.requestAnimationFrame = (() => {
		return window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame;
	})();
}

/**
 * Provides a custom timed rendering function
 */
window.requestCustomAnimationFrame = (callback) => {
	var sett = audiOrbits.settings;
	if (!sett.system_drawing)
		audiOrbits.rafID = setTimeout(() => callback(), 1000 / sett.fps_limit)
	else
		audiOrbits.rafID = requestAnimationFrame(callback);
};

// tests an array for containing NaN values
// function testNaN(arr, str) { for(var i = 0; i < arr.length; i++) if(arr[i] == null || isNaN(arr[i])) console.log("testNaN match: " + str + " | @ " + i); }

// base object for wallpaper
var audiOrbits = {
	// holds default wallpaper settings
	settings: {
		cam_locked: true,
		auto_parallax: false,
		parallax_strength: 3,
		auto_parallax_speed: 2,
		color_fade_speed: 2,
		default_brightness: 60,
		default_saturation: 10,
		zoom_val: 1,
		rotation_val: 0,
		fps_limit: 60,
		system_drawing: true,
		minimum_brightness: 10,
		minimum_saturation: 10,
		audio_multiplier: 2,
		audio_smoothing: 75,
		audiozoom_val: 2,
		audiozoom_smooth: false,
		alg_a_min: -25,
		alg_a_max: 25,
		alg_b_min: 0.3,
		alg_b_max: 1.7,
		alg_c_min: 5,
		alg_c_max: 16,
		alg_d_min: 1,
		alg_d_max: 9,
		alg_e_min: 1,
		alg_e_max: 10,
		generate_tunnel: false,
		tunnel_inner_radius: 5,
		tunnel_outer_radius: 5,
		base_texture_path: "./img/galaxy.png",
		texture_size: 7,
		stats_option: -1,
		field_of_view: 90,
		fog_thickness: 3,
		scaling_factor: 1800,
		camera_bound: 1000,
		num_points_per_subset: 4000,
		num_subsets_per_level: 16,
		num_levels: 4,
		level_depth: 600,
		level_shifting: false,
		bloom_filter: false,
		icue_mode: 1,
		icue_area_xoff: 50,
		icue_area_yoff: 90,
		icue_area_width: 75,
		icue_area_height: 30,
		icue_area_blur: 5,
		icue_area_decay: 15,
		icue_area_preview: false,
		icue_main_color: "0 255 0",
		no_pause: false,
		seizure_warning: true,
	},
	// started yet?
	initialized: false,
	// paused?
	PAUSED: false,
	// debugging
	debug: false,
	debugTimeout: null,
	// canvas
	mainCanvas: null,
	helperCanvas: null,
	helperContext: null,
	// requestAnimationFrame ID
	lastFrame: performance.now() / 1000,
	rafID: null,
	// interval for random numer audio generator
	wallpaperAudioInterval: null,
	// interval for reloading the wallpaper
	resetTimeout: null,
	// interval for swirlHandler
	swirlInterval: null,
	// mouse over canvas position
	mouseX: 0,
	mouseY: 0,
	// window half size
	windowHalfX: window.innerWidth / 2,
	windowHalfY: window.innerHeight / 2,
	// main orbit data
	levels: [],
	moveBacks: [],
	// iCue Stuff
	icueAvailable: false,
	icueCanvasX: 23,
	icueCanvasY: 7,
	icueDevices: [],
	icuePreview: null,

	///////////////////////////////////////////////
	// APPLY SETTINGS
	///////////////////////////////////////////////

	applyCustomProps: function (props) {
		// applies actual
		print("apply: " + JSON.stringify(props), true);

		var _ignore = ["debugging", "parallax_option", "img_overlay", "img_background", "base_texture"];

		var _reInit = ["texture_size", "stats_option", "field_of_view", "fog_thickness", "scaling_factor", "camera_bound",
			"num_points_per_subset", "num_subsets_per_level", "num_levels", "level_depth", "level_shifting", "bloom_filter"];

		var self = audiOrbits;
		var sett = self.settings;
		var reInitFlag = false;

		// loop all settings for updated values
		for (var setting in props) {
			if (_ignore.includes(setting) || setting.startsWith("HEADER_")) continue;
			var prop = props[setting];
			if (!prop || !prop.type || prop.type == "text") continue;
			if (sett[setting] != null) {
				// apply prop value
				if (prop.type == "bool")
					sett[setting] = prop.value == true;
				else
					sett[setting] = prop.value;
				// check field flags
				reInitFlag = reInitFlag || _reInit.includes(setting);
			}
			else print("Unknown setting: " + setting);
		}

		weas.audio_smoothing = sett.audio_smoothing;

		// create preview skkrt
		if (!self.icuePreview && sett.icue_area_preview) {
			self.icuePreview = document.createElement('div');
			self.icuePreview.classList.add("cuePreview");
			document.body.appendChild(self.icuePreview);
		}
		// update settings or destroy
		if (self.icuePreview) {
			if (!sett.icue_area_preview) {
				document.body.removeChild(self.icuePreview);
				self.icuePreview = null;
			}
			else Object.assign(self.icuePreview.style, self.getICUEArea(true));
		}

		// Camera swirl / parallax / lock
		if (props['parallax_option']) {
			var val = props['parallax_option'].value;
			sett.cam_locked = (val == 0);
			sett.auto_parallax = (val == 2);
		}

		// Custom user images
		if (props['img_background']) {
			var val = props['img_background'].value;
			$("#img_back").fadeOut(1000, () => {
				if (val && val !== '') {
					$("#img_back").attr('src', 'file:///' + val);
					$("#img_back").fadeIn(1000);
				}
			});
		}
		if (props['img_overlay']) {
			var val2 = props['img_overlay'].value;
			$("#img_over").fadeOut(1000, () => {
				if (val2 && val2 !== '') {
					$("#img_over").attr('src', 'file:///' + val2);
					$("#img_over").fadeIn(1000);
				}
			});
		}

		// intitialize texture splash
		if (props['base_texture']) {
			var val = props['base_texture'].value;
			switch (val) {
				default: sett.base_texture_path = "./img/galaxy.png"; break;
				case 1: sett.base_texture_path = "./img/cuboid.png"; break;
				case 2: sett.base_texture_path = "./img/fractal.png"; break;
			}
			reInitFlag = true;
		}

		// debug logging
		if (props['debugging']) self.debug = props['debugging'].value == true;
		if (self.debugTimeout) {
			clearTimeout(self.debugTimeout);
			self.debugTimeout = null;
		}
		if (self.debug) self.debugTimeout = setTimeout(() => self.applyCustomProps({ 'debugging': { value: false } }), 1000 * 60);
		$("#debugwnd").css("visibility", self.debug ? "visible" : "hidden");

		// fix for centered camera on Parallax "none"
		if (sett.cam_locked) self.mouseX = self.mouseY = 0;

		return reInitFlag;
	},


	///////////////////////////////////////////////
	// INITIALIZE
	///////////////////////////////////////////////

	initFirst: function () {
		// Setup button, slider & window listeners only ever once!
		document.addEventListener('mousemove', (event) => {
			var sett = this.settings;
			if (sett.cam_locked || sett.auto_parallax) return;
			this.mouseX = event.clientX - this.windowHalfX;
			this.mouseY = event.clientY - this.windowHalfY;
		}, false);
		document.addEventListener('touchstart', (event) => {
			var sett = this.settings;
			if (sett.cam_locked || sett.auto_parallax) return;
			if (event.touches.length == 1) {
				event.preventDefault();
				this.mouseX = event.touches[0].pageX - this.windowHalfX;
				this.mouseY = event.touches[0].pageY - this.windowHalfY;
			}
		}, false);
		document.addEventListener('touchmove', (event) => {
			var sett = this.settings;
			if (sett.cam_locked || sett.auto_parallax) return;
			if (event.touches.length == 1) {
				event.preventDefault();
				this.mouseX = event.touches[0].pageX - this.windowHalfX;
				this.mouseY = event.touches[0].pageY - this.windowHalfY;
			}
		}, false);
		window.addEventListener('resize', (event) => {
			this.windowHalfX = window.innerWidth / 2;
			this.windowHalfY = window.innerHeight / 2;
			if (!this.initialized) return;
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);

		// real initializer
		var initWrap = () => {
			$('#triggerwarn').fadeOut(1000, () => this.initSystem());
		};
		// initialize now or after a delay?
		if (!this.settings.seizure_warning) initWrap();
		else {
			$('#triggerwarn').fadeIn(1000);
			setTimeout(initWrap, 10000);
		}
	},

	// initialize the geometric & grpahics system
	// => starts rendering loop afterwards
	initSystem: function () {
		print("initializing...");
		// No WebGL ? o.O
		if (!Detector.webgl) {
			Detector.addGetWebGLMessage();
			return;
		}
		var self = this;
		var sett = self.settings;
		// Lifetime variables
		self.fpsThreshold = 0;
		self.speedVelocity = 0;
		self.swirlStep = 0;
		// Orbit data
		self.hueValues = [];
		self.levels = [];
		self.moveBacks = [];
		// statistics
		if (sett.stats_option >= 0) {
			print("Init stats: " + sett.stats_option);
			self.stats = new Stats();
			self.stats.showPanel(sett.stats_option); // 0: fps, 1: ms, 2: mb, 3+: custom
			document.body.appendChild(self.stats.dom);
		}
		// get container
		self.container = document.getElementById('renderContainer');

		// get canvas & context
		self.mainCanvas = document.getElementById('mainCvs');

		// get helper canvas & context
		self.helperCanvas = document.getElementById('helpCvs');
		self.helperCanvas.width = self.icueCanvasX;
		self.helperCanvas.height = self.icueCanvasY;
		self.helperCanvas.style.display = 'none';

		self.helperContext = self.helperCanvas.getContext('2d');

		// setup geometrics
		for (var l = 0; l < sett.num_levels; l++) {
			var sets = [];
			for (var i = 0; i < sett.num_subsets_per_level; i++) {
				sets[i] = [];
				for (var j = 0; j < sett.num_points_per_subset; j++) {
					sets[i][j] = {
						x: 0,
						y: 0,
						vertex: new THREE.Vector3(0, 0, 0)
					};
				}
			}
			// set subset moveback counter
			self.moveBacks[l] = 0;
			// create level object
			var lvl = self.levels[l] = {
				myLevel: l,
				subsets: sets,
				xMin: 0,
				xMax: 0,
				yMin: 0,
				yMax: 0,
				scaleX: 0,
				scaleY: 0
			};
			// generate subset data for the first time
			self.generateLevel(lvl);
		}
		print("loading Texture: " + sett.base_texture_path);
		// load main saas 
		new THREE.TextureLoader().load(sett.base_texture_path,
			// onLoad callback
			// continue initialization
			function (texture) {
				// create camera
				self.camera = new THREE.PerspectiveCamera(sett.field_of_view, window.innerWidth / window.innerHeight, 1, 3 * sett.scaling_factor);
				self.camera.position.z = sett.scaling_factor / 2;
				// create distance fog
				self.scene = new THREE.Scene();
				self.scene.fog = new THREE.FogExp2(0x000000, sett.fog_thickness / 10000);
				// generate random hue vals
				for (var s = 0; s < sett.num_subsets_per_level; s++) {
					self.hueValues[s] = Math.random();
				}
				// material properties
				var matprops = {
					map: texture,
					size: (sett.texture_size),
					blending: THREE.AdditiveBlending,
					depthTest: false,
					transparent: true
				};
				var subsetDist = sett.level_depth / sett.num_subsets_per_level;
				// Create particle systems
				for (var k = 0; k < sett.num_levels; k++) {
					for (var s = 0; s < sett.num_subsets_per_level; s++) {
						// create particle geometry from orbit vertex data
						var geometry = new THREE.Geometry();
						for (var i = 0; i < sett.num_points_per_subset; i++) {
							geometry.vertices.push(self.levels[k].subsets[s][i].vertex);
						}
						geometry.dynamic = true;
						// create particle material with map & size
						var material = new THREE.PointsMaterial(matprops);
						// set material defaults
						material.color.setHSL(self.hueValues[s], sett.default_saturation, sett.default_brightness / 100);
						// create particle system from geometry and material
						var particles = new THREE.Points(geometry, material);
						particles.myMaterial = material;
						particles.myLevel = k;
						particles.mySubset = s;
						particles.position.x = 0;
						particles.position.y = 0;
						if (sett.level_shifting) {
							particles.position.z = - sett.level_depth * k - (s * subsetDist * 2) + sett.scaling_factor / 2;
							if (k % 2 != 0) particles.position.z -= subsetDist;
						}
						else particles.position.z = - sett.level_depth * k - (s * subsetDist) + sett.scaling_factor / 2;
						// euler angle 45 deg in radians
						particles.rotation.z = -0.785398;
						particles.needsUpdate = false;
						// add to scene
						self.scene.add(particles);
					}
				}
				// Setup renderer and effects
				self.renderer = new THREE.WebGLRenderer(
					{
						canvas: self.mainCanvas,
						clearColor: 0x000000,
						clearAlpha: 1,
						alpha: true,
						antialias: true
					});
				self.renderer.setSize(window.innerWidth, window.innerHeight);

				// intialize Bloom Shader
				if (sett.bloom_filter) {
					self.composer = new THREE.EffectComposer(self.renderer);
					self.composer.addPass(new THREE.RenderPass(self.scene, self.camera, null, 0x000000, 1));

					var urBloomPass = new THREE.UnrealBloomPass(512);
					urBloomPass.renderToScreen = true;
					self.composer.addPass(urBloomPass);
				}

				// prepare new orbit levels for the first reset/moveBack when a subset passes the camera
				for (var l = 0; l < sett.num_levels; l++) {
					self.generateLevel(self.levels[l]);
				}
				// init plugins
				if (self.icueAvailable) self.initICUE();
				// start bg parallax handler
				swirlInterval = setInterval(self.swirlHandler, 1000 / 60);
				// start rendering
				self.renderLoop();
				$("#renderContainer").fadeIn(5000);
				self.popupMessage('<h1>AudiOrbits 1.7</h1>', true);
				// print
				print("startup complete.", true);
			},
			// onProgress callback currently not supported
			undefined,
			// onError callback
			(err) => {
				print('texture loading error:', true);
				print(err, true);
			}
		);
	},
	// re-initialies the walpaper some time after an "advanced setting" has been changed
	reInitSystem: function () {
		print("reInitSystem()");

		if (this.rafID) {
			if (!this.settings.system_drawing) clearTimeout(this.rafID);
			else cancelAnimationFrame(this.rafID);
		}
		clearInterval(this.swirlInterval);
		clearInterval(this.icueInterval);

		// kill stats
		if (this.stats) this.stats.dispose();
		this.stats = null;

		// kill shader processor
		if (this.composer) this.composer.reset();
		this.composer = null;
		// kill webgl soos
		this.renderer.forceContextLoss();
		// recreate webgl canvas
		this.container.removeChild(this.mainCanvas);
		var mainCvs = document.createElement('canvas');
		mainCvs.id = "mainCvs";
		this.container.appendChild(mainCvs);
		// recreate 2d canvas
		this.container.removeChild(this.helperCanvas);
		var helpCvs = document.createElement('canvas');
		helpCvs.id = "helpCvs";
		this.container.appendChild(helpCvs);

		// init
		this.initSystem();
	},


	///////////////////////////////////////////////
	// RENDERING
	///////////////////////////////////////////////

	renderLoop: function () {
		try {
			var self = audiOrbits;
			var sett = self.settings;
			// paused - stop render
			if (self.PAUSED) return;
			window.requestCustomAnimationFrame(self.renderLoop);
			// Figure out how much time passed since the last animation
			var fpsThreshMin = 1 / sett.fps_limit;
			var fpsRenderMult = 60 / sett.fps_limit;
			var now = performance.now() / 1000;
			var ellapsed = Math.min(now - self.lastFrame, 1);
			var delta = ellapsed / fpsThreshMin * fpsRenderMult;
			self.lastFrame = now;
			// skip rendering the frame if we reached the desired FPS
			self.fpsThreshold += ellapsed;
			// over FPS limit? cancel animation..
			if (self.fpsThreshold < fpsThreshMin) return;
			self.fpsThreshold -= fpsThreshMin;
			// render canvas
			self.renderFrame(ellapsed, delta);
		} catch (ex) {
			console.log("renderLoop exception: ", true);
			console.log(ex, true);
		}
	},
	// render a single frame with the given delta Multiplicator
	renderFrame: function (ellapsed, deltaTime) {
		print("render with delta: " + deltaTime);
		// stats
		var self = audiOrbits;
		if (self.stats) self.stats.begin();

		// local vars are faster
		var sett = self.settings;
		var flmult = (15 + sett.audio_multiplier) * 0.02;
		var spvn = sett.zoom_val;
		var rot = sett.rotation_val / 10000;
		var camera = self.camera;
		var scene = self.scene;
		var scenelen = scene.children.length;
		var hueValues = self.hueValues;
		var spvel = self.speedVelocity;
		var moveBacks = self.moveBacks;

		// calculate camera parallax with smoothing
		var clampCam = (axis) => Math.min(sett.camera_bound, Math.max(-sett.camera_bound, axis));
		var newCamX = clampCam(self.mouseX * sett.parallax_strength / 50);
		var newCamY = clampCam(self.mouseY * sett.parallax_strength / -50);
		if (camera.position.x != newCamX) camera.position.x += (newCamX - camera.position.x) * deltaTime * 0.05;
		if (camera.position.y != newCamY) camera.position.y += (newCamY - camera.position.y) * deltaTime * 0.05;

		// shift hue values forward
		for (var s = 0; s < sett.num_subsets_per_level - 1; s++) {
			hueValues[s] += (sett.color_fade_speed / 4000) * deltaTime;
			hueValues[s] %= 1;
		}
		// set camera view-point to scene-center
		camera.lookAt(scene.position);

		// calculate boost strength & step size if data given
		var hasAudio = weas.hasAudio();
		var lastAudio, boost, step;
		if (hasAudio) {
			spvn = spvn + sett.audiozoom_val / 2;
			// get 
			lastAudio = weas.lastAudio;
			// calc audio boost
			boost = lastAudio.intensity * flmult;
			// calculate step distance between levels
			step = (sett.num_levels * sett.level_depth * 1.2) / 128;
			// speed velocity calculation
			if (sett.audiozoom_val > 0)
				spvn += sett.zoom_val * boost * 0.02 + boost * sett.audiozoom_val * 0.05;
		}

		// apply smoothing or direct value
		if (!hasAudio || sett.audiozoom_smooth) {
			self.speedVelocity += ((spvn - spvel) * sett.audio_smoothing / 1000);
		}
		else self.speedVelocity = spvn;

		// rotation calculation
		if (hasAudio)
			rot += rot * boost * 0.01;

		// iterate through all objects
		for (i = 0; i < scenelen; i++) {
			var child = scene.children[i];
			// reset if out of bounds
			if (child.position.z > camera.position.z) {
				// offset to back
				print("moved back child: " + i);
				child.position.z -= sett.num_levels * sett.level_depth;
				moveBacks[child.myLevel]++;
				// update the child visually
				if (child.needsUpdate) {
					print("update child vertex data: " + i);
					child.geometry.verticesNeedUpdate = true;
					child.needsUpdate = false;
				}
				// process subset generation
				if (moveBacks[child.myLevel] == sett.num_subsets_per_level) {
					moveBacks[child.myLevel] = 0;
					var lvl = self.levels[child.myLevel];
					setTimeout(() => self.generateLevel(lvl), 250);
				}
			}
			// velocity & rotation
			child.position.z += spvel * deltaTime;
			child.rotation.z -= rot * deltaTime;
			// HSL calculation
			var nhue, nsat, nlight;
			if (hasAudio) {
				// use obj to camera distance with step to get frequency from data >> do some frequency calculations
				var freqIndx = Math.round((camera.position.z - child.position.z) / step) + 4;
				// get & process frequency data
				var cfreq = parseFloat(lastAudio.data[freqIndx]);
				var rFreq = (cfreq * flmult / 3) / lastAudio.max;
				// quick maths
				nhue = (hueValues[child.mySubset] + rFreq) % 1.0;
				nsat = Math.abs(sett.minimum_saturation / 100 + rFreq + rFreq * boost * 0.17);
				nlight = Math.min(0.7, sett.minimum_brightness / 100 + rFreq + rFreq * boost * 0.05);
			}
			else {
				// get current HSL
				var hsl = child.myMaterial.color.getHSL({});
				var hue = hueValues[child.mySubset];
				// Process color fade to new 
				nhue = hsl.h + (hue - hsl.h) / 60 * deltaTime;
				nsat = hsl.s + (sett.default_saturation / 100 - hsl.s) / 60 * deltaTime;
				nlight = hsl.l + (sett.default_brightness / 100 - hsl.l) / 60 * deltaTime;
			}
			// update dat shit
			print("setHSL | child: " + i + " | h: " + nhue + " | s: " + nsat + " | l: " + nlight);
			child.myMaterial.color.setHSL(nhue, nsat, nlight);
		}
		// render alll dat shit
		if (self.composer) self.composer.render(ellapsed);
		else self.renderer.render(scene, camera);

		// ICUE PROCESSING

		if (sett.icue_mode == 1) {
			// get helper vars
			var cueWid = self.icueCanvasX;
			var cueHei = self.icueCanvasY;
			var area = self.getICUEArea();
			var hctx = self.helperContext;
			// overlay "decay"
			hctx.fillStyle = "rgba(0, 0, 0, " + sett.icue_area_decay / 100 + ")";
			hctx.fillRect(0, 0, cueWid, cueHei);
			// scale down and copy the image to the helper canvas
			hctx.drawImage(self.mainCanvas, area.left, area.top, area.width, area.height, 0, 0, cueWid, cueHei);
			// blur the helper projection canvas
			if (sett.icue_area_blur > 0) self.gBlurCanvas(self.helperCanvas, hctx, sett.icue_area_blur);
		}

		// stats
		if (self.stats) self.stats.end();
	},


	///////////////////////////////////////////////
	// FRACTAL GENERATOR
	///////////////////////////////////////////////

	generateLevel: function (level) {
		print("generating level: " + level.myLevel);
		// Using lol vars should be faster
		var subsets = level.subsets;
		var sett = this.settings;
		var num_subsets_l = sett.num_subsets_per_level;
		var num_points_subset_l = sett.num_points_per_subset;
		var scale_factor_l = sett.scaling_factor;
		var tunnel = sett.generate_tunnel;
		var iradius = sett.tunnel_inner_radius / 100;
		var oradius = sett.tunnel_outer_radius / 100;
		// get randomized params in defined ranges
		var al = sett.alg_a_min + Math.random() * (sett.alg_a_max - sett.alg_a_min),
			bl = sett.alg_b_min + Math.random() * (sett.alg_b_max - sett.alg_b_min),
			cl = sett.alg_c_min + Math.random() * (sett.alg_c_max - sett.alg_c_min),
			dl = sett.alg_d_min + Math.random() * (sett.alg_d_max - sett.alg_d_min),
			el = sett.alg_e_min + Math.random() * (sett.alg_e_max - sett.alg_e_min);
		// some stuff needed in the subset generation loop
		var xMin = 0, xMax = 0, yMin = 0, yMax = 0;
		var choice = Math.random();
		var x, y, z, x1;
		// loop subsets
		for (var s = 0; s < num_subsets_l; s++) {
			// Use a different starting point for each orbit subset
			x = s / 100 * (0.5 - Math.random());
			y = s / 100 * (0.5 - Math.random());
			//print({al,bl,cl,dl,el});
			for (var i = 0; i < num_points_subset_l; i++) {
				// Iteration formula (generalization of the Barry Martin's original one)
				if (choice < 0.5) z = (dl + (Math.sqrt(Math.abs(bl * x - cl))));
				else if (choice < 0.75) z = (dl + Math.sqrt(Math.sqrt(Math.abs(bl * x - cl))));
				else z = (dl + Math.log(2 + Math.sqrt(Math.abs(bl * x - cl))));

				if (x > 0) x1 = y - z;
				else if (x == 0) x1 = y;
				else x1 = y + z;

				// process x size
				if (x < xMin) xMin = x;
				else if (x > xMax) xMax = x;
				// process y size
				if (y < yMin) yMin = y;
				else if (y > yMax) yMax = y;

				// apply subset point pos
				subsets[s][i].y = y = al - x;
				subsets[s][i].x = x = x1 + el;
			}
		}
		// calculate level scale based on min and max values
		var scaleX = 2 * scale_factor_l / (xMax - xMin);
		var scaleY = 2 * scale_factor_l / (yMax - yMin);
		// set dat shit for corresponding orbit
		level.xMin = xMin;
		level.xMax = xMax;
		level.yMin = yMin;
		level.yMax = yMax;
		level.scaleX = scaleX;
		level.scaleY = scaleY;
		// Normalize and update vertex data          
		for (var s = 0; s < num_subsets_l; s++) {
			for (var i = 0; i < num_points_subset_l; i++) {
				var x = scaleX * (subsets[s][i].x - xMin) - scale_factor_l;
				var y = scaleY * (subsets[s][i].y - yMin) - scale_factor_l;
				if (tunnel) {
					var dist = this.getPointDistance(0, 0, x, y) / scale_factor_l;
					//print("pd: " + dist + ",   inner: " + iradius);
					if (dist < iradius) {
						var scaling = dist / iradius;
						var outer = scaling / oradius;
						x = x / scaling + x * outer;
						y = y / scaling + y * outer;
					}
				}
				subsets[s][i].vertex.x = x;
				subsets[s][i].vertex.y = y;
			}
		}
		// loop all scene children and set flag that new vertex data is available
		if (!this.scene || !this.scene.children) return;
		var children = this.scene.children;
		var scenelen = children.length;
		for (var i = 0; i < scenelen; i++) {
			var child = children[i];
			if (child.myLevel == level.myLevel) {
				print("set child needsUpdate: " + i);
				child.needsUpdate = true;
			}
		}
	},
	// calculates the distance between 2 2D coordinates
	getPointDistance: function (x1, y1, x2, y2) {
		var a = x1 - x2;
		var b = y1 - y2;
		return Math.sqrt(a * a + b * b);
	},
	// Auto Parallax handler
	swirlHandler: function () {
		var self = audiOrbits;
		var sett = self.settings;
		if (!sett.auto_parallax) return;
		self.swirlStep += sett.auto_parallax_speed / 3;
		if(self.swirlStep > 360) self.swirlStep -= 360;
		else if(self.swirlStep < 0) self.swirlStep += 360;
		var ang = self.swirlStep * Math.PI / 180;
		var w = window.innerHeight;
		if(window.innerWidth < w) w = window.innerWidth;
		self.mouseX = w / 2 * Math.sin(ang);
		self.mouseY = w / 2 * Math.cos(ang);
	},
	// popup message handler
	popupMessage: function (msg, hideAfter) {
		$('#txtholder').html(msg);
		$('#txtholder').fadeIn({ queue: false, duration: 'slow' });
		$('#txtholder').animate({ bottom: "40px" }, 'slow');
		if (hideAfter) setTimeout(() => {
			$('#txtholder').fadeOut({ queue: false, duration: 'slow' });
			$('#txtholder').animate({ bottom: "-40px" }, 'slow');
		}, 10000);
	},
	// show a message by icue
	icueMessage: function(msg) {
		$('#icuetext').html(msg);
		$('#icueholder').fadeIn({ queue: false, duration: 'slow' });
		$('#icueholder').animate({ top: "0px" }, 'slow');
		setTimeout(() => {
			$('#icueholder').fadeOut({ queue: false, duration: 'slow' });
			$('#icueholder').animate({ top: "-120px" }, 'slow');
		}, 7000);
	},


	///////////////////////////////////////////////
	// ICUE INTEGRATION
	///////////////////////////////////////////////

	// will return a rectangle object represnting the icue area in pixels
	// choosable as integer or string with "px" suffix (for css styling)
	getICUEArea: function (inPx) {
		var sett = audiOrbits.settings;
		var wwid = window.innerWidth;
		var whei = window.innerHeight;
		var w = wwid * sett.icue_area_width / 100;
		var h = whei * sett.icue_area_height / 100;
		var l = ((wwid - w) * sett.icue_area_xoff / 100);
		var t = ((whei - h) * sett.icue_area_yoff / 100);
		return {
			width: w + (inPx ? "px" : ""),
			height: h + (inPx ? "px" : ""),
			left: l + (inPx ? "px" : ""),
			top: t + (inPx ? "px" : ""),
		};
	},
	// will initialize ICUE api & usage
	initICUE: function () {
		print("iCUE: async initialization...")
		var self = audiOrbits;
		self.icueDevices = [];
		window.cue.getDeviceCount((deviceCount) => {
			self.icueMessage("iCUE: " + deviceCount + " devices found.");
			for (var xi = 0; xi < deviceCount; xi++) {
				var xl = xi;
				window.cue.getDeviceInfo(xl, (info) => {
					info.id = xl;
					window.cue.getLedPositionsByDeviceIndex(xl, function (leds) {
						info.leds = leds;
						print("iCUE: Device " + JSON.stringify(info));
						self.icueDevices[xl] = info;
					});
				});
			}
		});
		// start processing after 3 seconds (info should be gathered)
		self.icueInterval = setInterval(self.processICUE, 1000 / 30);
	},
	// process frame for icue devices
	processICUE: function () {
		var self = audiOrbits;
		var sett = self.settings;
		if (self.icueDevices.length < 1 || sett.icue_mode == 0) return;
		// projection mode
		if (sett.icue_mode == 1) {
			// get local values
			var cueWid = self.icueCanvasX;
			var cueHei = self.icueCanvasY;
			var ctx = self.helperContext;
			// get scaled down image data
			var imgData = ctx.getImageData(0, 0, cueWid, cueHei);
			// encode data for icue
			var encDat = self.getEncodedCanvasImageData(imgData);
			// update all devices with data
			for (var xi = 0; xi < self.icueDevices.length; xi++) {
				//var info = self.icueDevices[xi];
				//window.cue.setAllLedsColorsAsync(xi, self.hueValues[0]);
				window.cue.setLedColorsByImageData(xi, encDat, cueWid, cueHei);
			}
		}
		// color mode
		if (sett.icue_mode == 2) {
			// get lol objects
			var col = sett.icue_main_color.split(' ');
			var ledColor = {
				r: col[0] * 255,
				g: col[1] * 255,
				b: col[2] * 255
			};;
			// try audio multiplier processing
			if (weas.hasAudio()) {
				var aud = weas.lastAudio;
				var mlt = 255 * aud.average / aud.range / aud.intensity * 10;
				ledColor = {
					r: Math.min(255, Math.max(0, col[0] * mlt)),
					g: Math.min(255, Math.max(0, col[1] * mlt)),
					b: Math.min(255, Math.max(0, col[2] * mlt))
				};
			}
			// update all devices with data
			for (var xi = 0; xi < self.icueDevices.length; xi++) {
				window.cue.setAllLedsColorsAsync(xi, ledColor);
			}
		}
	},
	// get data for icue
	getEncodedCanvasImageData: function (imageData) {
		var colorArray = [];
		for (var d = 0; d < imageData.data.length; d += 4) {
			var write = d / 4 * 3;
			colorArray[write] = imageData.data[d];
			colorArray[write + 1] = imageData.data[d + 1];
			colorArray[write + 2] = imageData.data[d + 2];
		}
		return String.fromCharCode.apply(null, colorArray);
	},
	// canvas blur helper function
	gBlurCanvas: function (canvas, ctx, blur) {
		let sum = 0;
		let delta = 5;
		let alpha_left = 1 / (2 * Math.PI * delta * delta);
		let step = blur < 3 ? 1 : 2;
		for (let y = -blur; y <= blur; y += step) {
			for (let x = -blur; x <= blur; x += step) {
				let weight = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta));
				sum += weight;
			}
		}
		for (let y = -blur; y <= blur; y += step) {
			for (let x = -blur; x <= blur; x += step) {
				ctx.globalAlpha = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta)) / sum * blur * blur;
				ctx.drawImage(canvas, x, y);
			}
		}
		ctx.globalAlpha = 1;
	}
};


///////////////////////////////////////////////
// Actual Initialisation
///////////////////////////////////////////////

print("Begin Startup...")

// will apply settings edited in Wallpaper Engine
// this will also cause initialization for the first time
window.wallpaperPropertyListener = {
	applyGeneralProperties: (props) => {
		// nothing to do here
	},
	applyUserProperties: (props) => {
		var initFlag = audiOrbits.applyCustomProps(props);
		// very first initialization
		if (!audiOrbits.initialized) {
			audiOrbits.initialized = true;
			$(() => audiOrbits.initFirst());
		}
		else if (initFlag) {
			print("got reInit-flag after apply!");
			if (audiOrbits.resetTimeout) clearTimeout(audiOrbits.resetTimeout);
			audiOrbits.resetTimeout = setTimeout(() => audiOrbits.reInitSystem(), 3000);
		}
	},
	setPaused: (isPaused) => {
		if (audiOrbits.settings.no_pause && isPaused) return;
		audiOrbits.PAUSED = isPaused;
		if (!isPaused) window.requestCustomAnimationFrame(audiOrbits.renderLoop);
	}
};

// will initialize icue functionality if available
window.wallpaperPluginListener = {
	onPluginLoaded: function (name, version) {
		print("Plugin loaded: " + name + ", Version: " + version);
		if (name === 'cue') audiOrbits.icueAvailable = true;
	}
};

// after the page finished loading: if the wallpaper context is not given => start wallpaper 
$(() => {
	if (!window.wallpaperRegisterAudioListener) {
		print("wallpaperRegisterAudioListener not defined. We are probably out of wallpaper engine. Manual init..");
		audiOrbits.applyCustomProps({});
		audiOrbits.initialized = true;
		audiOrbits.initFirst();
	}
});
