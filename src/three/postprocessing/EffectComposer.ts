/**
 * @author alteredq / http://alteredqualia.com/
 */

import * as THREE from 'three';

import { ShaderPass } from './ShaderPass';
import { CopyShader } from '../shader/CopyShader';

export class EffectComposer {

	renderer = null;
	renderTarget1 = null;
	renderTarget2 = null;
	writeBuffer = this.renderTarget1;
	readBuffer = this.renderTarget2;
	renderToScreen = true;
	passes = [];
	copyPass = null;
	_previousFrameTime = Date.now();

	constructor(renderer, renderTarget?) {
		this.renderer = renderer;
		if (renderTarget === undefined) {
			var parameters = {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBAFormat,
				stencilBuffer: false
			};
			var size = renderer.getDrawingBufferSize(new THREE.Vector2());
			renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, parameters);
			renderTarget.texture.name = 'EffectComposer.rt1';
		}

		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();
		this.renderTarget2.texture.name = 'EffectComposer.rt2';

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;
		this.renderToScreen = true;
		this.passes = [];

		// dependencies
		this.copyPass = new ShaderPass(CopyShader);
		this._previousFrameTime = Date.now();
	}

	swapBuffers() {
		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
	}

	addPass(pass) {
		this.passes.push(pass);
		var size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
		pass.setSize(size.width, size.height);
	}

	insertPass(pass, index) {
		this.passes.splice(index, 0, pass);
	}

	isLastEnabledPass(passIndex) {
		for (var i = passIndex + 1; i < this.passes.length; i++) {
			if (this.passes[i].enabled) return false;
		}
		return true;
	}

	render(deltaTime) {
		// deltaTime value is in seconds
		if (deltaTime === undefined) {
			deltaTime = (Date.now() - this._previousFrameTime) * 0.001;
		}
		this._previousFrameTime = Date.now();
		var currentRenderTarget = this.renderer.getRenderTarget();

		var pass, i, il = this.passes.length;
		for (i = 0; i < il; i++) {

			pass = this.passes[i];
			if (pass.enabled === false) continue;
			pass.renderToScreen = (this.renderToScreen && this.isLastEnabledPass(i));
			pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, false);

			if (pass.needsSwap) {
				this.swapBuffers();
			}
		}
		this.renderer.setRenderTarget(currentRenderTarget);
	}

	reset(renderTarget) {

		if (renderTarget === undefined) {
			var size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
			renderTarget = this.renderTarget1.clone();
			renderTarget.setSize(size.width, size.height);
		}
		this.renderTarget1.dispose();
		this.renderTarget2.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

	}

	setSize(width, height) {
		this.renderTarget1.setSize(width, height);
		this.renderTarget2.setSize(width, height);
		for (var i = 0; i < this.passes.length; i++) {
			this.passes[i].setSize(width, height);
		}
	}
}


export class Pass {
	// if set to true, the pass is processed by the composer
	enabled = true;
	// if set to true, the pass indicates to swap read and write buffer after rendering
	needsSwap = true;
	// if set to true, the pass clears its buffer before rendering
	clear = false;
	// if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
	renderToScreen = false;

	setSize(width, height) { }

	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
		console.error('THREE.Pass: .render() must be implemented in derived pass.');
	}
};

// Helper for passes that need to fill the viewport with a single quad.
export class FullScreenQuad {
	camera = null;
	geometry = null;
	mesh = null;
	_mat = null;
	material = {
		get: function () {
			return this._mesh.material;
		},
		set: function (value) {
			this._mesh.material = value;
		}
	}
	constructor(material) {
		this._mat = material;
		this.camera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1);
		this.geometry = new THREE.PlaneBufferGeometry(2, 2);
		this.mesh = new THREE.Mesh(this.geometry, material);
	}
	render (renderer) {
		renderer.render(this.mesh, this.camera);
	}
}

