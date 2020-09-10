/**
 * @author D.Thiele @https://hexx.one
 * 
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @see
 * AudiOrbits project	(https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780)
 * for Wallpaper Engine (https://steamcommunity.com/app/431960)
 * by Hexxon 			(https://hexx.one)
 * 
 * You don't own Wallper Engine but want to see this in action?
 * Go here:	https://orbits.hexx.one
 * 
 * @description
 * Audiorbits for Wallpaper Engine
 * 
 * If you're reading this you're either pretty interested in the code or just bored :P
 * Either way thanks for using this Wallpaper I guess.
 * Leave me some feedback on the Workshop-Page for this item if you like!
 * 
 * @todo
 * - Add Shader precision extra setting
 * - finish implementing Web-XR
 * - record "how to debug"-video?
 * - highlight seizure text on white BG
 * 
 * - split Color, Saturation, Brightness
 * - move audio min saturation & brightness
 * - add audio max saturation & brightness
*/

// custom logging function
function print(arg, force) {
	if (audiOrbits.debug || force) console.log("AudiOrbits: " + JSON.stringify(arg));
}

// what's the wallpaper currently doing?
var RunState = {
	None: 0,
	Initializing: 1,
	Running: 2,
	Paused: 3,
	ReInitializing: 4
};

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
		custom_fps: false,
		fps_value: 60,
		minimum_brightness: 10,
		minimum_saturation: 10,
		audio_multiplier: 2,
		audio_smoothing: 75,
		audiozoom_val: 2,
		only_forward: false,
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
		shader_quality: "low",
		field_of_view: 90,
		fog_thickness: 3,
		scaling_factor: 1800,
		camera_bound: 1000,
		num_points_per_subset: 4096,
		num_subsets_per_level: 12,
		num_levels: 6,
		level_depth: 1200,
		level_shifting: false,
		bloom_filter: false,
		lut_filter: -1,
		mirror_shader: 0,
		mirror_invert: false,
		fx_antialiasing: true,
		blur_strength: 0,
		color_mode: 0,
		user_color_a: "1 0.5 0",
		user_color_b: "0 0.5 1",
		seizure_warning: true,
	},
	/* Have you ever wondered,
	how many settings are too many settings?
	No? Me neither */

	isWebContext: false,
	// state of the Wallpaper
	state: 0,

	// debugging
	debug: false,
	debugTimeout: null,

	// relevant html elements
	container: null,
	mainCanvas: null,
	helperContext: null,
	// these are set once 
	resetBar: null,
	resetText: null,

	// Seconds & interval for reloading the wallpaper
	resetTimespan: 3,
	resetTimeout: null,

	// render relevant stuff
	clock: null,
	renderTimeout: null,

	// interval for swirlHandler
	swirlInterval: null,

	// extended  user settings
	colorObject: null,
	// mouse over canvas
	mouseX: 0,
	mouseY: 0,
	// window half size
	windowHalfX: window.innerWidth / 2,
	windowHalfY: window.innerHeight / 2,

	// Three.js relevant objects
	renderer: null,
	composer: null,
	camera: null,
	scene: null,
	// main orbit data
	levels: [],
	moveBacks: [],
	hueValues: [],
	// actions to perform after render
	afterRenderQueue: [],

	// generator holder
	levelWorker: null,
	levelWorkersRunning: 0,
	levelWorkerCall: null,

	///////////////////////////////////////////////
	// APPLY SETTINGS
	///////////////////////////////////////////////

	// Apply settings from the project.json "properties" object and takes certain actions
	applyCustomProps: function (props) {
		print("applying settings: " + Object.keys(props).length);

		var _ignore = ["debugging", "img_overlay", "img_background", "base_texture", "mirror_invalid_val"];

		var _reInit = ["texture_size", "stats_option", "field_of_view", "fog_thickness", "icue_mode",
			"scaling_factor", "camera_bound", "num_points_per_subset", "num_subsets_per_level",
			"num_levels", "level_depth", "level_shifting", "bloom_filter", "lut_filter", "mirror_shader",
			"mirror_invert", "fx_antialiasing", "blur_strength", "custom_fps", "shader_quality"];

		var self = audiOrbits;
		var sett = self.settings;
		var reInitFlag = false;

		// possible apply-targets
		var settStorage = [sett, weas.settings, weicue.settings];

		// loop all settings for updated values
		for (var setting in props) {
			// ignore this setting or apply it manually
			if (_ignore.includes(setting) || setting.startsWith("HEADER_")) continue;
			// get the updated setting
			var prop = props[setting];
			// check typing
			if (!prop || !prop.type || prop.type == "text") continue;

			var found = false;
			// process all storages
			for (var storage of settStorage) {
				if (storage[setting] != null) {
					// save b4
					found = true;
					var b4Setting = storage[setting];
					// apply prop value
					if (prop.type == "bool")
						storage[setting] = prop.value == true;
					else
						storage[setting] = prop.value;

					// set re-init flag if value changed and included in list
					reInitFlag = reInitFlag || b4Setting != storage[setting] && _reInit.includes(setting);
				}
			}
			// invalid?
			if (!found) print("Unknown setting: " + setting + ". Are you using an old preset?", true);
		}

		// update preview visbility after setting possibly changed
		weicue.updatePreview();

		// Custom bg color
		if (props.main_color) {
			var spl = props.main_color.value.split(' ');
			for (var i = 0; i < spl.length; i++) spl[i] *= 255;
			document.body.style.backgroundColor = "rgb(" + spl.join(", ") + ")";
		}

		// Custom user images
		if (props.img_background)
			self.setImgSrc("#img_back", props.img_background.value);
		if (props.img_overlay)
			self.setImgSrc("#img_over", props.img_overlay.value);

		// intitialize texture splash
		if (props.base_texture) {
			var val = props.base_texture.value;
			switch (val) {
				default: sett.base_texture_path = "./img/galaxy.png"; break;
				case 1: sett.base_texture_path = "./img/cuboid.png"; break;
				case 2: sett.base_texture_path = "./img/fractal.png"; break;
			}
			reInitFlag = true;
		}

		// re-initialize colors if mode or user value changed
		if (props.color_mode || props.user_color_a || props.user_color_b) {
			self.initHueValues();
		}

		// debug logging
		if (props.debugging) self.debug = props.debugging.value == true;
		if (!self.debug && self.debugTimeout) {
			clearTimeout(self.debugTimeout);
			self.debugTimeout = null;
		}
		if (self.debug && !self.debugTimeout)
			self.debugTimeout = setTimeout(() => self.applyCustomProps({ debugging: { value: false } }), 1000 * 60);
		$("#debugwnd").css("visibility", self.debug ? "visible" : "hidden");

		// fix for centered camera on Parallax "none"
		if (sett.parallax_option == 0) self.mouseX = self.mouseY = 0;
		// set Cursor for "fixed" parallax mode
		if (sett.parallax_option == 3) self.positionMouseAngle(sett.parallax_angle);

		// have render-relevant settings been changed?
		return reInitFlag;
	},
	// Set Image
	setImgSrc: function (imgID, srcVal) {
		$(imgID).fadeOut(1000, () => {
			if (srcVal && srcVal !== "") {
				$(imgID).attr("src", "file:///" + srcVal);
				$(imgID).fadeIn(1000);
			}
		});
	},


	///////////////////////////////////////////////
	// INITIALIZE
	///////////////////////////////////////////////

	initOnce: function () {
		print("initializing...");
		var self = audiOrbits;
		var sett = self.settings;

		// No WebGL ? o.O
		if (!THREE || !Detector.webgl) {
			Detector.addGetWebGLMessage();
			return;
		}

		// bruh...
		ThreePatcher.patch();
		// set global caching
		THREE.Cache.enabled = true;

		// get static elements
		self.resetBar = document.getElementById("reload-bar");
		self.resetText = document.getElementById("reload-text");
		self.container = document.getElementById("renderContainer");

		// add global mouse (parallax) listener
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

		// init plugins
		LUTSetup.run();
		weicue.init();

		// initialize
		self.clock = new THREE.Clock();
		self.initSystem();

		// initialize wrapper
		var initWrap = () => {
			$("#mainCvs").addClass("show");
			self.popupMessage("<h1>" + document.title + "</h1>", true);
		};

		// show seizure warning before initializing?
		if (!sett.seizure_warning) initWrap();
		else WarnHelper.Show(initWrap);
	},

	// re-initialies the walpaper after some time
	reInitSystem: function () {
		print("re-initializing...");
		// Lifetime variables
		var self = audiOrbits;

		// hide reloader
		ReloadHelper.Hide();
		// kill intervals
		clearInterval(self.swirlInterval);
		self.levelWorker.terminate();
		self.levelWorkersRunning = 0;
		// kill stats
		if (self.stats) self.stats.dispose();
		self.stats = null;
		// kill shader processor
		if (self.composer) self.composer.reset();
		self.composer = null;
		// kill frame animation and webgl
		self.setRenderer(null);
		self.renderer.forceContextLoss();
		// recreate webgl canvas
		self.container.removeChild(self.mainCanvas);
		var mainCvs = document.createElement("canvas");
		mainCvs.id = "mainCvs";
		self.container.appendChild(mainCvs);
		// actual re-init
		self.initSystem();
		// show again
		$("#mainCvs").addClass("show");
	},

	// initialize the geometric & grpahics system
	// => starts rendering loop afterwards
	initSystem: function () {
		// Lifetime variables
		var self = audiOrbits;
		var sett = self.settings;

		// reset rendering
		self.speedVelocity = 0;
		self.swirlStep = 0;
		// reset Orbit data
		self.levels = [];
		self.moveBacks = [];
		self.hueValues = [];
		self.afterRenderQueue = [];

		// setup level generator
		self.levelWorker = new Worker('./js/worker/levelWorker.js');
		self.levelWorker.addEventListener('message', self.levelGenerated, false);
		self.levelWorker.addEventListener('error', self.levelError, false);

		// init stats
		if (sett.stats_option >= 0) {
			print("Init stats: " + sett.stats_option);
			self.stats = new Stats();
			self.stats.showPanel(sett.stats_option); // 0: fps, 1: ms, 2: mb, 3+: custom
			document.body.appendChild(self.stats.dom);
		}

		// get canvases & contexts
		// ensure the canvas sizes are set !!!
		// these are independent from the style sizes
		self.mainCanvas = document.getElementById("mainCvs");
		self.mainCanvas.width = window.innerWidth;
		self.mainCanvas.height = window.innerHeight;

		// set origin Canvas to copy from
		weicue.mainCanvas = self.mainCanvas;

		// setup basic objects
		for (var l = 0; l < sett.num_levels; l++) {
			var sets = [];
			for (var i = 0; i < sett.num_subsets_per_level; i++) {
				sets[i] = {
					child: null,
				};
			}
			// set subset moveback counter
			self.moveBacks[l] = 0;
			// create level object
			self.levels[l] = {
				myLevel: l,
				subsets: sets
			};
		}

		print("loading Texture: " + sett.base_texture_path);
		// load main texture
		// path, onLoad, onProgress, onError
		new THREE.TextureLoader().load(sett.base_texture_path,
			self.initWithTexture, undefined, self.textureError
		);
	},

	/// continue intialisation affter texture was loaded
	initWithTexture: function (texture) {
		var self = audiOrbits;
		var sett = self.settings;
		print("texture loaded.")

		// create camera
		self.camera = new THREE.PerspectiveCamera(sett.field_of_view, window.innerWidth / window.innerHeight, 1, 3 * sett.scaling_factor);
		self.camera.position.z = sett.scaling_factor / 2;
		// create distance fog
		self.scene = new THREE.Scene();
		self.scene.fog = new THREE.FogExp2(0x000000, sett.fog_thickness / 10000);
		// generate random hue vals
		self.initHueValues();

		// generate level object structure
		self.initGeometries(texture);

		self.renderer = new THREE.WebGLRenderer({
			canvas: self.mainCanvas,
			clearColor: 0x000000,
			clearAlpha: 1,
			alpha: true,
			antialias: false,
			logarithmicDepthBuffer: true
		});
		self.renderer.setSize(window.innerWidth, window.innerHeight);

		// enable web-vr context
		if (self.isWebContext) {
			self.initWebXR();
		}

		// initialize Shader Composer
		self.composer = new THREE.EffectComposer(self.renderer);
		self.initShaders();

		// set function to be called when all levels are generated
		// will apply data and trigger to start rendering
		self.levelWorkerCall = () => {

			// apply data manually
			while (self.afterRenderQueue.length > 0) {
				self.afterRenderQueue.shift()();
			}

			// prepare new orbit levels for the first reset/moveBack already
			for (var l = 0; l < sett.num_levels; l++) {
				self.generateLevel(l);
			}

			// start auto parallax handler
			self.swirlInterval = setInterval(self.swirlHandler, 1000 / 60);

			// start rendering
			self.setRenderer(self.renderLoop);

			// print
			print("initializing complete.", true);
		};

		// generate the levels
		for (var l = 0; l < sett.num_levels; l++) {
			self.generateLevel(l);
		}
	},

	// create WEBGL objects for each level and subset
	initGeometries: function (texture) {
		var self = audiOrbits;
		var sett = self.settings;
		print("building geometries.");
		// material properties
		var matprops = {
			map: texture,
			size: sett.texture_size,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		};

		var subsetDist = sett.level_depth / sett.num_subsets_per_level;
		// build all levels
		for (var k = 0; k < sett.num_levels; k++) {
			// build all subsets
			for (var s = 0; s < sett.num_subsets_per_level; s++) {
				// create particle geometry from orbit vertex data
				var geometry = new THREE.BufferGeometry();

				// position attribute (2 vertices per point, thats pretty illegal)
				geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sett.num_points_per_subset * 2), 2));

				// create particle material with map & size
				var material = new THREE.PointsMaterial(matprops);
				// set material defaults
				material.color.setHSL(self.hueValues[s], 0, 0);
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
				self.levels[k].subsets[s].child = particles;
			}
		}
	},

	// initialize shaders after composer
	initShaders: function () {
		var self = audiOrbits;
		var sett = self.settings;
		// last added filter
		var lastEffect = null;
		print("adding shaders to render chain.");
		self.composer.addPass(new THREE.RenderPass(self.scene, self.camera, null, 0x000000, 1));
		// bloom
		if (sett.bloom_filter) {
			var urBloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 3, 0, 0.1);
			urBloomPass.renderToScreen = false;
			self.composer.addPass(urBloomPass);
			lastEffect = urBloomPass;
		}

		// lookuptable filter
		if (sett.lut_filter >= 0) {
			// add normal or filtered LUT shader
			var lutInfo = LUTSetup.Textures[sett.lut_filter];
			// get normal or filtered LUT shader
			var lutPass = new THREE.ShaderPass(lutInfo.filter ?
				THREE.LUTShader : THREE.LUTShaderNearest);
			// prepare render queue
			lutPass.renderToScreen = false;
			lutPass.material.transparent = true;
			self.composer.addPass(lutPass);
			lastEffect = lutPass;
			// set shader uniform values
			lutPass.uniforms.lutMap.value = lutInfo.texture;
			lutPass.uniforms.lutMapSize.value = lutInfo.size;
		}

		// fractal mirror shader
		if (sett.mirror_shader > 1) {
			var mirrorPass = new THREE.ShaderPass(THREE.FractalMirrorShader);
			mirrorPass.renderToScreen = false;
			mirrorPass.material.transparent = true;
			self.composer.addPass(mirrorPass);
			lastEffect = mirrorPass;
			// set shader uniform values
			mirrorPass.uniforms.invert.value = sett.mirror_invert;
			mirrorPass.uniforms.numSides.value = sett.mirror_shader;
			mirrorPass.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
		}

		// Nvidia FX antialiasing
		if (sett.ufx_antialiasing) {
			var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
			fxaaPass.renderToScreen = false;
			fxaaPass.material.transparent = true;
			self.composer.addPass(fxaaPass);
			lastEffect = fxaaPass;
			// set uniform
			fxaaPass.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
		}

		// TWO-PASS Blur using the same directional shader
		if (sett.blur_strength > 0) {
			var bs = sett.blur_strength / 5;
			// X
			var blurPassX = new THREE.ShaderPass(THREE.BlurShader);
			blurPassX.renderToScreen = false;
			blurPassX.material.transparent = true;
			blurPassX.uniforms.u_dir.value = new THREE.Vector2(bs, 0);
			blurPassX.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
			self.composer.addPass(blurPassX);
			// Y
			var blurPassY = new THREE.ShaderPass(THREE.BlurShader);
			blurPassY.renderToScreen = false;
			blurPassY.material.transparent = true;
			blurPassY.uniforms.u_dir.value = new THREE.Vector2(0, bs);
			blurPassY.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
			self.composer.addPass(blurPassY);
			// chaining
			lastEffect = blurPassY;
		}

		// render last effect
		if (lastEffect) lastEffect.renderToScreen = true;
	},

	// failed to load texture
	textureError: function (err) {
		print("texture loading error:", true);
		print(err, true);
	},

	// initialize hue-values by color mode
	initHueValues: function () {
		var self = audiOrbits;
		var sett = self.settings;
		var cobj = self.colorObject = self.getColorObject();
		print("initHueValues: a=" + cobj.hsla + ", b=" + cobj.hslb, true);
		for (var s = 0; s < sett.num_subsets_per_level; s++) {
			var col = Math.random();
			switch (sett.color_mode) {
				case 1:
				case 4: col = cobj.hsla; break;
				case 2: col = cobj.hsla + (s / sett.num_subsets_per_level * cobj.range); break;
				case 3: col = cobj.hsla + (col * cobj.range); break;
			}
			self.hueValues[s] = col;
		}
	},
	// returns the processed user color object
	getColorObject: function () {
		var self = audiOrbits;
		var sett = self.settings;
		var a = self.rgbToHue(sett.user_color_a.split(" ")).h;
		var b = self.rgbToHue(sett.user_color_b.split(" ")).h;
		var mi = Math.min(a, b);
		var ma = Math.max(a, b);
		return {
			hsla: a,
			hslb: b,
			min: mi,
			max: ma,
			range: b - a
		};
	},
	// get HUE val
	rgbToHue: function (arr) {
		let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
		rabs = arr[0] / 255;
		gabs = arr[1] / 255;
		babs = arr[2] / 255;
		v = Math.max(rabs, gabs, babs),
			diff = v - Math.min(rabs, gabs, babs);
		diffc = c => (v - c) / 6 / diff + 1 / 2;
		percentRoundFn = num => Math.round(num * 100) / 100;
		if (diff == 0) {
			h = s = 0;
		} else {
			s = diff / v;
			rr = diffc(rabs);
			gg = diffc(gabs);
			bb = diffc(babs);

			if (rabs === v) {
				h = bb - gg;
			} else if (gabs === v) {
				h = (1 / 3) + rr - bb;
			} else if (babs === v) {
				h = (2 / 3) + gg - rr;
			}
			if (h < 0) {
				h += 1;
			} else if (h > 1) {
				h -= 1;
			}
		}
		return {
			h: h,
			s: s,
			v: v
		};
	},


	///////////////////////////////////////////////
	// RENDERING
	///////////////////////////////////////////////

	// start or stop rendering
	setRenderer: function (renderFunc) {
		print("setRenderer: " + (renderFunc != null));
		var self = audiOrbits;
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
		if (renderFunc != null) {
			// set state to running
			self.state = RunState.Running;
			// initialize rendering
			if (sett.custom_fps) {
				self.renderTimeout = setTimeout(self.renderLoop, 1000 / sett.fps_value);
			}
			else if (self.renderer) {
				self.renderer.setAnimationLoop(renderFunc);
			}
			else print("not initialized!", true);
		}
	},

	// root render frame call
	renderLoop: function () {
		var self = audiOrbits;
		var sett = self.settings;
		// paused - stop render
		if (self.state != RunState.Running) return;

		// custom rendering needs manual re-call
		if (self.renderTimeout)
			self.renderTimeout = setTimeout(self.renderLoop, 1000 / sett.fps_value);

		// track FPS, mem etc.
		if (self.stats) self.stats.begin();

		// Figure out how much time passed since the last animation and calc delta
		// Minimum we should reach is 1 FPS
		var ellapsed = Math.min(1, Math.max(0.001, self.clock.getDelta()));
		var delta = ellapsed * 60;

		// effect render first, then update
		self.composer.render();

		// update objects
		self.animateFrame(ellapsed, delta);

		// ICUE PROCESSING
		// its better to do this every frame instead of seperately timed
		weicue.updateCanvas();

		// TODO: WEBVR PROCESSING
		if (self.isWebContext) {
			self.handleVRController(self.userData.controller1);
			self.handleVRController(self.userData.controller1);
		}

		// randomly do one after-render-aqction
		// yes this is intended: "()()"
		if (self.afterRenderQueue.length > 0) {
			if (self.speedVelocity > 5 || Math.random() > 0.4)
				self.afterRenderQueue.shift()();
		}

		// stats
		if (self.stats) self.stats.end();
	},

	// render a single frame with the given delta
	animateFrame: function (ellapsed, deltaTime) {
		print("| animate | ellapsed: " + ellapsed + ", delta: " + deltaTime);
		var self = audiOrbits;
		var sett = self.settings;

		// calculate camera parallax with smoothing
		var clampCam = (axis) => Math.min(sett.camera_bound, Math.max(-sett.camera_bound, axis));
		var newCamX = clampCam(self.mouseX * sett.parallax_strength / 50);
		var newCamY = clampCam(self.mouseY * sett.parallax_strength / -50);
		if (self.camera.position.x != newCamX)
			self.camera.position.x += (newCamX - self.camera.position.x) * deltaTime * 0.05;
		if (self.camera.position.y != newCamY)
			self.camera.position.y += (newCamY - self.camera.position.y) * deltaTime * 0.05;

		// shift hue values
		if (sett.color_mode == 0) {
			var hueAdd = (sett.color_fade_speed / 4000) * deltaTime;
			for (var s = 0; s < sett.num_subsets_per_level - 1; s++) {
				self.hueValues[s] += hueAdd;
				if (self.hueValues[s] >= 1)
					self.hueValues[s] -= 1;
			}
		}

		// set camera view-target to scene-center
		self.camera.lookAt(self.scene.position);

		// calculate boost strength & step size if data given
		var flmult = (15 + sett.audio_multiplier) * 0.02;
		var spvn = sett.zoom_val / 1.5 * deltaTime;

		var hasAudio = weas.hasAudio();
		var lastAudio, boost, step;
		if (hasAudio) {
			spvn = (spvn + sett.audiozoom_val / 3) * deltaTime;
			// get 
			lastAudio = weas.lastAudio;
			// calc audio boost
			boost = lastAudio.intensity * flmult;
			// calculate step distance between levels
			step = (sett.num_levels * sett.level_depth * 1.2) / 128;
			// speed velocity calculation
			if (sett.audiozoom_val > 0)
				spvn += sett.zoom_val * boost * 0.01 + boost * sett.audiozoom_val * 0.03 * deltaTime;
		}

		// speed / zoom smoothing
		if (!hasAudio || sett.audiozoom_smooth) {
			spvn -= ((spvn - self.speedVelocity) * sett.audio_smoothing / 1000);
		}
		// no negative zoom?
		if (sett.only_forward && spvn < 0) {
			spvn = 0;
		}
		self.speedVelocity = spvn;

		// rotation calculation
		var rot = sett.rotation_val / 5000;
		if (hasAudio) rot *= boost * 0.02;
		rot *= deltaTime;

		// move as many calculations out of loop as possible
		var minSat = sett.minimum_saturation / 100;
		var minBri = sett.minimum_brightness / 100;
		// get targeted saturation & brightness
		var defSat = sett.default_saturation / 100;
		var defBri = sett.default_brightness / 100;
		var sixtyDelta = deltaTime * 2000;

		var i, child, freqData, freqLvl, hsl, tmpHue, setHue, setSat, setLight;
		// position all objects
		for (i = 0; i < self.scene.children.length; i++) {
			child = self.scene.children[i];

			// reset if out of bounds
			if (child.position.z > self.camera.position.z) {
				// offset to back
				//print("moved back child: " + i);
				child.position.z -= sett.num_levels * sett.level_depth;
				self.moveBacks[child.myLevel]++;

				// update the child visually
				if (child.needsUpdate) {
					child.geometry.attributes.position.needsUpdate = true;
					child.needsUpdate = false;
				}
				// process subset generation
				if (self.moveBacks[child.myLevel] == sett.num_subsets_per_level) {
					self.moveBacks[child.myLevel] = 0;
					self.generateLevel(child.myLevel);
				}
			}

			// velocity & rotation
			child.position.z += spvn;
			child.rotation.z -= rot;

			// targeted HUE
			tmpHue = Math.abs(self.hueValues[child.mySubset]);

			// HSL calculation with audio?
			if (hasAudio) {
				// use obj to camera distance with step to get frequency from data >> do some frequency calculations
				// get & process frequency data
				freqData = parseFloat(lastAudio.data[Math.round((self.camera.position.z - child.position.z) / step) + 4]);
				freqLvl = (freqData * flmult / 3) / lastAudio.max;
				// uhoh ugly special case
				if (sett.color_mode == 4)
					tmpHue += (self.colorObject.hslb - tmpHue) * freqData / lastAudio.max;
				else if (sett.color_mode == 0)
					tmpHue += freqLvl;
				// quick maths
				setHue = tmpHue % 1.0;
				setSat = Math.abs(minSat + freqLvl + freqLvl * boost * 0.07);
				setLight = Math.min(0.7, minBri + freqLvl + freqLvl * boost * 0.01);
			}
			else {
				// get current HSL
				hsl = child.myMaterial.color.getHSL({});
				setHue = hsl.h;
				setSat = hsl.s;
				setLight = hsl.l;
				// targeted HUE
				if (Math.abs(tmpHue - setHue) > 0.01)
					setHue += (tmpHue - setHue) / sixtyDelta;
				// targeted saturation
				if (Math.abs(defSat - setSat) > 0.01)
					setSat += (defSat - setSat) / sixtyDelta;
				// targeted brightness
				if (Math.abs(defBri - setLight) > 0.01)
					setLight += (defBri - setLight) / sixtyDelta;
			}
			// update dat shit
			print("setHSL | child: " + i + " | h: " + setHue + " | s: " + setSat + " | l: " + setLight);
			child.myMaterial.color.setHSL(self.clamp(setHue, 0, 1, true), self.clamp(setSat, 0, 1), self.clamp(setLight, 0, 1));
		}
	},
	// correct dem colors to be safe
	clamp: function (val, min, max, goround) {
		if (goround) {
			if (val < min) return max - val;
			return val % max;
		}
		else {
			return Math.max(Math.min(val, max), min);
		}
	},

	///////////////////////////////////////////////
	// FRACTAL GENERATOR
	///////////////////////////////////////////////

	// web worker has finished generating the level
	levelGenerated: function (e) {
		let ldata = e.data;
		print("generated level: " + ldata.id);

		var self = audiOrbits;
		var sett = self.settings;
		self.levelWorkersRunning--;

		let xyzBuf = new Float32Array(ldata.xyzBuff);
		var subbs = self.levels[ldata.id].subsets;

		// spread over time for less thread blocking
		for (let s = 0; s < sett.num_subsets_per_level; s++) {
			self.afterRenderQueue.push(() => {
				// copy start index
				var from = (s * sett.num_points_per_subset) * 2;
				// copy end index
				var tooo = (s * sett.num_points_per_subset + sett.num_points_per_subset) * 2;
				// slice & set xyzBuffer data, then update child
				subbs[s].child.geometry.attributes.position.set(xyzBuf.slice(from, tooo), 0);
				subbs[s].child.needsUpdate = true;
			});
		}

		// if all workers finished and we have a queued event, trigger it
		// this is used as "finished"-trigger for initial level generation...
		if (self.levelWorkersRunning == 0 && self.levelWorkerCall) {
			self.levelWorkerCall();
			self.levelWorkerCall = null;
		}
	},
	// uh oh
	levelError: function (e) {
		print("level error: [" + e.filename + ", Line: " + e.lineno + "] " + e.message, true);
	},
	// queue worker event
	generateLevel: function (level) {
		print("generating level: " + level);
		audiOrbits.levelWorkersRunning++;
		audiOrbits.levelWorker.postMessage({
			id: level,
			settings: audiOrbits.settings
		});
	},


	///////////////////////////////////////////////
	// EVENT HANDLER & TIMERS
	///////////////////////////////////////////////

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
		}, 7000);
	},


	///////////////////////////////////////////////
	// WEB-VR INTEGRATION
	///////////////////////////////////////////////

	// will initialize webvr components and rendering
	initWebXR: function () {
		var self = audiOrbits;
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
	}
};


