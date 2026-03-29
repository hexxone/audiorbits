/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2026 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 *
 * @description
 * AudiOrbits fractal geometry worker.
 */

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

function iatan(n: f32): f32 {
    return Math.atan(n) as f32;
}

const RNG_MULTIPLIER: f32 = 9301.0;
const RNG_INCREMENT: f32 = 49297.0;
const RNG_MODULUS: f32 = 233280.0;

let baseSeed: f32 = 1.0;
let seed: f32 = 1.0;

function resetSeed(levelId: i32): void {
    seed = (baseSeed + ((levelId as f32) * 7919.0)) % RNG_MODULUS;
}

function nextR(): f32 {
    seed = ((seed * RNG_MULTIPLIER + RNG_INCREMENT) % RNG_MODULUS) as f32;

    return (seed / RNG_MODULUS) as f32;
}

const DIMS: i32 = 3;
const DEFAULT_LEVEL_ROTATION: f32 = -0.785398;
const DEG_TO_RAD: f32 = (Math.PI / 180.0) as f32;
const SCALE_NORMALIZATION_FACTOR: f32 = 2.0;
const SUBSET_Z_OFFSET_DIVISOR: f32 = 1024.0;
const SUBSET_Z_INVERSION_FACTOR: f32 = 0.95;
const EPSILON: f32 = 0.000001;
const ATTRACTOR_WEIGHT_OFFSET: i32 = 20;
const ATTRACTOR_COUNT: i32 = 41;
const HOTSPOT_GRID_SIZE: i32 = 32;
const HOTSPOT_GRID_CELL_COUNT: i32 = HOTSPOT_GRID_SIZE * HOTSPOT_GRID_SIZE;
const HOTSPOT_MODE_OFF: i32 = 0;
const HOTSPOT_MODE_BALANCED: i32 = 1;
const HOTSPOT_MODE_AGGRESSIVE: i32 = 2;
const HOTSPOT_MODE_EXTREME: i32 = 3;

enum AttractorId {
    Hopalong = 0,
    HopalongMod1 = 1,
    HopalongMod2 = 2,
    HopalongZen = 3,
    FuturisticHUD = 4,
    Stereoscopic = 5,
    SunSpots = 6,
    Trypophobia = 7,
    SuperNovaD = 8,
    SuperNovaE = 9,
    EndlessPit = 10,
    OrderedChaos = 11,
    AlienPhantasms = 12,
    AlienEtching = 13,
    AlienHieroglyphs = 14,
    Wormhole = 15,
    SpaceCarnival = 16,
    Coexistence = 17,
    HawkingRadiation = 18,
    Medusa = 19,
    QuadrupTwo = 20,
    NeonLights = 21,
    NeonSigns = 22,
    MathematicalSpecter = 23,
    OpticalIllusion = 24,
    VisualIllusion = 25,
    SlinkyWorms = 26,
    ObservableUniverse = 27,
    ParallelUniverse = 28,
    HostilePlanet = 29,
    CyberWarfare = 30,
    RaveDance = 31,
    SunBeams = 32,
    WaywardAi = 33,
    Threeply = 34,
    Fiesta = 35,
    WizardsTunnel = 36,
    GapingHole = 37,
    LeapOfFaith = 38,
    BreathingRoom = 39,
    NameMe = 40
}

let numSubsets: i32;
let numPoints: i32;
let scaleFactor: f32;
let iRadius: f32;
let oRadius: f32;
let lDep: f32;
let levelSpiral: f32;
let levelCount: i32;
let hotspotAvoidance: i32;

function nonZero(value: f32): f32 {
    if (iabs(value) < EPSILON) {
        return value < 0 ? -EPSILON : EPSILON;
    }

    return value;
}

function safeDiv(num: f32, den: f32): f32 {
    return num / nonZero(den);
}

function safeLogAbs(value: f32): f32 {
    return ilog(iabs(value) + EPSILON);
}

function legacySign(value: f32): f32 {
    return value > 0 ? 1.0 : -1.0;
}

function randScaled(subsetId: i32, plusOne: bool = false): f32 {
    const idx = plusOne ? subsetId + 1 : subsetId;

    return (((idx as f32) / 100.0) * (0.5 - nextR())) as f32;
}

