/**
 * @author D.Thiele @https://hexx.one
 */

import { BaseShader } from "./BaseShader";

export class BlendShader implements BaseShader {

    defines = null;

    shaderID = "blendShader";

    uniforms = {
        tDiffuse: { value: null },
        overlayBuffer: { value: null },
        mixValue: { value: 1 }
    };

    // default vertex shader
    vertexShader = `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    // simple blending Shader
    fragmentShader = `
		uniform sampler2D tDiffuse;
        uniform sampler2D overlayBuffer;
        
        varying vec2 vUv;
        
		void main() {
			vec4 texel1 = texture2D(tDiffuse, vUv);
			vec4 texel2 = texture2D(overlayBuffer, vUv);
			vec4 diff = abs(texel1 - texel2);
			gl_FragColor = vec4(diff, 1.0);
		}
    `;
}