///////////////////////////////////////////////
// Actual Initialisation
///////////////////////////////////////////////

// will apply settings edited in Wallpaper Engine
// this will also cause initialization for the first time
window.wallpaperPropertyListener = {
	applyGeneralProperties: (props) => { },
	applyUserProperties: (props) => {
		var initFlag = audiOrbits.applyCustomProps(props);
		// very first initialization
		if (audiOrbits.state == RunState.None) {
			audiOrbits.state = RunState.Initializing;
			$(() => audiOrbits.initOnce());
		}
		else if (initFlag) {
			audiOrbits.state = RunState.ReInitializing;
			print("got reInit-flag from applying settings!", true);
			if (audiOrbits.resetTimeout) clearTimeout(audiOrbits.resetTimeout);
			audiOrbits.resetTimeout = setTimeout(audiOrbits.reInitSystem, audiOrbits.resetTimespan * 1000);
			// show reloader
			ReloadHelper.Show();
			$("#mainCvs").removeClass("show");
		}
	},
	setPaused: (isPaused) => {
		if (audiOrbits.state == RunState.Paused) {
			if (isPaused) return;
			audiOrbits.state = RunState.Running;
		}
		else if (audiOrbits.state == RunState.Running) {
			if (!isPaused) return;
			audiOrbits.state = RunState.Paused;
		}
		console.log("Set pause: " + isPaused);
		audiOrbits.setRenderer(isPaused ? null : audiOrbits.renderLoop);
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
	if (!window.wallpaperRegisterAudioListener && audiOrbits.state == RunState.None) {
		print("wallpaperRegisterAudioListener not defined. We are probably outside of wallpaper engine. Manual init..", true);
		audiOrbits.applyCustomProps({});
		audiOrbits.state = RunState.Initializing;
		audiOrbits.initOnce();
	}
});
