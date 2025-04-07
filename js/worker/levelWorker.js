/**
 * @author D.Thiele @https://hexx.one
 * 
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * AudiOrbits level-generator worker.
 */

var po = {
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
const fracs = [
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
    Coexistance,
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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
    bid = 0;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            x1 = (y - sgn(x) * (d + Math.sqrt(Math.sqrt(Math.abs(b * x - c))))) + e;
            y1 = a - x;

            // process x size
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;

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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    d = po.dl;
    e = po.el
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    c = po.cl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    c = po.cl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}

function Coexistance(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;
    let x, y;
    let a, b;
    let c, d;
    let z;

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl; // Change to make more stuff happen near center
    c = po.cl;
    d = po.dl;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

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

    a = po.al;
    b = po.bl;
    c = po.cl;
    d = po.dl;
    e = po.el;
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
            po.xMin = (x < po.xMin) ? x : po.xMin;
            po.xMax = (x > po.xMax) ? x : po.xMax;
            // process y size
            po.yMin = (y < po.yMin) ? y : po.yMin;
            po.yMax = (y > po.yMax) ? y : po.yMax;

            xyzBuff[bid] = x = x1;
            xyzBuff[bid + 1] = y = y1;
            bid += 2;
        }
    }
}


onmessage = function (e) {
    // what I need:
    let eventData = e.data;
    let sett = eventData.settings;
    let levelId = eventData.id;
    let fc = eventData.frac;
    let fcLen = fc.length;

    // get local vars
    let num_subsets = sett.num_subsets_per_level;
    let num_points_subset = sett.num_points_per_subset;

    // create a buffer thats big enough to hold the x,y,z corrdinate
    // of all subsets * points of the level.
    // may seem ridiclous, but is actually the fastest way to transfer.
    let xyzBuff = new Float32Array(num_subsets * num_points_subset * 2);

    let scale_factor_l = sett.scaling_factor;
    let tunnel = sett.generate_tunnel;
    let iradius = sett.tunnel_inner_radius / 100;
    let oradius = sett.tunnel_outer_radius / 100;
    // get randomized params in defined ranges
    po.al = sett.alg_a_min + Math.random() * (sett.alg_a_max - sett.alg_a_min);
    po.bl = sett.alg_b_min + Math.random() * (sett.alg_b_max - sett.alg_b_min);
    po.cl = sett.alg_c_min + Math.random() * (sett.alg_c_max - sett.alg_c_min);
    po.dl = sett.alg_d_min + Math.random() * (sett.alg_d_max - sett.alg_d_min);
    po.el = sett.alg_e_min + Math.random() * (sett.alg_e_max - sett.alg_e_min);
    // some stuff needed in the subset generation loop
    po.xMin = 0, po.xMax = 0, po.yMin = 0, po.yMax = 0;
    let choice = Math.random();
    let s, x, y, i, bid;
    // Grab an Attractor based on choice
    for (i = 0; i < fcLen; i++) {
        if (choice < fc[i][0]) {
            fracs[fc[i][1]](num_subsets, num_points_subset, xyzBuff);
            break;
        }
    }
    if (i == fcLen) {
        // Did not select a frac. Default to GapingHole since it's pretty empty
        GapingHole(num_subsets, num_points_subset, xyzBuff);
    }

    // calculate level scale based on min and max values
    let scaleX = 2 * scale_factor_l / (po.xMax - po.xMin);
    let scaleY = 2 * scale_factor_l / (po.yMax - po.yMin);

    // small helper
    let getPointDistance = function (x1, y1, x2, y2) {
        let a = x1 - x2;
        let b = y1 - y2;
        return Math.sqrt(a * a + b * b);
    };

    // Normalize and post-process the level          
    let dist, scaling, outer;
    bid = 0;
    for (s = 0; s < num_subsets; s++) {
        for (i = 0; i < num_points_subset; i++) {
            // re-scale x position
            x = scaleX * (xyzBuff[bid] - po.xMin) - scale_factor_l;
            // re-scale y position
            y = scaleY * (xyzBuff[bid + 1] - po.yMin) - scale_factor_l;
            // tunnel processing to take certain points from the center
            // and move them outwards in a circular way
            if (tunnel) {
                dist = getPointDistance(0, 0, x, y) / scale_factor_l;
                //print("pd: " + dist + ",   inner: " + iradius);
                if (dist < iradius) {
                    scaling = dist / iradius;
                    outer = scaling / oradius;
                    x = x / scaling + x * outer;
                    y = y / scaling + y * outer;
                }
            }
            xyzBuff[bid] = x;
            xyzBuff[bid + 1] = y;
            bid += 2;
        }
    }
    // done, post calculated object
    let levelObj = {
        id: levelId,
        xyzBuff: xyzBuff.buffer,
    }
    self.postMessage(levelObj, [levelObj.xyzBuff]);
};