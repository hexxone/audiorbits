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
 * Blend another texture in and out
 */
export class BlendShader implements BaseShader {
	defines = null;

	shaderID = 'blendShader';

	uniforms = {
		tDiffuse: {value: null},
		overlayBuffer: {value: null},
		mixValue: {value: 1},
	};

	// default vertex shader
	vertexShader = `
	varying vec2 vUv;
	
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
	`;

	// simple blending Shader
	fragmentShader = `
	uniform sampler2D tDiffuse;
	uniform sampler2D overlayBuffer;
	
	varying vec2 vUv;
	
	void main() {
		vec4 texel1 = texture2D(tDiffuse, vUv);
		vec4 texel2 = texture2D(overlayBuffer, vUv);
		vec4 diff = abs(texel1 - texel2);
		gl_FragColor = vec4(diff, 1.0);
	}
	`;
}