function randRange(min: f32, max: f32): f32 {
    return min + nextR() * (max - min);
}

function getAttractorWeight(id: i32): f32 {
    return levelSettings[ATTRACTOR_WEIGHT_OFFSET + id];
}

function getDefaultAttractorWeight(id: i32): f32 {
    switch (id) {
        case AttractorId.Hopalong:
            return 100.0;
        default:
            return 0.0;
    }
}

function selectAttractor(): i32 {
    let exclusiveCount = 0;

    for (let idx = 0; idx < ATTRACTOR_COUNT; idx++) {
        if (getAttractorWeight(idx) >= 100.0) {
            exclusiveCount++;
        }
    }

    if (exclusiveCount > 0) {
        let pick = ifloor(nextR() * (exclusiveCount as f32));

        for (let idx = 0; idx < ATTRACTOR_COUNT; idx++) {
            if (getAttractorWeight(idx) >= 100.0) {
                if (pick === 0) {
                    return idx;
                }
                pick--;
            }
        }
    }

    let total = 0.0;

    for (let idx = 0; idx < ATTRACTOR_COUNT; idx++) {
        const weight = getAttractorWeight(idx);

        if (weight > 0.0) {
            total += weight;
        }
    }

    if (total <= 0.0) {
        for (let idx = 0; idx < ATTRACTOR_COUNT; idx++) {
            total += getDefaultAttractorWeight(idx);
        }

        if (total <= 0.0) {
            return AttractorId.Hopalong;
        }

        let target = nextR() * total;

        for (let idx = 0; idx < ATTRACTOR_COUNT; idx++) {
            target -= getDefaultAttractorWeight(idx);
            if (target <= 0.0) {
                return idx;
            }
        }

        return AttractorId.Hopalong;
    }

    let target = nextR() * total;

    for (let idx = 0; idx < ATTRACTOR_COUNT; idx++) {
        const weight = getAttractorWeight(idx);

        if (weight <= 0.0) {
            continue;
        }

        target -= weight;
        if (target <= 0.0) {
            return idx;
        }
    }

    return AttractorId.Hopalong;
}

function getPointDistance(x1: f32, y1: f32, x2: f32, y2: f32): f32 {
    const aDist = x1 - x2;
    const bDist = y1 - y2;

    return isqrt(aDist * aDist + bDist * bDist);
}

function clampF32(value: f32, minValue: f32, maxValue: f32): f32 {
    if (value < minValue) {
        return minValue;
    }

    if (value > maxValue) {
        return maxValue;
    }

    return value;
}

function hotspotCellIndex(pointX: f32, pointY: f32): i32 {
    const span = nonZero(scaleFactor * 2.0);
    let x = ifloor(
        clampF32(
            ((pointX + scaleFactor) / span) * (HOTSPOT_GRID_SIZE as f32),
            0.0,
            HOTSPOT_GRID_SIZE as f32 - 0.0001
        ) as f64
    );
    let y = ifloor(
        clampF32(
            ((pointY + scaleFactor) / span) * (HOTSPOT_GRID_SIZE as f32),
            0.0,
            HOTSPOT_GRID_SIZE as f32 - 0.0001
        ) as f64
    );

    if (x < 0) {
        x = 0;
    } else if (x >= HOTSPOT_GRID_SIZE) {
        x = HOTSPOT_GRID_SIZE - 1;
    }

    if (y < 0) {
        y = 0;
    } else if (y >= HOTSPOT_GRID_SIZE) {
        y = HOTSPOT_GRID_SIZE - 1;
    }

    return y * HOTSPOT_GRID_SIZE + x;
}

