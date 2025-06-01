/**
 * @author hexxone / https://hexx.one
 * @author ssaenger / https://github.com/ssaenger
 * 
 * @license
 * Copyright (c) 2025 hexxone All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * AudiOrbits level-generator worker.
 *
 * Special thanks to @ssaenger for his contribution of >30 fractal algorithms!
 */

var params = {
    xMin: 0,
    xMax: 0,
    yMin: 0,
    yMax: 0,
    al: 0,
    bl: 0,
    cl: 0,
    dl: 0,
    el: 0
}

// 42 fractal functions
const fractalFunctions = [
    Hopalong,
    HopalongMod1,
    HopalongMod2,
    HopalongZen,
    FuturisticHUD,
    Stereoscopic,
    SunSpots,
    Trypophobia,
    SuperNovaD,
    SuperNovaE,
    EndlessPit,
    OrderedChaos,
    AlienPhantasms,
    AlienEtching,
    AlienHieroglyphs,
    Wormhole,
    SpaceCarnival,
    Coexistence,
    HawkingRadiation,
    Medusa,
    QuadrupTwo,
    NeonLights,
    NeonSigns,
    MathematicalSpecter,
    OpticalIllusion,
    VisualIllusion,
    SlinkyWorms,
    ObservableUniverse,
    ParallelUniverse,
    HostilePlanet,
    CyberWarfare,
    RaveDance,
    SunBeams,
    WaywardAi,
    Threeply,
    Fiesta,
    WizardsTunnel,
    GapingHole,
    LeapOfFaith,
    BreathingRoom,
    NameMe,
    EasterEgg
];

function sgn(t) {
    return (t > 0) ? 1 : (t < 1) ? -1 : 0;
}

function Hopalong(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1
    let bid;
    let x, y;
    let a, b, c, d, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            x1 = (y - sgn(x) * (d - (Math.sqrt(Math.abs(b * x - c))))) + e;
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            // set x coordinate
            xyzBuff[bid] = x = x1;
            // set y coordinate
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function HopalongMod1(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1;
    let bid;
    let x, y;
    let a, b, c, d, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            x1 = (y - sgn(x) * (d + Math.sqrt(Math.sqrt(Math.abs(b * x - c))))) + e;
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            // set x coordinate
            xyzBuff[bid] = x = x1;
            // set y coordinate
            xyzBuff[bid + 1] = y = y1;
            bid += 2;

        }
    }
}

function HopalongMod2(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1;
    let bid;
    let x, y;
    let a, b, c, d, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            x1 = (y - sgn(x) * (d + Math.log(2 + Math.sqrt(Math.abs(b * x - c))))) + e;
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            // set x coordinate
            xyzBuff[bid] = x = x1;
            // set y coordinate
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}


function HopalongZen(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());
        t = 1;
        //print({al,bl,cl,dl,el});
        for (i = 0; i < numPointsSub; i++) {
            x1 = y - sgn(x) * ((Math.sqrt(Math.abs((x - c * t / (y + b * t))))));
            y1 = a - x;
            t = t + d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            // calculate x buffer location
            bid = (s * numPointsSub + i) * 2;
            // set x coordinate
            xyzBuff[bid] = x = x1;
            // set y coordinate
            xyzBuff[bid + 1] = y = y1;
        }
    }
}


function FuturisticHUD(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());

        tmp = Math.abs(Math.sin(a * x));
        tmp = Math.atan(tmp);
        for (i = 0; i < numPointsSub; i++) {
            x1 = y - sgn(x) * (tmp * (Math.sqrt(Math.abs(b * x - c))));
            y1 = a - x - Math.sin(tmp);

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            // set x coordinate
            xyzBuff[bid] = x = x1;
            // set y coordinate
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

// Called stereoscopic simply because there were some shapes that perceived to have depth
function Stereoscopic(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, d, e, f;
    let tmp;

    a = params.al;
    b = params.bl;
    d = params.dl;
    e = params.el
     // f param. Random number between -0.008 and 0.008
     f = -0.008 + Math.random() * (0.008 + 0.008);
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());

        tmp = Math.sin(a - x);
        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.atan(tmp);
            x1 = y - sgn(x) * (1 - tmp + (Math.sqrt(Math.abs(b * x - d))) + (f + e)/ tmp) ;
            y1 = a - x - tmp;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            // set x coordinate
            xyzBuff[bid] = x = x1;
            // set y coordinate
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function SunSpots(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c, d;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            x1 = y + d + (Math.sin(b * x - c) / (y - b + 1));
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            // set x coordinate
            xyzBuff[bid] = x = x1;
            // set y coordinate
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}


function Trypophobia(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, d;

    a = params.al;
    b = params.bl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            x1 = y + (Math.abs(b * x - d) / (x - a));
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function SuperNovaD(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c, d;
    let z, t;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());
        z = t;

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.cos(c * t - b) * Math.atan(x / z));
            x1 = y + Math.sqrt(z * z);
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}


