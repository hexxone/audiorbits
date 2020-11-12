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

var colorHolder = {

	settings: {
		num_subsets_per_level: 16,
		// Color category
		color_mode: 0,
		user_color_a: "1 0.5 0",
		user_color_b: "0 0.5 1",
		color_fade_speed: 2,
	},

	// color data
	hueValues: [],

	// user colors converted from RGB to HSL
	colorObject: null,

	// gets called when updating color picker
	init: function () {
		var self = colorHolder;
		self.initHueValues();
	},

	// initialize hue-values by color mode
	initHueValues: function () {
		var self = colorHolder;
		var sett = self.settings;
		var cobj = self.colorObject = self.getColorObject();
		print("initHueValues: a=" + cobj.hsla + ", b=" + cobj.hslb);
		for (var s = 0; s < sett.num_subsets_per_level; s++) {
			var col = Math.random();
			switch (sett.color_mode) {
				case 1:
				case 4: col = cobj.hsla; break;
				case 2: col = cobj.hsla + (s / sett.num_subsets_per_level * cobj.range); break;
				case 3: col = cobj.hsla + (col * cobj.range); break;
			}
			self.hueValues[s] = col;
		}
	},

	// returns the processed user color object
	getColorObject: function () {
		var self = colorHolder;
		var sett = self.settings;
		var a = self.rgbToHue(sett.user_color_a).h;
		var b = self.rgbToHue(sett.user_color_b).h;
		var mi = Math.min(a, b);
		var ma = Math.max(a, b);
		return {
			hsla: a,
			hslb: b,
			min: mi,
			max: ma,
			range: b - a
		};
	},

	// get HUE val
	rgbToHue: function (r_g_b) {
		const arr = r_g_b.split(" ");
		const tmp = new THREE.Color(arr[0], arr[1], arr[2]);
		var hsl = {};
		tmp.getHSL(hsl);
		return hsl;
	},


	// shift hue values
	update: function (ellapsed, deltaTime) {
		var self = colorHolder;
		var sett = self.settings;

		if (sett.color_mode == 0) {
			var hueAdd = (sett.color_fade_speed / 4000) * deltaTime;
			for (var s = 0; s < sett.num_subsets_per_level; s++) {
				self.hueValues[s] += hueAdd;
				if (self.hueValues[s] >= 1)
					self.hueValues[s] -= 1;
			}
		}
	}
}