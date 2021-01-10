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

import * as THREE from 'three';
import { CComponent } from './we_utils/src/CComponent';

import { CSettings } from './we_utils/src/CSettings';
import { Smallog } from './we_utils/src/Smallog';

interface ColorObject {
	hsla: number;
	hslb: number;
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

	// gets called when updating color picker
	public init() {
		var sett = this.settings;
		var cobj = this.colorObject = this.getColorObject();
		Smallog.Debug("initHueValues: a=" + cobj.hsla + ", b=" + cobj.hslb);
		for (var s = 0; s < sett.num_subsets_per_level; s++) {
			var col = Math.random();
			switch (sett.color_mode) {
				case 1:
				case 4: col = cobj.hsla; break;
				case 2: col = cobj.hsla + (s / sett.num_subsets_per_level * cobj.range); break;
				case 3: col = cobj.hsla + (col * cobj.range); break;
			}
			this.hueValues[s] = col;
		}
	}

	// returns the processed user color object
	private getColorObject() {
		var sett = this.settings;
		var a = this.rgbToHue(sett.user_color_a).h;
		var b = this.rgbToHue(sett.user_color_b).h;
		var mi = Math.min(a, b);
		var ma = Math.max(a, b);
		return {
			hsla: a,
			hslb: b,
			min: mi,
			max: ma,
			range: b - a
		};
	}

	// get HUE val
	private rgbToHue(r_g_b) {
		const arr = r_g_b.split(" ");
		const tmp = new THREE.Color(arr[0], arr[1], arr[2]);
		var hsl = { h: 0, s: 0, l: 0 };
		tmp.getHSL(hsl);
		return hsl;
	}

	// shift hue values
	public update(ellapsed, deltaTime) {
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