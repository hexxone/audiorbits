/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Contains color settings and objects for audiOrbits
 * 
 */

import { Color } from 'three';
import { CComponent } from './we_utils/src/CComponent';

import { CSettings } from './we_utils/src/CSettings';
import { Smallog } from './we_utils/src/Smallog';

interface ColorObject {
	hueA: number;
	hueB: number;
	min: number;
	max: number;
	range: number;
}

class ColorSettings extends CSettings {
	num_subsets_per_level: number = 16;
	// Color category
	color_mode: number = 0;
	user_color_a: string = "1 0.5 0";
	user_color_b: string = "0 0.5 1";
	color_fade_speed: number = 2;
}

export class ColorHelper extends CComponent {
	// settings
	public settings: ColorSettings = new ColorSettings();

	// user colors converted from RGB to HSL
	public colorObject: ColorObject = null;
	public hueValues: number[] = [];

	// gets called after updating color picker
	public UpdateSettings(): Promise<void> {
		var sett = this.settings;
		var cobj = this.colorObject = this.getColorObject();
		Smallog.Debug("initHueValues: a=" + cobj.hueA + ", b=" + cobj.hueB);
		this.hueValues = [];
		for (var s = 0; s < sett.num_subsets_per_level; s++) {
			var col = Math.random(); // default: random
			switch (sett.color_mode) {
				// single color OR
				// audio max = 2nd color, min = 1st color
				case 1:
				case 4: col = cobj.hueA; break;
				// level gradient
				case 2: col = cobj.hueA + (s / sett.num_subsets_per_level * cobj.range); break;
				// random from range
				case 3: col = cobj.hueA + (col * cobj.range); break;
			}
			this.hueValues[s] = col;
		}
		return;
	}

	// returns the processed user color object
	private getColorObject(): ColorObject {
		const a = this.rgbToHue(this.settings.user_color_a).h;
		const b = this.rgbToHue(this.settings.user_color_b).h;
		return {
			hueA: a,
			hueB: b,
			min: Math.min(a, b),
			max: Math.max(a, b),
			range: b - a
		};
	}

	// get HUE val
	private rgbToHue(r_g_b: string) {
		const arr = r_g_b.split(" ");
		if (arr.length != 3) throw Error("Invalid color: " + r_g_b)
		const tmp = new Color(
			Number.parseFloat(arr[0]),
			Number.parseFloat(arr[1]),
			Number.parseFloat(arr[2])
		);
		var hsl = { h: 0, s: 0, l: 0 };
		tmp.getHSL(hsl);
		return hsl;
	}

	// shift hue values
	public UpdateFrame(ellapsed, deltaTime) {
		var sett = this.settings;
		if (sett.color_fade_speed > 0) {
			var hueAdd = (sett.color_fade_speed / 6000) * deltaTime;
			for (var s = 0; s < sett.num_subsets_per_level; s++) {
				this.hueValues[s] += hueAdd;
				if (this.hueValues[s] >= 1)
					this.hueValues[s] -= 1;
			}
		}
	}
}