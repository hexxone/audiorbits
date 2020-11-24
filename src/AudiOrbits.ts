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
 * - update translations -> project.json -> steam
 * - use webworker rendering?
 * - add new re-init vars
 * - implement color mode "level splitting"?
 * - use buffer for geometry colors && sizes?
 * 		- in weasWorker?
 * 
 * - test "min > max" saturation/light
 * - move fov to camera category
 * - add "camera centered" checkbox for vr
 * - add fog / leveldepth percentage density   ((1 / viewDist * val / 100))
 * 
 * - change weas worker path in we_utils?
 * 
 * - highlight seizure text on white BG
 * - finish implementing Web-XR
 * 		- add  "vr-cam" mode, with relative controls
 * - record "how to debug"-video?
 * 
*/

import { CtxHolder } from './CtxHolder';

import { LogLevel, Smallog } from './we_utils/src/Smallog';
import { ReloadHelper } from './we_utils/src/ReloadHelper';
import { WarnHelper } from './we_utils/src/WarnHelper';
import { CSettings } from "./we_utils/src/CSettings";
import { Ready } from './we_utils/src/Ready';

const Ignore: string[] = ["debugging", "img_overlay", "img_background", "mirror_invalid_val"];

const ReInit: string[] = ["texture_size", "stats_option", "field_of_view", "fog_thickness", "icue_mode",
	"scaling_factor", "camera_bound", "num_points_per_subset", "num_subsets_per_level",
	"num_levels", "level_depth", "level_shifting", "bloom_filter", "lut_filter", "mirror_shader",
	"mirror_invert", "fx_antialiasing", "blur_strength", "custom_fps", "shader_quality"];

// custom logging function
var debug: boolean = false;

// what's the wallpaper currently doing?
enum RunState {
	None = 0,
	Initializing = 1,
	Running = 2,
	Paused = 3,
	ReInitializing = 4
}

// type-safe settings
class MainSettings extends CSettings {
	schemecolor: string = "0 0 0";
	// Advanced
	stats_option: number = -1;
	// Misc category
	seizure_warning: boolean = true;
	// mirrored setting
	parallax_option: number = 0;
	auto_parallax_speed: number = 1;
}

// base object for wallpaper
class AudiOrbits {
	// holds default wallpaper settings
	// these basically connect 1:1 to wallpaper engine settings.
	// for more explanation on settings visit the Workshop-Item-Forum (link above)
	private settings: MainSettings = new MainSettings();

	// state of the Wallpaper
	public state: RunState = RunState.None;

	// debugging
	private debugTimeout: number = null;
	// Seconds & interval for reloading the wallpaper
	private resetTimespan: number = 3;
	private resetTimeout: number = null;
	// interval for swirlHandler
	private swirlInterval: number = null;
	private swirlStep: number = 0;
	// important objects
	private ctxHolder: CtxHolder = new CtxHolder();
	private reloadHelper: ReloadHelper = new ReloadHelper();
	private warnHelper: WarnHelper = new WarnHelper();

	constructor() {
		Smallog.SetPrefix("[AudiOrbits] ");
		Smallog.Info("initializing...");
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
					Ready.On(() => this.initOnce());
				}
				else if (initFlag) {
					this.state = RunState.ReInitializing;
					Smallog.Debug("got reInit-flag from applying settings!");
					if (this.resetTimeout) clearTimeout(this.resetTimeout);
					this.resetTimeout = setTimeout(() => this.reInitSystem(), this.resetTimespan * 1000);
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
				Smallog.Debug("set pause: " + isPaused);
				this.ctxHolder.setRenderer(isPaused);
			}
		};

	}

	///////////////////////////////////////////////
	// APPLY SETTINGS
	///////////////////////////////////////////////

	// Apply settings from the project.json "properties" object and takes certain actions
	private applyCustomProps(props) {
		Smallog.Debug("applying settings: " + JSON.stringify(Object.keys(props)));

		// possible apply-targets
		const sett = this.settings;
		const settingsStorages: CSettings[] = [sett, ...this.ctxHolder.GetSettings()];

		var reInitFlag = false;

		// loop all settings for updated values
		for (var setting in props) {
			// ignore this setting or apply it manually
			if (Ignore.indexOf(setting) > -1 || this.startsWith(setting, "HEADER_")) continue;
			// get the updated setting
			var prop = props[setting];
			// check typing
			if (!prop || !prop.type || prop.type == "text") continue;

			var found = false;
			// process all storages
			for (var storage of settingsStorages) {
				var fo = false;
				// apply prop value
				switch (prop.type) {
					case "bool":
						found ||= (fo = storage.apply(setting, prop.value == "True"));
						break;
					case "slider":
					case "combo":
						found ||= (fo = storage.apply(setting, parseFloat(prop.value)));
						break;
					default:
						found ||= (fo = storage.apply(setting, prop.value));
						break;
				}
				// set re-init flag if value changed and included in list
				if (fo) reInitFlag ||= ReInit.indexOf(setting) > -1;
			}
			// invalid?
			if (!found) Smallog.Error("Unknown setting: " + setting + ". Are you using an old preset?");
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
		if (props.debugging) {
			debug = props.debugging.value == true;
			Smallog.SetLevel(debug ? LogLevel.Debug : LogLevel.Info);
		}
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

	private startsWith(str, word) {
		return str.lastIndexOf(word, 0) === 0;
	}

	// Set Image
	private setImgSrc(imgID: string, srcVal: string) {
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

	// do first init after page loaded
	private initOnce() {
		var initWrap = () => {
			this.initSystem();
			this.popupMessage("<h1>" + document.title + "</h1>", true);
		};
		// show seizure warning before initializing?
		if (!this.settings.seizure_warning) initWrap();
		else this.warnHelper.Show(initWrap);
	}

	// re-initialies the walpaper after some time
	private reInitSystem() {
		Smallog.Info("re-initializing...");
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
	private initSystem() {
		// initialize three js and add geometry to returned scene
		this.ctxHolder.init(() => {
			// start auto parallax handler
			this.swirlInterval = setInterval(() => this.swirlHandler(), 1000 / 60);
			// print
			Smallog.Info("initializing complete.");
			// start rendering
			this.ctxHolder.setRenderer(true);
			this.state = RunState.Running;
		});
	}


	///////////////////////////////////////////////
	// EVENT HANDLER & TIMERS
	///////////////////////////////////////////////

	// Auto Parallax handler
	private swirlHandler() {
		if (this.settings.parallax_option != 2) return;
		this.swirlStep += this.settings.auto_parallax_speed / 8;
		if (this.swirlStep > 360) this.swirlStep -= 360;
		else if (this.swirlStep < 0) this.swirlStep += 360;
		this.ctxHolder.positionMouseAngle(this.swirlStep);
	}

	// popup message handler
	private popupMessage(msg, hideAfter) {
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
const _ = new AudiOrbits();