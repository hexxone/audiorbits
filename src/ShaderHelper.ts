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

import { LUTHelper } from "./LUTHelper";
import {
	BlurShader,
	CComponent,
	ChromaticShader,
	CSettings,
	EffectComposer,
	FractalMirrorShader,
	FXAAShader,
	LUTShader,
	LUTShaderNearest,
	ShaderPass,
	Smallog,
	UnrealBloomPass,
	WEAS,
	Vector2,
} from "./we_utils/src";

/**
 * Shder-relevant settings
 * @public
 */
class ShaderSettings extends CSettings {
	bloom_filter = false;
	lut_filter = -1;
	mirror_shader = 0;
	mirror_invert = false;
	fx_antialiasing = true;
	blur_strength = 0;
	chroma_filter = 10;
	audio_increase = 75;
}

/**
 * Contains all shader-relevant js-code
 * @extends {CComponent}
 * @public
 */
export class ShaderHolder extends CComponent {
	public settings: ShaderSettings = new ShaderSettings();

	private weas: WEAS;

	private lutSetup: LUTHelper = new LUTHelper();

	private composer: EffectComposer;
	private urBloomPass: UnrealBloomPass;
	private lutPass: ShaderPass;
	private lutNear: ShaderPass;
	private mirrorPass: ShaderPass;
	private fxaaPass: ShaderPass;
	private blurPassX: ShaderPass;
	private blurPassY: ShaderPass;
	private chrmPass: ShaderPass;

	/**
	 * Construct the shaders
	 * @param {WEAS} weas optional audio supplier
	 */
	constructor(weas?: WEAS) {
		super();
		this.weas = weas;
		Smallog.debug("creating shaders...");

		// bloom
		this.urBloomPass = new UnrealBloomPass(new Vector2(512, 512), 3, 0, 0.1);

		// get normal & filtered lookuptable shader
		this.lutPass = new ShaderPass(new LUTShader());
		this.lutNear = new ShaderPass(new LUTShaderNearest());

		// mirror shader
		this.mirrorPass = new ShaderPass(new FractalMirrorShader());

		// Nvidia FX antialiasing
		this.fxaaPass = new ShaderPass(new FXAAShader());

		// TWO-PASS Blur (x,y) using the same directional shader
		this.blurPassX = new ShaderPass(new BlurShader());
		this.blurPassY = new ShaderPass(new BlurShader());

		// chromatic abberation
		this.chrmPass = new ShaderPass(new ChromaticShader());
	}

	/**
	 * add shaders to composer
	 * @public
	 * @param {EffectComposer} composer Render-Manager
	 * @returns {void}
	 */
	public init(composer: EffectComposer) {
		this.composer = composer;
		this.updateSettings();
		Smallog.debug("adding shaders to render chain.");

		// bloom
		composer.addPass(this.urBloomPass);
		// get normal & filtered lookuptable shader
		composer.addPass(this.lutPass);
		composer.addPass(this.lutNear);
		// mirror shader
		composer.addPass(this.mirrorPass);
		// Nvidia FX antialiasing
		composer.addPass(this.fxaaPass);
		// TWO-PASS Blur (x,y) using the same directional shader
		composer.addPass(this.blurPassX);
		composer.addPass(this.blurPassY);
		// chromatic abberation
		composer.addPass(this.chrmPass);
	}

	/**
	 * update some uniforms values?
	 * @public
	 * @param {number} e ellapsed ms
	 * @param {number} d deltaTime ~1 multiplier
	 * @returns {void}
	 */
	public updateFrame(e, d) {
		const hasAudio = this.weas && this.weas.hasAudio();
		const audioObj = this.weas.lastAudio || null;
		const sett = this.settings;

		if (hasAudio && sett.chroma_filter > 0) {
			const flmult = (1 + sett.audio_increase) * 0.5;
			const intensity =
				((audioObj.bass * 2 - audioObj.mids + audioObj.highs) /
					60 /
					audioObj.average) *
				flmult;

			this.chrmPass.uniforms.strength = sett.chroma_filter * intensity;
		} else {
			this.chrmPass.uniforms.strength = sett.chroma_filter;
		}
	}

	/**
	 * just destroy & rebuild completely... whatever lul
	 * @public
	 * @return {Promise} finished event
	 */
	public updateSettings(): Promise<void> {
		if (!this.composer) return;
		const sett = this.settings;

		// bloom
		this.urBloomPass.enabled = sett.bloom_filter;

		// lookuptable filter
		this.lutNear.enabled = this.lutPass.enabled = false;
		if (sett.lut_filter >= 0) {
			// add normal or filtered LUT shader
			const lutInfo = this.lutSetup.Textures[sett.lut_filter];
			const useEffect = lutInfo.filter ? this.lutNear : this.lutPass;
			// set shader uniform values
			useEffect.uniforms.lutMap.value = lutInfo.texture;
			useEffect.uniforms.lutMapSize.value = lutInfo.size;
			useEffect.enabled = true;
		}

		// mirror shader
		const mirror = sett.mirror_shader > 1;
		if (mirror) {
			// set shader uniform values
			this.mirrorPass.uniforms.invert.value = sett.mirror_invert;
			this.mirrorPass.uniforms.numSides.value = sett.mirror_shader;
		}
		this.mirrorPass.enabled = mirror;

		// Nvidia FX antialiasing
		const fxaa = sett.fx_antialiasing;
		if (fxaa) {
			// set uniform
			this.fxaaPass.uniforms.resolution.value = new Vector2(
				1 / window.innerWidth,
				1 / window.innerHeight
			);
		}
		this.fxaaPass.enabled = fxaa;

		// TWO-PASS Blur using the same directional shader
		const blur = sett.blur_strength > 0;
		if (sett.blur_strength > 0) {
			const bs = sett.blur_strength / 15;
			// X
			this.blurPassX.uniforms.u_dir.value = new Vector2(bs, 0);
			// Y
			this.blurPassY.uniforms.u_dir.value = new Vector2(0, bs);
		}
		this.blurPassX.enabled = this.blurPassY.enabled = blur;

		// chroma
		this.chrmPass.enabled = sett.chroma_filter > 0;

		return Promise.resolve();
	}
}
