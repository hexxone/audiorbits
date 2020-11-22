/**
 * @author D.Thiele @https://hexx.one
 */

export interface BaseShader {

    shaderID: string;
    vertexShader: string ;
    fragmentShader: string;
    uniforms: any;
	defines: any;
}
