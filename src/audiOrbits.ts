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

import { ctxHolder } from './ctxHolder';
import { ReloadHelper } from '../we_utils/src/ReloadHelper';
import { WarnHelper } from '../we_utils/src/WarnHelper';


// custom logging function
var debug: boolean = false;
function print(arg, force?) {
	if (debug || force) console.log("AudiOrbits: " + JSON.stringify(arg));
}

// what's the wallpaper currently doing?
enum RunState {
	None = 0,
	Initializing = 1,
	Running = 2,
	Paused = 3,
	ReInitializing = 4
}

// base object for wallpaper
export class audiOrbits {
	// holds default wallpaper settings
	// these basically connect 1:1 to wallpaper engine settings.
	// for more explanation on settings visit the Workshop-Item-Forum (link above)
	settings = {
		schemecolor: "0 0 0",
		// Advanced
		stats_option: -1,
		shader_quality: "low",
		// Misc category
		seizure_warning: true,
		// mirrored setting
		parallax_option: 0,
		auto_parallax_speed: 1
	};

	// state of the Wallpaper
	state: RunState = RunState.None;

	// debugging
	debugTimeout: number = null;
	// Seconds & interval for reloading the wallpaper
	resetTimespan: number = 3;
	resetTimeout: number = null;

	// interval for swirlHandler
	swirlInterval: number = null;
	swirlStep: number = 0;

	// important objects
	ctxHolder: ctxHolder = new ctxHolder();
	reloadHelper: ReloadHelper = new ReloadHelper();
	warnHelper: WarnHelper = new WarnHelper();

	constructor() {
		// will apply settings edited in Wallpaper Engine
		// this will also cause initialization for the first time
		window['wallpaperPropertyListener'] = {
			applyGeneralProperties: (props) => {

			},
			applyUserProperties: (props) => {
				var initFlag = this.applyCustomProps(props);
				// very first initialization
				if (this.state == RunState.None) {
					this.state = RunState.Initializing;
					$(() => this.initOnce());
				}
				else if (initFlag) {
					this.state = RunState.ReInitializing;
					print("got reInit-flag from applying settings!", true);
					if (this.resetTimeout) clearTimeout(this.resetTimeout);
					this.resetTimeout = setTimeout(this.reInitSystem, this.resetTimespan * 1000);
					// show reloader
					this.reloadHelper.Show();
					// stop frame animation
					this.ctxHolder.setRenderer(false);
				}
			},
			setPaused: (isPaused) => {
				if (this.state == RunState.Paused) {
					if (isPaused) return;
					this.state = RunState.Running;
				}
				else if (this.state == RunState.Running) {
					if (!isPaused) return;
					this.state = RunState.Paused;
				}
				console.log("Set pause: " + isPaused);
				this.ctxHolder.setRenderer(isPaused);
			}
		};

	}

	///////////////////////////////////////////////
	// APPLY SETTINGS
	///////////////////////////////////////////////

