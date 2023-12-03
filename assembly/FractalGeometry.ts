/**
 * @author hexxone / https://hexx.one
 * 
 * @license
 * Copyright (c) 2023 hexxone All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Wallaper Engine Basic Geometry worker.
 */

//////////////////////////
//     CUSTOM API
//////////////////////////

@external("env", "logf")
declare function logf(value: f64): void;

@external("env", "logi")
declare function logi(value: u32): void;

@inline
function deallocArray<T>(arr: T[]): void {
    memory.free(changetype<usize>(arr.buffer_));
    memory.free(changetype<usize>(arr));
}

// Math lib is using 64 bit prrecision float by default...
// so in order to not cast everything, use these short wrapeprs.

function isqrt(n: f32): f32 {
    return Math.sqrt(n) as f32;
}

function iabs(n: f32): f32 {
    return Math.abs(n) as f32;
}

function ilog(n: f32): f32 {
    return Math.log(n) as f32;
}

function ifloor(n: f64): i32 {
    return Math.floor(n) as i32;
}

function icos(n: f32): f32 {
    return Math.cos(n) as f32;
}

function isin(n: f32): f32 {
    return Math.sin(n) as f32;
}


//////////////////////////
//     Seeded Random
//////////////////////////

// seed used for this RNG
let seed: f32 = 1.0;

// generate seeded random float in Range[0,1]
// Kjona, [11.02.21 11:49], "Samen daddy" 💦💦💦
function nextR(): f32 {
    seed = (seed * 9301.0 + 49297.0) % 233280.0 as f32;
    return seed / 233280.0 as f32;
}


//////////////////////////
//     Fractal Geo
//////////////////////////

const DIMS: i32 = 3;

const deg45rad: f32 = -0.785398;

// main Settings
let numSubsets: i32, numPoints: i32, hlfPoints: i32, scaleFactor: f32, iRadius: f32, oRadius: f32, lDep: f32,
    // algorithm params
    al: f32, bl: f32, cl: f32, dl: f32, el: f32,
    // RNG
    choice1: f32,
    choice2: f32,
    // scale helper
    minX: f32 = 0, maxX: f32 = 0, scaleX: f32,
    minY: f32 = 0, maxY: f32 = 0, scaleY: f32,
    tmp: f32,
    s: i32, // subset counter
    x: f32, // p-coord
    y: f32, // p-coord
    newX: f32,
    newY: f32,
    i: i32, // point counter
    z: f32, // alg-param
    x1: f32, // alg-param
    bid: i32, // overall level index
    dist: f32,
    scaling: f32,
    outer: f32,
    ldnum: f32, // subset depth
    lData: Float32Array = new Float32Array(0),
    tmpSet: f32,
    levelSpiral: f32,
    levelCount: i32;

