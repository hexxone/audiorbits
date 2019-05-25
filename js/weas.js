/*
 * Copyright (c) 2019 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * WEWWA
 * Wallpaper Engine Audio Supplier
 * 
 * This is an aditional JS file to be included in any Wallpaper Engine
 * Web-Wallpaper project to make working with audio easier.
 * It will automatically start to receive and process the audio data
 * which can then be accessed on the global object.
 * 
*/

var weas = {
    // has currently valid audio data stored?
    hasAudio: function() {
        // @TODO: return false if data is invalid due to time (> 3s old)
        return weas.lastAudio && !weas.lastAudio.silent;
    },
    // last processed audio object
    lastAudio: null,
    // time-value smoothing ratio
    audio_smoothing: 55,
	// ignore value leveling for "silent" data
	silentThreshHold: 0.001,
	// correction plot for frequency levels
	pinkNoise: [1.1760367470305, 0.85207379418243, 0.68842437227852, 0.63767902570829,
		0.5452348949654, 0.50723325864167, 0.4677726234682, 0.44204182748767, 0.41956517802157,
		0.41517375040002, 0.41312118577934, 0.40618363960446, 0.39913707474975, 0.38207008614508,
		0.38329789106488, 0.37472136606245, 0.36586428412968, 0.37603017335105, 0.39762590761573,
		0.39391828858591, 0.37930603769622, 0.39433365764563, 0.38511504613859, 0.39082579241834,
		0.3811852720504, 0.40231453727161, 0.40244151133175, 0.39965366884521, 0.39761103827545,
		0.51136400422212, 0.66151212038954, 0.66312205226679, 0.7416276690995, 0.74614971301133,
		0.84797007577483, 0.8573583910469, 0.96382997811663, 0.99819377577185, 1.0628692615814,
		1.1059083969751, 1.1819808497335, 1.257092297208, 1.3226521464753, 1.3735992532905,
		1.4953223705889, 1.5310064942373, 1.6193923584808, 1.7094805527135, 1.7706604552218,
		1.8491987941428, 1.9238418849406, 2.0141596921333, 2.0786429508827, 2.1575522518646,
		2.2196355526005, 2.2660112509705, 2.320762171749, 2.3574848254513, 2.3986127976537,
		2.4043566176474, 2.4280476777842, 2.3917477397336, 2.4032522546622, 2.3614180150678],


	// function will get called with the audio data as array, containing L & R channels
	audioListener: function (audioArray) {
		var self = weas;
		// check proof
		if (!audioArray) return;
		if (audioArray.length != 128) {
			print("audioListener: received invalid audio data array. Length: " + audioArray.length);
			return;
		}
		// fix pink noise for both channels
		var corrected = self.correctPinkNoise(audioArray);
		// write botch channels to mono
		var monoArray = self.stereoToMono(corrected);
		// smooth and get final data
		var data = self.smoothArray(monoArray, 2);
        // set latest data
		var lst, ldata;
        var hasLast = self.hasAudio();
        if(hasLast) {
            lst = self.lastAudio;
            ldata = lst.data.slice(0);
        }
		// process current frequency data and previous if given
		var sum = 0, min = 1, max = 0, bass = 0, mids = 0, peaks = 0;
		for (var i = 0; i < 128; i++) {
			// parse current freq value
			var idata = parseFloat(data[i]);
			// fix null values
			if (idata == null || isNaN(idata)) data[i] = idata = 0.0;
            
            // process last value with current
            if (hasLast) data[i] = idata = self.applyValueLeveling(idata, ldata[i]);
            
			// process min max value
            if (idata < min) min = idata;
			if (idata > max) max = idata;
			// process ranges
			if (i < 16) bass += idata;
			else if (i > 80) peaks += idata / 1.5;
			else mids += idata / 1.25;
			// calc peak average
			sum += idata;
		}
		// calc average with previous entry
		var average = sum / 128;
		var intensity = (bass * 6 - mids + peaks) / 6 / average;
		// update newest entry
		self.lastAudio = {
			silent: (max < self.silentThreshHold),
			min: min,
			max: max,
			range: max - min,
			bass: bass,
			mids: mids,
			peaks: peaks,
            sum: sum,
			average: average,
            intensity: intensity,
			time: performance.now() / 1000,
			data: data,
        };
	},
	// function will process the given audio data with the some default noise levels
	correctPinkNoise: function (data) {
		var correct = [];
		for (var i = 0; i < 64; i++) {
			correct[i] = data[i] / weas.pinkNoise[i];
			correct[64 + i] = data[64 + i] / weas.pinkNoise[i];
		}
		return correct;
	},
	// function will return stereo data as mono
	stereoToMono: function (data) {
		var mono = [];
		var mIdx = 0;
		for (var i = 0; i < 64; i++) {
			mono[mIdx++] = data[i];
			mono[mIdx++] = data[64 + i];
		}
		return mono;
	},
	// this will smooth the given audio data array by given amount, rotational
	smoothArray: function (array, smoothing) {
		var newArray = [];
		for (var i = 0; i < array.length; i++) {
			var sum = 0;
			for (var index = i - smoothing; index <= i + smoothing; index++)
				sum += array[index < 0 ? index + array.length : index % array.length];
			newArray[i] = sum / ((smoothing * 2) + 1);
		}
		return newArray;
	},
	// function will apply setting-defined data smoothing
	applyValueLeveling: function (curr, prev) {
		return curr - (curr - prev) * weas.audio_smoothing / 100;
	},

};

// init audio listener
if (window.wallpaperRegisterAudioListener) {
    window.wallpaperRegisterAudioListener(weas.audioListener);
}
