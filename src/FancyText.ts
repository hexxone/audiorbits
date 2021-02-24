/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Fancy Shorthand 3D Text Renderer for THREE js
 * 
 * @todo
 * - FIX this
 */

import { Font, Mesh, MeshPhongMaterial, TextGeometry } from 'three';
import { myFetch } from './we_utils/src/wasc-worker/WascRT';

export class FancyText {

    private scene: THREE.Scene;

    private mesh: THREE.Mesh;

    constructor(scene: THREE.Scene, CPos: THREE.Vector3, lookAt: THREE.Vector3, text: string, hideAfter: number = 30, fontPath: string = "./css/HEXAGON_cup_font.json") {
        this.scene = scene;
        
        myFetch(fontPath, "json").then(fDat => {

            const textFont = new Font(fDat);
            const textGeo = new TextGeometry(text, {
                font: textFont,
                size: 200,
                height: 5,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            });
    
            const textMaterial = new MeshPhongMaterial(
                { color: 0xffffff, specular: 0xffffff }
            );
    
            const textMesh = new Mesh(textGeo, textMaterial);
            textMesh.position.set(CPos.x, CPos.y, CPos.z);
            textMesh.lookAt(lookAt);
            this.mesh = textMesh;
            scene.add(textMesh);
    
            // hide again
            setTimeout(() => this.Hide(), hideAfter * 1000);

        });
    }

    public Hide() {
        if(this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh = null;
        }
    }
}