function FractalGeometry(levelId: i32): Array<Float32Array | null> | null {
    if (lastData === null) {
        return null;
    }

    // get randomized params in defined ranges
    // E.g.:  a_val = a_min + random[0-1] * (a_max - a_min)
    al = levelSettings[6] + nextR() * (levelSettings[7] - levelSettings[6]);
    bl = levelSettings[8] + nextR() * (levelSettings[9] - levelSettings[8]);
    cl = levelSettings[10] + nextR() * (levelSettings[11] - levelSettings[10]);
    dl = levelSettings[12] + nextR() * (levelSettings[13] - levelSettings[12]);
    el = levelSettings[14] + nextR() * (levelSettings[15] - levelSettings[14]);

    // some stuff needed in the subset generation loop
    choice1 = nextR();
    choice2 = nextR();
    // scale calculation
    maxX = maxY = minX = minY = 0;

    // loop all subsets for the level
    for (s = 0; s < numSubsets; s++) {
        // Use a different starting point for each orbit subset
        // Needs explicit cast for whatever reason??
        x = s / 100.0 * (0.5 - nextR()) as f32;
        y = s / 100.0 * (0.5 - nextR()) as f32;

        // get array
        if(lastData![s] == null) {
            continue;
        }
        lData = lastData![s]!;

        tmp = (choice1 + ((choice2 - choice1) * ((s / numSubsets) as f32)));

        for (i = 0; i < numPoints; i++) {

            // first half: Iteration formula (generalization of Barry Martin's one)
            if (i < hlfPoints || choice1 > 0.3) {

                if (choice1 < 0.5) z = (dl + (isqrt(iabs(bl * x - cl))));
                else if (choice1 < 0.75) z = (dl + isqrt(isqrt(iabs(bl * x - cl))));
                else z = (dl + ilog(2 + isqrt(iabs(bl * x - cl))));

                if (x > 0) x1 = y - z;
                else if (x == 0) x1 = y;
                else x1 = y + z;

                y = al - x;
                x = x1 + el;

                // translate the point to make it look better
                // spiralize here
                if (levelSpiral > 0.5) {
                    rotatePoint(x, y, - (levelId as f32) * deg45rad + ((s as f32) * deg45rad / (levelCount as f32)));
                }
                else {
                    rotatePoint(x, y, -0.785398);
                }

                newX = rotX;
                newY = rotY;
            }
            // 2nd half of points, copy & flip y
            else {
                if (choice1 > 0.1) {
                    newX = -lData[(i - hlfPoints) * DIMS];
                }
                else {
                    newX = lData[(i - hlfPoints) * DIMS];
                }
                if (choice2 > 0.8) {
                    newY = -lData[(i - hlfPoints) * DIMS + 1];
                }
                else {
                    newY = lData[(i - hlfPoints) * DIMS + 1];
                }
            }

            // process x
            if (newX < minX) minX = newX;
            else if (newX > maxX) maxX = newX;
            // process y
            if (newY < minY) minY = newY;
            else if (newY > maxY) maxY = newY;

            // calculate x buffer location
            bid = i * DIMS;
            // set x & y coordinates
            lData[bid] = newX;
            lData[bid + 1] = newY;
        }

    }

    // calculate level scale based on min and max values
    scaleX = 2 * scaleFactor / (maxX - minX);
    scaleY = 2 * scaleFactor / (maxY - minY);
    ldnum = lDep / levelSettings[1];

    // Normalize and post-process the level   
    for (s = 0; s < numSubsets; s++) {

        // get array
        if(lastData![s] == null) {
            continue;
        }
        lData = lastData![s]!;

        // get depth offset
        tmpSet = ((levelId * numSubsets + s) as f32) / 1024;

        for (i = 0; i < numPoints; i++) {
            // calculate x buffer location
            bid = i * DIMS;

            // re-scale x position
            x = scaleX * (lData[bid] - minX) - scaleFactor;
            // re-scale y position
            y = scaleY * (lData[bid + 1] - minY) - scaleFactor;

            // tunnel processing to take certain points from the center
            // and move them outwards in a circular way
            if (iRadius > 0) {
                dist = getPointDistance(0, 0, x, y) / scaleFactor;
                //print("pd: " + dist + ",   inner: " + iradius);
                if (dist < iRadius) {
                    scaling = dist / iRadius;
                    outer = scaling / oRadius;
                    x = x / scaling + x * outer;
                    y = y / scaling + y * outer;
                }
            }
            // set new scaled x & y value
            lData[bid] = x;
            lData[bid + 1] = y;

            // calculate Z depth with scaled value
            if (DIMS == 3.0) {
                lData[bid + 2] = makeNoise(x, y, tmpSet, scaleFactor) * ldnum;
                // invert every 2nd subset
                if (s % 2 == 1) {
                    lData[bid + 2] = ldnum - lData[bid + 2] * 0.95;
                }
            }

        }
    }

    return lastData;
}


//////////////////////////
//       Utilities
//////////////////////////

let a_dist: f32, b_dist: f32;

function getPointDistance(x1: f32, y1: f32, x2: f32, y2: f32): f32 {
    a_dist = x1 - x2;
    b_dist = y1 - y2;
    return isqrt(a_dist * a_dist + b_dist * b_dist);
}


