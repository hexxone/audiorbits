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
    x: 0,
    y: 0,
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

function BarryMartinClassic(numSub, numPointsSub, xyzBuff) {
    let s, i, z, x1, bid;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        po.x = s / 100 * (0.5 - Math.random());
        po.y = s / 100 * (0.5 - Math.random());
        //print({al,bl,cl,dl,el});
        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            z = (po.dl + (Math.sqrt(Math.abs(po.bl * po.x - po.cl))));

            if (po.x > 0) x1 = po.y - z;
            else if (po.x == 0) x1 = po.y;
            else x1 = po.y + z;

            // process x size
            if (po.x < po.xMin) po.xMin = po.x;
            else if (po.x > po.xMax) po.xMax = po.x;
            // process y size
            if (po.y < po.yMin) po.yMin = po.y;
            else if (po.y > po.yMax) po.yMax = po.y;

            // calculate x buffer location
            bid = (s * numPointsSub + i) * 2;
            // set y coordinate first
            xyzBuff[bid + 1] = po.y = po.al - po.x;
            // set x coordinate
            xyzBuff[bid] = po.x = x1 + po.el;
        }
    }
}

function BarryMartinClassicInv(numSub, numPointsSub, xyzBuff) {
    let s, i, z, x1, bid;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        po.x = s / 100 * (0.5 - Math.random());
        po.y = s / 100 * (0.5 - Math.random());
        //print({al,bl,cl,dl,el});
        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            z = (po.dl - (Math.sqrt(Math.abs(po.bl * po.x - po.cl))));

            if (po.x > 0) x1 = po.y - z;
            else if (po.x == 0) x1 = po.y;
            else x1 = po.y + z;

            // process x size
            if (po.x < po.xMin) po.xMin = po.x;
            else if (po.x > po.xMax) po.xMax = po.x;
            // process y size
            if (po.y < po.yMin) po.yMin = po.y;
            else if (po.y > po.yMax) po.yMax = po.y;

            // calculate x buffer location
            bid = (s * numPointsSub + i) * 2;
            // set y coordinate first
            xyzBuff[bid + 1] = po.y = po.al - po.x;
            // set x coordinate
            xyzBuff[bid] = po.x = x1 + po.el;
        }
    }
}

function BarryMartinMod1(numSub, numPointsSub, xyzBuff) {
    let s, i, z, x1, bid;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        po.x = s / 100 * (0.5 - Math.random());
        po.y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            z = (po.dl + Math.sqrt(Math.sqrt(Math.abs(po.bl * po.x - po.cl))));

            if (po.x > 0) x1 = po.y - z;
            else if (po.x == 0) x1 = po.y;
            else x1 = po.y + z;

            // process x size
            if (po.x < po.xMin) po.xMin = po.x;
            else if (po.x > po.xMax) po.xMax = po.x;
            // process y size
            if (po.y < po.yMin) po.yMin = po.y;
            else if (po.y > po.yMax) po.yMax = po.y;

            // calculate x buffer location
            bid = (s * numPointsSub + i) * 2;
            // set y coordinate first
            xyzBuff[bid + 1] = po.y = po.al - po.x;
            // set x coordinate
            xyzBuff[bid] = po.x = x1 + po.el;
        }
    }
}

function BarryMartinMod2(numSub, numPointsSub, xyzBuff) {
    let s, i, z, x1, bid;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        po.x = s / 100 * (0.5 - Math.random());
        po.y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            z = (po.dl + Math.log(2 + Math.sqrt(Math.abs(po.bl * po.x - po.cl))));

            if (po.x > 0) x1 = po.y - z;
            else if (po.x == 0) x1 = po.y;
            else x1 = po.y + z;

            // process x size
            if (po.x < po.xMin) po.xMin = po.x;
            else if (po.x > po.xMax) po.xMax = po.x;
            // process y size
            if (po.y < po.yMin) po.yMin = po.y;
            else if (po.y > po.yMax) po.yMax = po.y;

            // calculate x buffer location
            bid = (s * numPointsSub + i) * 2;
            // set y coordinate first
            xyzBuff[bid + 1] = po.y = po.al - po.x;
            // set x coordinate
            xyzBuff[bid] = po.x = x1 + po.el;
        }
    }
}

