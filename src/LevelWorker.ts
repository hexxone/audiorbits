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

// get the typed object
const lvlw: Worker = self as any;

lvlw.addEventListener("message", (e) => {
    // what I need:
    let eventData = e.data;
    let sett = eventData.settings;
    let levelId = eventData.id;

    // shorter to write and better to read
    let numSubsets = sett.num_subsets_per_level;
    let numPoints = sett.num_points_per_subset;
    let scaleFactor = sett.scaling_factor;
    let tunnel = sett.generate_tunnel;
    let iRadius = sett.tunnel_inner_radius / 100;
    let oRadius = sett.tunnel_outer_radius / 100;

    // get randomized params in defined ranges
    let al = sett.alg_a_min + Math.random() * (sett.alg_a_max - sett.alg_a_min),
        bl = sett.alg_b_min + Math.random() * (sett.alg_b_max - sett.alg_b_min),
        cl = sett.alg_c_min + Math.random() * (sett.alg_c_max - sett.alg_c_min),
        dl = sett.alg_d_min + Math.random() * (sett.alg_d_max - sett.alg_d_min),
        el = sett.alg_e_min + Math.random() * (sett.alg_e_max - sett.alg_e_min);

    // some stuff needed in the subset generation loop
    let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
    let choice = Math.random();
    let s, x, y, i, z, x1, bid;
    let sets = [];

    // loop all subsets for the level
    for (s = 0; s < numSubsets; s++) {
        // create a buffer thats big enough to hold the x & y corrdinates of all points in a subset.
        // may seem ridiclous, but is actually the best way to transfer the data back
        let xyBuff = new Float32Array(numPoints * 2);
        sets.push(xyBuff);

        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());

        //print({al,bl,cl,dl,el});
        for (i = 0; i < numPoints; i++) {
            // Iteration formula (generalization of Barry Martin's one)
            if (choice < 0.5) z = (dl + (Math.sqrt(Math.abs(bl * x - cl))));
            else if (choice < 0.75) z = (dl + Math.sqrt(Math.sqrt(Math.abs(bl * x - cl))));
            else z = (dl + Math.log(2 + Math.sqrt(Math.abs(bl * x - cl))));

            if (x > 0) x1 = y - z;
            else if (x == 0) x1 = y;
            else x1 = y + z;

            // process x size
            if (x < xMin) xMin = x;
            else if (x > xMax) xMax = x;
            // process y size
            if (y < yMin) yMin = y;
            else if (y > yMax) yMax = y;

            // calculate x buffer location
            bid = i * 2;
            // set y coordinate first
            xyBuff[bid + 1] = y = al - x;
            // set x coordinate
            xyBuff[bid] = x = x1 + el;
        }
    }

    // calculate level scale based on min and max values
    let scaleX = 2 * scaleFactor / (xMax - xMin);
    let scaleY = 2 * scaleFactor / (yMax - yMin);

    // small helper
    let getPointDistance = function (x1, y1, x2, y2) {
        let a = x1 - x2;
        let b = y1 - y2;
        return Math.sqrt(a * a + b * b);
    };

    // Normalize and post-process the level          
    let dist, scaling, outer;
    for (s = 0; s < numSubsets; s++) {
        // get previous set buffer
        var setBuff = sets[s];
        for (i = 0; i < numPoints; i++) {
            // calculate x buffer location
            bid = i * 2;
            // re-scale x position
            x = scaleX * (setBuff[bid] - xMin) - scaleFactor;
            // re-scale y position
            y = scaleY * (setBuff[bid + 1] - yMin) - scaleFactor;
            // tunnel processing to take certain points from the center
            // and move them outwards in a circular way
            if (tunnel) {
                dist = getPointDistance(0, 0, x, y) / scaleFactor;
                //print("pd: " + dist + ",   inner: " + iradius);
                if (dist < iRadius) {
                    scaling = dist / iRadius;
                    outer = scaling / oRadius;
                    x = x / scaling + x * outer;
                    y = y / scaling + y * outer;
                }
            }
            // set new scaled value
            setBuff[i * 2] = x;
            setBuff[i * 2 + 1] = y;
        }
        // post calculated set
        lvlw.postMessage({
            action: "subset",
            level: levelId,
            subset: s,
            xyBuff: setBuff.buffer,
        }, [setBuff.buffer]);
    }
    // we are done - Woohoo!
    lvlw.postMessage({
        action: "level",
        level: levelId
    });
});