function hotspotVisibleCount(cellCount: i32, avgOccupied: f32, pressure: f32): i32 {
    if (cellCount <= 0) {
        return 0;
    }

    let crowdedMultiplier: f32 = 2.6;
    let minKeepRatio: f32 = 0.6;
    let pressureMultiplier: f32 = 1.0;

    if (hotspotAvoidance === HOTSPOT_MODE_AGGRESSIVE) {
        crowdedMultiplier = 1.7;
        minKeepRatio = 0.28;
        pressureMultiplier = 1.45;
    } else if (hotspotAvoidance === HOTSPOT_MODE_EXTREME) {
        crowdedMultiplier = 1.2;
        minKeepRatio = 0.1;
        pressureMultiplier = 1.95;
    }

    const crowdedLimit = avgOccupied * crowdedMultiplier;

    if ((cellCount as f32) <= crowdedLimit) {
        return cellCount;
    }

    const overflowRatio = crowdedLimit / (cellCount as f32);
    const effectivePressure = clampF32(
        pressure * pressureMultiplier,
        0.0,
        1.0
    );
    const keepRatio = clampF32(
        1.0 - effectivePressure * (1.0 - Math.max(minKeepRatio, overflowRatio) as f32),
        minKeepRatio,
        1.0
    );
    let visible = ifloor(((cellCount as f32) * keepRatio + 0.5) as f64);

    if (visible < 1) {
        visible = 1;
    } else if (visible > cellCount) {
        visible = cellCount;
    }

    return visible;
}

function compactHotspots(lData: Float32Array): i32 {
    if (hotspotAvoidance === HOTSPOT_MODE_OFF) {
        return numPoints;
    }

    const cellCounts = new Int32Array(HOTSPOT_GRID_CELL_COUNT);
    let occupiedCells = 0;
    let maxCellCount = 0;

    for (let idx = 0; idx < numPoints; idx++) {
        const bid = idx * DIMS;
        const cell = hotspotCellIndex(lData[bid], lData[bid + 1]);
        const next = cellCounts[cell] + 1;

        cellCounts[cell] = next;
        if (next === 1) {
            occupiedCells++;
        }
        if (next > maxCellCount) {
            maxCellCount = next;
        }
    }

    if (occupiedCells <= 0 || maxCellCount <= 0) {
        return numPoints;
    }

    const avgOccupied = (numPoints as f32) / (occupiedCells as f32);
    const severity = (maxCellCount as f32) / nonZero(avgOccupied);
    let severityStart: f32 = 5.0;

    if (hotspotAvoidance === HOTSPOT_MODE_AGGRESSIVE) {
        severityStart = 3.4;
    } else if (hotspotAvoidance === HOTSPOT_MODE_EXTREME) {
        severityStart = 2.3;
    }

    if (severity <= severityStart) {
        return numPoints;
    }

    const pressure = clampF32(
        (severity - severityStart) / nonZero(severity),
        0.0,
        1.0
    );
    const visiblePerCell = new Int32Array(HOTSPOT_GRID_CELL_COUNT);
    const keptPerCell = new Int32Array(HOTSPOT_GRID_CELL_COUNT);

    for (let cell = 0; cell < HOTSPOT_GRID_CELL_COUNT; cell++) {
        visiblePerCell[cell] = hotspotVisibleCount(
            cellCounts[cell],
            avgOccupied,
            pressure
        );
    }

    let writeIdx = 0;

    for (let idx = 0; idx < numPoints; idx++) {
        const bid = idx * DIMS;
        const cell = hotspotCellIndex(lData[bid], lData[bid + 1]);

        if (keptPerCell[cell] >= visiblePerCell[cell]) {
            continue;
        }

        if (writeIdx !== idx) {
            const writeBid = writeIdx * DIMS;

            lData[writeBid] = lData[bid];
            lData[writeBid + 1] = lData[bid + 1];
            lData[writeBid + 2] = lData[bid + 2];
        }

        keptPerCell[cell]++;
        writeIdx++;
    }

    return writeIdx;
}

class Point {

    constructor(public x: f32, public y: f32) {}

}

function rotatePoint(pX: f32, pY: f32, angle: f32): Point {
    const tmpCos = icos(angle);
    const tmpSin = isin(angle);
    const rotX = pX * tmpCos - pY * tmpSin;
    const rotY = pY * tmpCos + pX * tmpSin;

    return new Point(rotX, rotY);
}

