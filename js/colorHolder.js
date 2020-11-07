

var colorHolder = {

    settings: {
        num_subsets_per_level: 4096,
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
    init: function() {
        var self = colorHolder;
        self.hueValues = [];
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
		var a = self.rgbToHue(sett.user_color_a.split(" ")).h;
		var b = self.rgbToHue(sett.user_color_b.split(" ")).h;
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
	rgbToHue: function (arr) {
		let rabs, gabs, babs, rr, gg, bb, h, s, v, diff, diffc, percentRoundFn;
		rabs = arr[0] / 255;
		gabs = arr[1] / 255;
		babs = arr[2] / 255;
		v = Math.max(rabs, gabs, babs),
			diff = v - Math.min(rabs, gabs, babs);
		diffc = c => (v - c) / 6 / diff + 1 / 2;
		percentRoundFn = num => Math.round(num * 100) / 100;
		if (diff == 0) {
			h = s = 0;
		} else {
			s = diff / v;
			rr = diffc(rabs);
			gg = diffc(gabs);
			bb = diffc(babs);

			if (rabs === v) {
				h = bb - gg;
			} else if (gabs === v) {
				h = (1 / 3) + rr - bb;
			} else if (babs === v) {
				h = (2 / 3) + gg - rr;
			}
			if (h < 0) {
				h += 1;
			} else if (h > 1) {
				h -= 1;
			}
		}
		return {
			h: h,
			s: s,
			v: v
		};
	},


    update: function(ellapsed, deltaTime) {
        var self = colorHolder;
        var sett = self.settings;

		// shift hue values
		if (sett.color_mode == 0) {
			var hueAdd = (sett.color_fade_speed / 4000) * deltaTime;
			for (var s = 0; s < sett.num_subsets_per_level - 1; s++) {
				self.hueValues[s] += hueAdd;
				if (self.hueValues[s] >= 1)
					self.hueValues[s] -= 1;
			}
		}


    }
}