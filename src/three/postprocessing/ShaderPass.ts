/**
* @author alteredq / http://alteredqualia.com/
*
* @author hexxone / https://hexx.one
*/

import {Material, ShaderMaterial, UniformsUtils, WebGLRenderer, WebGLRenderTarget} from 'three';
import {BaseShader} from '../shader/BaseShader';

import {FullScreenQuad} from './FullScreenQuad';
import {BasePass} from './BasePass';

/**
 * ThreeJS Pass for easy full screen shaders
 */
export class ShaderPass implements BasePass {
	enabled = true;
	needsSwap = true;
	clear = false;
	renderToScreen = false;
	material: Material = null;
	textureID: string = null;
	uniforms = null;
	fsQuad: FullScreenQuad = null;

	/**
	 * Make Pass
	 * @param {BaseShader|ShaderMaterial} shader Create From
	 * @param {string} textureID Input Uniform Texture name
	 */
	constructor(shader: BaseShader | ShaderMaterial, textureID: string = 'tDiffuse') {
		this.textureID = textureID;

		if (shader instanceof ShaderMaterial) {
			this.uniforms = shader.uniforms;
			this.material = shader;
		} else if (shader) {
			this.uniforms = UniformsUtils.clone(shader.uniforms);
			this.material = new ShaderMaterial({
				defines: Object.assign({}, shader.defines),
				uniforms: this.uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader,
			});
		}
		this.fsQuad = new FullScreenQuad(this.material);
	}

	/**
	 * Destroy Pass
	 */
	public dispose() {
		this.fsQuad.dispose();
	}

	/**
	 * Canvas size update
	 * @param {number} width X
	 * @param {number} height Y
	 */
	public setSize(width: number, height: number) { }

	/**
	 * Render frame with chaining-support
	 * @param {WebGLRenderer} renderer
	 * @param {WebGLRenderTarget} writeBuffer wB
	 * @param {WebGLRenderTarget} readBuffer rB
	 * @param {number} deltaTime dT
	 * @param {boolean} maskActive mA
	 */
	public render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime: number, maskActive: boolean) {
		if (this.uniforms[this.textureID]) {
			this.uniforms[this.textureID].value = readBuffer.texture;
		}

		this.fsQuad.setMaterial(this.material);

		if (this.renderToScreen) {
			renderer.setRenderTarget(null);
			this.fsQuad.render(renderer);
		} else {
			renderer.setRenderTarget(writeBuffer);
			// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/js/pull/15571#issuecomment-465669600
			if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
			this.fsQuad.render(renderer);
		}
	}
}
