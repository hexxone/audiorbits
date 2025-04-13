/**
 * @author alteredq / http://alteredqualia.com/
 * 
 * @license
 * Copyright (c) 2025 hexxone All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 *
 * @description
 * Full-screen textured quad shader
 */

THREE.CopyShader = {

    uniforms: {
        tDiffuse: { value: null },
        opacity: { value: 1.0 }
    },

    vertexShader: `
        varying vec2 vUv;

        void main() {

            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
    `,

    fragmentShader: `
        uniform float opacity;
        uniform sampler2D tDiffuse;
        varying vec2 vUv;

        void main() {

            vec4 texel = texture2D( tDiffuse, vUv );
            gl_FragColor = opacity * texel;
        }
    `
};
