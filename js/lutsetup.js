/**
 * @author D.Thiele @https://hexxon.me
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

var lutSetup = {
    Textures: [
		{
			name: "posterize",
			url: "./img/lookup/posterize-s8n.png",
		},
		{
			name: "inverse",
			url: "./img/lookup/inverse-s8.png",
		},
		{
			name: "negative",
			url: "./img/lookup/color-negative-s8.png",
		},
	],
    run: function () {
        const makeIdentityLutTexture = function () {
            const identityLUT = new Uint8Array([
                0, 0, 0, 255, // black
                255, 0, 0, 255, // red
                0, 0, 255, 255, // blue
                255, 0, 255, 255, // magenta
                0, 255, 0, 255, // green
                255, 255, 0, 255, // yellow
                0, 255, 255, 255, // cyan
                255, 255, 255, 255, // white
            ]);
            return function (filter) {
                const texture = new THREE.DataTexture(identityLUT, 4, 2, THREE.RGBAFormat);
                texture.minFilter = filter;
                texture.magFilter = filter;
                texture.needsUpdate = true;
                texture.flipY = false;
                return texture;
            };
        }();
        const makeLUTTexture = function () {
            const imgLoader = new THREE.ImageLoader();
            const ctx = document.createElement("canvas").getContext("2d");

            return function (info) {
                const texture = makeIdentityLutTexture(
                    info.filter ? THREE.LinearFilter : THREE.NearestFilter);

                if (info.url) {
                    const lutSize = info.size;
                    // set the size to 2 (the identity size). We'll restore it when the
                    // image has loaded. This way the code using the lut doesn't have to
                    // care if the image has loaded or not
                    info.size = 2;
                    imgLoader.load(info.url, function (image) {
                        const width = lutSize * lutSize;
                        const height = lutSize;
                        info.size = lutSize;
                        ctx.canvas.width = width;
                        ctx.canvas.height = height;
                        ctx.drawImage(image, 0, 0);
                        const imageData = ctx.getImageData(0, 0, width, height);
                        texture.image.data = new Uint8Array(imageData.data.buffer);
                        texture.image.width = width;
                        texture.image.height = height;
                        texture.needsUpdate = true;
                    }, null, function (err) {
                        console.log("Error loading LUT: ");
                        throw err;
                    });
                }

                return texture;
            };
        }();
        lutSetup.Textures.forEach((info) => {
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
            info.texture = makeLUTTexture(info);
        });
    }
}