function BarryMartinAdd(numSub, numPointsSub, xyzBuff) {
    let s, i, z, x1, bid;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        po.x = s / 100 * (0.5 - Math.random());
        po.y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            x1 = (po.y + Math.sqrt(Math.abs(po.bl * po.x - po.cl)));

            // process x size
            if (po.x < po.xMin) po.xMin = po.x;
            else if (po.x > po.xMax) po.xMax = po.x;
            // process y size
            if (po.y < po.yMin) po.yMin = po.y;
            else if (po.y > po.yMax) po.yMax = po.y;

            // calculate x buffer location
            bid = (s * numPointsSub + i) * 2;
            // set y coordinate first
            xyzBuff[bid + 1] = po.y = po.al - po.x;
            // set x coordinate
            xyzBuff[bid] = po.x = x1 + po.el;
        }
    }
}

function BarryMartinSinusoidal(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        po.x = s / 100 * (0.5 - Math.random());
        po.y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            x1 = po.y + po.dl + Math.sin(po.bl * po.x - po.cl);
            y1 = po.al - po.x;

            // process x size
            if (po.x < po.xMin) po.xMin = po.x;
            else if (po.x > po.xMax) po.xMax = po.x;
            // process y size
            if (po.y < po.yMin) po.yMin = po.y;
            else if (po.y > po.yMax) po.yMax = po.y;

            // calculate x buffer location
            bid = (s * numPointsSub + i) * 2;
            // set x coordinate
            xyzBuff[bid] = po.x = x1 + po.el;
            // set y coordinate
            xyzBuff[bid + 1] = po.y = y1;
        }
    }
}


function GingerbreadMan(numSub, numPointsSub, xyzBuff) {
    let s, i, x1, y1, bid;

    // loop all subsets for the level
    for (s = 0; s < numSub; s++) {
        // Use a different starting point for each orbit subset
        po.x = s / 100 * (0.5 - Math.random());
        po.y = s / 100 * (0.5 - Math.random());

        for (i = 0; i < numPointsSub; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            x1 = po.y + po.dl + Math.abs(po.bl * po.x);
            y1 = po.al - po.x;

            // process x size
            if (po.x < po.xMin) po.xMin = po.x;
            else if (po.x > po.xMax) po.xMax = po.x;
            // process y size
            if (po.y < po.yMin) po.yMin = po.y;
            else if (po.y > po.yMax) po.yMax = po.y;

            // calculate x buffer location
            bid = (s * numPointsSub + i) * 2;
            // set x coordinate
            xyzBuff[bid] = po.x = x1 + po.el;
            // set y coordinate
            xyzBuff[bid + 1] = po.y = y1;
        }
    }
}

onmessage = function (e) {
    // what I need:
    let eventData = e.data;
    let sett = eventData.settings;
    let levelId = eventData.id;

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
    // Grab Hopalong Attractor based on choice
    if (choice < 0.2) BarryMartinClassic(num_subsets, num_points_subset, xyzBuff);
    else if (choice < 0.4) BarryMartinMod1(num_subsets, num_points_subset, xyzBuff);
    else if (choice < 0.6) BarryMartinMod2(num_subsets, num_points_subset, xyzBuff);
    else if (choice < 0.7) BarryMartinSinusoidal(num_subsets, num_points_subset, xyzBuff);
    else if (choice < 0.8) GingerbreadMan(num_subsets, num_points_subset, xyzBuff);
    else if (choice < 0.9) BarryMartinAdd(num_subsets, num_points_subset, xyzBuff);
    else  BarryMartinClassicInv(num_subsets, num_points_subset, xyzBuff);

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
    for (s = 0; s < num_subsets; s++) {
        for (i = 0; i < num_points_subset; i++) {
            // calculate x buffer location
            bid = (s * num_points_subset + i) * 2;
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
        }
    }
    // done, post calculated object
    let levelObj = {
        id: levelId,
        xyzBuff: xyzBuff.buffer,
    }
    self.postMessage(levelObj, [levelObj.xyzBuff]);
};