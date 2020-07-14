/**
 * @author D.Thiele @https://hexxon.me
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * WEWWA
 * Wallpaper Engine Audio Supplier
 * 
 * DEPENDS ON:
 * - "./worker/weasWorker.js"
 * - jQuery (window loaded event)
 * - Wallpaper Engine Web Wallpaper environment
 * - audio-processing supported wallpaper...
 * 
 * This is an aditional JS file to be included in any Wallpaper Engine
 * Web-Wallpaper project to make working with audio easier.
 * It will automatically start to receive and process the audio data
 * which can then be accessed on the global object.
 * 
*/

var weas = {
	// has currently valid audio data stored?
	hasAudio: function () {
		var timeOut = 5;
		var now = performance.now() / 1000;
		// return false if there is no data or its invalid due to time (> 3s old)
		return weas.settings.audioprocessing &&
			(!weas.lastAudio.silent || now - weas.lastAudio.silent < timeOut) &&
			(now - weas.lastAudio.time < timeOut);
	},
	// audio processing worker
	weasWorker: null,
	// last processed audio object
	lastAudio: {
		silent: (performance.now() / 1000) - 10,
		min: 0,
		max: 0,
		range: 0,
		bass: 0,
		mids: 0,
		peaks: 0,
		sum: 0,
		average: 0,
		intensity: 0,
		data: new Float32Array(128),
	},
	// settings object
	settings: {
		audioprocessing: false,
		// time-value smoothing ratio
		audio_smoothing: 65,
		// NEIGHBOUR value smoothing
		value_smoothing: 2,
		// multipliers
		treble_multiplier: 0.5,
		mids_multiplier: 0.75,
		bass_multiplier: 1,
		// ignore value leveling for "silent" data
		minimum_volume: 0.001,
		// peak processing
		peak_filter: 1
	},
	// function will get called with the audio data as array, containing L & R channels
	audioListener: function (audioArray) {
		// check proof
		if (!audioArray || !weas.settings.audioprocessing) return;
		if (audioArray.length != 128) {
			print("audioListener: received invalid audio data array. Length: " + audioArray.length);
			return;
		}
		let audBuff = new Float32Array(audioArray);
		// post web worker task
		//print("WEAS: post audio data..");
		weas.weasWorker.postMessage({
			settings: weas.settings,
			last: weas.lastAudio,
			audio: audBuff.buffer
		}, [audBuff.buffer]);
	},
	// task completed
	processed: function (e) {
		e.data.data = new Float32Array(e.data.data);
		e.data.time = performance.now() / 1000;
		// if new data is silent, replace with timestamp
		if (e.data.silent) {
			// if the last audio data is silent, keep the old timestamp
			if (weas.lastAudio && weas.lastAudio.silent)
				e.data.silent = weas.lastAudio.silent;
			// otherwise make a new one
			else
				e.data.silent = e.data.time;
		}
		// apply the new data
		weas.lastAudio = e.data;
		//print("WEAS: processed audio data "/* + JSON.stringify(e.data)*/);
	},
	// task error
	errror: function (e) {
		console.log("weas error: [" + e.filename + ", Line: " + e.lineno + "] " + e.message);
	}
};

// if wallpaper engine context given, listen
if (window.wallpaperRegisterAudioListener) {
	// initialize web worker
	weas.weasWorker = new Worker('./js/worker/weasWorker.js');
	weas.weasWorker.addEventListener("message", weas.processed, true);
	weas.weasWorker.addEventListener("error", weas.error, true);
	// intialize wallpaper engine audio listener
	window.wallpaperRegisterAudioListener(weas.audioListener);
}