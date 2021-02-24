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
 * Audiorbits Web-Wallpaper for Wallpaper Engine
 * 
 * If you're reading this you're either pretty interested in the code or just bored :P
 * Either way thanks for using this Wallpaper I guess.
 * Leave me some feedback on the Workshop-Page for this item if you like!
 * 
 * @todo
 * 
 * project.json
 * - update translations -> project.json -> steam
 * - update preview image?
 * - test prop text in WE
 * 
 * 
 * main code:
 * - fix spiral level rotation
 * - rotate camera instead of objects?
 * - reuse wasc modules
 * - optimize WEAS new allocations
 * - fix "min > max" saturation/light
 * - fix parallax
 * - fix custom fps
 * - add new re-init vars
 * - fix seizure warning text
 * - use buffer for geometry size in WASM?
 * - wasc-loader worker debugging option ?
 * - wasc-loader worker option
 * 
 * 
 * low priority:
 * - remove jquery
 * - fix licenses?
 * - highlight seizure text on white BG
 * - finish implementing Web-XR
 * 		- add "camera centered" checkbox for vr
 * 		- add  "vr-cam" mode, with relative controls
 * - record "how to debug"-video?
 * 
 * 
*/

import { ContextHolder } from './ContextHelper';

import { LogLevel, Smallog } from './we_utils/src/Smallog';
import { ReloadHelper } from './we_utils/src/ReloadHelper';
import { WarnHelper } from './we_utils/src/WarnHelper';
import { CSettings } from "./we_utils/src/CSettings";
import { WEWWA } from './we_utils/src/WEWWA';
import { CComponent } from './we_utils/src/CComponent';
import WEventListener from './WEventListener';

const Ignore: string[] = ["img_overlay", "img_background", "mirror_invalid_val"];

const ReInit: string[] = ["geometry_type", "base_texture", "texture_size", "scaling_factor", "num_levels",
	"level_depth", "level_shifting", "level_spiralize", "num_subsets_per_level", "num_points_per_subset",
	"custom_fps", "stats_option", "field_of_view", "fog_thickness", "icue_mode", "shader_quality", "random_seed"];

// what's the wallpaper currently doing?
export enum RunState {
	None = 0,
	Initializing = 1,
	Running = 2,
	Paused = 3,
	ReInitializing = 4
}

// type-safe settings
export class MainSettings extends CSettings {
	// debugging
	debugging: boolean = false;
	// default scheme property
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
export class AudiOrbits extends CComponent {
	// holds default wallpaper settings
	// these basically connect 1:1 to wallpaper engine settings.
	// for more explanation on settings visit the Workshop-Item-Forum (link above)
	public settings: MainSettings = new MainSettings();
	// state of the Wallpaper
	public state: RunState = RunState.None;
	// Seconds & interval for reloading the wallpaper
	public resetTimespan: number = 3;
	public resetTimeout: any = null;
	// debugging
	public debugTimeout: any = null;

	// submodules
	public ctxHolder: ContextHolder = new ContextHolder();
	public warnHelper: WarnHelper = new WarnHelper();
	public reloadHelper: ReloadHelper = new ReloadHelper();

	// interval for swirlHandler
	private swirlInterval: any = null;
	private swirlStep: number = 0;
	// Wallpaper Engine Event Listener
	private weListener: WEventListener = null;

	constructor() {
		super();
		Smallog.SetPrefix("[AudiOrbits] ");
		Smallog.Info("initializing...");


		this.children.push(this.ctxHolder);
		this.children.push(this.warnHelper);
		this.children.push(this.reloadHelper);

		// will apply settings edited in Wallpaper Engine
		// this will also cause initialization for the first time
		this.weListener = new WEventListener(this);
		window['wallpaperPropertyListener'] = this.weListener;
	}

	///////////////////////////////////////////////
	// APPLY SETTINGS
	///////////////////////////////////////////////

	// Apply settings from the project.json "properties" object and takes certain actions
	public applyCustomProps(props) {
		Smallog.Debug("applying settings: " + JSON.stringify(Object.keys(props)));

		// possible apply-targets
		var reInitFlag = false;

		// loop all settings for updated values
		for (const setting in props) {
			// ignore this setting or apply it manually
			if (Ignore.indexOf(setting) > -1 || this.startsWith(setting, "HEADER_") || this.startsWith(setting, "SPACER_")) continue;
			// get the updated setting
			var prop = props[setting];
			// check typing
			if (!prop || !prop.type) continue;

			var found = false;
			// apply prop value
			switch (prop.type) {
				case "bool":
					found = this.ApplySetting(setting, prop.value == "True");
					break;
				case "slider":
				case "combo":
					found = this.ApplySetting(setting, parseFloat(prop.value));
					break;
				default:
					found = this.ApplySetting(setting, prop.value || prop.text);
					break;
			}
			// set re-init flag if value changed and included in list
			if (found) reInitFlag ||= ReInit.indexOf(setting) > -1;
			// invalid?
			else if (prop.type != "text") Smallog.Error("Unknown setting: " + setting + ". Are you using an old preset?");
		}

		// Update all modules
		this.UpdateAll();

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

	// TODO
	public UpdateSettings(): Promise<void> {
		return new Promise(resolve => {

			// debug logging
			Smallog.SetLevel(this.settings.debugging ? LogLevel.Debug : LogLevel.Info);
			if (!this.settings.debugging && this.debugTimeout) {
				clearTimeout(this.debugTimeout);
				this.debugTimeout = null;
			}
			if (this.settings.debugging && !this.debugTimeout)
				this.debugTimeout = setTimeout(() => this.applyCustomProps({ debugging: { value: false } }), 1000 * 60);

			// update visibility
			if (this.settings.debugging) document.getElementById("debugwnd").classList.add("show");
			else document.getElementById("debugwnd").classList.remove("show");

			resolve();
		});
	}


	///////////////////////////////////////////////
	// INITIALIZE
	///////////////////////////////////////////////

	// do first init after page loaded
	public initOnce() {
		const initWrap = () => {
			this.initSystem();
		};
		// show seizure warning before initializing?
		if (!this.settings.seizure_warning) initWrap();
		else this.warnHelper.Show().then(initWrap);
	}

	// re-initialies the walpaper after some time
	public reInitSystem() {
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
		this.ctxHolder.init().then(() => {
			// start auto parallax handler
			this.swirlInterval = setInterval(() => this.swirlHandler(), 1000 / 60);
			// start rendering
			this.ctxHolder.setRenderer(true);
			this.state = RunState.Running;
			// print
			Smallog.Info("initializing complete.");
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
}


///////////////////////////////////////////////
// Actual Initialisation
///////////////////////////////////////////////

// if the wallpaper is ran in browser, we want to delay the init until caching is complete.
new WEWWA(() => new AudiOrbits());

