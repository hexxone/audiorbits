/**
 * @author D.Thiele @https://hexx.one
 */

import { BufferGeometry, Camera, Material, Mesh, OrthographicCamera, PlaneBufferGeometry } from 'three';

// Helper for passes that need to fill the viewport with a single quad.
export class FullScreenQuad {
	private _mat = null;

	public camera: Camera = null;
	public geometry: BufferGeometry = null;
	public mesh: Mesh = null;

	constructor(material) {
		this._mat = material;
		this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.geometry = new PlaneBufferGeometry(2, 2);
		this.mesh = new Mesh(this.geometry, material);
	}

	public SetMaterial(mat: Material) {
		this.mesh.material = mat;
	}

	public render(renderer) {
		renderer.render(this.mesh, this.camera);
	}

	public dispose() {
		this.camera.clear();
		this.mesh.clear();
		this.geometry.dispose();
	}
}
