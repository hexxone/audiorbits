/**
 * @author alteredq / http://alteredqualia.com/
 */
import * as THREE from 'three';
import { BaseShader } from '../shader/BaseShader';

import { FullScreenQuad } from "./FullScreenQuad";
import { BasePass } from "./BasePass";

export class ShaderPass implements BasePass {

	enabled = true;
	needsSwap = true;
	clear = false;
	renderToScreen = false;
	material: THREE.Material = null;
	textureID: string = null;
	uniforms = null;
	fsQuad: FullScreenQuad = null;

	constructor(shader: BaseShader, textureID: string = "tDiffuse") {
		this.textureID = textureID;

		if (shader instanceof THREE.ShaderMaterial) {
			this.uniforms = shader.uniforms;
			this.material = shader;
		} else if (shader) {
			this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);
			this.material = new THREE.ShaderMaterial({
				defines: Object.apply({}, shader.defines),
				uniforms: this.uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader
			});
		}
		this.fsQuad = new FullScreenQuad(this.material);
	}

	setSize(width,height) {}

	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {

		if (this.uniforms[this.textureID])
			this.uniforms[this.textureID].value = readBuffer.texture;

		this.fsQuad.SetMaterial(this.material);

		if (this.renderToScreen) {
			renderer.setRenderTarget(null);
			this.fsQuad.render(renderer);

		} else {
			renderer.setRenderTarget(writeBuffer);
			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
			if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
			this.fsQuad.render(renderer);
		}
	}
}