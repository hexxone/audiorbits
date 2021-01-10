/**
 * @author alteredq / http://alteredqualia.com/
 */

import { BasePass } from "./BasePass";

export class RenderPass implements BasePass {

	enabled = true;
	needsSwap = false;
	clear = true;
	renderToScreen = true;

	scene = null;
	camera = null;
	overrideMaterial = null;
	clearColor = null;
	clearAlpha = null;

	clearDepth = false;

	constructor(scene, camera, overrideMaterial, clearColor, clearAlpha) {

		this.scene = scene;
		this.camera = camera;

		this.overrideMaterial = overrideMaterial;

		this.clearColor = clearColor;
		this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 0;
	}

	setSize(width, height) { }

	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
		var oldAutoClear = renderer.autoClear;
		renderer.autoClear = false;

		this.scene.overrideMaterial = this.overrideMaterial;

		var oldClearColor, oldClearAlpha;
		if (this.clearColor) {
			oldClearColor = renderer.getClearColor().getHex();
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

