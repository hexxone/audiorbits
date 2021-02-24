/**
 * @author alteredq / http://alteredqualia.com/
 * 
 * @author hexx.one
 */

import { LinearFilter, RGBAFormat, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three';
import { BasePass } from './BasePass';

const defaultParams = {
	minFilter: LinearFilter,
	magFilter: LinearFilter,
	format: RGBAFormat,
	stencilBuffer: false
};

export class EffectComposer {

	private renderer = null;
	private initSize: Vector2;

	private globalPrecision: string;

	private _previousFrameTime = Date.now();

	private defaultTarget: WebGLRenderTarget;

	private renderWrite: WebGLRenderTarget = null;
	private writeBuffer: WebGLRenderTarget = null;

	private renderRead: WebGLRenderTarget = null;
	private readBuffer: WebGLRenderTarget = null;

	// render by default
	public renderToScreen: boolean = true;
	public passes: BasePass[] = [];

	// CURENTLY NOT USED
	public enabled: boolean = true;
	public needsSwap: boolean = false;
	public clear: boolean;


	constructor(renderer: WebGLRenderer, globalPrec: string = "mediump", renderTarget?: WebGLRenderTarget) {

		this.renderer = renderer;
		this.initSize = renderer.getDrawingBufferSize(new Vector2());

		// use a new default render target if none is given
		this.defaultTarget = new WebGLRenderTarget(this.initSize.width, this.initSize.height, defaultParams);
		this.defaultTarget.texture.name = 'EffectComposer.dt';

		if (renderTarget === undefined) {
			renderTarget = this.defaultTarget.clone();
			renderTarget.texture.name = 'EffectComposer.wt';
		}

		// set write buffer for shader pass rendering
		this.renderWrite = renderTarget;
		this.writeBuffer = this.renderWrite;

		// set input buffer for shader pass rendering
		this.renderRead = renderTarget.clone();
		this.renderRead.texture.name = 'EffectComposer.rt';
		this.readBuffer = this.renderRead;

		this.passes = [];
		this._previousFrameTime = Date.now();
		this.globalPrecision = globalPrec;
	}

	public addPass(pass: BasePass) {
		const p = this.wrapPrecision(pass);
		this.passes.push(p);
		p.setSize(this.initSize.width, this.initSize.height);
	}

	public insertPass(pass: BasePass, index: number) {
		this.passes.splice(index, 0, this.wrapPrecision(pass));
	}

	public isLastEnabledPass(passIndex: number) {
		for (var i = passIndex + 1; i < this.passes.length; i++) {
			if (this.passes[i].enabled) return false;
		}
		return true;
	}

	public render(deltaTime?: number) {
		// deltaTime value is in seconds
		if (deltaTime === undefined) {
			deltaTime = (Date.now() - this._previousFrameTime) * 0.001;
		}
		this._previousFrameTime = Date.now();
		const currentRenderTarget = this.renderer.getRenderTarget();

		this.passes.forEach((pass, i) => {
			if (pass.enabled === false) return;
			pass.renderToScreen = (this.renderToScreen && this.isLastEnabledPass(i));
			pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, false);
			if (pass.needsSwap) this.swapBuffers();
		});

		this.renderer.setRenderTarget(currentRenderTarget);
	}

	public reset(renderTarget?: WebGLRenderTarget) {

		if (renderTarget === undefined) {
			renderTarget = this.defaultTarget.clone();
			renderTarget.texture.name = 'EffectComposer.wt';
		}

		this.renderWrite.dispose();
		this.renderRead.dispose();

		this.renderWrite = renderTarget;
		this.writeBuffer = this.renderWrite;

		this.renderRead = renderTarget.clone();
		this.renderRead.texture.name = 'EffectComposer.rt';
		this.readBuffer = this.renderRead;

		this.passes = [];
	}

	public setSize(width: number, height: number) {
		this.renderWrite.setSize(width, height);
		this.renderRead.setSize(width, height);
		this.passes.forEach(pass => pass.setSize(width, height))
	}

	/* UTILS */

	private wrapPrecision(pass: BasePass): BasePass {
		const copy = pass as any;
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

	private swapBuffers() {
		const tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
	}
}
