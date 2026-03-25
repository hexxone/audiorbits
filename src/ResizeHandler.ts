/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2026 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

import { PerspectiveCamera, WebGLRenderer } from 'three.ts/src';
import { CComponent, CSettings, EffectComposer } from 'we_utils/src';
import { EVENT_RESIZE } from './Consts';

export class ResizeHandler extends CComponent {

    public settings: CSettings = new CSettings();

    private camera: PerspectiveCamera;
    private renderer: WebGLRenderer;
    private composer?: EffectComposer;

    constructor(
        camera: PerspectiveCamera,
        renderer: WebGLRenderer,
        composer?: EffectComposer
    ) {
        super();
        this.camera = camera;
        this.renderer = renderer;
        this.composer = composer;

        window.addEventListener(EVENT_RESIZE, this.onResize, false);
    }

    public onResize(): void {
        const iW = window.innerWidth;
        const iH = window.innerHeight;

        if (!this.camera || !this.renderer) {
            return;
        }

        this.camera.aspect = iW / iH;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(iW, iH);

        if (this.composer) {
            this.composer.setSize(iW, iH);
        }
    }

    // Optional: if composer can be set later or changed
    public setComposer(composer: EffectComposer): void {
        this.composer = composer;
    }

    // Method to clean up event listener if handler is ever destroyed
    public dispose(): void {
        window.removeEventListener(EVENT_RESIZE, this.onResize, false);
    }

}
