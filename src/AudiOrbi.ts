/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2026 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 *
 * @see
 * AudiOrbits project   / https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780
 * for Wallpaper Engine / https://steamcommunity.com/app/431960
 * Code Repository:     / https://github.com/hexxone/audiorbits
 * Online Preview:      / https://orbits.hexx.one
 *
 * @description
 * Audiorbits Web-Wallpaper for Wallpaper Engine
 *
 * If you're reading this you're either pretty interested in the code or just bored :P
 * Either way thanks for using this Wallpaper!
 * Feel free to leave me some feedback on the Workshop-Page if you like :)
 */
/* eslint-disable no-unused-vars */

import { ContextHelper } from './ContextHelper';
import { WEProperty, WEventListener } from './WEventListener';
import { FILE_PROTOCOL, DEBUG_WINDOW_ID } from './Consts';

import { CComponent,
    CSettings,
    ReloadHelper,
    rgbToObj,
    Smallog,
    waitReady,
    WarnHelper,
    WEWA,
    LoadHelper } from 'we_utils/src';

const Ignore: string[] = [
    'img_overlay',
    'img_background',
    'mirror_invalid_val',
    'wec_brs',
    'wec_con',
    'wec_e',
    'wec_hue',
    'wec_sa',
    '_d0'
];

const ReInit: string[] = [
    'geometry_type',
    'base_texture',
    'scaling_factor',
    'num_levels',
    'level_depth',
    'level_shifting',
    'level_spiralize',
    'spiral',
    'num_subsets_per_level',
    'num_points_per_subset',
    'custom_fps',
    'field_of_view',
    'icue_mode',
    'shader_quality',
    'random_seed',
    'low_latency',
    'xr_mode'
];

const TextLabels: string[] = ['text', 'label'];
const BrowserFpsCandidates: number[] = [
    30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 180, 200, 240
];

// temporary properties
let temProps = null;

// eslint-disable-next-line dot-notation
window['wallpaperPropertyListener'] = {
    applyUserProperties: (p) => {
        temProps = p;
    }
};

/**
 * what's the wallpaper currently doing?
 */
enum RunState {
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
class MainSettings extends CSettings {

    debugging = false;
    // default scheme property
    schemecolor = '0 0 0';
    // Misc category
    seizure_warning = true;
    // mirrored setting
    parallax_option = 0;
    auto_parallax_speed = 1;

}

/**
 * Root Class
 */
class AudiOrbits extends CComponent {

    // holds default wallpaper settings
    // these basically connect 1:1 to wallpaper engine settings.
    // for more explanation on settings visit the Workshop-Item-Forum (link above)
    public settings: MainSettings = new MainSettings();

    // update loading status here
    private loadHelper: LoadHelper = new LoadHelper();

    // state of the Wallpaper
    private state: RunState = RunState.None;

    // Seconds & interval for reloading the wallpaper
    private resetTimespan = 3;
    private resetTimeout: any = null;

    // submodules
    private ctxHolder: ContextHelper = new ContextHelper(this.loadHelper);
    private reloadHelper: ReloadHelper = new ReloadHelper();
    private warnHelper: WarnHelper = new WarnHelper();

    // interval for swirlHandler
    private swirlInterval: any = null;
    private swirlStep = 0;
    // Wallpaper Engine Event Listener
    private weListener: WEventListener = null;
    private receivedGeneralFps = false;
    private browserFpsEstimate?: Promise<void>;

