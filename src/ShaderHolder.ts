/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Contains all shader-relevant js-code
 * 
 */

import * as THREE from 'three';

import { LUTSetup } from './lutSetup';

import { RenderPass } from './three/postprocessing/RenderPass';
import { ShaderPass } from './three/postprocessing/ShaderPass';
import { UnrealBloomPass } from './three/postprocessing/UnrealBloomPass';

import * as LUT from './three/shader/LUTShader';
import * as LUTShaderNearest from "./three/shader/LUTShaderNearest";
import { BlurShader } from './three/shader/BlurShader';
import { FXAAShader } from './three/shader/FXAAShader';
import { FractalMirrorShader } from './three/shader/FractalMirrorShader';
import { Smallog } from '../we_utils/src/Smallog';

export class ShaderHolder {

	// Filter / Shader settings
	settings = {
		bloom_filter: false,
		lut_filter: -1,
		mirror_shader: 0,
		mirror_invert: false,
		fx_antialiasing: true,
		blur_strength: 0,
	};

	lutSetup: LUTSetup = null;

	constructor() {
		this.lutSetup = new LUTSetup();
	}

	// initialize shaders after composer
	init(scene, camera, composer) {
		var sett = this.settings;

		// last added filter
		var lastEffect = null;
		Smallog.Debug("adding shaders to render chain.");
		composer.addPass(new RenderPass(scene, camera, null, 0x000000, 1));

		// bloom
		if (sett.bloom_filter) {
			var urBloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), 3, 0, 0.1);
			urBloomPass.renderToScreen = false;
			composer.addPass(urBloomPass);
			lastEffect = urBloomPass;
		}

		// lookuptable filter
		if (sett.lut_filter >= 0) {
			// add normal or filtered LUT shader
			var lutInfo = this.lutSetup.Textures[sett.lut_filter];
			// get normal or filtered LUT shader
			var lutPass = new ShaderPass(lutInfo.filter ? new LUT.LUTShader() : new LUTShaderNearest.LUTShaderNearest());
			// prepare render queue
			lutPass.renderToScreen = false;
			lutPass.material.transparent = true;
			composer.addPass(lutPass);
			lastEffect = lutPass;
			// set shader uniform values
			lutPass.uniforms.lutMap.value = lutInfo.texture;
			lutPass.uniforms.lutMapSize.value = lutInfo.size;
		}

		// fractal mirror shader
		if (sett.mirror_shader > 1) {
			var mirrorPass = new ShaderPass(new FractalMirrorShader());
			mirrorPass.renderToScreen = false;
			mirrorPass.material.transparent = true;
			composer.addPass(mirrorPass);
			lastEffect = mirrorPass;
			// set shader uniform values
			mirrorPass.uniforms.invert.value = sett.mirror_invert;
			mirrorPass.uniforms.numSides.value = sett.mirror_shader;
			mirrorPass.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
		}

		// Nvidia FX antialiasing
		if (sett.fx_antialiasing) {
			var fxaaPass = new ShaderPass(new FXAAShader());
			fxaaPass.renderToScreen = false;
			fxaaPass.material.transparent = true;
			composer.addPass(fxaaPass);
			lastEffect = fxaaPass;
			// set uniform
			fxaaPass.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
		}

		// TWO-PASS Blur using the same directional shader
		if (sett.blur_strength > 0) {
			var bs = sett.blur_strength / 5;
			// X
			var blurPassX = new ShaderPass(new BlurShader());
			blurPassX.renderToScreen = false;
			blurPassX.material.transparent = true;
			blurPassX.uniforms.u_dir.value = new THREE.Vector2(bs, 0);
			blurPassX.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
			composer.addPass(blurPassX);
			// Y
			var blurPassY = new ShaderPass(new BlurShader());
			blurPassY.renderToScreen = false;
			blurPassY.material.transparent = true;
			blurPassY.uniforms.u_dir.value = new THREE.Vector2(0, bs);
			blurPassY.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
			composer.addPass(blurPassY);
			// chaining
			lastEffect = blurPassY;
		}

		// only render last effect
		if (lastEffect) lastEffect.renderToScreen = true;
	}
}