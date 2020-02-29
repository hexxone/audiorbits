/**
 * @author D.Thiele @https://hexxon.me
 * 
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Wallaper Engine Audio Supplier worker.
 */

var pinkNoise = [1.1760367470305, 0.85207379418243, 0.68842437227852, 0.63767902570829,
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
    2.4043566176474, 2.4280476777842, 2.3917477397336, 2.4032522546622, 2.3614180150678];

var correctPinkNoise = function (data) {
    var correct = [];
    for (var i = 0; i < 64; i++) {
        correct[i] = data[i] / pinkNoise[i];
        correct[64 + i] = data[64 + i] / pinkNoise[i];
    }
    return correct;
};

var stereoToMono = function (data) {
    var mono = [];
    var mIdx = 0;
    for (var i = 0; i < 64; i++) {
        mono[mIdx++] = data[i];
        mono[mIdx++] = data[64 + i];
    }
    return mono;
};

var smoothArray = function (array, smoothing) {
    var newArray = new Float64Array(array.length);
    for (var i = 0; i < array.length; i++) {
        var sum = 0;
        for (var index = i - smoothing; index <= i + smoothing; index++)
            sum += array[index < 0 ? index + array.length : index % array.length];
        newArray[i] = sum / ((smoothing * 2) + 1);
    }
    return newArray;
};

// function will apply setting-defined data smoothing
var applyValueLeveling = function (curr, prev, s) {
    return curr - (curr - prev) * s / 100;
};

onmessage = function (e) {
    let eventData = e.data;
    // can be null
    let audioArray = new Float64Array(eventData.audio);
    let lastData = eventData.last;
    let settings = eventData.settings;
    // fix pink noise for both channels
    var corrected = correctPinkNoise(audioArray);
    // write botch channels to mono
    var monoArray = stereoToMono(corrected);
    // smooth and get final data
    var data = smoothArray(monoArray, 2);
    // set latest data
    var ldata;
    if (lastData) ldata = lastData.data.slice(0);
    // process current frequency data and previous if given
    var sum = 0, min = 1, max = 0, bass = 0, mids = 0, peaks = 0;
    for (var i = 0; i < 128; i++) {
        // parse current freq value
        var idata = parseFloat(data[i]);
        // fix null values
        if (idata == null || isNaN(idata)) data[i] = idata = 0.0;
        // process last value with current
        if (lastData) data[i] = idata = applyValueLeveling(idata, ldata[i], settings.audio_smoothing);
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
    // I cant really explain.... magic?
    var intensity = (bass * 6 - mids + peaks) / 6 / average;
    // done
    self.postMessage({
        silent: (max < settings.minimum_volume / 1000),
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
        data: data.buffer,
    },
    [data.buffer]);
};