function getRotationAngle(levelId: i32, subsetId: i32): f32 {
    if (levelSpiral === 0.0) {
        return DEFAULT_LEVEL_ROTATION;
    }

    const spiralRad = levelSpiral * DEG_TO_RAD;
    const subsetDivisor = numSubsets > 0 ? numSubsets as f32 : 1.0;

    return -((levelId as f32) * spiralRad + ((subsetId as f32) * spiralRad) / subsetDivisor);
}

const NOISE_STX_BASE: f32 = -30.0;
const NOISE_STX_OFFS_MULTIPLIER: f32 = 240.0;
const NOISE_STX_SCALE_MULTIPLIER_A: f32 = 1.0;
const NOISE_STX_SCALE_MULTIPLIER_B: f32 = 6.0;
const NOISE_STY_BASE: f32 = -20.0;
const NOISE_STY_OFFS_MULTIPLIER: f32 = 320.0;
const NOISE_STY_SCALE_MULTIPLIER_A: f32 = 1.0;
const NOISE_STY_SCALE_MULTIPLIER_B: f32 = 5.0;
const NOISE_TRIG_CHOICE_THRESHOLD: f32 = 0.4;
const NOISE_MIX_CHOICE_THRESHOLD_1: f32 = 0.8;
const NOISE_MIX_TRIG_CHOICE_THRESHOLD: f32 = 0.5;
const NOISE_MIX_CHOICE_THRESHOLD_2: f32 = 0.7;

function mix(a: f32, b: f32, interpolator: f32): f32 {
    return a + (b - a) * (interpolator % 1.0);
}

function helpNoise(stx: f32, sty: f32, offS: f32, scale: f32, choice1: f32, choice2: f32): f32 {
    stx = NOISE_STX_BASE + NOISE_STX_OFFS_MULTIPLIER * offS * choice1
        + (iabs(stx) / scale) * (NOISE_STX_SCALE_MULTIPLIER_A + NOISE_STX_SCALE_MULTIPLIER_B * choice2);
    sty = NOISE_STY_BASE + NOISE_STY_OFFS_MULTIPLIER * offS * choice2
        + (iabs(sty) / scale) * (NOISE_STY_SCALE_MULTIPLIER_A + NOISE_STY_SCALE_MULTIPLIER_B * choice1);

    return isqrt(stx * stx + sty * sty);
}

function makeNoise(stx: f32, sty: f32, offS: f32, scale: f32, choice1: f32, choice2: f32): f32 {
    let noitmp = helpNoise(stx, sty, offS, scale, choice1, choice2);

    noitmp = choice1 < NOISE_TRIG_CHOICE_THRESHOLD ? icos(noitmp) : isin(noitmp);
    let noires = noitmp;

    if (choice1 < NOISE_MIX_CHOICE_THRESHOLD_1) {
        noitmp = helpNoise(stx, sty, offS, scale, choice1, choice2);
        noitmp = choice1 < NOISE_MIX_TRIG_CHOICE_THRESHOLD ? icos(noitmp) : isin(noitmp);
        noires = mix(noires, noitmp, choice1);
    }

    if (choice2 < NOISE_MIX_CHOICE_THRESHOLD_2) {
        noitmp = helpNoise(stx, sty, offS, scale, choice1, choice2);
        noitmp = choice2 < NOISE_MIX_TRIG_CHOICE_THRESHOLD ? icos(noitmp) : isin(noitmp);
        noires = mix(noires, noitmp, choice2);
    }

    return noires;
}

