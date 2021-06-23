/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*/

import {Font, Mesh, MeshPhongMaterial, TextGeometry} from 'three';
import {WascUtil} from './we_utils';

/**
* @todo FIX
* Fancy Shorthand 3D Text Renderer for THREE js
* @public
*/
export class FancyText {
	private scene: THREE.Scene;
	private mesh: THREE.Mesh;

	/**
	* Fancy Shorthand 3D Text Renderer for THREE js
	* @param {THREE.Scene} scene Where to append the text
	* @param {THREE.Vector3} CPos Position for mesh
	* @param {THREE.Vector3} lookAt Position to look at
	* @param {string} text message to show
	* @param {number} hideAfter seconds to remove msg after (default = 30)
	* @param {string} fontPath custom font (default = Hexagon)
	*/
	constructor(scene: THREE.Scene, CPos: THREE.Vector3, lookAt: THREE.Vector3, text: string, hideAfter = 30, fontPath = '/css/HEXAGON_cup_font.json') {
		this.scene = scene;

		WascUtil.myFetch(fontPath, 'json').then((fDat) => {
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
				bevelSegments: 5,
			});

			const textMaterial = new MeshPhongMaterial(
				{color: 0xffddbb, specular: 0xffffff},
			);

			const textMesh = new Mesh(textGeo, textMaterial);
			textMesh.position.set(CPos.x, CPos.y, CPos.z);
			textMesh.lookAt(lookAt);
			this.mesh = textMesh;
			scene.add(textMesh);

			// hide again
			setTimeout(() => this.hide(), hideAfter * 1000);
		});
	}

	/**
		* Remove message
		* @public
		*/
	public hide() {
		if (this.mesh) {
			this.scene.remove(this.mesh);
			this.mesh = null;
		}
	}
}


