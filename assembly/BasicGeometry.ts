/**
 * @author hexxone / https://hexx.one
 * 
 * @license
 * Copyright (c) 2023 hexxone All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Wallaper Engine Fractal Geometry worker.
 *
 * @todo
 * export function vars to global space
 */


//////////////////////////
//     CUSTOM API
//////////////////////////

@external("env", "logf")
declare function logf(value: f64): void;

@external("env", "logi")
declare function logi(value: u32): void;

@inline()
function deallocArray<T>(arr: T[]): void {
    memory.free(changetype<usize>(arr.buffer_));
    memory.free(changetype<usize>(arr));
}

//////////////////////////
//     Shape Geo
//////////////////////////

const DIMS = 3;

function ShapeGeometry(levelId: i32, reuse: Array<Float32Array | null> | null): Array<Float32Array | null> | null {
    if(reuse === null) {
        return null;
    }

    const startScale = 0.6 + Math.random() * 0.8;
    const endScale = startScale - Math.random() * 0.5 * (Math.random() > 0.5 ? -1 : 1);
    const stepSize = (startScale - endScale) / levelSettings[1];
    for (let s = 0; s < levelSettings[1]; s++) {
        // calculate time scale
        const tscale = startScale + (stepSize * s);
        // calculating reusing arrays
        reuse[s] = MakeLevelData(levelId, tscale, reuse[s]);
    }
    return reuse;
}

function MakeLevelData(levelId: i32, scale: f64, arr: Float32Array | null): Float32Array {
    switch (levelId % 4) {
        case 1: return Circle(scale, arr);
        case 2: return Rektangle(scale, arr);
        case 3: return Cross(scale, arr);
        default: return Triangle(scale, arr);
    }
}

function Triangle(lscale: f64, arr: Float32Array | null): Float32Array {
    const numVert = Math.floor(levelSettings[2] / 100) as i32;
    const rVert = numVert - numVert % 3;
    const result = arr != null ? arr : new Float32Array(rVert);

    return result;
}

function Circle(lscale: f64, arr: Float32Array | null): Float32Array {
    const numVert = Math.floor(levelSettings[2] / 100) as i32;
    const result = arr != null ? arr : new Float32Array(numVert);

    return result;
}

function Rektangle(lscale: f64, arr: Float32Array | null): Float32Array {
    const numVert = Math.floor(levelSettings[2] / 100) as i32;
    const rVert = numVert - numVert % 4;
    const result = arr != null ? arr : new Float32Array(rVert);

    return result;
}

function Cross(lscale: f64, arr: Float32Array | null): Float32Array {
    const numVert = Math.floor(levelSettings[2] / 100) as i32;
    const rVert = numVert - numVert % 12;
    const result = arr != null ? arr : new Float32Array(rVert);

    return result;
}

// internal short-hand helper
function myBuild(id: i32): Array<Float32Array | null> | null {
    const numSubsets = Math.floor(levelSettings[0]) as i32;
    if (lastData == null) {
        lastData = new Array<Float32Array | null>(numSubsets);
    }
    return lastData = ShapeGeometry(id, lastData);
}

//////////////////////////
//     Main Program
//////////////////////////

// this will hold the last allocated array for re-use
let lastData: Array<Float32Array | null> | null = null;

// this will hold the current processing settings
export const levelSettings = new Float64Array(20);
levelSettings.fill(0.0);

// Build and return a level by specified settings
export function build(id: i32): Array<Float32Array | null> |null {
    // run generator
    return myBuild(id);
}

export const Copyright_by_hexxone: bool = true;