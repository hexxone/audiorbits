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
 * - always allow color fading?
 * - new color mode "level splitting"?
 * - finish implementing Web-XR
 * 		- add "center"-mode for camera?
 * - record "how to debug"-video?
 * - highlight seizure text on white BG
 * - fix reload notification
 * - add missing reload trigger texts
 * 
 * - fix translations
 * - split shaders from context
 * - switch to typescript
 * - use webworker rendering?
 * - only show audio-related settings if enabled
 * - fix peak filter
 * - fix shader precision inject?
 * 
 * - implement 3x new dropdown settings
 * - implement audio max saturation & brightness
 * 
 * - use buffer for geometry colors?
 * - calculate in weasWorker?
 * - weas_custom branch?
 * 
 * - add new re-init vars
 * - remove "misc" category
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
	// holds default wallpaper settings
	// these basically connect 1:1 to wallpaper engine settings.
	// for more explanation on settings visit the Workshop-Item-Forum (link above)
	settings: {
		schemecolor: "0 0 0",
		// Advanced
		stats_option: -1,
		shader_quality: "low",
		// Misc category
		seizure_warning: true,
	},

	// state of the Wallpaper
	state: 0,

	// debugging
	debug: false,
	debugTimeout: null,
	// Seconds & interval for reloading the wallpaper
	resetTimespan: 3,
	resetTimeout: null,


	// interval for swirlHandler
	swirlInterval: null,
	swirlStep: 0,

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
		var settStorage = [sett, weas.settings, weicue.settings, colorHolder.settings,
			ctxHolder.settings, shaderHolder.settings, geoHolder.settings];

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
		// update parallax -> mouse settings
		ctxHolder.updateSettings();

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

		// re-initialize colors if mode or user value changed
		if (props.color_mode || props.user_color_a || props.user_color_b) {
			colorHolder.init();
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
		THREE.Cache.enabled = true;

		// init plugins
		lutSetup.run();
		weicue.init();

		// initialize wrapper
		var initWrap = () => {
			self.initSystem();
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
		self.swirlStep = 0;
		// kill stats
		if (self.stats) self.stats.dispose();
		self.stats = null;
		// actual re-init
		self.initSystem();
	},

	// initialize the geometric & grpahics system
	// => starts rendering loop afterwards
	initSystem: function () {
		// Lifetime variables
		var self = audiOrbits;
		// prepare shaders
		ShaderQuality.Inject(self.settings.shader_quality,
			[THREE.BlendShader, THREE.BlurShader, THREE.FractalMirrorShader,
			THREE.FXAAShader, THREE.LuminosityHighPassShader, THREE.LUTShader]);
		// initialize three js and add geometry to returned scene
		geoHolder.init(ctxHolder.init(), () => {
			// start auto parallax handler
			self.swirlInterval = setInterval(self.swirlHandler, 1000 / 60);
			// print
			print("initializing complete.", true);
			// start rendering
			ctxHolder.setRenderer(true);
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
		ctxHolder.positionMouseAngle(self.swirlStep);
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
			// stop frame animation
			ctxHolder.setRenderer(false);
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
		ctxHolder.setRenderer(isPaused);
	}
};
