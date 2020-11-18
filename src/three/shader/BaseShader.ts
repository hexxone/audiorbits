/**
 * @author D.Thiele @https://hexx.one
 */

export abstract class BaseShader {

    shaderID: string = "baseShader";
    vertexShader: string = "";
    fragmentShader: string = "";
    uniforms: any = {};
	defines: any = null;
}
