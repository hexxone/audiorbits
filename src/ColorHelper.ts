/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2024 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

import { CComponent,
    CSettings,
    rgbToHSL,
    rgbToObj,
    Smallog } from 'we_utils/src';

import { Color } from 'three.ts/src/';

/**
 * @public
 */
type ColorObject = {
    hueA: number;
    hueB: number;
    min: number;
    max: number;
    range: number;
    main: Color;
};

/**
 * ColorHelper settings
 * @public
 */
class ColorSettings extends CSettings {

    num_subsets_per_level = 16;
    // Color category
    color_mode = 0;
    main_color = '0 0 0';
    user_color_a = '1 0.5 0';
    user_color_b = '0 0.5 1';
    color_fade_speed = 2;

}

/**
 * Contains color settings and objects for audiOrbits
 * @public
 */
export class ColorHelper extends CComponent {

    // settings
    public settings: ColorSettings = new ColorSettings();

    // user colors converted from RGB to HSL
    public colorObject: ColorObject = null;
    public hueValues: number[] = [];

    /**
     * gets called after updating color picker
     * @public
     * @returns {Promise} complete
     */
    public updateSettings(): Promise<void> {
        const sett = this.settings;
        const cobj = (this.colorObject = this.getColorObject());

        Smallog.debug(`initHueValues: a=${cobj.hueA}, b=${cobj.hueB}`);
        this.hueValues = [];
        for (let s = 0; s < sett.num_subsets_per_level; s++) {
            let col = Math.random(); // default: random

            switch (sett.color_mode) {
                case 1: // single color OR
                case 4: // audio max = 2nd color, min = 1st color
                    col = cobj.hueA;
                    break;
                case 2: // level gradient
                    col
                        = cobj.hueA
                        + (s / sett.num_subsets_per_level) * cobj.range;
                    break;
                case 3: // random from range
                    col = cobj.hueA + col * cobj.range;
                    break;
            }
            this.hueValues[s] = col;
        }

        return Promise.resolve();
    }

    /**
     * returns the processed user color object
     * @returns {ColorObject} processed
     */
    private getColorObject(): ColorObject {
        const a = rgbToHSL(this.settings.user_color_a).h;
        const b = rgbToHSL(this.settings.user_color_b).h;
        const m = rgbToObj(this.settings.main_color, 1);

        return {
            hueA: a,
            hueB: b,
            min: Math.min(a, b),
            max: Math.max(a, b),
            range: b - a,
            main: new Color(m.r, m.g, m.b)
        };
    }

    /**
     * shift hue values
     * @public
     * @param {number} ellapsed passed ms float
     * @param {number} deltaTime alternative multiplier
     * @returns {void}
     */
    public updateFrame(ellapsed, deltaTime) {
        const sett = this.settings;

        if (sett.color_fade_speed > 0) {
            const hueAdd = (sett.color_fade_speed / 6000) * deltaTime;

            for (let s = 0; s < sett.num_subsets_per_level; s++) {
                this.hueValues[s] += hueAdd;
                if (this.hueValues[s] >= 1) {
                    this.hueValues[s] -= 1;
                }
            }
        }
    }

}
