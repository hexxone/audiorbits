/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2026 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

import { CComponent, CSettings } from 'we_utils/src';
import { EVENT_TOUCH_START,
    EVENT_TOUCH_MOVE,
    EVENT_MOUSE_MOVE,
    EVENT_RESIZE,
    DEG_TO_RAD } from './Consts';

export class MouseInputHandlerSettings extends CSettings {

    public parallax_option = 0; // 0: None, 1: Mouse, 2: Auto, 3: Fixed
    public parallax_angle = 180; // For fixed parallax

}

export class MouseInputHandler extends CComponent {

    public settings: MouseInputHandlerSettings = new MouseInputHandlerSettings();

    private _mouseX = 0;
    private _mouseY = 0;
    private _windowHalfX = window.innerWidth / 2;
    private _windowHalfY = window.innerHeight / 2;

    constructor() {
        super();
        document.addEventListener(EVENT_TOUCH_START, (e) => { return this.mouseUpdate(e); }, false);
        document.addEventListener(EVENT_TOUCH_MOVE, (e) => { return this.mouseUpdate(e); }, false);
        document.addEventListener(EVENT_MOUSE_MOVE, (e) => { return this.mouseUpdate(e); }, false);
        window.addEventListener(EVENT_RESIZE, () => { return this.onResize(); }, false); // Keep window half updated
    }

    private onResize(): void {
        this._windowHalfX = window.innerWidth / 2;
        this._windowHalfY = window.innerHeight / 2;
    }

    private mouseUpdate(event: MouseEvent | TouchEvent): void {
        if (this.settings.parallax_option !== 1) { // Only update if mouse parallax is active
            return;
        }
        if (event instanceof TouchEvent && event.touches && event.touches.length === 1) {
            event.preventDefault();
            this._mouseX = event.touches[0].pageX - this._windowHalfX;
            this._mouseY = event.touches[0].pageY - this._windowHalfY;
        } else if (event instanceof MouseEvent && event.clientX) {
            this._mouseX = event.clientX - this._windowHalfX;
            this._mouseY = event.clientY - this._windowHalfY;
        }
    }

    public get mouseX(): number {
        return this._mouseX;
    }

    public get mouseY(): number {
        return this._mouseY;
    }

    public positionMouseAngle(degrees: number): void {
        const ang = degrees * DEG_TO_RAD;
        let w = window.innerHeight;

        if (window.innerWidth < w) {
            w = window.innerWidth;
        }
        w /= 2; // Use half of the smaller dimension
        this._mouseX = w * Math.sin(ang);
        this._mouseY = w * Math.cos(ang);
    }

    public updateSettings(): Promise<void> {
        // If parallax option changes, reset mouse or apply fixed angle
        if (this.settings.parallax_option === 0) { // None
            this._mouseX = 0;
            this._mouseY = 0;
        } else if (this.settings.parallax_option === 3) { // Fixed
            this.positionMouseAngle(this.settings.parallax_angle);
        }

        return Promise.resolve();
    }

}
