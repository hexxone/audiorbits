/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*
* @see
* AudiOrbits project	/ https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780
* for Wallpaper Engine / https://steamcommunity.com/app/431960
* Code Repository:     / https://github.com/hexxone/audiorbits
* Online Preview:		/ https://orbits.hexx.one
*
* @description
* Audiorbits Web-Wallpaper for Wallpaper Engine
*
* If you're reading this you're either pretty interested in the code or just bored :P
* Either way thanks for using this Wallpaper!
* Feel free to leave me some feedback on the Workshop-Page if you like :)
*/
/* eslint-disable no-unused-vars */

import {ContextHelper} from './ContextHelper';
import WEventListener from './WEventListener';

import {CComponent, CSettings, ReloadHelper, Smallog, waitReady, WarnHelper, WEWWA} from './we_utils';

const Ignore: string[] = ['img_overlay', 'img_background', 'mirror_invalid_val'];

const ReInit: string[] = ['geometry_type', 'base_texture', 'texture_size', 'scaling_factor', 'num_levels',
	'level_depth', 'level_shifting', 'level_spiralize', 'num_subsets_per_level', 'num_points_per_subset',
	'custom_fps', 'field_of_view', 'fog_thickness', 'icue_mode', 'shader_quality', 'random_seed',
	'low_latency', 'xr_mode'];

/**
* what's the wallpaper currently doing?
* @public
*/
export enum RunState {
	None = 0,
	Initializing = 1,
	Running = 2,
	Paused = 3,
	ReInitializing = 4
}

/**
* Root Settings
* @public
*/
export class MainSettings extends CSettings {
	debugging: boolean = false;
	// default scheme property
	schemecolor: string = '0 0 0';
	// Misc category
	seizure_warning: boolean = true;
	// mirrored setting
	parallax_option: number = 0;
	auto_parallax_speed: number = 1;
}

/**
* Root Class
* @public
*/
export class AudiOrbits extends CComponent {
	// holds default wallpaper settings
	// these basically connect 1:1 to wallpaper engine settings.
	// for more explanation on settings visit the Workshop-Item-Forum (link above)
	public settings: MainSettings = new MainSettings();

	// state of the Wallpaper
	private state: RunState = RunState.None;

	// Seconds & interval for reloading the wallpaper
	private resetTimespan: number = 3;
	private resetTimeout: any = null;

	// submodules
	private ctxHolder: ContextHelper = new ContextHelper();
	private reloadHelper: ReloadHelper = new ReloadHelper();
	private warnHelper: WarnHelper = new WarnHelper();

	// interval for swirlHandler
	private swirlInterval: any = null;
	private swirlStep: number = 0;
	// Wallpaper Engine Event Listener
	private weListener: WEventListener = null;

	/**
	* Intialize Wallpaper...
	*/
	constructor() {
		super();
		Smallog.setPrefix('[AudiOrbits] ');
		Smallog.debug('constructing...');

		this._internal_children.push(this.ctxHolder);
		this._internal_children.push(this.warnHelper);
		this._internal_children.push(this.reloadHelper);

		// will apply settings edited in Wallpaper Engine
		// this will also cause initialization for the first time
		window['wallpaperPropertyListener'] = this.weListener = {
			applyUserProperties: (props) => {
				const initFlag = this.applyCustomProps(props);
				// very first initialization
				if (this.state == RunState.None) {
					this.state = RunState.Initializing;
					waitReady().then(() => this.initOnce());
				} else if (initFlag) {
					this.state = RunState.ReInitializing;
					Smallog.debug('got reInit-flag from applying settings!');
					if (this.resetTimeout) clearTimeout(this.resetTimeout);
					this.resetTimeout = setTimeout(() => this.reInitSystem(), this.resetTimespan * 1000);
					// show reloader
					this.reloadHelper.show(true);
					// stop frame animation
					this.ctxHolder.setRenderer(false);
				}
			},

			setPaused: (isPaused: boolean) => {
				// only pause/running toggle, ignore other states
				if (this.state != RunState.Running && this.state != RunState.Paused) return;

				if (this.state == RunState.Paused) {
					if (isPaused) return;
					this.state = RunState.Running;
				} else if (this.state == RunState.Running) {
					if (!isPaused) return;
					this.state = RunState.Paused;
				}
				Smallog.debug('set pause: ' + isPaused);
				this.ctxHolder.setRenderer(!isPaused);
			},

			// currently not used
			applyGeneralProperties: (props) => {},
			userDirectoryFilesAddedOrChanged: (p, f) => {},
			userDirectoryFilesRemoved: (p, f) => {},
		};
	}

	// /////////////////////////////////////////////
	// APPLY SETTINGS
	// /////////////////////////////////////////////