    /**
     * Intialize Wallpaper...
     */
    constructor() {
        super();
        Smallog.setPrefix('[AudiOrbits] ');
        Smallog.debug('constructing...');

        this.children.push(this.ctxHolder);
        this.children.push(this.warnHelper);
        this.children.push(this.reloadHelper);

        // will apply settings edited in Wallpaper Engine
        // this will also cause initialization for the first time
        // eslint-disable-next-line dot-notation
        window['wallpaperPropertyListener'] = this.weListener = {
            applyUserProperties: (props) => {
                const initFlag = this.applyCustomProps(props);

                // very first initialization
                if (this.state === RunState.None) {
                    this.state = RunState.Initializing;
                    waitReady()
                        .then(() => {
                            return this.initOnce();
                        })
                        .catch((err) => {
                            Smallog.error('[AudiOrbits] Error during initial waitReady: ', err);
                        });
                } else if (initFlag) {
                    this.state = RunState.ReInitializing;
                    Smallog.debug('got reInit-flag from applying settings!');
                    if (this.resetTimeout) {
                        clearTimeout(this.resetTimeout);
                    }
                    this.resetTimeout = setTimeout(() => {
                        return this.reInitSystem();
                    }, this.resetTimespan * 1000);
                    // show reloader
                    this.reloadHelper.show(true);
                    // stop frame animation
                    this.ctxHolder.setRenderer(false);
                }
            },

            setPaused: (isPaused: boolean) => {
                // only pause/running toggle, ignore other states
                if (
                    this.state !== RunState.Running
                    && this.state !== RunState.Paused
                ) {
                    return;
                }

                if (this.state === RunState.Paused) {
                    if (isPaused) {
                        return;
                    }
                    this.state = RunState.Running;
                } else if (this.state === RunState.Running) {
                    if (!isPaused) {
                        return;
                    }
                    this.state = RunState.Paused;
                }
                Smallog.debug(`set pause: ${isPaused}`);
                this.ctxHolder.setRenderer(!isPaused);
            },

            applyGeneralProperties: (props: any) => {
                if (!props || props.fps === undefined) {
                    return;
                }

                const fps = Number(props.fps);

                if (!isNaN(fps) && fps > 0) {
                    this.receivedGeneralFps = true;
                    this.applySetting('wallpaper_fps', fps);
                    this.updateAll();
                }
            },
            userDirectoryFilesAddedOrChanged: () => {},
            userDirectoryFilesRemoved: () => {}
        };

        if (temProps) {
            this.weListener.applyUserProperties(temProps);
            temProps = null; // Clear temProps after use
        }
    }

    // /////////////////////////////////////////////
    // APPLY SETTINGS
    // /////////////////////////////////////////////

    private _applyBooleanProp(setting: string, propValue: boolean | string): boolean {
        return this.applySetting(
            setting,
            propValue === true
            || propValue === 'true'
            || propValue === 'True'
        );
    }

    private _applyNumericProp(setting: string, propValue: string): boolean {
        return this.applySetting(
            setting,
            parseFloat(propValue)
        );
    }

    private _applyStringProp(setting: string, propValue: any): boolean {
        return this.applySetting(setting, propValue);
    }

    private _applyMainColorProp(propValue: string): void {
        const cO = rgbToObj(propValue);

        document.body.style.backgroundColor = `rgba(${cO.r},${cO.g},${cO.b},${cO.a / 255})`;
    }

    private _applyImageProp(imgID: string, srcVal: string): void {
        const elmt = document.getElementById(imgID);

        if (!elmt) { return; }

        elmt.classList.remove('show');
        if (!srcVal) {
            return;
        }
        setTimeout(() => {
            elmt.setAttribute('src', `${FILE_PROTOCOL}${srcVal}`);
            elmt.classList.add('show');
        }, 1000);
    }

    private _applyDebuggingProp(): void {
        const dbgWnd = document.getElementById(DEBUG_WINDOW_ID);

        if (!dbgWnd) { return; }

        if (this.settings.debugging) {
            dbgWnd.classList.add('show');
        } else {
            dbgWnd.classList.remove('show');
        }
    }

    /**
     * Apply settings from the project.json "properties" object and takes certain actions
     * @param {Object} props Properties
     * @returns {boolean} reinit-flag
     */
    private applyCustomProps(props: { [key: string]: WEProperty }): boolean {
        Smallog.debug(`applying settings: ${JSON.stringify(props)}`);

        let reInitFlag = false;

        for (const setting in props) {
            if (
                Ignore.indexOf(setting) > -1
                || setting.indexOf('HDR_') === 0
                || setting.indexOf('SPCR_') === 0
            ) {
                continue;
            }

            const prop = props[setting];

            if (!prop) { continue; }

            let found = false;
            const propValue = prop.value ?? prop.text;

            switch (prop.type || 'none') {
                case 'bool':
                    found = this._applyBooleanProp(setting, prop.value as string | boolean);
                    break;
                case 'slider':
                case 'combo':
                    found = this._applyNumericProp(setting, prop.value as string);
                    break;
                default:
                    found = this._applyStringProp(setting, propValue);
                    break;
            }

            if (found) {
                reInitFlag ||= ReInit.indexOf(setting) > -1;
            } else if (prop.type && TextLabels.includes(prop.type)) {
                Smallog.debug(`TextLabel not applied: ${setting}`);
            }
        }

        this.updateAll();

        if (props.main_color) {
            this._applyMainColorProp(props.main_color.value as string);
        }

        // Custom user images
        if (props.img_background) {
            this._applyImageProp('img_back', props.img_background.value as string);
        }
        if (props.img_overlay) {
            this._applyImageProp('img_over', props.img_overlay.value as string);
        }

        this._applyDebuggingProp();
        this.ensureBrowserFpsTarget();

        return reInitFlag;
    }

    /**
     * Update Debugging State
     * @public
     * @returns {Object} null
     */
    public updateSettings(): Promise<void> {
        return Promise.resolve();
    }

