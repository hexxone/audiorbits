/**
* @author alteredq / http://alteredqualia.com/
*
* @author hexxone / https://hexx.one
*/

import {Camera, Color, Material, Scene} from 'three';
import {BasePass} from './BasePass';

/**
 * Shader Render Helper
 */
export class RenderPass implements BasePass {
	enabled = true;
	needsSwap = false;
	renderToScreen = true;

	clear = true;

	clearColor: Color = null;
	clearAlpha: number = null;
	clearDepth = false;

	private scene: Scene = null;
	private camera: Camera = null;
	private overMat: Material = null;

	/**
	 * Construct helper
	 * @param {Scene} scene
	 * @param {Camera} camera
	 * @param {Material} overMat
	 * @param {Color} clearColor
	 * @param {number} clearAlpha
	 */
	constructor(scene: Scene, camera: Camera, overMat, clearColor, clearAlpha: number) {
		this.scene = scene;
		this.camera = camera;

		this.overMat = overMat;

		this.clearColor = clearColor;
		this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 0;
	}

	/**
	 * Destroy shader
	 */
	public dispose() {
		throw new Error('Method not implemented.');
	}

	/**
	 * Updated screen size
	 * @param {number} width X
	 * @param {number} height Y
	 */
	public setSize(width: number, height: number) { }

	/**
	 * Render Frame
	 * @param {WebGLRenderer} renderer Context
	 * @param {WebGLRenderTarget} writeBuffer Output
	 * @param {WebGLRenderTarget} readBuffer Input
	 * @param {number} deltaTime ellapsed MS
	 * @param {boolean} maskActive filter
	 */
	public render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget, deltaTime: number, maskActive: boolean) {
		const oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		this.scene.overrideMaterial = this.overMat;

		let oldClearColor: Color; let oldClearAlpha: number;

		if (this.clearColor) {
			renderer.getClearColor(oldClearColor);
			oldClearAlpha = renderer.getClearAlpha();
			renderer.setClearColor(this.clearColor, this.clearAlpha);
		}

		if (this.clearDepth) {
			renderer.clearDepth();
		}

		renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);

		// TODO: Avoid using autoClear properties, see https://github.com/mrdoob/three.js/pull/15571#issuecomment-465669600
		if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
		renderer.render(this.scene, this.camera);
		if (this.clearColor) renderer.setClearColor(oldClearColor, oldClearAlpha);

		this.scene.overrideMaterial = null;
		renderer.autoClear = oldAutoClear;
	}
}

