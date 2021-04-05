/**
* @author alteredq / http://alteredqualia.com/
*
* @author hexxone / https://hexx.one
*/

import {BufferGeometry, Camera, Material, Mesh, OrthographicCamera, PlaneBufferGeometry, WebGLRenderer} from 'three';

/**
 * Helper for passes that need to fill the viewport with a single quad.
 * used to render on a PlaneGeometry ("texture")
 */
export class FullScreenQuad {
	private _mat = null;

	public camera: Camera = null;
	public geometry: BufferGeometry = null;
	public mesh: Mesh = null;

	/**
	 * instantiate
	 * @param {Material} material
	 */
	constructor(material: Material) {
		this._mat = material;
		this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.geometry = new PlaneBufferGeometry(2, 2);
		this.mesh = new Mesh(this.geometry, material);
	}

	/**
	 * Change mesh material
	 * @param {Material} mat
	 */
	public setMaterial(mat: Material) {
		this.mesh.material = mat;
	}

	/**
	 * Render the 2D-environment
	 * @param {WebGLRenderer} renderer
	 */
	public render(renderer: WebGLRenderer) {
		renderer.render(this.mesh, this.camera);
	}

	/**
	 * Destroy 2D-environment
	 */
	public dispose() {
		this.camera.clear();
		this.mesh.clear();
		this.geometry.dispose();
	}
}
