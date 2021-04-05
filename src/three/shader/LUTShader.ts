/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*/

import {BaseShader} from './BaseShader';

/**
 * LookUpTable shader
 *
 * taken from ThreeJS examples and converted to TS
 */
export class LUTShader implements BaseShader {
	defines = null;

	shaderID = 'LUTShader';

	uniforms = {
		tDiffuse: {value: null},
		lutMap: {value: null},
		lutMapSize: {value: 1},
	};

	vertexShader = `
	varying vec2 vUv;
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
	`;

	fragmentShader = `
	#include <common>
	
	#define FILTER_LUT true
	
	uniform sampler2D tDiffuse;
	uniform sampler2D lutMap;
	uniform float lutMapSize;
	
	varying vec2 vUv;
	
	vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size) {
		float sliceSize = 1.0 / size;                  // space of 1 slice
		float slicePixelSize = sliceSize / size;       // space of 1 pixel
		float width = size - 1.0;
		float sliceInnerSize = slicePixelSize * width; // space of size pixels
		float zSlice0 = floor( texCoord.z * width);
		float zSlice1 = min( zSlice0 + 1.0, width);
		float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
		float yRange = (texCoord.y * width + 0.5) / size;
		float s0 = xOffset + (zSlice0 * sliceSize);
		
		#ifdef FILTER_LUT
		
		float s1 = xOffset + (zSlice1 * sliceSize);
		vec4 slice0Color = texture2D(tex, vec2(s0, yRange));
		vec4 slice1Color = texture2D(tex, vec2(s1, yRange));
		float zOffset = mod(texCoord.z * width, 1.0);
		return mix(slice0Color, slice1Color, zOffset);
		
		#else
		
		return texture2D(tex, vec2( s0, yRange));
		
		#endif
	}
	
	void main() {
		vec4 originalColor = texture2D(tDiffuse, vUv);
		vec4 tempColor = sampleAs3DTexture(lutMap, originalColor.xyz, lutMapSize);
		tempColor.a = originalColor.a;
		gl_FragColor = tempColor;
	}
	`;
}
