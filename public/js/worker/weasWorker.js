/**
 * @author D.Thiele @https://hexx.one
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

// correct pink noise for first and second half
var correctPinkNoise = function (data) {
    var correct = [];
    for (var i = 0; i < 64; i++) {
        correct[i] = data[i] / pinkNoise[i];
        correct[64 + i] = data[64 + i] / pinkNoise[i];
    }
    return correct;
};

// merge first and second half into full range
var stereoToMono = function (data) {
    var mono = [];
    var mIdx = 0;
    for (var i = 0; i < 64; i++) {
        mono[mIdx++] = data[i];
        mono[mIdx++] = data[64 + i];
    }
    return mono;
};

// switch front with back in first half
var invertFirst = function (data) {
    for (var i = 0; i < 32; i++) {
        var a = data[i];
        data[i] = data[64 - i];
        data[64 - i] = a;
    }
};

// switch front with back in second half
var invertSecond = function (data) {
    for (var i = 0; i < 32; i++) {
        var b = data[64 + i];
        data[64 + i] = data[128 - i];
        data[128 - i] = b;
    }
};

// switch front with back in full range
var invertAll = function (data) {
    for (var i = 0; i < 64; i++) {
        var a = data[i];
        data[i] = data[128 - i];
        data[128 - i] = a;
    }
};

// filter peaks for full range
var peakFilter = function (array, amount) {
    var oldMax = 0;
    var newMax = 0;
    var newArray = new Float64Array(array.length);
    // pow this shit
    for (var i = 0; i < array.length; i++) {
        if (array[i] > oldMax) oldMax = array[i];
        newArray[i] = Math.pow(array[i] * amount, amount);
        if (newArray[i] > newMax) newMax = newArray[i];
    }
    // re-scale & apply
    var divide = newMax / oldMax;
    for (var i = 0; i < array.length; i++)
        array[i] = newArray[i] / divide;
};

// smooth values for full range
var smoothArray = function (array, smoothing) {
    var newArray = new Float64Array(array.length);
    // make smoothed array
    for (var i = 0; i < array.length; i++) {
        var sum = 0;
        for (var index = i - smoothing; index <= i + smoothing; index++)
            sum += array[index < 0 ? index + array.length : index % array.length];
        newArray[i] = sum / ((smoothing * 2) + 1);
    }
    // copy new data to old array
    for (var i = 0; i < array.length; i++)
        array[i] = newArray[i];
};

// function will apply setting-defined data smoothing
var applyValueLeveling = function (curr, prev, sett) {
    for (var i = 0; i < curr.length; i++) {
        var diff = curr[i] - prev[i];
        var mlt = 100 - (diff > 0 ? sett.audio_increase : sett.audio_decrease);
        curr[i] -= diff * mlt / 100;
    }
};

onmessage = function (e) {
    let eventData = e.data;
    // can be null
    let data = new Float64Array(eventData.audio);
    let lastData = eventData.last;
    let settings = eventData.settings;

    // fix pink noise?
    if (settings.equalize) correctPinkNoise(data);

    // write botch channels to mono
    if (settings.mono_audio) stereoToMono(data);

    // normal high & low mapping
    if (settings.audio_direction == 0) {
        // only flip the second half of the data
        if (!settings.mono_audio) invertSecond(data);
    }
    // flipped high & low mapping
    else {
        // flip whole range
        if (settings.mono_audio) invertAll(data);
        // only flip first half of stereo
        else invertFirst(data);
    }

    // process peaks?
    if (settings.peak_filter > 0) peakFilter(data, settings.peak_filter + 1);

    // smooth data?
    if (settings.value_smoothing > 0) smoothArray(data, settings.value_smoothing);

    // process with last data?
    if (lastData) applyValueLeveling(data, lastData.data, settings);

    // process current frequency data and previous if given
    var sum = 0, min = 1, max = 0, bass = 0, mids = 0, peaks = 0;
    for (var i = 0; i < data.length; i++) {
        // parse current freq value
        var idata = parseFloat(data[i]);
        // fix null values
        if (idata == null || isNaN(idata)) data[i] = idata = 0.0;
        // process min max value
        if (idata < min) min = idata;
        if (idata > max) max = idata;
        // process ranges
        if (i < 10) bass += idata * settings.bass_multiplier;
        else if (i > 70) peaks += idata * settings.treble_multiplier;
        else mids += idata * settings.mids_multiplier;
        // calc peak average
        sum += idata;
    }
    // calc average with previous entry
    var average = sum / data.length;
    // done
    self.postMessage({
        bass: bass,
        mids: mids,
        peaks: peaks,
        sum: sum,
        min: min,
        max: max,
        average: average,
        range: max - min,
        silent: (max < settings.minimum_volume / 1000),
        intensity: (bass * 8 - mids + peaks) / 6 / average,
        time: performance.now() / 1000,
        data: data.buffer,
    }, [data.buffer]);
}; // Strassenbande
