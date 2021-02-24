/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * LookUpTable Setup helper & holder
 * 
 * will locally preload the given textures and set metadata infos
 */

import { DataTexture, ImageLoader, LinearFilter, NearestFilter, RGBAFormat } from 'three';

import { Smallog } from './we_utils/src/Smallog';

export class LUTHelper {
    // set the size to 2 (the identity size). We'll restore it when the
    // image has loaded. This way the code using the lut doesn't have to
    // care if the image has loaded or not
    Textures = [
        {
            name: "posterize",
            url: "./img/lookup/posterize-s8n.png",
            size: 2,
            filter: false,
            texture: null
        },
        {
            name: "inverse",
            url: "./img/lookup/inverse-s8.png",
            size: 2,
            filter: false,
            texture: null
        },
        {
            name: "negative",
            url: "./img/lookup/color-negative-s8.png",
            size: 2,
            filter: false,
            texture: null
        },
    ];

    constructor() {
        this.Textures.forEach((info) => {
            // if not size set get it from the filename
            if (!info.size) {
                // assumes filename ends in '-s<num>[n]'
                // where <num> is the size of the 3DLUT cube
                // and [n] means 'no filtering' or 'nearest'
                //
                // examples:
                //    'foo-s16.png' = size:16, filter: true
                //    'bar-s8n.png' = size:8, filter: false
                const m = /-s(\d+)(n*)\.[^.]+$/.exec(info.url);
                if (m) {
                    info.size = parseInt(m[1]);
                    info.filter = info.filter === undefined ? m[2] !== "n" : info.filter;
                }
            }
            info.texture = this.makeLUTTexture(info);
        });
    }

    private makeLUTTexture(info) {
        const imgLoader = new ImageLoader();
        const ctx = document.createElement("canvas").getContext("2d");

        var texture = null;
        if (info.url) {
            const lutSize = info.size;
            Smallog.Debug("Loading image: " + JSON.stringify(info));
            imgLoader.load(info.url, (image) => {
                const width = lutSize * lutSize;
                const height = lutSize;
                info.size = lutSize;
                ctx.canvas.width = width;
                ctx.canvas.height = height;
                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, width, height);

                texture = this.makeIdentityLutTexture(imageData.data.buffer, width, height,
                    info.filter ? LinearFilter : NearestFilter);

                texture.needsUpdate = true;
            }, null, function (err) {
                Smallog.Error("Error loading LUT: " + err);
                throw err;
            });
        }

        return texture;
    }

    private makeIdentityLutTexture(data, wid, hig, filter) {
        const texture = new DataTexture(data, wid, hig, RGBAFormat);
        texture.minFilter = filter;
        texture.magFilter = filter;
        texture.needsUpdate = true;
        texture.flipY = false;
        return texture;
    }
}