/**
 * @author D.Thiele @https://hexxon.me
 * 
 * Inspired by ackleyrc: https://www.shadertoy.com/view/llXcRl 
 */

THREE.FractalMirrorShader = {

  shaderID: "fractalMirror",

  uniforms: {
    tDiffuse: { value: null },
    iResolution: { value: new THREE.Vector2(16, 9) },
    numSides: { value: 2.0 }, // minimum value
    angleOffset: { value: 0.0 },
    invert: { value: false }
  },

  vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,

  fragmentShader: `
      precision mediump float;

      uniform sampler2D tDiffuse;
      uniform vec2 iResolution;
      uniform float numSides;
      uniform float angleOffset;
      uniform bool invert;

      varying vec2 vUv;

      const float PI = 3.14159265359;

      void main() {
        vec2 center = vec2(1.0, 1.0) / 2.0;
        vec2 uv = center - vUv;
        float KA = PI / numSides;
        float angle = abs (mod (atan (uv.y, uv.x), 2.0 * KA) - KA) + angleOffset;
        vec2 transformed = length(uv) * vec2(cos(angle), sin(angle));
        float zoom = iResolution.x / iResolution.y * 0.85;
        if(!invert) transformed = transformed / zoom + center;
        gl_FragColor = texture2D(tDiffuse, transformed);
      }
    `,
};