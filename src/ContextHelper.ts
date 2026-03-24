/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2024 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

import { ColorHelper } from './ColorHelper';
import { GeometryHolder } from './GeometryHelper';
import { ShaderHolder } from './ShaderHelper';
import { FancyText } from './FancyText';
import { CComponent, CSettings, EffectComposer, FPStats, LoadHelper, Smallog, WEAS, WEICUE } from 'we_utils/src';
import { Clock, Color, Fog, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three.ts/src';

import { COLOR_BLACK_HEX,
    DEFAULT_FPS,
    ELLAPSED_TIME_MAX,
    ELLAPSED_TIME_MIN,
    FANCY_TEXT_DEFAULT_Z,
    FOG_FAR_DIVISOR,
    FOG_NEAR_FACTOR,
    LERP_FACTOR_CAMERA,
    MAIN_CANVAS_ID,
    MOUSE_PARALLAX_DIVISOR_X,
    MOUSE_PARALLAX_DIVISOR_Y,
    NEAR_DIST,
    POWER_PREFERENCE_DEFAULT,
    POWER_PREFERENCE_HIGH,
    POWER_PREFERENCE_LOW,
    PRECISION_HIGH,
    PRECISION_LOW,
    PRECISION_MEDIUM,
    RENDER_CONTAINER_ID } from './Consts';
import { WebXRHandler } from './WebXRHandler';
import { MouseInputHandler } from './MouseInputHandler';
import { ResizeHandler } from './ResizeHandler';

/**
 * Renderer Settings
 * @public
 */
class ContextSettings extends CSettings {

    // Camera category
    parallax_option = 0;
    parallax_angle = 180;
    parallax_strength = 3;
    auto_parallax_speed = 2;
    parallax_cam = true;
    field_of_view = 90;
    x_offset = 0;
    y_offset = 0;
    custom_fps = false;
    fps_value = 60;
    shader_quality = 1;
    xr_mode = false;

    // mirrored setting
    fog_thickness = 20;
    scaling_factor = 1500;
    level_depth = 1200;
    num_levels = 8000;

    // use low latency audio?
    low_latency = false;
    debugging = false;

}

/**
 * Contains main rendering context for AudiOrbits
 * @public
 */
export class ContextHelper extends CComponent {


    /** @public global state */
    public PAUSED = false;

    /** @public */
    public settings: ContextSettings = new ContextSettings();

    public readonly mouseInputHandler: MouseInputHandler = new MouseInputHandler();

    private readonly loadHelper: LoadHelper;
    private readonly geoHolder: GeometryHolder;

    // html elements
    private mainCanvas: HTMLCanvasElement | undefined;

    // Three.js objects
    private renderer?: WebGLRenderer;
    private camera?: PerspectiveCamera;
    private cameraPosition?: Vector3;
    private scene?: Scene;

    private composer?: EffectComposer;
    private clock: Clock = new Clock();

    // custom render timing
    private renderTimeout: number | null = null;

    private textHolder?: FancyText;
    private resizeHandler?: ResizeHandler; // Initialized in init when camera/renderer are ready

    // important objects
    private weas: WEAS = new WEAS();
    private colorHolder: ColorHelper = new ColorHelper();
    private shaderHolder: ShaderHolder = new ShaderHolder(this.weas);
    private weicue: WEICUE = new WEICUE(this.weas);
    private stats: FPStats = new FPStats(this.weas);
    private webXRHandler?: WebXRHandler;


    /**
     * add global listeners
     * @param {LoadHelper} loadHelper LoadHelper
     */
    constructor(loadHelper: LoadHelper) {
        super();
        this.loadHelper = loadHelper;
        this.geoHolder = new GeometryHolder(
            this.colorHolder,
            this.weas,
            this.loadHelper
        );

        // keep track of children settings
        this.children.push(this.mouseInputHandler);
        this.children.push(this.weas);
        this.children.push(this.colorHolder);
        this.children.push(this.shaderHolder);
        this.children.push(this.weicue);
        this.children.push(this.stats);
        this.children.push(this.geoHolder);
        // WebXRHandler is added to children in init()
        // ResizeHandler is added to children in init()
    }

    /**
     * initialize three-js context
     * @public
     * @param {Promise} waitFor (optional) wait for this promise before rendering
     * @returns {Promise} finish event
     */
    public async init(waitFor?: Promise<void>): Promise<void> {
        Smallog.debug('init Context...');

        const renderContainer = document.getElementById(RENDER_CONTAINER_ID);

        if (!renderContainer) {
            throw new Error(`Missing #${RENDER_CONTAINER_ID}`);
        }

        // distance
        const viewDist
            = this.settings.num_levels
            * this.settings.level_depth
            * (this.settings.xr_mode ? 1 : 2);

        const precisionPref = this.getPrecisionPref();

        // destroy old context
        if (this.renderer) {
            this.renderer.forceContextLoss();
        }
        if (this.composer) {
            this.composer.reset();
        }
        if (this.mainCanvas) {
            renderContainer.removeChild(this.mainCanvas);
        }

        // get canvases & contexts
        // ensure the canvas sizes are set !!!
        // these are independent from the style sizes
        this.mainCanvas = document.createElement('canvas');
        this.mainCanvas.id = MAIN_CANVAS_ID;
        this.mainCanvas.width = window.innerWidth;
        this.mainCanvas.height = window.innerHeight;
        renderContainer.appendChild(this.mainCanvas);

        // create camera
        this.camera = new PerspectiveCamera(
            this.settings.field_of_view,
            window.innerWidth / window.innerHeight,
            NEAR_DIST,
            viewDist
        );
        this.cameraPosition = this.camera.position;
        this.applyCameraViewOffset();

        // create scene
        this.scene = new Scene();
        this.scene.fog = new Fog(
            new Color(COLOR_BLACK_HEX),
            NEAR_DIST,
            (viewDist * (FOG_NEAR_FACTOR - this.settings.fog_thickness)) / FOG_FAR_DIVISOR
        );

        // create render-context
        this.renderer = new WebGLRenderer({
            alpha: true,
            antialias: false,
            canvas: this.mainCanvas,
            logarithmicDepthBuffer: true,
            powerPreference: this.getPowerPreference(),
            precision: precisionPref
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(COLOR_BLACK_HEX, 0);

        // Initialize ResizeHandler now that camera and renderer are available
        if (this.camera && this.renderer) {
            if (this.resizeHandler) {
                this.resizeHandler.dispose();
                this.children.splice(this.children.indexOf(this.resizeHandler), 1);
            }
            this.resizeHandler = new ResizeHandler(this.camera, this.renderer);
            this.children.push(this.resizeHandler); // Add to children for settings propagation
        }

        if (this.webXRHandler) {
            this.webXRHandler.dispose();
            this.children.splice(this.children.indexOf(this.webXRHandler), 1);
        }
        // initialize VR mode
        if (this.settings.xr_mode && this.renderer && this.scene) {
            this.webXRHandler = new WebXRHandler(this.renderer, this.scene);
            this.children.push(this.webXRHandler); // Add to children for settings propagation
            this.webXRHandler.initWebXR();
        }

        // initialize shader composer
        this.composer = new EffectComposer(
            this.scene,
            this.camera,
            this.renderer,
            precisionPref,
            COLOR_BLACK_HEX
        );
        // Pass composer to ResizeHandler
        if (this.resizeHandler) {
            this.resizeHandler.setComposer(this.composer);
        }

        // add shaders
        this.shaderHolder.init(this.composer);

        // initialize colors if not done already
        await this.colorHolder.updateSettings();

        this.loadHelper.setText('Objects');
        this.loadHelper.setProgress(10);

        // initialize main geometry
        await this.geoHolder.init(this.scene, this.camera);

        // precompile shaders
        this.composer?.precompile();

        // initialize weas
        if (this.weas.init) {
            await this.weas.init();
        }
        this.loadHelper.setProgress(this.loadHelper.progress + 5);

        // wait for seizure warning
        if (waitFor) {
            await waitFor;
        }

        this.loadHelper.show(false);
        // show fancy text
        this.showMessage(document.title);
        // start rendering
        this.setRenderer(true);
    }

    /**
     * clamp camera position
     * @param {number} axis current value
     * @returns {number} clamped value
     */
    private clampCam(axis: number): number {
        return Math.min(
            this.settings.scaling_factor / 2,
            Math.max(-this.settings.scaling_factor / 2, axis)
        );
    }

    /**
     * update camera values
     * @param {number} _elapsed ms
     * @param {number} deltaTime multiplier ~1
     * @returns {void}
     */
    private updateFrame(_elapsed: number, deltaTime: number): void {
        if (!this.camera || !this.cameraPosition) {
            Smallog.error('[ContextHelper] Camera or cameraPosition is not initialized in updateFrame.');

            return;
        }

        if (this.settings.xr_mode && this.webXRHandler) {
            this.webXRHandler.updateFrame();
        } else {
            // NORMAL PROCESSING
            // constantly use/control mouse position to make it smooth

            const newXPos = this.clampCam(
                (this.mouseInputHandler.mouseX * this.settings.parallax_strength) / MOUSE_PARALLAX_DIVISOR_X
            );
            const newYPos = this.clampCam(
                (this.mouseInputHandler.mouseY * this.settings.parallax_strength) / MOUSE_PARALLAX_DIVISOR_Y
            );
            // lerp to new position
            const cPos = this.camera.position;

            if (cPos.x !== newXPos) {
                cPos.x += (newXPos - cPos.x) * deltaTime * LERP_FACTOR_CAMERA;
            }
            if (cPos.y !== newYPos) {
                cPos.y += (newYPos - cPos.y) * deltaTime * LERP_FACTOR_CAMERA;
            }

            const depthVector = new Vector3(
                0,
                0,
                -this.settings.level_depth / 2
            );

            if (this.settings.parallax_cam) {
                // target is center origin - depth (parallax)
                this.camera.lookAt(depthVector.add(this.cameraPosition));
            } else {
                // target is camera position - depth (no parallax)
                this.camera.lookAt(depthVector.add(cPos));
            }
        }
    }

    /**
     * Apply x_offset/y_offset as a camera frustum shift (view offset).
     * This shifts the point-of-view center without rotating the camera,
     * so the geometry appears centered on the offset position (e.g. left
     * screen of a dual-monitor span).
     * @returns {void}
     * @private
     */
    private applyCameraViewOffset(): void {
        if (!this.camera) {
            return;
        }
        const xOff = this.settings.x_offset;
        const yOff = this.settings.y_offset;

        if (xOff === 0 && yOff === 0) {
            this.camera.clearViewOffset();
        } else {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const xPx = (xOff / 100) * w;
            const yPx = (yOff / 100) * h;

            // setViewOffset(fullWidth, fullHeight, offsetX, offsetY, portWidth, portHeight)
            this.camera.setViewOffset(w, h, xPx, yPx, w, h);
        }
        this.camera.updateProjectionMatrix();
    }

    /**
     * called after any setting changed
     * @public
     * @returns {Promise} finish event
     */
    public updateSettings(): Promise<void> {
        // parallax delegated to MouseInputHandler
        // also WebXRHandler listens for its own settings if it exists

        // apply screen-center shift for multi-monitor setups
        this.applyCameraViewOffset();

        const viewDist
            = this.settings.num_levels
            * this.settings.level_depth
            * (this.settings.xr_mode ? 1 : 2);

        if (this.scene?.fog) {
            this.scene.fog.far = (viewDist * (FOG_NEAR_FACTOR - this.settings.fog_thickness)) / FOG_FAR_DIVISOR;
        }

        return Promise.resolve();
    }

    // /////////////////////////////////////////////
    // RENDERING
    // /////////////////////////////////////////////

    /**
     * start or stop rendering
     * @public
     * @param {boolean} render Start | Stop
     * @returns {void}
     */
    public setRenderer(render: boolean): void {
        Smallog.debug(`setRender: ${render}`);

        // clear all old renderers
        if (this.renderer) {
            this.renderer.setAnimationLoop(null);
        }
        if (this.renderTimeout) {
            clearTimeout(this.renderTimeout);
            this.renderTimeout = null;
        }

        // call new renderer
        if (render) {
            // set state to running
            this.PAUSED = this.weicue.PAUSED = false;
            // initialize rendering
            if (this.settings.custom_fps) {
                this.renderTimeout = setTimeout(() => {
                    return this.renderLoop();
                }, 1000 / (this.settings.fps_value || DEFAULT_FPS));
            } else if (this.renderer) {
                this.renderer.setAnimationLoop((t, f) => {
                    return this.renderLoop(t, f);
                });
            } else {
                Smallog.error('not initialized!');
            }
            // show again
            this.mainCanvas.classList.add('show');
        } else {
            this.PAUSED = this.weicue.PAUSED = true;
            this.mainCanvas.classList.remove('show');
        }
    }

    /**
     * repeated render frame call
     * @param {number} _time second fraction
     * @param {XRFrame} frame XR Frame
     * @returns {void}
     */
    private renderLoop(_time?: number, frame?: XRFrame): void {
        // paused - stop render
        if (this.PAUSED) {
            return;
        }
        const sett = this.settings;

        // custom rendering needs manual re-call
        if (this.renderTimeout) {
            this.renderTimeout = setTimeout(() => {
                return this.renderLoop();
            }, 1000 / sett.fps_value);
        }

        // Figure out how much time passed since the last animation and calc delta
        // Minimum we should reach is 1 FPS
        const elapsed = Math.min(ELLAPSED_TIME_MAX, Math.max(ELLAPSED_TIME_MIN, this.clock.getDelta()));
        const delta = elapsed * DEFAULT_FPS; // Assuming 60 FPS is the target for delta calculation

        // render before updating
        if (!sett.low_latency) {
            this.timeRender(elapsed, frame);
        }

        // track CPU
        this.stats.begin(true);

        // update objects
        this.colorHolder.updateFrame(elapsed, delta);
        this.geoHolder.updateFrame(elapsed, delta);
        this.shaderHolder.updateFrame(elapsed, delta);
        this.updateFrame(elapsed, delta);

        // track CPU
        this.stats.end(true);

        // render after updating
        // this saves 1 frame (7-16 ms) audio delay but may cause stutter
        if (sett.low_latency) {
            this.timeRender(elapsed, frame);
        }

        // update tracked stats
        if (sett.debugging) {
            this.stats.update();
        }
    }

    /**
     * Render timing wrapper
     * @param {number} elapsed time
     * @param {XRFrame} frame XR Frame
     * @returns {void}
     */
    private timeRender(elapsed: number, frame: XRFrame): void {
        // track GPU
        this.stats.begin(false);

        // render without effects
        // this.renderer.render(this.scene, this.camera);

        // render with effects
        this.composer.render(elapsed, frame);

        // ICUE PROCESSING
        this.weicue.updateCanvas(this.mainCanvas);
        // track GPU
        this.stats.end(false);
    }

    // /////////////////////////////////////////////
    // WEB-VR INTEGRATION MOVED TO WebXRHandler.ts
    // /////////////////////////////////////////////

    // /////////////////////////////////////////////
    // HELPER
    // /////////////////////////////////////////////

    /**
     * use overall "quality" setting to determine three.js "power" mode
     * @returns {string} three.js power mode
     */
    private getPowerPreference(): string {
        switch (this.settings.shader_quality) {
            case 0:
                return POWER_PREFERENCE_LOW;
            case 2:
                return POWER_PREFERENCE_HIGH;
            default:
                return POWER_PREFERENCE_DEFAULT;
        }
    }

    /**
     * use overall "quality" setting to determine three.js "power" mode
     * @returns {string} three.js power mode
     */
    private getPrecisionPref(): string {
        switch (this.settings.shader_quality) {
            case 0:
                return PRECISION_LOW;
            case 2:
                return PRECISION_HIGH;
            default:
                return PRECISION_MEDIUM;
        }
    }

    /**
     * shows a fancy text mesage
     * @param {string} msg text to show
     * @returns {void}
     */
    private showMessage(msg: string): void {
        // Position the text at a fixed Z distance in front of the camera's initial view plane.
        // The text is added to the scene, so it won't move with camera XY translation by default.
        const tPos = new Vector3(0, 0, FANCY_TEXT_DEFAULT_Z);
        // If the camera is not at (0,0,0) initially or text needs to be relative to current camera view,
        // this might need adjustment or text added as child of camera.
        // For now, assuming text is relative to world origin or initial camera setup.

        if (this.scene && this.camera) { // Ensure scene and camera are available
            this.textHolder = new FancyText(this.scene, tPos, msg);
        } else {
            Smallog.warn('Scene or Camera not available for showMessage.');
        }
    }

}