function SuperNovaE(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c, e;
    let z, t;

    a = params.al;
    b = params.bl;
    c = params.cl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());
        z = t;

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.cos(c * t - b) * Math.atan(Math.abs(x + c * y)/ (y * x)));
            x1 = y + z;
            y1 = a - x;
            t += e;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function EndlessPit(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c;
    let z, t;

    a = params.al;
    b = params.bl;
    c = params.cl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());
        z = t;

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.cos(c * t - b) * Math.atan((x)/ (c + y * t)));
            x1 = y + z;
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function OrderedChaos(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c;
    let z, t;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.cos(t - b) * Math.atan(x * a));
            x1 = y - Math.sqrt(z * z) + c;
            y1 = c - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function AlienPhantasms(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, c;
    let z;

    a = params.al;
    c = params.cl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.atan(x - c * Math.sin(x)));
            x1 = y - Math.sqrt(z * z);
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function AlienEtching(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b;
    let c;
    let z;

    a = params.al;
    b = params.bl;
    c = params.cl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.atan(x - a * b * Math.sin(x)));
            x1 = y - Math.sqrt(z * z);
            y1 = c - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function AlienHieroglyphs(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, c;
    let z;

    a = params.al;
    c = params.cl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.atan(x - a * a * Math.sin(x)));
            x1 = y - Math.sqrt(z * z);
            y1 = c - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function Wormhole(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, d;
    let z;

    a = params.al;
    b = params.bl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.atan((x) * Math.atan(x * y + b)));
            x1 = y - Math.sqrt(z * z);
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function SpaceCarnival(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, d;
    let z;

    a = params.al;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.atan((x) * Math.atan((x + x) / (y)) + Math.sin(t)));
            x1 = y - Math.sqrt(z * z);
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function Coexistence(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b;
    let c, d;
    let z;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            z = Math.abs(Math.atan((x) * Math.atan((x * b) / (y + 1) - c * t)));
            x1 = y - Math.sqrt(z * z);
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function HawkingRadiation(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, d;
    let z, t;

    a = params.al;
    b = params.bl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = s / 100 * (0.5 - Math.random());
        z = d;

        for (i = 0; i < numPointsSub; i++) {
            z = (Math.sin((t - b * y) / (y * a - z)));
            x1 = y + sgn(x) * z;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function Medusa(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c, d, e;
    let z;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            z = Math.atan((c + x) / (t + c)) + b / (y - d) + (e * x / c);
            x1 = y - z;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function QuadrupTwo(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * x - b);
            x1 = y - sgn(x) * Math.sin(Math.log(Math.abs(b * x - c))) * Math.atan(tmp * tmp) + e / y;
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function NeonLights(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y + sgn(x) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) + e / y;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function NeonSigns(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y + sgn(y) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) + e / y;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function MathematicalSpecter(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.log(Math.abs(c * t - b));
            x1 = y + sgn(x) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) + Math.cos(c * t) + e / y;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function OpticalIllusion(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y - sgn(x) * Math.sin(Math.log(Math.abs(b * x - c))) * Math.atan(tmp * tmp) + e / tmp;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function VisualIllusion(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let tmp;
    let a, b, c, d, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(Math.sin(x) * Math.cos(b) + a - x * Math.sin(c + b) / y);
            x1 = y - sgn(x) * tmp + e / x;
            y1 = c - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}


function SlinkyWorms(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y - sgn(x) * Math.sin(Math.log(Math.abs(b * x - c))) * Math.atan(tmp * tmp) * Math.sin(tmp) + e * x / y;
            tmp = Math.cos(b * x);
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function ObservableUniverse(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y - sgn(x) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) * Math.sin(tmp);
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function ParallelUniverse(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y + sgn(x) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) * Math.sin(tmp) - e / tmp;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function HostilePlanet(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, f;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
     // f param. Random number between -0.002 and 0.002
     // 0 = is like the universe attractor. Too big of a value is just a verticle line
     // down the middle. Staying close to 0 splits the verticle line into many lines, and adds
     // different effects into the mix. It looks like a jungle with alien lifeforms,
     // hence the name Hostile Planet.
    f = -0.002 + Math.random() * (0.002 + 0.002);
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y + sgn(x) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) * Math.sin(tmp) - f * tmp;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

// Cyber warefare that turns into fireworks as e goes up
function CyberWarfare(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y - sgn(x) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) * Math.sqrt(tmp) + e / y;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

// Lights shine from above for the most part. Spotlights from the sides and below
function RaveDance(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, f;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    // f param between -0.008 and 0.008
    // Like HostilePlanet, too high turns just into a single line down middle.
    // 0 = CyberWarefare. Close to 0 is a Rave Dance with lights
    // shinning in every direction.
    f = -0.008 + Math.random() * (0.008 + 0.008);
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(c * t - b);
            x1 = y - sgn(x) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) * Math.sqrt(tmp) + f * tmp;
            y1 = a - x;
            t = t + d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function SunBeams(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            tmp = Math.abs(c * x - b);
            x1 = y - sgn(x) * Math.sin(Math.log(Math.abs(b * t - c))) * Math.atan(tmp * tmp) * Math.sqrt(tmp) + (e + 0.05) / tmp;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function WaywardAi(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d, e;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            tmp = Math.abs(c * x - b);
            x1 = y - sgn(x) * (Math.sin(Math.log(Math.abs(b * t - c))) + b) * Math.atan(tmp * tmp) - e;
            y1 = a - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function Threeply(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            x1 = y - sgn(x) * Math.abs(Math.sin(x) * Math.cos(b) + a - x * Math.sin( c + b + a)) + (e + 0.001) / x;
            y1 = c - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function Fiesta(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let tmp;
    let a, b, c, d, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(Math.sin(x) * Math.cos(b) + a - x * Math.sin(c + b) / x);
            x1 = y - sgn(x) * tmp + e / x;
            y1 = c - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function WizardsTunnel(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d;
    let tmp;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(Math.sin(x) * Math.cos(a));
            x1 = y + sgn(x) + Math.atan(tmp * tmp) * Math.sin(x * tmp) + c / a;
            y1 = b - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}


function GapingHole(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            x1 = (y + Math.sqrt(Math.abs(b * x - c))) + e;
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

// Called Leap of Faith in reference to the first step in moving forward.
// This was my first AudiOrbit Orbital modification.
function LeapOfFaith(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b, c, d, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1)/ 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            x1 = y + d + Math.sin(b * x - c) + e / x;
            y1 = a - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}



// A moment of reprieve where not much happens near center.
function BreathingRoom(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let a, b, c, d;

    a = params.al;
    b = params.bl; // Change to make more stuff happen near center
    c = params.cl;
    d = params.dl;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(Math.sin(x + c) * Math.cos(x + a));
            x1 = y + sgn(1) + Math.atan(tmp) * Math.sin(x * tmp);
            y1 = b - x;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

// Letting community name this one
function NameMe(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let tmp;
    let a, b, c, d, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s + 1) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(Math.sin(x) * Math.cos(b) + a - x * Math.sin(c + b) / t);
            x1 = y - sgn(x) * tmp + e / tmp;
            y1 = c - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function EasterEgg(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y, t;
    let tmp;
    let a, b, c, d, e;

    a = params.al;
    b = params.bl;
    c = params.cl;
    d = params.dl;
    e = params.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        x = (s + 1) / 100 * (0.5 - Math.random());
        y = (s + 1) / 100 * (0.5 - Math.random());
        t = (s) / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            tmp = Math.abs(Math.sin(x) * Math.cos(t) + a - x * Math.sin(c + b));
            x1 = y - sgn(1) * tmp + e / tmp;
            y1 = c - x;
            t += d;

            // process x size
            params.xMin = (x < params.xMin) ? x : params.xMin;
            params.xMax = (x > params.xMax) ? x : params.xMax;
            // process y size
            params.yMin = (y < params.yMin) ? y : params.yMin;
            params.yMax = (y > params.yMax) ? y : params.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

onmessage = function (e) {
    const eventData = e.data;
    const sett = eventData.settings;
    const levelId = eventData.id;
    const fractalChoices = eventData.frac;

    // get local vars
    const num_subsets = sett.num_subsets_per_level;
    const num_points_subset = sett.num_points_per_subset;
    const numSubsets = sett.num_subsets_per_level;
    const numPointsSubset = sett.num_points_per_subset;
    const scaleFactor = sett.scaling_factor;
    const tunnel = sett.generate_tunnel;
    const innerRadius = sett.tunnel_inner_radius / 100;
    const outerRadius = sett.tunnel_outer_radius / 100;

    // Create output buffer
    const xyzBuff = new Float32Array(num_subsets * num_points_subset * 2);

    // Initialize parameters with random values in the specified ranges
    params.a = getRandomInRange(sett.alg_a_min, sett.alg_a_max);
    params.b = getRandomInRange(sett.alg_b_min, sett.alg_b_max);
    params.c = getRandomInRange(sett.alg_c_min, sett.alg_c_max);
    params.d = getRandomInRange(sett.alg_d_min, sett.alg_d_max);
    params.e = getRandomInRange(sett.alg_e_min, sett.alg_e_max);

    // Reset min/max values
    params.xMin = params.xMax = params.yMin = params.yMax = 0;

    const choice = Math.random();
    let selectedFractal = false;

    // Grab an Attractor based on choice
    for (let i = 0; i < fractalChoices.length; i++) {
        if (choice < fractalChoices[i][0]) {
            // Execute the selected fractal function
            fractalFunctions[fractalChoices[i][1]](num_subsets, num_points_subset, xyzBuff);
            selectedFractal = true;

            break;
        }
    }

    // Default to a fallback fractal if none selected
    if (!selectedFractal) {
        GapingHole(num_subsets, num_points_subset, xyzBuff);
    }

    // Scale and normalize the coordinates
    normalizeCoordinates(xyzBuff, numSubsets, numPointsSubset, scaleFactor, tunnel, innerRadius, outerRadius);

    sendLevelData(levelId, xyzBuff.buffer);
};


/**
 * Get a random number within a specified range
 */
function getRandomInRange(min, max) {
    return min + Math.random() * (max - min);
}


/**
 * Calculate distance between two points
 */
function getPointDistance(x1, y1, x2, y2) {
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.sqrt(a * a + b * b);
}

/**
 * Normalize coordinates to the proper scale for rendering
 */
function normalizeCoordinates(buffer, numSubsets, numPointsSubset, scaleFactor, tunnel, innerRadius, outerRadius) {
    // Calculate scale based on min/max values
    const scaleX = 2 * scaleFactor / (params.xMax - params.xMin);
    const scaleY = 2 * scaleFactor / (params.yMax - params.yMin);

    let bid = 0;
    for (let s = 0; s < numSubsets; s++) {
        for (let i = 0; i < numPointsSubset; i++) {
            // Scale the coordinates
            let x = scaleX * (buffer[bid] - params.xMin) - scaleFactor;
            let y = scaleY * (buffer[bid + 1] - params.yMin) - scaleFactor;

            // Apply tunnel effect if enabled
            if (tunnel) {
                const dist = getPointDistance(0, 0, x, y) / scaleFactor;
                if (dist < innerRadius) {
                    const scaling = dist / innerRadius;
                    const outer = scaling / outerRadius;
                    x = x / scaling + x * outer;
                    y = y / scaling + y * outer;
                }
            }

            // Store scaled coordinates
            buffer[bid] = x;
            buffer[bid + 1] = y;
            bid += 2;
        }
    }
}

/**
 * Uses chunking to send the level data in smaller arrays for less thread-blocking.
 * @param levelId
 * @param buffer
 */
function sendLevelData(levelId, buffer) {
    // Configure chunk size
    const CHUNK_SIZE = 100000; // 100KB in bytes
    const totalSize = buffer.byteLength;

    // For small buffers, send in one piece
    if (totalSize <= CHUNK_SIZE) {
        self.postMessage({
            id: levelId,
            complete: true,
            xyzBuff: buffer
        }, [buffer]);
        return;
    }

    // For large buffers, send in chunks
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
    const float32View = new Float32Array(buffer);

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE / Float32Array.BYTES_PER_ELEMENT;
        const end = Math.min(
            start + CHUNK_SIZE / Float32Array.BYTES_PER_ELEMENT,
            buffer.byteLength / Float32Array.BYTES_PER_ELEMENT
        );

        // Create a slice of the buffer
        const chunk = float32View.slice(start, end);

        self.postMessage({
            id: levelId,
            chunkIndex: i,
            totalChunks: totalChunks,
            totalSize: totalSize,
            chunkData: chunk.buffer,
            complete: false
        }, [chunk.buffer]);
    }
}