	/**
	* Apply settings from the project.json "properties" object and takes certain actions
	* @param {Object} props Properties
	* @return {boolean} reinit-flag
	*/
	private applyCustomProps(props) {
		Smallog.debug('applying settings: ' + JSON.stringify(props));

		// possible apply-targets
		let reInitFlag = false;

		// loop all settings for updated values
		for (const setting in props) {
			// ignore this setting or apply it manually
			if (Ignore.indexOf(setting) > -1 || setting.indexOf('HEADER_') === 0 || setting.indexOf('SPACER_') === 0) continue;
			// get the updated setting
			const prop = props[setting];
			// check typing
			if (!prop) continue;

			let found = false;
			// apply prop value
			switch (prop.type || 'none') {
			case 'bool':
				found = this.applySetting(setting, prop.value == true || prop.value == 'true' || prop.value == 'True');
				break;
			case 'slider':
			case 'combo':
				found = this.applySetting(setting, parseFloat(prop.value));
				break;
			default:
				found = this.applySetting(setting, prop.value || prop.text);
				break;
			}
			// set re-init flag if value changed and included in list
			if (found) reInitFlag ||= ReInit.indexOf(setting) > -1;
			// invalid?
			else if (prop.type != 'text') Smallog.debug('Setting not applied: ' + setting);
		}

		// Update all modules
		this.updateAll();

		// Custom bg color
		if (props.main_color) {
			const spl = props.main_color.value.split(' ');
			for (let i = 0; i < spl.length; i++) spl[i] *= 255;
			document.body.style.backgroundColor = 'rgb(' + spl.join(', ') + ')';
		}

		// Custom user images
		if (props.img_background) {
			this.setImgSrc('img_back', props.img_background.value);
		}
		if (props.img_overlay) {
			this.setImgSrc('img_over', props.img_overlay.value);
		}

		// debug
		// Smallog.setLevel(this.settings.debugging ? LogLevel.Debug : LogLevel.Info);
		const dbgWnd = document.getElementById('debugwnd');
		if (this.settings.debugging) dbgWnd.classList.add('show');
		else dbgWnd.classList.remove('show');


		// have render-relevant settings been changed?
		return reInitFlag;
	}

	/**
	* Set Image
	* @param {string} imgID html element id
	* @param {string} srcVal new src value
	*/
	private setImgSrc(imgID: string, srcVal: string) {
		const elmt = document.getElementById(imgID);
		elmt.classList.remove('show');
		if (!srcVal) return;
		setTimeout(() => {
			// "file:///" +
			elmt.setAttribute('src', 'file:///' + srcVal);
			elmt.classList.add('show');
		}, 1000);
	}

	/**
	* Update Debugging State
	* @public
	* @return {Object} null
	*/
	public updateSettings(): Promise<void> {
		return Promise.resolve();
	}


	// /////////////////////////////////////////////
	// INITIALIZE
	// /////////////////////////////////////////////

	/**
	* do first init after page loaded
	* @public
	*/
	public initOnce() {
		// show seizure warning before initializing
		this.warnHelper.show()
			.then(() => this.initSystem());
	}

	/**
	* re-initialies the walpaper after some time
	* @public
	*/
	public reInitSystem() {
		// hide reloader
		this.reloadHelper.show(false);
		// kill intervals
		clearInterval(this.swirlInterval);
		this.swirlStep = 0;
		// actual re-init
		this.initSystem();
	}

	/**
	* initialize the geometric & grpahics system
	* => starts rendering loop afterwards
	*/
	private initSystem() {
		Smallog.debug('initializing...');
		// initialize three js and add geometry to returned scene
		this.ctxHolder.init().then(() => {
			// start auto parallax handler
			this.swirlInterval = window.setInterval(() => this.swirlHandler(), 1000 / 60);
			// start rendering
			this.state = RunState.Running;
			// print
			Smallog.info('initializing complete.');
		});
	}


	// /////////////////////////////////////////////
	// EVENT HANDLER & TIMERS
	// /////////////////////////////////////////////

	/**
	* Auto Parallax handler
	*/
	private swirlHandler() {
		if (this.settings.parallax_option != 2) return;
		this.swirlStep += this.settings.auto_parallax_speed / 8;
		if (this.swirlStep > 360) this.swirlStep -= 360;
		else if (this.swirlStep < 0) this.swirlStep += 360;
		this.ctxHolder.positionMouseAngle(this.swirlStep);
	}
}


// /////////////////////////////////////////////
// Actual Initialisation
// /////////////////////////////////////////////

// if the wallpaper is ran in browser, we want to delay the init until caching is complete.
new WEWWA(() => new AudiOrbits());