function FractalGeometry(levelId: i32): Array<Float32Array | null> | null {
    if (lastData === null) {
        return null;
    }

    const al = levelSettings[6] + nextR() * (levelSettings[7] - levelSettings[6]);
    const bl = levelSettings[8] + nextR() * (levelSettings[9] - levelSettings[8]);
    const cl = levelSettings[10] + nextR() * (levelSettings[11] - levelSettings[10]);
    const dl = levelSettings[12] + nextR() * (levelSettings[13] - levelSettings[12]);
    const el = levelSettings[14] + nextR() * (levelSettings[15] - levelSettings[14]);
    const choice1 = nextR();
    const choice2 = nextR();
    const attractorId = selectAttractor();

    let maxX: f32 = 0.0;
    let minX: f32 = 0.0;
    let maxY: f32 = 0.0;
    let minY: f32 = 0.0;

    for (let s = 0; s < numSubsets; s++) {
        const lData = lastData![s];

        if (lData === null) {
            continue;
        }

        let currentX: f32 = randScaled(s, false);
        let currentY: f32 = randScaled(s, false);
        let currentT: f32 = randScaled(s, false);
        let currentZ: f32 = currentT;
        let currentF: f32 = 0.0;
        let currentTmp: f32 = 0.0;

        switch (attractorId) {
            case AttractorId.HopalongZen:
                currentT = 1.0;
                break;
            case AttractorId.FuturisticHUD:
                currentTmp = iatan(iabs(isin(al * currentX)));
                break;
            case AttractorId.Stereoscopic:
                currentX = randScaled(s, true);
                currentY = randScaled(s, true);
                currentF = randRange(-0.008, 0.008);
                currentTmp = isin(al - currentX);
                break;
            case AttractorId.Medusa:
                currentX = randScaled(s, true);
                currentY = randScaled(s, false);
                currentT = randScaled(s, true);
                break;
            case AttractorId.QuadrupTwo:
                currentX = randScaled(s, true);
                currentY = randScaled(s, true);
                break;
            case AttractorId.NeonLights:
            case AttractorId.NeonSigns:
            case AttractorId.MathematicalSpecter:
            case AttractorId.OpticalIllusion:
            case AttractorId.SlinkyWorms:
            case AttractorId.ObservableUniverse:
            case AttractorId.ParallelUniverse:
            case AttractorId.CyberWarfare:
            case AttractorId.SunBeams:
            case AttractorId.WaywardAi:
            case AttractorId.WizardsTunnel:
            case AttractorId.NameMe:
                currentX = randScaled(s, true);
                currentY = randScaled(s, true);
                currentT = randScaled(s, true);
                break;
            case AttractorId.HostilePlanet:
                currentX = randScaled(s, true);
                currentY = randScaled(s, true);
                currentT = randScaled(s, true);
                currentF = randRange(-0.002, 0.002);
                break;
            case AttractorId.RaveDance:
                currentX = randScaled(s, true);
                currentY = randScaled(s, true);
                currentT = randScaled(s, true);
                currentF = randRange(-0.008, 0.008);
                break;
            case AttractorId.VisualIllusion:
            case AttractorId.Fiesta:
                break;
            case AttractorId.Threeply:
            case AttractorId.GapingHole:
            case AttractorId.LeapOfFaith:
            case AttractorId.BreathingRoom:
                currentX = randScaled(s, true);
                currentY = randScaled(s, true);
                currentT = randScaled(s, true);
                break;
            default:
                if (
                    attractorId >= AttractorId.HostilePlanet
                    || attractorId === AttractorId.VisualIllusion
                    || attractorId === AttractorId.Fiesta
                ) {
                    currentX = randScaled(s, true);
                    currentY = randScaled(s, true);
                }
                break;
        }

        const angle = getRotationAngle(levelId, s);

        for (let idx = 0; idx < numPoints; idx++) {
            let nextX: f32 = currentX;
            let nextY: f32 = currentY;

            switch (attractorId) {
                case AttractorId.Hopalong:
                    nextX = currentY - legacySign(currentX) * (dl - isqrt(iabs(bl * currentX - cl))) + el;
                    nextY = al - currentX;
                    break;
                case AttractorId.HopalongMod1:
                    nextX = currentY - legacySign(currentX) * (dl + isqrt(isqrt(iabs(bl * currentX - cl)))) + el;
                    nextY = al - currentX;
                    break;
                case AttractorId.HopalongMod2:
                    nextX = currentY - legacySign(currentX) * (dl + ilog(2.0 + isqrt(iabs(bl * currentX - cl)))) + el;
                    nextY = al - currentX;
                    break;
                case AttractorId.HopalongZen:
                    nextX = currentY - legacySign(currentX)
                        * isqrt(iabs(currentX - safeDiv(cl * currentT, currentY + bl * currentT)));
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.FuturisticHUD:
                    nextX = currentY - legacySign(currentX) * (currentTmp * isqrt(iabs(bl * currentX - cl)));
                    nextY = al - currentX - isin(currentTmp);
                    break;
                case AttractorId.Stereoscopic:
                    currentTmp = iatan(currentTmp);
                    nextX = currentY - legacySign(currentX)
                        * (1.0 - currentTmp + isqrt(iabs(bl * currentX - dl)) + safeDiv(currentF + el, currentTmp));
                    nextY = al - currentX - currentTmp;
                    break;
                case AttractorId.SunSpots:
                    nextX = currentY + dl + safeDiv(isin(bl * currentX - cl), currentY - bl + 1.0);
                    nextY = al - currentX;
                    break;
                case AttractorId.Trypophobia:
                    nextX = currentY + safeDiv(iabs(bl * currentX - dl), currentX - al);
                    nextY = al - currentX;
                    break;
                case AttractorId.SuperNovaD:
                    currentZ = iabs(icos(cl * currentT - bl) * iatan(safeDiv(currentX, currentZ)));
                    nextX = currentY + iabs(currentZ);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.SuperNovaE:
                    currentZ = iabs(
                        icos(cl * currentT - bl)
                        * iatan(safeDiv(iabs(currentX + cl * currentY), currentY * currentX))
                    );
                    nextX = currentY + currentZ;
                    nextY = al - currentX;
                    currentT += el;
                    break;
                case AttractorId.EndlessPit:
                    currentZ = iabs(
                        icos(cl * currentT - bl)
                        * iatan(safeDiv(currentX, cl + currentY * currentT))
                    );
                    nextX = currentY + currentZ;
                    nextY = al - currentX;
                    break;
                case AttractorId.OrderedChaos:
                    currentZ = iabs(icos(currentT - bl) * iatan(currentX * al));
                    nextX = currentY - iabs(currentZ) + cl;
                    nextY = cl - currentX;
                    currentT += dl;
                    break;
                case AttractorId.AlienPhantasms:
                    currentZ = iabs(iatan(currentX - cl * isin(currentX)));
                    nextX = currentY - iabs(currentZ);
                    nextY = al - currentX;
                    break;
                case AttractorId.AlienEtching:
                    currentZ = iabs(iatan(currentX - al * bl * isin(currentX)));
                    nextX = currentY - iabs(currentZ);
                    nextY = cl - currentX;
                    break;
                case AttractorId.AlienHieroglyphs:
                    currentZ = iabs(iatan(currentX - al * al * isin(currentX)));
                    nextX = currentY - iabs(currentZ);
                    nextY = cl - currentX;
                    break;
                case AttractorId.Wormhole:
                    currentZ = iabs(iatan(currentX * iatan(currentX * currentY + bl)));
                    nextX = currentY - iabs(currentZ);
                    nextY = al - currentX;
                    break;
                case AttractorId.SpaceCarnival:
                    currentZ = iabs(
                        iatan(currentX * iatan(safeDiv(currentX + currentX, currentY)) + isin(currentT))
                    );
                    nextX = currentY - iabs(currentZ);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.Coexistence:
                    currentZ = iabs(
                        iatan(
                            currentX * iatan(safeDiv(currentX * bl, currentY + 1.0) - cl * currentT)
                        )
                    );
                    nextX = currentY - iabs(currentZ);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.HawkingRadiation:
                    currentZ = isin(safeDiv(currentT - bl * currentY, currentY * al - currentZ));
                    nextX = currentY + legacySign(currentX) * currentZ;
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.Medusa:
                    currentZ = iatan(safeDiv(cl + currentX, currentT + cl))
                        + safeDiv(bl, currentY - dl)
                        + safeDiv(el * currentX, cl);
                    nextX = currentY - currentZ;
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.QuadrupTwo:
                    currentTmp = iabs(cl * currentX - bl);
                    nextX = currentY
                        - legacySign(currentX) * isin(safeLogAbs(bl * currentX - cl))
                        * iatan(currentTmp * currentTmp)
                        + safeDiv(el, currentY);
                    nextY = al - currentX;
                    break;
                case AttractorId.NeonLights:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        + legacySign(currentX) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        + safeDiv(el, currentY);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.NeonSigns:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        + legacySign(currentY) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        + safeDiv(el, currentY);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.MathematicalSpecter:
                    currentTmp = safeLogAbs(cl * currentT - bl);
                    nextX = currentY
                        + legacySign(currentX) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        + icos(cl * currentT)
                        + safeDiv(el, currentY);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.OpticalIllusion:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        - legacySign(currentX) * isin(safeLogAbs(bl * currentX - cl))
                        * iatan(currentTmp * currentTmp)
                        + safeDiv(el, currentTmp);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.VisualIllusion:
                    currentTmp = iabs(isin(currentX) * icos(bl) + al - safeDiv(currentX * isin(cl + bl), currentY));
                    nextX = currentY - legacySign(currentX) * currentTmp + safeDiv(el, currentX);
                    nextY = cl - currentX;
                    currentT += dl;
                    break;
                case AttractorId.SlinkyWorms:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        - legacySign(currentX) * isin(safeLogAbs(bl * currentX - cl))
                        * iatan(currentTmp * currentTmp)
                        * isin(currentTmp)
                        + safeDiv(el * currentX, currentY);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.ObservableUniverse:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        - legacySign(currentX) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        * isin(currentTmp);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.ParallelUniverse:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        + legacySign(currentX) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        * isin(currentTmp)
                        - safeDiv(el, currentTmp);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.HostilePlanet:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        + legacySign(currentX) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        * isin(currentTmp)
                        - currentF * currentTmp;
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.CyberWarfare:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        - legacySign(currentX) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        * isqrt(currentTmp)
                        + safeDiv(el, currentY);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.RaveDance:
                    currentTmp = iabs(cl * currentT - bl);
                    nextX = currentY
                        - legacySign(currentX) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        * isqrt(currentTmp)
                        + currentF * currentTmp;
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.SunBeams:
                    currentTmp = iabs(cl * currentX - bl);
                    nextX = currentY
                        - legacySign(currentX) * isin(safeLogAbs(bl * currentT - cl))
                        * iatan(currentTmp * currentTmp)
                        * isqrt(currentTmp)
                        + safeDiv(el + 0.05, currentTmp);
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.WaywardAi:
                    currentTmp = iabs(cl * currentX - bl);
                    nextX = currentY
                        - legacySign(currentX)
                        * (isin(safeLogAbs(bl * currentT - cl)) + bl)
                        * iatan(currentTmp * currentTmp)
                        - el;
                    nextY = al - currentX;
                    currentT += dl;
                    break;
                case AttractorId.Threeply:
                    nextX = currentY
                        - legacySign(currentX)
                        * iabs(isin(currentX) * icos(bl) + al - currentX * isin(cl + bl + al))
                        + safeDiv(el + 0.001, currentX);
                    nextY = cl - currentX;
                    break;
                case AttractorId.Fiesta:
                    currentTmp = iabs(isin(currentX) * icos(bl) + al - safeDiv(currentX * isin(cl + bl), currentX));
                    nextX = currentY - legacySign(currentX) * currentTmp + safeDiv(el, currentX);
                    nextY = cl - currentX;
                    currentT += dl;
                    break;
                case AttractorId.WizardsTunnel:
                    currentTmp = iabs(isin(currentX) * icos(al));
                    nextX = currentY + legacySign(currentX)
                        + iatan(currentTmp * currentTmp) * isin(currentX * currentTmp)
                        + safeDiv(cl, al);
                    nextY = bl - currentX;
                    currentT += dl;
                    break;
                case AttractorId.GapingHole:
                    nextX = currentY + isqrt(iabs(bl * currentX - cl)) + el;
                    nextY = al - currentX;
                    break;
                case AttractorId.LeapOfFaith:
                    nextX = currentY + dl + isin(bl * currentX - cl) + safeDiv(el, currentX);
                    nextY = al - currentX;
                    break;
                case AttractorId.BreathingRoom:
                    currentTmp = iabs(isin(currentX + cl) * icos(currentX + al));
                    nextX = currentY + 1.0 + iatan(currentTmp) * isin(currentX * currentTmp);
                    nextY = bl - currentX;
                    break;
                case AttractorId.NameMe:
                    currentTmp = iabs(isin(currentX) * icos(bl) + al - safeDiv(currentX * isin(cl + bl), currentT));
                    nextX = currentY - legacySign(currentX) * currentTmp + safeDiv(el, currentTmp);
                    nextY = cl - currentX;
                    currentT += dl;
                    break;
                default:
                    nextX = currentY - legacySign(currentX) * (dl - isqrt(iabs(bl * currentX - cl))) + el;
                    nextY = al - currentX;
                    break;
            }

            currentX = nextX;
            currentY = nextY;

            const rotated = rotatePoint(nextX, nextY, angle);
            const bid = idx * DIMS;

            if (rotated.x < minX) {
                minX = rotated.x;
            } else if (rotated.x > maxX) {
                maxX = rotated.x;
            }

            if (rotated.y < minY) {
                minY = rotated.y;
            } else if (rotated.y > maxY) {
                maxY = rotated.y;
            }

            lData[bid] = rotated.x;
            lData[bid + 1] = rotated.y;
        }
    }

    const xRange = nonZero(maxX - minX);
    const yRange = nonZero(maxY - minY);
    const scaleX = (SCALE_NORMALIZATION_FACTOR * scaleFactor) / xRange;
    const scaleY = (SCALE_NORMALIZATION_FACTOR * scaleFactor) / yRange;
    const ldnum = lDep / (numSubsets as f32);

    for (let s = 0; s < numSubsets; s++) {
        const lData = lastData![s];

        if (lData === null) {
            continue;
        }

        const tmpSet = ((levelId * numSubsets + s) as f32) / SUBSET_Z_OFFSET_DIVISOR;

        for (let idx = 0; idx < numPoints; idx++) {
            const bid = idx * DIMS;
            let pointX = scaleX * (lData[bid] - minX) - scaleFactor;
            let pointY = scaleY * (lData[bid + 1] - minY) - scaleFactor;

            if (iRadius > 0.0) {
                const dist = getPointDistance(0.0, 0.0, pointX, pointY) / scaleFactor;

                if (dist < iRadius) {
                    const scaling = nonZero(dist / iRadius);
                    const outer = scaling / nonZero(oRadius);

                    pointX = pointX / scaling + pointX * outer;
                    pointY = pointY / scaling + pointY * outer;
                }
            }

            lData[bid] = pointX;
            lData[bid + 1] = pointY;
            lData[bid + 2] = makeNoise(pointX, pointY, tmpSet, scaleFactor, choice1, choice2) * ldnum;

            if (s % 2 === 1) {
                lData[bid + 2] = ldnum - lData[bid + 2] * SUBSET_Z_INVERSION_FACTOR;
            }
        }

        visibleCounts[s] = compactHotspots(lData);
    }

    return lastData;
}