	// Apply settings from the project.json "properties" object and takes certain actions
	applyCustomProps(props) {
		print("applying settings: " + Object.keys(props).length);

		const _ignore: string[] = ["debugging", "img_overlay", "img_background", "base_texture", "mirror_invalid_val"];

		const _reInit: string[] = ["texture_size", "stats_option", "field_of_view", "fog_thickness", "icue_mode",
			"scaling_factor", "camera_bound", "num_points_per_subset", "num_subsets_per_level",
			"num_levels", "level_depth", "level_shifting", "bloom_filter", "lut_filter", "mirror_shader",
			"mirror_invert", "fx_antialiasing", "blur_strength", "custom_fps", "shader_quality"];

		var sett = this.settings;
		var reInitFlag = false;

		// possible apply-targets
		var settStorage = [sett, this.ctxHolder.settings, this.ctxHolder.weas.settings, this.ctxHolder.weicue.settings,
			this.ctxHolder.colorHolder.settings, this.ctxHolder.shaderHolder.settings, this.ctxHolder.geoHolder.settings];

		// loop all settings for updated values
		for (var setting in props) {
			// ignore this setting or apply it manually
			if (_ignore.indexOf(setting) > -1 || this.startsWith(setting, "HEADER_")) continue;
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
					reInitFlag = reInitFlag || b4Setting != storage[setting] && _reInit.indexOf(setting) > -1;
				}
			}
			// invalid?
			if (!found) print("Unknown setting: " + setting + ". Are you using an old preset?", true);
		}

		// update parallax / weicue settings
		this.ctxHolder.updateSettings();

		// Custom bg color
		if (props.main_color) {
			var spl = props.main_color.value.split(' ');
			for (var i = 0; i < spl.length; i++) spl[i] *= 255;
			document.body.style.backgroundColor = "rgb(" + spl.join(", ") + ")";
		}

		// Custom user images
		if (props.img_background)
			this.setImgSrc("#img_back", props.img_background.value);
		if (props.img_overlay)
			this.setImgSrc("#img_over", props.img_overlay.value);

		// re-initialize colors if mode or user value changed
		if (props.color_mode || props.user_color_a || props.user_color_b) {
			this.ctxHolder.colorHolder.init();
		}

		// debug logging
		if (props.debugging) debug = props.debugging.value == true;
		if (!debug && this.debugTimeout) {
			clearTimeout(this.debugTimeout);
			this.debugTimeout = null;
		}
		if (debug && !this.debugTimeout)
			this.debugTimeout = setTimeout(() => this.applyCustomProps({ debugging: { value: false } }), 1000 * 60);
		$("#debugwnd").css("visibility", debug ? "visible" : "hidden");

		// have render-relevant settings been changed?
		return reInitFlag;
	}

	startsWith(str, word) {
		return str.lastIndexOf(word, 0) === 0;
	}

	// Set Image
	setImgSrc(imgID: string, srcVal: string) {
		$(imgID).fadeOut(1000, () => {
			if (srcVal && srcVal !== "") {
				$(imgID).attr("src", "file:///" + srcVal);
				$(imgID).fadeIn(1000);
			}
		});
	}


	///////////////////////////////////////////////
	// INITIALIZE
	///////////////////////////////////////////////

	initOnce() {
		print("initializing...");
		var sett = this.settings;
		// bruh...
		ThreePatcher.patch();

		// TODO
		//THREE.Cache.enabled = true;

		// initialize wrapper
		var initWrap = () => {
			this.initSystem();
			this.popupMessage("<h1>" + document.title + "</h1>", true);
		};

		// show seizure warning before initializing?
		if (!sett.seizure_warning) initWrap();
		else this.warnHelper.Show(initWrap);
	}

	// re-initialies the walpaper after some time
	reInitSystem() {
		print("re-initializing...");
		// hide reloader
		this.reloadHelper.Hide();
		// kill intervals
		clearInterval(this.swirlInterval);
		this.swirlStep = 0;
		// actual re-init
		this.initSystem();
	}

	// initialize the geometric & grpahics system
	// => starts rendering loop afterwards
	initSystem() {
		// initialize three js and add geometry to returned scene
		this.ctxHolder.init(() => {
			// start auto parallax handler
			this.swirlInterval = setInterval(this.swirlHandler, 1000 / 60);
			// print
			print("initializing complete.", true);
			// start rendering
			this.ctxHolder.setRenderer(true);
			this.state = RunState.Running;
		});
	}


	///////////////////////////////////////////////
	// EVENT HANDLER & TIMERS
	///////////////////////////////////////////////

	// Auto Parallax handler
	swirlHandler() {
		var sett = this.settings;
		if (sett.parallax_option != 2) return;
		this.swirlStep += sett.auto_parallax_speed / 8;
		if (this.swirlStep > 360) this.swirlStep -= 360;
		else if (this.swirlStep < 0) this.swirlStep += 360;
		this.ctxHolder.positionMouseAngle(this.swirlStep);
	}

	// popup message handler
	popupMessage(msg, hideAfter) {
		$("#txtholder").html(msg);
		$("#txtholder").fadeIn({ queue: false, duration: "slow" });
		$("#txtholder").animate({ bottom: "40px" }, "slow");
		if (hideAfter) setTimeout(() => {
			$("#txtholder").fadeOut({ queue: false, duration: "slow" });
			$("#txtholder").animate({ bottom: "-40px" }, "slow");
		}, 7000);
	}
};
