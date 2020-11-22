/**
 * @author alteredq / http://alteredqualia.com/
 */

import * as THREE from 'three';

import { ShaderPass } from './ShaderPass';
import { CopyShader } from '../shader/CopyShader';
import { BasePass } from './BasePass';

export class EffectComposer implements BasePass {

	renderer = null;
	renderTarget1: THREE.WebGLRenderTarget = null;
	renderTarget2: THREE.WebGLRenderTarget = null;
	writeBuffer: THREE.WebGLRenderTarget = this.renderTarget1;
	readBuffer: THREE.WebGLRenderTarget = this.renderTarget2;
	renderToScreen: boolean = true;
	passes: BasePass[] = [];
	copyPass: ShaderPass = null;
	_previousFrameTime = Date.now();

	enabled: boolean;
	needsSwap: boolean;
	clear: boolean;

	globalPrecision: string;

	constructor(renderer: THREE.WebGLRenderer, globalPrec: string = "mediump", renderTarget?: THREE.WebGLRenderTarget) {

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
		this.copyPass = new ShaderPass(new CopyShader());
		this._previousFrameTime = Date.now();
		// overwrite shader precision
		this.globalPrecision = globalPrec;
	}

	public swapBuffers() {
		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
	}

	public addPass(pass: BasePass) {
		var p: BasePass = this.wrapPrecision(pass);
		this.passes.push(p);
		var size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
		p.setSize(size.width, size.height);
	}

	public insertPass(pass: BasePass, index) {
		this.passes.splice(index, 0, this.wrapPrecision(pass));
	}

	private wrapPrecision(pass: BasePass) {
		var copy: any = pass;
		if (copy.material) {
			// get prefix
			var pre = "precision " + this.globalPrecision + " float;\r\n    "
				+ "precision " + this.globalPrecision + " int;\r\n    ";
			// "medium" sampler precision should always be available for "high" float precision.
			if (this.globalPrecision == "highp") {
				pre += "precision mediump sampler2D;\r\n    "
					+ "precision mediump samplerCube;\r\n    ";
			}
			// apply it
			if (copy.material.vertexShader)
				copy.material.vertexShader = pre + copy.material.vertexShader;
			if (copy.material.fragmentShader)
				copy.material.fragmentShader = pre + copy.material.fragmentShader;
		}
		return copy;
	}

	public isLastEnabledPass(passIndex) {
		for (var i = passIndex + 1; i < this.passes.length; i++) {
			if (this.passes[i].enabled) return false;
		}
		return true;
	}

	public render(deltaTime) {
		// deltaTime value is in seconds
		if (deltaTime === undefined) {
			deltaTime = (Date.now() - this._previousFrameTime) * 0.001;
		}
		this._previousFrameTime = Date.now();
		var currentRenderTarget = this.renderer.getRenderTarget();

		var pass: BasePass, i, il = this.passes.length;
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

	public reset(renderTarget) {

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

	public setSize(width, height) {
		this.renderTarget1.setSize(width, height);
		this.renderTarget2.setSize(width, height);
		for (var i = 0; i < this.passes.length; i++) {
			this.passes[i].setSize(width, height);
		}
	}
}
