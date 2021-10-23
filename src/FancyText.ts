/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*/

import {FontLoader, Mesh, MeshPhongMaterial, TextGeometry} from 'three';

/**
* @todo FIX
* Fancy Shorthand 3D Text Renderer for THREE js
* @public
*/
export class FancyText {
	/**
	* Fancy Shorthand 3D Text Renderer for THREE js
	* @param {THREE.Scene} scene Where to append the text
	* @param {THREE.Vector3} CPos Position for mesh
	* @param {string} text message to show
	* @param {THREE.Vector3} lookAt text front facing Position (null)
	* @param {number} hideAfter seconds to remove msg after (30)
	* @param {string} fontPath custom font (Hexagon_cup)
	*/
	constructor(scene: THREE.Scene, CPos: THREE.Vector3, text: string, lookAt: THREE.Vector3 = null, hideAfter: number = 30, fontPath: string = '/css/HEXAGON_cup_font.json') {
		const loader = new FontLoader();
		loader.load(fontPath, (fDat) => {
			const textGeo = new TextGeometry(text, {
				font: fDat,
				size: 200,
				height: 200,
				curveSegments: 12,
				bevelEnabled: false,
				bevelThickness: 10,
				bevelSize: 8,
				bevelOffset: 0,
				bevelSegments: 5,
			});

			const textMaterial = new MeshPhongMaterial(
				{color: 0xffddbb, specular: 0xffffff},
			);

			const textMesh = new Mesh(textGeo, textMaterial);
			textMesh.position.set(CPos.x, CPos.y, CPos.z);

			if (lookAt) textMesh.lookAt(lookAt);
			scene.add(textMesh);

			// hide again
			setTimeout(() => {
				scene.remove(textMesh);
			}, hideAfter * 1000);
		});
	}
}


