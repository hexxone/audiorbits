/*
 * Copyright (c) 2019 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * AudiOrbits project	(https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780)
 * for Wallpaper Engine (https://steamcommunity.com/app/431960)
 * by Hexxon 			(https://hexxon.me)
 * 
 * You don't own Wallper Engine but want to see this in action?
 * Go here:	https://experiment.hexxon.me
 * 
 * If you're reading this you're either pretty interested in the code or just bored :P
 * Either way thanks for using this Wallpaper I guess.
 * Leave me some feedback on the Workshop-Page for this item if you like!
 * 
*/

// custom logging function
function print(arg, force) {
	if (!audiOrbits.initialized || audiOrbits.debug || force) console.log("AudiOrbits: " + JSON.stringify(arg));
}

// base object for wallpaper
var audiOrbits = {
	// webvr user input data
	userData: {
		isSelecting: false,
		controller1: null,
		controller2: null
	},
	// holds default wallpaper settings
	// these basically connect 1:1 to wallpaper engine settings.
	// for more explanation on settings visit the Workshop-Item-Forum (link above)
	settings: {
		schemecolor: "0 0 0",
		parallax_option: 0,
		parallax_angle: 180,
		parallax_strength: 3,
		auto_parallax_speed: 2,
		color_fade_speed: 2,
		default_brightness: 60,
		default_saturation: 10,
		zoom_val: 1,
		rotation_val: 0,
		fps_limit: 60,
		minimum_volume: 1,
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
		lut_filter: -1,
		mirror_shader: 0,
		mirror_invert: true,
		icue_mode: 1,
		icue_area_xoff: 50,
		icue_area_yoff: 90,
		icue_area_width: 75,
		icue_area_height: 30,
		icue_area_blur: 5,
		icue_area_decay: 15,
		icue_area_preview: false,
		icue_main_color: "0 0.8 0",
		color_mode: 0,
		user_color_a: "1 0.5 0",
		user_color_b: "0 0.5 1",
		seizure_warning: true,
	},
	// context?
	isWebContext: false,
	// vr rendering is only supported in web.
	vrRendering: false,
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
	// LUT (LookUpTable) Textures
	lutTextures: [
		{
			name: "posterize",
			url: "./img/lookup/posterize-s8n.png",
		},
		{
			name: "inverse",
			url: "./img/lookup/inverse-s8.png",
		},
		{
			name: "negative",
			url: "./img/lookup/color-negative-s8.png",
		},
	],
	// Three.js relevant objects
	renderer: null,
	composer: null,
	mirrorPass: null,
	// last frame time
	lastFrame: performance.now() / 1000,
	// current user colorObject
	colorObject: null,
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

	// Apply settings from the project.json "properties" object and takes certain actions
	applyCustomProps: function (props) {
		print("applying settings: " + Object.keys(props).length);

		var _ignore = ["debugging", "audioprocessing", "img_overlay",
			"img_background", "base_texture", "mirror_invalid_val"];

		var _reInit = ["texture_size", "stats_option", "field_of_view", "fog_thickness", "scaling_factor",
			"camera_bound", "num_points_per_subset", "num_subsets_per_level", "num_levels", "level_depth",
			"level_shifting", "bloom_filter", "lut_filter", "mirror_shader", "mirror_invert"];

		var self = audiOrbits;
		var sett = self.settings;
		var reInitFlag = false;

		// loop all settings for updated values
		for (var setting in props) {
			// ignore this setting or apply it manually
			if (_ignore.includes(setting) || setting.startsWith("HEADER_")) continue;
			// get the updated setting
			var prop = props[setting];
			// check typing
			if (!prop || !prop.type || prop.type == "text") continue;
			if (sett[setting] != null) {
				// save b4
				var b4Setting = sett[setting];
				// apply prop value
				if (prop.type == "bool")
					sett[setting] = prop.value == true;
				else
					sett[setting] = prop.value;

				// set re-init flag if value changed and included in list
				reInitFlag = reInitFlag || b4Setting != sett[setting] && _reInit.includes(setting);
			}
			else print("Unknown setting: " + setting);
		}

		// apply audio analyzer-relevant settings
		weas.audio_smoothing = sett.audio_smoothing;
		weas.silentThreshHold = sett.minimum_volume / 1000;

		// create preview
		if (!self.icuePreview && sett.icue_area_preview) {
			self.icuePreview = document.createElement("div");
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

		// Custom user images
		var setImgSrc = function (imgID, srcVal) {
			$(imgID).fadeOut(1000, () => {
				if (srcVal && srcVal !== "") {
					$(imgID).attr("src", "file:///" + srcVal);
					$(imgID).fadeIn(1000);
				}
			});
		};
		if (props["img_background"])
			setImgSrc("#img_back", props["img_background"].value);
		if (props["img_overlay"])
			setImgSrc("#img_over", props["img_overlay"].value);

		// intitialize texture splash
		if (props["base_texture"]) {
			var val = props["base_texture"].value;
			switch (val) {
				default: sett.base_texture_path = "./img/galaxy.png"; break;
				case 1: sett.base_texture_path = "./img/cuboid.png"; break;
				case 2: sett.base_texture_path = "./img/fractal.png"; break;
			}
			reInitFlag = true;
		}

		// re-initialize colors if mode or user value changed
		if (props["color_mode"] || props["user_color_a"] || props["user_color_b"]) {
			self.initHueValues();
		}

		// debug logging
		if (props["debugging"]) self.debug = props["debugging"].value == true;
		if (!self.debug && self.debugTimeout) {
			clearTimeout(self.debugTimeout);
			self.debugTimeout = null;
		}
		if (self.debug && !self.debugTimeout) self.debugTimeout = setTimeout(() => self.applyCustomProps({ "debugging": { value: false } }), 1000 * 60);
		$("#debugwnd").css("visibility", self.debug ? "visible" : "hidden");

		// fix for centered camera on Parallax "none"
		if (sett.parallax_option == 0) self.mouseX = self.mouseY = 0;
		// set Cursor for "fixed" parallax mode
		if (sett.parallax_option == 3) self.positionMouseAngle(sett.parallax_angle);

		// have render-relevant settings been changed?
		return reInitFlag;
	},


	///////////////////////////////////////////////
	// INITIALIZE
	///////////////////////////////////////////////

	initFirst: function () {
		// Setup button, slider & window listeners only ever once!
		document.addEventListener("mousemove", (event) => {
			var sett = this.settings;
			if (sett.parallax_option != 1) return;
			this.mouseX = event.clientX - this.windowHalfX;
			this.mouseY = event.clientY - this.windowHalfY;
		}, false);
		document.addEventListener("touchstart", (event) => {
			var sett = this.settings;
			if (sett.parallax_option != 1) return;
			if (event.touches.length == 1) {
				event.preventDefault();
				this.mouseX = event.touches[0].pageX - this.windowHalfX;
				this.mouseY = event.touches[0].pageY - this.windowHalfY;
			}
		}, false);
		document.addEventListener("touchmove", (event) => {
			var sett = this.settings;
			if (sett.parallax_option != 1) return;
			if (event.touches.length == 1) {
				event.preventDefault();
				this.mouseX = event.touches[0].pageX - this.windowHalfX;
				this.mouseY = event.touches[0].pageY - this.windowHalfY;
			}
		}, false);
		window.addEventListener("resize", (event) => {
			this.windowHalfX = window.innerWidth / 2;
			this.windowHalfY = window.innerHeight / 2;
			if (!this.initialized) return;
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		}, false);

		const makeIdentityLutTexture = function () {
			const identityLUT = new Uint8Array([
				0, 0, 0, 255, // black
				255, 0, 0, 255, // red
				0, 0, 255, 255, // blue
				255, 0, 255, 255, // magenta
				0, 255, 0, 255, // green
				255, 255, 0, 255, // yellow
				0, 255, 255, 255, // cyan
				255, 255, 255, 255, // white
			]);
			return function (filter) {
				const texture = new THREE.DataTexture(identityLUT, 4, 2, THREE.RGBAFormat);
				texture.minFilter = filter;
				texture.magFilter = filter;
				texture.needsUpdate = true;
				texture.flipY = false;
				return texture;
			};
		}();

		const makeLUTTexture = function () {
			const imgLoader = new THREE.ImageLoader();
			const ctx = document.createElement("canvas").getContext("2d");

			return function (info) {
				const texture = makeIdentityLutTexture(
					info.filter ? THREE.LinearFilter : THREE.NearestFilter);

				if (info.url) {
					const lutSize = info.size;
					// set the size to 2 (the identity size). We'll restore it when the
					// image has loaded. This way the code using the lut doesn't have to
					// care if the image has loaded or not
					info.size = 2;
					imgLoader.load(info.url, function (image) {
						const width = lutSize * lutSize;
						const height = lutSize;
						info.size = lutSize;
						ctx.canvas.width = width;
						ctx.canvas.height = height;
						ctx.drawImage(image, 0, 0);
						const imageData = ctx.getImageData(0, 0, width, height);
						texture.image.data = new Uint8Array(imageData.data.buffer);
						texture.image.width = width;
						texture.image.height = height;
						texture.needsUpdate = true;
					}, null, function (err) {
						console.log("Error loading LUT: ");
						throw err;
					});
				}

				return texture;
			};
		}();

		audiOrbits.lutTextures.forEach((info) => {
			// if not size set get it from the filename
			if (!info.size) {
				// assumes filename ends in '-s<num>[n]'
				// where <num> is the size of the 3DLUT cube
				// and [n] means 'no filtering' or 'nearest'
				//
				// examples:
				//    'foo-s16.png' = size:16, filter: true
				//    'bar-s8n.png' = size:8, filter: false
				const m = /-s(\d+)(n*)\.[^.]+$/.exec(info.url);
				if (m) {
					info.size = parseInt(m[1]);
					info.filter = info.filter === undefined ? m[2] !== "n" : info.filter;
				}
			}
			info.texture = makeLUTTexture(info);
		});

		// real initializer
		var initWrap = () => {
			$("#triggerwarn").fadeOut(1000, () => this.initSystem());
		};
		// initialize now or after a delay?
		if (!this.settings.seizure_warning) initWrap();
		else {
			$("#triggerwarn").fadeIn(1000);
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

		// Lifetime variables
		var self = this;
		var sett = self.settings;
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
		self.container = document.getElementById("renderContainer");
		// get canvas & context
		self.mainCanvas = document.getElementById("mainCvs");
		// get helper canvas & context
		self.helperCanvas = document.getElementById("helpCvs");
		self.helperCanvas.width = self.icueCanvasX;
		self.helperCanvas.height = self.icueCanvasY;
		self.helperCanvas.style.display = "none";
		self.helperContext = self.helperCanvas.getContext("2d");

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
				self.initHueValues();
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
				self.renderer = new THREE.WebGLRenderer({
					canvas: self.mainCanvas,
					clearColor: 0x000000,
					clearAlpha: 1,
					alpha: true,
					antialias: true
				});
				self.renderer.setSize(window.innerWidth, window.innerHeight);

				// enable web-vr context
				if (self.isWebContext) {
					self.initWebVR();
				}

				// initialize Composer for Shaders

				// add import Pass from real renderer
				self.composer = new THREE.EffectComposer(self.renderer);
				self.composer.addPass(new THREE.RenderPass(self.scene, self.camera, null, 0x000000, 1));
				// last added filter
				var lastEffect = null;
				// bloom
				if (sett.bloom_filter) {
					var urBloomPass = new THREE.UnrealBloomPass(512);
					lastEffect = urBloomPass;
					urBloomPass.renderToScreen = false;
					self.composer.addPass(urBloomPass);
				}
				// lookuptable filter
				if (sett.lut_filter >= 0) {
					// add normal or filtered LUT shader
					var lutInfo = self.lutTextures[sett.lut_filter];
					// get normal or filtered LUT shader
					var lutPass = new THREE.ShaderPass(lutInfo.filter ?
						THREE.LUTShader : THREE.LUTShaderNearest);
					// prepare render queue
					lastEffect = lutPass;
					lutPass.renderToScreen = false;
					self.composer.addPass(lutPass);
					// set shader uniform values
					lutPass.uniforms.lutMap.value = lutInfo.texture;
					lutPass.uniforms.lutMapSize.value = lutInfo.size;
				}
				// fractal mirror shader
				if (sett.mirror_shader > 1) {
					var mirrorPass = new THREE.ShaderPass(THREE.FractalMirrorShader);
					lastEffect = mirrorPass;
					mirrorPass.renderToScreen = false;
					self.composer.addPass(mirrorPass);
					// set shader uniform values
					mirrorPass.uniforms.invert.value = sett.mirror_invert;
					mirrorPass.uniforms.numSides.value = sett.mirror_shader;
					mirrorPass.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
				}
				// render last effect
				if (lastEffect)
					lastEffect.renderToScreen = true;

				// prepare new orbit levels for the first reset/moveBack when a subset passes the camera
				for (var l = 0; l < sett.num_levels; l++) {
					self.generateLevel(self.levels[l]);
				}
				// init plugins
				if (self.icueAvailable) self.initICUE();
				else self.icueMessage("iCUE: Not available!");
				// start bg parallax handler
				swirlInterval = setInterval(self.swirlHandler, 1000 / 60);
				// start rendering
				self.renderer.setAnimationLoop(self.renderLoop);
				$("#renderContainer").fadeIn(5000);
				self.popupMessage("<h1>" + document.title + "</h1>", true);
				// print
				print("startup complete.", true);
			},
			// onProgress callback currently not supported
			undefined,
			// onError callback
			(err) => {
				print("texture loading error:", true);
				print(err, true);
			}
		);
	},
	// initialize hue-values by color mode
	initHueValues: function () {
		var self = audiOrbits;
		if (!self.hueValues) self.hueValues = [];
		var sett = self.settings;
		var cobj = self.colorObject = self.getColorObject();
		//print("initHueV: a=" + cobj.hsla + ", b=" + cobj.hslb);
		for (var s = 0; s < sett.num_subsets_per_level; s++) {
			var col = Math.random();
			switch (sett.color_mode) {
				case 1:
				case 4: col = cobj.hsla; break;
				case 2: col = cobj.min + (s / sett.num_subsets_per_level * cobj.range); break;
				case 3: col = cobj.min + (col * cobj.range); break;
			}
			self.hueValues[s] = col;
		}
	},
	// returns the processed user color object
	getColorObject: function () {
		var self = audiOrbits;
		var sett = self.settings;
		var a = self.rgbToHue(sett.user_color_a.split(" "));
		var b = self.rgbToHue(sett.user_color_b.split(" "));
		var mi = Math.min(a, b);
		var ma = Math.max(a, b);
		return {
			hsla: a,
			hslb: b,
			min: mi,
			max: ma,
			range: ma - mi
		}
	},
	// get HUE val
	rgbToHue: function (arr) {
		var r1 = arr[0];
		var g1 = arr[1];
		var b1 = arr[2];
		var maxColor = Math.max(r1, g1, b1);
		var minColor = Math.min(r1, g1, b1);
		var L = (maxColor + minColor) / 2;
		var S = 0;
		var H = 0;
		if (maxColor != minColor) {
			if (L < 0.5) {
				S = (maxColor - minColor) / (maxColor + minColor);
			} else {
				S = (maxColor - minColor) / (2.0 - maxColor - minColor);
			}
			if (r1 == maxColor) {
				H = (g1 - b1) / (maxColor - minColor);
			} else if (g1 == maxColor) {
				H = 2.0 + (b1 - r1) / (maxColor - minColor);
			} else {
				H = 4.0 + (r1 - g1) / (maxColor - minColor);
			}
		}
		L = L * 100;
		S = S * 100;
		H = H * 60;
		if (H < 0) {
			H += 360;
		}
		return H / 360;
	},
	// re-initialies the walpaper some time after an "advanced setting" has been changed
	reInitSystem: function () {
		print("reInitSystem()");

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
		var mainCvs = document.createElement("canvas");
		mainCvs.id = "mainCvs";
		this.container.appendChild(mainCvs);
		// recreate icue help canvas
		this.container.removeChild(this.helperCanvas);
		var helpCvs = document.createElement("canvas");
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
			// Figure out how much time passed since the last animation
			var fpsThreshMin = 1 / sett.fps_limit;
			var now = performance.now() / 1000;
			var ellapsed = Math.min(now - self.lastFrame, 1);
			var delta = ellapsed / fpsThreshMin * 60 / sett.fps_limit;
			// set lastFrame for 
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
		var cObj = self.colorObject;
		var sett = self.settings;
		var flmult = (15 + sett.audio_multiplier) * 0.02;
		var spvn = sett.zoom_val;
		var rot = sett.rotation_val / 5000;
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

		// shift hue values
		if (sett.color_mode == 0) {
			var hueAdd = (sett.color_fade_speed / 4000) * deltaTime;
			for (var s = 0; s < sett.num_subsets_per_level - 1; s++) {
				hueValues[s] += hueAdd;
				if(hueValues[s] >= 1)
					hueValues[s] -= 2;
			}
		}

		// set camera view-target to scene-center
		camera.lookAt(scene.position);

		// calculate boost strength & step size if data given
		var hasAudio = weas.hasAudio();
		var lastAudio, boost, step;
		if (hasAudio) {
			spvn = spvn + sett.audiozoom_val / 1.5;
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
			rot *= boost * 0.02;

		// position all objects
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

		}

		// HSL calculation with audio?
		if (hasAudio) {
			// move as many calculations out of loop as possible
			var minSat = sett.minimum_saturation / 100;
			var minBri = sett.minimum_brightness / 100;
			// iterate through all objects
			for (i = 0; i < scenelen; i++) {
				var child = scene.children[i];
				// use obj to camera distance with step to get frequency from data >> do some frequency calculations
				var freqIndx = Math.round((camera.position.z - child.position.z) / step) + 4;
				// get & process frequency data
				var cfreq = parseFloat(lastAudio.data[freqIndx]);
				var rFreq = (cfreq * flmult / 3) / lastAudio.max;
				var cHue = Math.abs(hueValues[child.mySubset]);
				// uhoh ugly special case
				if (sett.color_mode == 4) {
					var tHue = cObj.hslb;
					cHue += (tHue - cHue) * cfreq / lastAudio.max;
				}
				else if (sett.color_mode == 0)
					cHue += rFreq;
				// quick maths
				var nhue = cHue % 1.0;
				var nsat = Math.abs(minSat + rFreq + rFreq * boost * 0.07);
				var nlight = Math.min(0.7, minBri + rFreq + rFreq * boost * 0.02);
				// update dat shit
				//print("setHSL | child: " + i + " | h: " + nhue + " | s: " + nsat + " | l: " + nlight);
				child.myMaterial.color.setHSL(nhue, nsat, nlight);
			}
		}
		else {
			// get targeted saturation & brightness
			var defSat = sett.default_saturation / 100;
			var defBri = sett.default_brightness / 100;
			var sixtyDelta = deltaTime * 60;
			// iterate through all objects
			for (i = 0; i < scenelen; i++) {
				var child = scene.children[i];
				// get current HSL
				var hsl = child.myMaterial.color.getHSL({});
				var cHue = hsl.h, cSat = hsl.s, cLight = hsl.l;
				// targeted HUE
				var hue = Math.abs(hueValues[child.mySubset]);
				if(Math.abs(hue - cHue) > 0.01)
					cHue += (hue - cHue) / sixtyDelta;
				// targeted saturation
				if(Math.abs(defSat - cSat) > 0.01)
					cSat += (defSat - cSat) / sixtyDelta;
				// targeted brightness
				if(Math.abs(defBri - cLight) > 0.01)
					cLight += (defBri - cLight) / sixtyDelta;
				// update dat shit
				child.myMaterial.color.setHSL(cHue, cSat, cLight);
			}
		}

		// effect render
		if (self.composer) self.composer.render(ellapsed);
		// default render
		else self.renderer.render(scene, camera);

		// ICUE PROCESSING
		// its better to do this every frame instead of seperately timed
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

		// TODO: WEBVR PROCESSING
		if (self.isWebContext) {
			self.handleVRController(self.userData.controller1);
			self.handleVRController(self.userData.controller1);
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
				// Iteration formula (generalization of Barry Martin's one)
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
		// means the shape will update once the subset gets moved back to the end.
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
		if (sett.parallax_option != 2) return;
		self.swirlStep += sett.auto_parallax_speed / 8;
		if (self.swirlStep > 360) self.swirlStep -= 360;
		else if (self.swirlStep < 0) self.swirlStep += 360;
		self.positionMouseAngle(self.swirlStep);
	},
	// position Mouse with angle
	positionMouseAngle: function (degrees) {
		var self = audiOrbits;
		var ang = degrees * Math.PI / 180;
		var w = window.innerHeight;
		if (window.innerWidth < w) w = window.innerWidth;
		w /= 2;
		self.mouseX = w * Math.sin(ang);
		self.mouseY = w * Math.cos(ang);
	},
	// popup message handler
	popupMessage: function (msg, hideAfter) {
		$("#txtholder").html(msg);
		$("#txtholder").fadeIn({ queue: false, duration: "slow" });
		$("#txtholder").animate({ bottom: "40px" }, "slow");
		if (hideAfter) setTimeout(() => {
			$("#txtholder").fadeOut({ queue: false, duration: "slow" });
			$("#txtholder").animate({ bottom: "-40px" }, "slow");
		}, 15000);
	},
	// show a message by icue
	icueMessage: function (msg) {
		$("#icuetext").html(msg);
		$("#icueholder").fadeIn({ queue: false, duration: "slow" });
		$("#icueholder").animate({ top: "0px" }, "slow");
		setTimeout(() => {
			$("#icueholder").fadeOut({ queue: false, duration: "slow" });
			$("#icueholder").animate({ top: "-120px" }, "slow");
		}, 12000);
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
		// update devices about every 33ms/30fps. iCue doesnt really support higher values 
		self.icueInterval = setInterval(self.processICUE, 1000 / 30);
	},
	// process LEDs for iCUE devices
	processICUE: function () {
		var self = audiOrbits;
		var sett = self.settings;
		if (self.PAUSED || self.icueDevices.length < 1 || sett.icue_mode == 0) return;
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
				window.cue.setLedColorsByImageData(xi, encDat, cueWid, cueHei);
			}
		}
		// color mode
		if (sett.icue_mode == 2) {
			// get lol objects
			var col = sett.icue_main_color.split(" ");
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
		var sum = 0;
		var delta = 5;
		var alpha_left = 1 / (2 * Math.PI * delta * delta);
		var step = blur < 3 ? 1 : 2;
		for (var y = -blur; y <= blur; y += step) {
			for (var x = -blur; x <= blur; x += step) {
				var weight = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta));
				sum += weight;
			}
		}
		for (var y = -blur; y <= blur; y += step) {
			for (var x = -blur; x <= blur; x += step) {
				ctx.globalAlpha = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta)) / sum * blur * blur;
				ctx.drawImage(canvas, x, y);
			}
		}
		ctx.globalAlpha = 1;
	},


	///////////////////////////////////////////////
	// WEB-VR INTEGRATION
	///////////////////////////////////////////////

	// will initialize webvr components and rendering
	initWebVR: function () {
		var scene = audiOrbits.scene;
		var renderer = audiOrbits.renderer;
		var userData = audiOrbits.userData;

		self.renderer.vr.enabled = true;
		document.body.appendChild(VRButton.createButton(self.renderer));

		userData.controller1 = renderer.vr.getController(0);
		userData.controller1.addEventListener("selectstart", audiOrbits.onVRSelectStart);
		userData.controller1.addEventListener("selectend", audiOrbits.onVRSelectEnd);
		scene.add(userData.controller1);
		userData.controller2 = renderer.vr.getController(1);
		userData.controller2.addEventListener("selectstart", audiOrbits.onVRSelectStar);
		userData.controller2.addEventListener("selectend", audiOrbits.onVRSelectEnd);
		scene.add(userData.controller2);
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
		/* TODO
		controller.userData.isSelecting
		controller.position
		controller.quaternion
		*/
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
		if (audiOrbits.PAUSED == isPaused) return;
		console.log("Set pause: " + isPaused);
		audiOrbits.PAUSED = isPaused;
		audiOrbits.lastFrame = (performance.now() / 1000) - 1;
		audiOrbits.renderer.setAnimationLoop(isPaused ? null : audiOrbits.renderLoop);
	}
};

// will initialize icue functionality if available
window.wallpaperPluginListener = {
	onPluginLoaded: function (name, version) {
		print("Plugin loaded: " + name + ", Version: " + version);
		if (name === "cue") audiOrbits.icueAvailable = true;
	}
};

// will be called first when wallpaper is run from web(with wewwa)
window.wewwaListener = {
	initWebContext: function () {
		audiOrbits.isWebContext = true;
	}
};

// after the page finished loading: if the wallpaper context is not given
// AND wewwa fails for some reason => start wallpaper manually
$(() => {
	if (!window.wallpaperRegisterAudioListener) {
		print("wallpaperRegisterAudioListener not defined. We are probably outside of wallpaper engine. Manual init..");
		audiOrbits.applyCustomProps({});
		audiOrbits.initialized = true;
		audiOrbits.initFirst();
	}
});