let oX: f32, oY: f32, closestDist: f32, pDist: f32, closestIndx: i32;

// todo implement variable size for each point
function closestIndex(arr: Float32Array, pIndx: i32): i32 {
    oX = arr[pIndx];
    oY = arr[pIndx + 1];
    closestDist = 100000;
    closestIndx = -1;
    for (let pos = 0; pos < arr.length; pos += DIMS) {
        // skip own point, cause its obviously 0 distance
        if (pos == pIndx) continue;
        // calculate point distance
        pDist = getPointDistance(oX, oY, arr[pos], arr[pos + 1]);
        if (pDist < closestDist) {
            closestDist = pDist;
            closestIndx = pos;
        }
    }
    return closestIndx;
}

let tmpSin: f32, tmpCos: f32, rotX: f32, rotY: f32;

// assumes the point is already relative to center
function rotatePoint(pX: f32, pY: f32, angle: f32): void {
    tmpCos = Math.cos(angle) as f32;
    tmpSin = Math.sin(angle) as f32;
    // rotate point
    rotX = pX * tmpCos - pY * tmpSin;
    rotY = pY * tmpCos + pX * tmpSin;
}


//////////////////////////
//     Depth Noise
//////////////////////////

let noitmp: f32, noires: f32;

function mix(a: f32, b: f32, i: f32): f32 {
    return a + ((b - a) * (i % 1.));
}

function helpNoise(stx: f32, sty: f32, offS: f32, scale: f32): f32 {
    stx = -30 + (240 * offS * choice1) + iabs(stx) / scale * (1 + 6 * choice2)
    sty = -20 + (320 * offS * choice2) + iabs(sty) / scale * (1 + 5 * choice1);
    return isqrt(stx * stx + sty * sty);
}

function makeNoise(stx: f32, sty: f32, offS: f32, scale: f32): f32 {
    noitmp = helpNoise(stx, sty, offS, scale);
    noitmp = (choice1 < 0.4) ? icos(noitmp) : isin(noitmp);
    noires = noitmp;

    if (choice1 < 0.8) {
        noitmp = helpNoise(stx, sty, offS, scale);
        noitmp = (choice1 < 0.5) ? icos(noitmp) : isin(noitmp);
        noires = mix(noires, noitmp, choice1);
    }

    if (choice2 < 0.7) {
        noitmp = helpNoise(stx, sty, offS, scale);
        noitmp = (choice2 < 0.5) ? icos(noitmp) : isin(noitmp);
        noires = mix(noires, noitmp, choice2);
    }

    return noires;
}


//////////////////////////
//     Main Program
//////////////////////////

// this will hold the current processing settings
export const levelSettings = new Float32Array(20);
levelSettings.fill(0.0);

// this will hold the last allocated array for re-use
let lastData: Array<Float32Array | null> | null = null;

// Call after updating settings always
export function update(): void {

    numSubsets = ifloor(levelSettings[1]);
    numPoints = ifloor(levelSettings[2]);
    hlfPoints = ifloor(numPoints / 2);
    scaleFactor = levelSettings[3];
    iRadius = levelSettings[4] / 100;
    oRadius = levelSettings[5] / 100;
    seed = levelSettings[16];
    lDep = levelSettings[17];
    levelSpiral = levelSettings[18];
    levelCount = ifloor(levelSettings[19]);

    // create a buffer thats big enough to hold the x & y corrdinates of all points in a subset.
    // may seem ridiclous, but is actually the best way to transfer the data back
    // also, if the array did not change in size, don't recreate it every time...

    lastData = new Array<Float32Array | null>(numSubsets);
    if (lastData != null) {
        for (let s = 0; s < numSubsets; s++) {
            lastData![s]! = new Float32Array(numPoints * DIMS);
        }
    }
}

// Build and return a level by specified settings
export function build(id: i32): Array<Float32Array | null> | null {
    // run generator
    return FractalGeometry(id);
}

export const Copyright_by_hexxone: bool = true;