/**
 * @author D.Thiele @https://hexx.one
 */

import * as THREE from 'three';

// Helper for passes that need to fill the viewport with a single quad.
export class FullScreenQuad {
	camera = null;
	geometry = null;
	mesh = null;
	_mat = null;

	SetMaterial(mat: THREE.Material) {
		this.mesh.material = mat;
	}

	constructor(material) {
		this._mat = material;
		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.geometry = new THREE.PlaneBufferGeometry(2, 2);
		this.mesh = new THREE.Mesh(this.geometry, material);
	}
	
	render(renderer) {
		renderer.render(this.mesh, this.camera);
	}
}
