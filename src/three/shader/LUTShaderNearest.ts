/**
 * @author D.Thiele @https://hexx.one
 */

import { LUTShader } from "./LUTShader";

export class LUTShaderNearest extends LUTShader {
    fragmentShader = new LUTShader().fragmentShader.replace('#define FILTER_LUT', '//');
}