    // /////////////////////////////////////////////
    // INITIALIZE
    // /////////////////////////////////////////////

    /**
     * do first init after page loaded
     * @returns {void}
     */
    private initOnce(): void {
        this.ensureBrowserFpsTarget();
        // initializing and wait for seizure warning
        this.initSystem(this.warnHelper.show());
    }

    /**
     * re-initialies the walpaper after some time
     * @returns {void}
     */
    private reInitSystem(): void {
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
     * @param {Promise} waitFor wait for this promise if given
     * @returns {void}
     */
    private initSystem(waitFor?: Promise<void>): void {
        Smallog.debug('initializing...');
        // show loader
        this.loadHelper.setText('3D');
        this.loadHelper.setProgress(5);
        this.loadHelper.show(true);

        // initialize three js and add geometry to returned scene
        this.ctxHolder
            .init(waitFor)
            .then(() => {
                // start auto parallax handler
                this.swirlInterval = window.setInterval(() => {
                    return this.swirlHandler();
                }, 1000 / 60);
                // start rendering
                this.state = RunState.Running;
                // hide loader
                this.loadHelper.show(false);
                // print
                Smallog.info('initializing complete.');
            })
            .catch((err) => {
                const m = `Fatal Error when creating main-context!\r\n\r\nMsg: ${err}`;

                Smallog.error(m);
                // Alert is kept as a last resort for critical errors to ensure user visibility,
                // as Smallog only logs to console.
                alert(m);
            });
    }

    private ensureBrowserFpsTarget(): void {
        if (
            this.receivedGeneralFps
            || this.ctxHolder.settings.custom_fps
            || this.browserFpsEstimate
        ) {
            return;
        }

        this.browserFpsEstimate = this.estimateBrowserFpsTarget()
            .then((fps) => {
                if (
                    this.receivedGeneralFps
                    || this.ctxHolder.settings.custom_fps
                ) {
                    return;
                }

                this.applySetting('wallpaper_fps', fps);
                this.updateAll();
                Smallog.debug(`Estimated browser refresh target: ${fps} FPS`);
            })
            .catch((err) => {
                Smallog.warn(`Failed to estimate browser refresh rate: ${err}`);
            })
            .finally(() => {
                this.browserFpsEstimate = null;
            });
    }

    private estimateBrowserFpsTarget(sampleCount: number = 45): Promise<number> {
        if (document.hidden) {
            return Promise.resolve(60);
        }

        return new Promise((resolve) => {
            const deltas: number[] = [];
            let lastTime = 0;
            let rafId = 0;
            let timeoutId = 0;

            const finish = () => {
                if (rafId) {
                    cancelAnimationFrame(rafId);
                }
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (deltas.length === 0) {
                    resolve(60);

                    return;
                }

                deltas.sort((a, b) => {
                    return a - b;
                });
                const median = deltas[Math.floor(deltas.length / 2)];
                const hz = 1000 / Math.max(median, Number.EPSILON);

                resolve(this.snapBrowserFps(hz));
            };

            const sample = (now: number) => {
                if (lastTime > 0) {
                    const delta = now - lastTime;

                    if (delta > 0 && delta < 100) {
                        deltas.push(delta);
                    }
                }

                lastTime = now;

                if (deltas.length >= sampleCount) {
                    finish();

                    return;
                }

                rafId = requestAnimationFrame(sample);
            };

            timeoutId = window.setTimeout(finish, 2500);
            rafId = requestAnimationFrame(sample);
        });
    }

    private snapBrowserFps(hz: number): number {
        let best = BrowserFpsCandidates[0];
        let bestDiff = Math.abs(hz - best);

        BrowserFpsCandidates.forEach((candidate) => {
            const diff = Math.abs(hz - candidate);

            if (diff < bestDiff) {
                best = candidate;
                bestDiff = diff;
            }
        });

        return best;
    }

    // /////////////////////////////////////////////
    // EVENT HANDLER & TIMERS
    // /////////////////////////////////////////////

    /**
     * Auto Parallax handler
     * @returns {void}
     */
    private swirlHandler(): void {
        if (this.settings.parallax_option !== 2) {
            return;
        }
        this.swirlStep += this.settings.auto_parallax_speed / 8;
        if (this.swirlStep > 360) {
            this.swirlStep -= 360;
        } else if (this.swirlStep < 0) {
            this.swirlStep += 360;
        }
        this.ctxHolder.mouseInputHandler.positionMouseAngle(this.swirlStep);
    }

}

// /////////////////////////////////////////////
// Actual Initialisation
// /////////////////////////////////////////////

// if the wallpaper is ran in browser, we want to delay the init until caching is complete.
new WEWA(() => {
    return new AudiOrbits();
});
