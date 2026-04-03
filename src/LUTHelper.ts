/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2026 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

import { Smallog } from './we_utils/src';

import { DataTexture,
    ImageLoader,
    LinearFilter,
    NearestFilter,
    RGBAFormat } from 'three.ts/src';

/**
 * LookUpTable Setup helper & holder
 * will locally preload the given textures and set metadata infos
 * @public
 */
export class LUTHelper {

    // set the size to 2 (the identity size). We'll restore it when the
    // image has loaded. This way the code using the lut doesn't have to
    // care if the image has loaded or not
    Textures = [
        {
            name: 'posterize',
            url: './img/lookup/posterize-s8n.png',
            size: 2,
            filter: false,
            texture: null
        },
        {
            name: 'inverse',
            url: './img/lookup/inverse-s8.png',
            size: 2,
            filter: false,
            texture: null
        },
        {
            name: 'negative',
            url: './img/lookup/color-negative-s8.png',
            size: 2,
            filter: false,
            texture: null
        }
    ];

    /**
     * Preload Lookup Table Textures
     */
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
                const m = (/-s(\d+)(n*)\.[^.]+$/).exec(info.url);

                if (m) {
                    info.size = parseInt(m[1]);
                    info.filter
                        = info.filter === undefined ? m[2] !== 'n' : info.filter;
                }
            }
            info.texture = this.makeLUTTexture(info);
        });
    }

    /**
     * Create a preloaded texture
     * @param {Object} info lookUpTableEntryInfo
     * @returns {Texture} result
     */
    private makeLUTTexture(info) {
        const imgLoader = new ImageLoader();
        const ctx = document.createElement('canvas').getContext('2d');
        const lutSize = info.size || 2;
        const width = lutSize * lutSize;
        const height = lutSize;
        const identityData = new Uint8Array(width * height * 4);

        for (let z = 0; z < lutSize; z++) {
            for (let y = 0; y < lutSize; y++) {
                for (let x = 0; x < lutSize; x++) {
                    const px = z * lutSize + x;
                    const idx = (y * width + px) * 4;

                    identityData[idx] = (x / Math.max(lutSize - 1, 1)) * 255;
                    identityData[idx + 1] = (y / Math.max(lutSize - 1, 1)) * 255;
                    identityData[idx + 2] = (z / Math.max(lutSize - 1, 1)) * 255;
                    identityData[idx + 3] = 255;
                }
            }
        }

        const texture = this.makeIdentityLutTexture(
            identityData.buffer,
            width,
            height,
            info.filter ? LinearFilter : NearestFilter
        );

        if (info.url) {
            Smallog.debug(`Loading image: ${JSON.stringify(info)}`);
            imgLoader.load(
                info.url,
                (image: HTMLImageElement) => {
                    info.size = lutSize;
                    ctx.canvas.width = width;
                    ctx.canvas.height = height;
                    ctx.drawImage(image, 0, 0);
                    const imageData = ctx.getImageData(0, 0, width, height);

                    texture.image.data = new Uint8Array(imageData.data);
                    texture.image.width = width;
                    texture.image.height = height;
                    texture.needsUpdate = true;
                },
                null,
                (err) => {
                    Smallog.error(`Error loading LUT: ${err}`);
                    throw err;
                }
            );
        }

        return texture;
    }

    /**
     * make filtered texture
     * @param {BufferSource} data to render
     * @param {number} wid weidht
     * @param {number} hig height
     * @param {number} filter Texture filter
     * @returns {DataTexture} result
     */
    private makeIdentityLutTexture(
        data: ArrayBufferLike,
        wid: number,
        hig: number,
        filter: number
    ) {
        const texture = new DataTexture(data, wid, hig, RGBAFormat);

        texture.minFilter = filter;
        texture.magFilter = filter;
        texture.needsUpdate = true;
        texture.flipY = false;

        return texture;
    }

}
