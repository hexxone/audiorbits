/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2026 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 */

import { Color,
    FontLoader,
    Mesh,
    MeshPhongMaterial,
    Scene,
    TextGeometry,
    Vector3 } from 'three.ts/src';
import { Smallog } from 'we_utils/src';

/**
 * @todo FIX
 * Fancy Shorthand 3D Text Renderer for THREE js
 * @public
 */
export class FancyText {

    private readonly scene: Scene;
    private textMesh: Mesh | null = null;
    private removeTimeout: number | null = null;


    /**
     * Fancy Shorthand 3D Text Renderer for THREE js
     * @param {Scene} scene Where to append the text
     * @param {Vector3} CPos Position for mesh
     * @param {string} text message to show
     * @param {Vector3} lookAt text front facing Position (null)
     * @param {number} hideAfter seconds to remove msg after (30)
     * @param {string} fontPath custom font (Hexagon_cup)
     */
    constructor(
        scene: Scene,
        CPos: Vector3,
        text: string,
        lookAt: Vector3 = null,
        hideAfter: number = 30,
        fontPath: string = '/css/HEXAGON_cup_font.json'
    ) {
        this.scene = scene;
        const loader = new FontLoader();

        loader.load(
            fontPath,
            (fDat) => {
                const textGeo = new TextGeometry(text, {
                    font: fDat,
                    size: 200,
                    depth: 20,
                    curveSegments: 4,
                    bevelEnabled: false,
                    bevelThickness: 0,
                    bevelSize: 0,
                    bevelOffset: 0
                }).center();

                const textMaterial = new MeshPhongMaterial();

                textMaterial.color = new Color(0xffddbb);
                textMaterial.specular = new Color(0xffffff);

                const textMesh = new Mesh(textGeo, textMaterial);

                textMesh.position.set(CPos.x, CPos.y, CPos.z);

                if (lookAt) {
                    textMesh.lookAt(lookAt);
                }

                this.textMesh = textMesh;
                this.scene.add(textMesh);

                // Remove and dispose so repeated init/reload does not leak text objects.
                this.removeTimeout = window.setTimeout(() => {
                    this.dispose();
                }, hideAfter * 1000);
            },
            undefined,
            (error) => {
                Smallog.warn(`[FancyText] Failed to load font: ${error}`);
            }
        );
    }

    public dispose(): void {
        if (this.removeTimeout !== null) {
            clearTimeout(this.removeTimeout);
            this.removeTimeout = null;
        }

        if (!this.textMesh) {
            return;
        }

        this.scene.remove(this.textMesh);
        this.textMesh.geometry?.dispose();

        if (this.textMesh.material instanceof MeshPhongMaterial) {
            this.textMesh.material.dispose();
        }

        this.textMesh = null;
    }

}
