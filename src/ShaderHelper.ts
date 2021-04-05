/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*
* @description
*/

import {Vector2} from 'three';

import {LUTHelper} from './LUTHelper';
import {ShaderPass} from './three/postprocessing/ShaderPass';
import {UnrealBloomPass} from './three/postprocessing/UnrealBloomPass';

import {LUTShader} from './three/shader/LUTShader';
import {LUTShaderNearest} from './three/shader/LUTShaderNearest';

import {BlurShader} from './three/shader/BlurShader';
import {FXAAShader} from './three/shader/FXAAShader';
import {FractalMirrorShader} from './three/shader/FractalMirrorShader';
import {Smallog} from './we_utils/src/Smallog';
import {EffectComposer} from './three/postprocessing/EffectComposer';
import {CSettings} from './we_utils/src/CSettings';
import {CComponent} from './we_utils/src/CComponent';

/**
 * Shder-relevant settings
 */
class ShaderSettings extends CSettings {
	bloom_filter: boolean = false;
	lut_filter: number = -1;
	mirror_shader: number = 0;
	mirror_invert: boolean = false;
	fx_antialiasing: boolean = true;
	blur_strength: number = 0;
}

/**
* Contains all shader-relevant js-code
*/
export class ShaderHolder extends CComponent {
	public settings: ShaderSettings = new ShaderSettings();

	private lutSetup: LUTHelper = new LUTHelper();

	private composer: EffectComposer;

	private urBloomPass: UnrealBloomPass;
	private lutPass: ShaderPass;
	private lutNear: ShaderPass;
	private mirrorPass: ShaderPass;
	private fxaaPass: ShaderPass;
	private blurPassX: ShaderPass;
	private blurPassY: ShaderPass;

	/**
	 * initialize shaders on composer
	 * @param {EffectComposer} composer Render-Manager
	 */
	public init(composer: EffectComposer) {
		this.composer = composer;
		const sett = this.settings;

		// last added filter
		let lastEffect = null;
		Smallog.debug('adding shaders to render chain.');

		// bloom
		if (sett.bloom_filter) {
			composer.addPass(lastEffect = this.urBloomPass = new UnrealBloomPass(new Vector2(512, 512), 3, 0, 0.1));
		}

		// lookuptable filter
		if (sett.lut_filter >= 0) {
			// get normal LUT shader
			composer.addPass(this.lutPass = new ShaderPass(new LUTShader()));
			this.lutPass.material.transparent = true;
			// get filtered LUT shader
			composer.addPass(this.lutNear = new ShaderPass(new LUTShaderNearest()));
			this.lutNear.material.transparent = true;
			// add normal or filtered LUT shader
			const lutInfo = this.lutSetup.Textures[sett.lut_filter];
			lastEffect = lutInfo.filter ? this.lutNear : this.lutPass;
			// set shader uniform values
			lastEffect.uniforms.lutMap.value = lutInfo.texture;
			lastEffect.uniforms.lutMapSize.value = lutInfo.size;
		}

		// mirror shader
		if (sett.mirror_shader > 1) {
			composer.addPass(lastEffect = this.mirrorPass = new ShaderPass(new FractalMirrorShader()));
			this.mirrorPass.material.transparent = true;
			// set shader uniform values
			this.mirrorPass.uniforms.invert.value = sett.mirror_invert;
			this.mirrorPass.uniforms.numSides.value = sett.mirror_shader;
			this.mirrorPass.uniforms.iResolution.value = new Vector2(window.innerWidth, window.innerHeight);
		}

		// Nvidia FX antialiasing
		if (sett.fx_antialiasing) {
			composer.addPass(lastEffect = this.fxaaPass = new ShaderPass(new FXAAShader()));
			this.fxaaPass.material.transparent = true;
			// set uniform
			this.fxaaPass.uniforms.resolution.value = new Vector2(1 / window.innerWidth, 1 / window.innerHeight);
		}

		// TWO-PASS Blur using the same directional shader
		if (sett.blur_strength > 0) {
			const bs = sett.blur_strength / 5;
			// X
			composer.addPass(this.blurPassX = new ShaderPass(new BlurShader()));
			this.blurPassX.material.transparent = true;
			this.blurPassX.uniforms.u_dir.value = new Vector2(bs, 0);
			this.blurPassX.uniforms.iResolution.value = new Vector2(window.innerWidth, window.innerHeight);
			// Y
			composer.addPass(this.blurPassY = new ShaderPass(new BlurShader()));
			this.blurPassY.material.transparent = true;
			this.blurPassY.uniforms.u_dir.value = new Vector2(0, bs);
			this.blurPassY.uniforms.iResolution.value = new Vector2(window.innerWidth, window.innerHeight);
			// chaining
			lastEffect = this.blurPassY;
		}

		// only render last effect
		if (lastEffect) lastEffect.renderToScreen = true;
	}

	/**
	 * update some uniforms values?
	 * @param {number} e ellapsed ms
	 * @param {number} d deltaTime ~1 multiplier
	 */
	public UpdateFrame(e, d) { }

	/**
	 * just destroy & rebuild completely... whatever lul
	 * @return {Promise} finished event
	 */
	public updateSettings(): Promise<void> {
		if (!this.composer) return;
		if (this.urBloomPass) this.urBloomPass.dispose();
		if (this.lutPass) this.lutPass.dispose();
		if (this.lutNear) this.lutNear.dispose();
		if (this.mirrorPass) this.mirrorPass.dispose();
		if (this.fxaaPass) this.fxaaPass.dispose();
		if (this.blurPassX) this.blurPassX.dispose();
		if (this.blurPassY) this.blurPassY.dispose();
		this.composer.reset();
		this.init(this.composer);
		return Promise.resolve();
	}
}
