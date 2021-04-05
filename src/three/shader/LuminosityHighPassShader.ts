/**
* @author bhouston / http://clara.io/
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*/

import {Color} from 'three';
import {BaseShader} from './BaseShader';

/**
* Luminosity
*
* http://en.wikipedia.org/wiki/Luminosity
*/
export class LuminosityHighPassShader implements BaseShader {
	defines = null;

	shaderID = 'luminosityHighPass';

	uniforms = {
		tDiffuse: {value: null},
		luminosityThreshold: {value: 1.0},
		smoothWidth: {value: 1.0},
		defaultColor: {value: new Color(0x000000)},
		defaultOpacity: {value: 0.0},
	};

	vertexShader = `
	varying vec2 vUv;
	
	void main() {
		vUv = uv;
		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}
	`;

	fragmentShader = `
	uniform sampler2D tDiffuse;
	uniform vec3 defaultColor;
	uniform float defaultOpacity;
	uniform float luminosityThreshold;
	uniform float smoothWidth;
	
	varying vec2 vUv;
	
	void main() {
		
		vec4 texel = texture2D( tDiffuse, vUv );
		vec3 luma = vec3( 0.299, 0.587, 0.114 );
		float v = dot( texel.xyz, luma );
		vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );
		float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );
		gl_FragColor = mix( outputColor, texel, alpha );
	}
	`;
};
