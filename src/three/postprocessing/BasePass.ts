/**
 * @author D.Thiele @https://hexx.one
 */

export interface BasePass {
	// if set to true, the pass is processed by the composer
	enabled: boolean; // = true;

	// if set to true, the pass indicates to swap read and write buffer after rendering
	needsSwap: boolean; // = true;

	// if set to true, the pass clears its buffer before rendering
	clear: boolean; // = false;

	// if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
	renderToScreen: boolean; // = false;

	setSize(width, height);

	render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
}