export const levelSettings = new Float32Array(62);
levelSettings.fill(0.0);

let lastData: Array<Float32Array | null> | null = null;

export let visibleCounts = new Int32Array(0);

// noinspection JSUnusedGlobalSymbols
export function update(): void {
    numSubsets = ifloor(levelSettings[1]);
    numPoints = ifloor(levelSettings[2]);
    scaleFactor = levelSettings[3];
    iRadius = levelSettings[4] / 100;
    oRadius = levelSettings[5] / 100;
    baseSeed = levelSettings[16];
    lDep = levelSettings[17];
    levelSpiral = levelSettings[18];
    levelCount = ifloor(levelSettings[19]);
    hotspotAvoidance = ifloor(levelSettings[61]);

    lastData = new Array<Float32Array | null>(numSubsets);
    visibleCounts = new Int32Array(numSubsets);
    if (lastData !== null) {
        for (let s = 0; s < numSubsets; s++) {
            lastData![s] = new Float32Array(numPoints * DIMS);
            visibleCounts[s] = numPoints;
        }
    }
}

// noinspection JSUnusedGlobalSymbols
export function build(id: i32): Array<Float32Array | null> | null {
    resetSeed(id);

    return FractalGeometry(id);
}

// noinspection JSUnusedGlobalSymbols
export const Copyright_by_hexxone: bool = true;
