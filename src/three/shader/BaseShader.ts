/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2021 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

/**
 * This is a definition wrapper, connecting the "compiled" workers to the actual worker loader.
 */
export interface BaseShader {
    shaderID: string;
    vertexShader: string;
    fragmentShader: string;
    uniforms: any;
    defines: any;
}
