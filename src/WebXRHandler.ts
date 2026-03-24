/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2024 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

import { Group, Scene, WebGLRenderer } from 'three.ts/src';
import { CComponent, CSettings, Smallog, XRHelper } from 'we_utils/src';
import { EVENT_VR_SELECT_END, EVENT_VR_SELECT_START } from './Consts';

export class WebXRHandler extends CComponent {

    public settings: CSettings = new CSettings();

    private renderer: WebGLRenderer;
    private scene: Scene;
    private xrHelper: XRHelper = new XRHelper();

    private initialized: boolean = false;

    // WebXR user input data
    private userData = {
        isSelecting: false,
        controller1: null as Group | null,
        controller2: null as Group | null
    };

    constructor(renderer: WebGLRenderer, scene: Scene) {
        super();
        this.renderer = renderer;
        this.scene = scene;
        this.children.push(this.xrHelper); // If XRHelper is a CComponent
    }

    public initWebXR(): void {
        if (this.initialized) {
            return;
        }

        this.xrHelper
            .enableSession(async (xrs) => {
                const enable = xrs !== null;

                this.initialized = enable;

                await this.renderer.xr.setSession(xrs);
                this.renderer.xr.enabled = true; // TODO: Check if this is correct usage

                if (enable && xrs) { // ensure xrs is not null
                    const regCon = (con: Group) => {
                        con.addEventListener(EVENT_VR_SELECT_START, () => { return this.onVRSelectStart(); });
                        con.addEventListener(EVENT_VR_SELECT_END, () => { return this.onVRSelectEnd(); });
                        this.scene.add(con);
                    };

                    const c1 = this.renderer.xr.getController(0);

                    if (c1) {
                        regCon(c1);
                        this.userData.controller1 = c1;
                        const c2 = this.renderer.xr.getController(1);

                        if (c2) {
                            regCon(c2);
                            this.userData.controller2 = c2;
                        }
                    }
                } else {
                    if (this.userData.controller1) {
                        this.scene.remove(this.userData.controller1);
                        this.userData.controller1.removeEventListener(EVENT_VR_SELECT_START, () => { return this.onVRSelectStart(); });
                        this.userData.controller1.removeEventListener(EVENT_VR_SELECT_END, () => { return this.onVRSelectEnd(); });
                    }
                    if (this.userData.controller2) {
                        this.scene.remove(this.userData.controller2);
                        this.userData.controller2.removeEventListener(EVENT_VR_SELECT_START, () => { return this.onVRSelectStart(); });
                        this.userData.controller2.removeEventListener(EVENT_VR_SELECT_END, () => { return this.onVRSelectEnd(); });
                    }
                    this.userData.controller1 = null;
                    this.userData.controller2 = null;
                }
            })
            .then((succ) => {
                if (succ) {
                    Smallog.info('Initialized WebXR!');
                } else {
                    Smallog.error('[WebXRHandler] Initializing WebXR failed (enableSession returned false).');
                }
            })
            .catch((err) => {
                Smallog.error('[WebXRHandler] Error during xrHelper.enableSession: ', err);
            });
    }

    private onVRSelectStart(): void {
        this.userData.isSelecting = true;
    }

    private onVRSelectEnd(): void {
        this.userData.isSelecting = false;
    }

    /**
     * @todo Fix
     * use VR controller like mouse & parallax
     * @param {Group | null} controller left or right
     * @returns {void}
     */
    public handleVRController(controller: Group | null): void {
        // @TODO Implement detailed VR controller logic.
        // This may involve raycasting, interaction with scene objects,
        // or using controller input to navigate/manipulate the environment.

        if (controller) {
            Smallog.debug(`[WebXRHandler] Handling controller: ${controller.id}`);
        }

        // Access controller.isSelecting, controller.position, controller.quaternion for input
        if (controller && (controller.userData as any).isSelecting) {
            // Example: Log position when selecting
            Smallog.debug(`[WebXRHandler] Controller ${controller.id} selecting at ${JSON.stringify(controller.position)}`);
        }
    }

    public updateFrame(): void {
        if (this.initialized && this.renderer.xr.isPresenting) {
            // WEBVR PROCESSING
            // will automagically update the camera, no need to do it manually
            this.handleVRController(this.userData?.controller1);
            // Typo? Should likely be controller2 or this is redundant
            this.handleVRController(this.userData?.controller2);
        }
    }

    // Add any necessary methods to update settings from ContextHelper
    public updateSettings(): Promise<void> {
        return Promise.resolve();
    }

    public dispose(): void {
        // TBD.. destroy event handlers etc?
    }

}
