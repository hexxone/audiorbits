/**
 * @author D.Thiele @https://hexxon.me
 * 
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * AudiOrbits level-generator worker.
 */

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
    let al = sett.alg_a_min + Math.random() * (sett.alg_a_max - sett.alg_a_min),
        bl = sett.alg_b_min + Math.random() * (sett.alg_b_max - sett.alg_b_min),
        cl = sett.alg_c_min + Math.random() * (sett.alg_c_max - sett.alg_c_min),
        dl = sett.alg_d_min + Math.random() * (sett.alg_d_max - sett.alg_d_min),
        el = sett.alg_e_min + Math.random() * (sett.alg_e_max - sett.alg_e_min);
    // some stuff needed in the subset generation loop
    let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
    let choice = Math.random();
    let s, x, y, i, z, x1, bid;
    // loop all subsets for the level
    for (s = 0; s < num_subsets; s++) {
        // Use a different starting point for each orbit subset
        x = s / 100 * (0.5 - Math.random());
        y = s / 100 * (0.5 - Math.random());
        //print({al,bl,cl,dl,el});
        for (i = 0; i < num_points_subset; i++) {
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
            bid = (s * num_points_subset + i) * 2;
            // set y coordinate first
            xyzBuff[bid + 1] = y = al - x;
            // set x coordinate
            xyzBuff[bid] = x = x1 + el;
        }
    }
    // calculate level scale based on min and max values
    let scaleX = 2 * scale_factor_l / (xMax - xMin);
    let scaleY = 2 * scale_factor_l / (yMax - yMin);

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
            x = scaleX * (xyzBuff[bid] - xMin) - scale_factor_l;
            // re-scale y position
            y = scaleY * (xyzBuff[bid + 1] - yMin) - scale_factor_l;
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