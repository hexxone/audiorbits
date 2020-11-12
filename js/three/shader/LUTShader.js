/**
 * @author D.Thiele @https://hexx.one
 */

THREE.LUTShader = {

	shaderID: "LUTShader",

  uniforms: {
    tDiffuse: { value: null },
    lutMap: { value: null },
    lutMapSize: { value: 1, },
  },

  vertexShader: `
      precision lowp float;
      //shaderquality

      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,

  fragmentShader: `
      precision lowp float;
      //shaderquality

      #include <common>
      
      #define FILTER_LUT true

      uniform sampler2D tDiffuse;
      uniform sampler2D lutMap;
      uniform float lutMapSize;

      varying vec2 vUv;

      vec4 sampleAs3DTexture(sampler2D tex, vec3 texCoord, float size) {
        float sliceSize = 1.0 / size;                  // space of 1 slice
        float slicePixelSize = sliceSize / size;       // space of 1 pixel
        float width = size - 1.0;
        float sliceInnerSize = slicePixelSize * width; // space of size pixels
        float zSlice0 = floor( texCoord.z * width);
        float zSlice1 = min( zSlice0 + 1.0, width);
        float xOffset = slicePixelSize * 0.5 + texCoord.x * sliceInnerSize;
        float yRange = (texCoord.y * width + 0.5) / size;
        float s0 = xOffset + (zSlice0 * sliceSize);

        #ifdef FILTER_LUT

          float s1 = xOffset + (zSlice1 * sliceSize);
          vec4 slice0Color = texture2D(tex, vec2(s0, yRange));
          vec4 slice1Color = texture2D(tex, vec2(s1, yRange));
          float zOffset = mod(texCoord.z * width, 1.0);
          return mix(slice0Color, slice1Color, zOffset);

        #else

          return texture2D(tex, vec2( s0, yRange));

        #endif
      }

      void main() {
        vec4 originalColor = texture2D(tDiffuse, vUv);
        vec4 tempColor = sampleAs3DTexture(lutMap, originalColor.xyz, lutMapSize);
        tempColor.a = originalColor.a;
        gl_FragColor = tempColor;
      }
    `,
};

THREE.LUTShaderNearest = {
  uniforms: Object.assign({}, THREE.LUTShader.uniforms),
  vertexShader: THREE.LUTShader.vertexShader,
  fragmentShader: THREE.LUTShader.fragmentShader.replace('#define FILTER_LUT', '//'),
};