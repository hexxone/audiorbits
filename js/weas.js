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
		// return false if there is no data or its invalid due to time (> 3s old)
		return weas.lastAudio && !weas.lastAudio.silent &&
			(performance.now() / 1000 - weas.lastAudio.time < 3);
	},
	// audio processing worker
	weasWorker: null,
	// last processed audio object
	lastAudio: null,
	// settings object
	settings: {
		// time-value smoothing ratio
		audio_smoothing: 55,
		// multipliers
		treble_multiplier: 0.5,
		mids_multiplier: 0.75,
		bass_multiplier: 1,
		// ignore value leveling for "silent" data
		minimum_volume: 0.001,
	},
	// function will get called with the audio data as array, containing L & R channels
	audioListener: function (audioArray) {
		// check proof
		if (!audioArray) return;
		if (audioArray.length != 128) {
			print("audioListener: received invalid audio data array. Length: " + audioArray.length);
			return;
		}
		let audBuff = new Float64Array(audioArray);
		// post web worker task
		weas.weasWorker.postMessage({
			settings: weas.settings,
			last: weas.lastAudio,
			audio: audBuff.buffer
		}, [audBuff.buffer]);
	},
	// task completed
	processed: function (e) {
		e.data.data = new Float64Array(e.data.data);
		weas.lastAudio = e.data;
	},
	// task error
	errror: function (e) {
		console.log("weas error: [" + e.filename + ", Line: " + e.lineno + "] " + e.message);
	}
};

$(() => {
	// if wallpaper engine context given, listen
	if (window.wallpaperRegisterAudioListener) {
		// initialize web worker
		weas.weasWorker = new Worker('./js/worker/weasWorker.js');
		weas.weasWorker.addEventListener("message", weas.processed, true);
		weas.weasWorker.addEventListener("error", weas.error, true);
		// intialize wallpaper engine audio listener
		window.wallpaperRegisterAudioListener(weas.audioListener);
	}
});