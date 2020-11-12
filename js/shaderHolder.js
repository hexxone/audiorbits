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

var shaderHolder = {

	// Filter / Shader settings
    settings: {
		bloom_filter: false,
		lut_filter: -1,
		mirror_shader: 0,
		mirror_invert: false,
		fx_antialiasing: true,
		blur_strength: 0,
    },

	// initialize shaders after composer
	init: function (scene, camera, composer) {
		var sett = shaderHolder.settings;

		// last added filter
		var lastEffect = null;
		print("adding shaders to render chain.");
		composer.addPass(new THREE.RenderPass(scene, camera, null, 0x000000, 1));

		// bloom
		if (sett.bloom_filter) {
			var urBloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 3, 0, 0.1);
			urBloomPass.renderToScreen = false;
			composer.addPass(urBloomPass);
			lastEffect = urBloomPass;
		}

		// lookuptable filter
		if (sett.lut_filter >= 0) {
			// add normal or filtered LUT shader
			var lutInfo = lutSetup.Textures[sett.lut_filter];
			// get normal or filtered LUT shader
			var lutPass = new THREE.ShaderPass(lutInfo.filter ?
				THREE.LUTShader : THREE.LUTShaderNearest);
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
			var mirrorPass = new THREE.ShaderPass(THREE.FractalMirrorShader);
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
		if (sett.ufx_antialiasing) {
			var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
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
			var blurPassX = new THREE.ShaderPass(THREE.BlurShader);
			blurPassX.renderToScreen = false;
			blurPassX.material.transparent = true;
			blurPassX.uniforms.u_dir.value = new THREE.Vector2(bs, 0);
			blurPassX.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
			composer.addPass(blurPassX);
			// Y
			var blurPassY = new THREE.ShaderPass(THREE.BlurShader);
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
	},

}