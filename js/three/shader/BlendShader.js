/**
 * @author D.Thiele @https://hexx.one
 */

THREE.BlendShader = {

    shaderID: "blendShader",

    uniforms: {
        tDiffuse: { value: null },
        overlayBuffer: { value: null },
        mixValue: { value: 1 }
    },

    // default vertex shader
    vertexShader: `
        precision lowp float;
        //shaderquality

        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    // simple blending Shader
    fragmentShader: `
        precision lowp float;
        //shaderquality

		uniform sampler2D tDiffuse;
        uniform sampler2D overlayBuffer;
        
        varying vec2 vUv;
        
		void main() {
			vec4 texel1 = texture2D(tDiffuse, vUv);
			vec4 texel2 = texture2D(overlayBuffer, vUv);
			vec4 diff = abs(texel1 - texel2);
			gl_FragColor = vec4(diff, 1.0);
		}
    `,
};
