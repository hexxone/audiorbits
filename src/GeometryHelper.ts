/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2021 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 *
 * @description
 * Contains and updates the Geometry for AudiOrbits.
 *
 * @todo
 * - customize hue/color audio influence (slider)
 * - implement particle system
 * - implement ps4 experiment
 * - implement cloud experiment
 *
 * - experimental: set buffergeometry drawrange on audio?
 *
 * - add material side "both" switch for vr
 * - test other blending modes
 */
/* eslint-disable no-unused-vars */

import {
	CComponent,
	CSettings,
	Smallog,
	WEAS,
	WascInterface,
	BufferGeometry,
	HSL,
	Object3D,
	Camera,
	Scene,
	Texture,
	TextureLoader,
	BufferAttribute,
	PointsMaterial,
	NormalBlending,
	Points,
	LineBasicMaterial,
	LineSegments,
	Float32BufferAttribute,
	LoadHelper,
	sharedWorker,
	Material,
} from "./we_utils/src";

import { ColorHelper } from "./ColorHelper";
import { NEAR_DIST } from "./ContextHelper";

export const GEO_DIMS = 3;

const cachedBuilders = [];

/**
 * @public
 */
type Level = {
	level: number;
	sets: Subset[];
};

/**
 * @public
 */
type Subset = {
	hasNewData: boolean;
	object: Object3D;
	level: number;
	set: number;
};

/**
 * Level generator settings
 * @public
 */
class LevelSettings extends CSettings {
	geometry_type = 0;

	// <GeneralGeometry>
	num_spread = 50; // relation (max 32K points per subset) <--> (min 4K points per subset)
	num_point = 16; // (x1024² points) inferrs num_levels & num_subsets_per_level & num_points_per_subset
	num_depth = 50; // (orbit depth) inferrs level_depth = x256 / num_levels
	num_scale = 50; // (orbit x-y size) inferrs scaling_factor -> x32

	num_levels = 6;
	level_depth = 1200;
	num_subsets_per_level = 12;
	num_points_per_subset = 4096;
	scaling_factor = 1500;

	level_shifting = false;
	level_spiralize = false;
	// Tunnel generator
	// @todo remove bool & make tunnel bigger
	generate_tunnel = false;
	tunnel_inner_radius = 5;
	tunnel_outer_radius = 5;
	// </GeneralGeometry>

	// <FractalGeometry>
	base_texture = 0;
	texture_size = 7;
	// Algorithm params
	alg_a_min = -25;
	alg_a_max = 25;
	alg_b_min = 0.3;
	alg_b_max = 1.7;
	alg_c_min = 5;
	alg_c_max = 16;
	alg_d_min = 1;
	alg_d_max = 9;
	alg_e_min = 1;
	alg_e_max = 10;
	// </FractalGeometry>

	// Camera category
	fog_thickness = 80;
	// Movement category
	movement_type = 0;
	zoom_val = 1;
	rotation_val = 0;
	// Color category
	color_audio_strength = 0;
	// Brightness category
	default_brightness = 60;
	minimum_brightness = 10;
	maximum_brightness = 90;
	// Saturation category
	default_saturation = 10;
	minimum_saturation = 10;
	maximum_saturation = 90;

	// Audio category
	audiozoom_val = 2;
	reverse_type = 0;
	audiozoom_smooth = false;
	// do dynamic processing?
	equalize = true;
	// time-value smoothing ratios mirrored from WEAS
	audio_increase = 75;
	audio_decrease = 25;
	// seeded random for fractal generator
	random_seed = 0; // user setting
	// VR mode
	xr_mode = false;
}

/**
 * settings required in worker
 * @public
 */
enum WasmSettings {
	geometry_type = 0,
	num_subsets_per_level = 1,
	num_points_per_subset = 2,
	scaling_factor = 3,

	tunnel_inner_radius = 4,
	tunnel_outer_radius = 5,

	alg_a_min = 6,
	alg_a_max = 7,
	alg_b_min = 8,
	alg_b_max = 9,
	alg_c_min = 10,
	alg_c_max = 11,
	alg_d_min = 12,
	alg_d_max = 13,
	alg_e_min = 14,
	alg_e_max = 15,

	real_seed = 16,
	level_depth = 17,
	level_spiralize = 18,
	num_levels = 19,
}

/**
 * Main Geometry component
 * @extends {CComponent}
 * @public
 */
export class GeometryHolder extends CComponent {
	public settings: LevelSettings = new LevelSettings();

	// main orbit data
	private levels: Level[] = [];
	private moveBacks: Int32Array;
	// speed smoothing helper
	private speedVelocity = 0;

	// keep camera position for moving subsets around
	private camera: Camera;

	// actions to perform after render
	private afterRenderQueue = [];

	// generator holder
	private levelBuilder: WascInterface;

	// color holder
	private colorHelpr: ColorHelper;
	// audio provider
	private weas: WEAS;

	private loadHelper: LoadHelper;

	/**
	 * construct component
	 * @param {ColorHelper} colorHelp color provider
	 * @param {WEAS} weas audio provider
	 * @param {LoadHelper} loadHelper load helper
	 */
	constructor(colorHelp: ColorHelper, weas: WEAS, loadHelper: LoadHelper) {
		super();
		this.colorHelpr = colorHelp;
		this.weas = weas;
		this.loadHelper = loadHelper;
	}

	/**
	 * initialize geometry generator, data & objects
	 * @public
	 * @param {Scene} scene parent
	 * @param {Camera} cam renderer
	 * @param {Promise} waitFor (optional)
	 * @return {Promise} res
	 */
	public init(
		scene: Scene,
		cam: Camera,
		waitFor?: Promise<void>
	): Promise<void> {
		return new Promise((res, rej) => {
			this.camera = cam;

			const sett = this.settings;
			// reset generator
			this.afterRenderQueue = [];
			// reset rendering
			this.speedVelocity = 0;

			this.loadHelper.setText("Texture");
			this.loadHelper.setProgress(15);

			// load texture
			let texture: Texture = null;
			if (sett.geometry_type == 0) {
				// get texture path
				const texPth = this.getBaseTexPath();
				Smallog.debug("loading Texture: " + texPth);
				texture = new TextureLoader().load(texPth);
			}

			this.loadHelper.setText("Generator");
			this.loadHelper.setProgress(20);

			// setup fractal generator, get exported functions, push settings & init geometry
			this.getGeoBuilder()
				.then((builder) => (this.levelBuilder = builder))
				.then(() => this.updateSettings())
				.then(() => this.initGeometries(scene, texture, waitFor))
				.then(() => {
					Smallog.debug("Finished building geometries!");
					this.loadHelper.setProgress(this.loadHelper.progress + 5);
					res();
				})
				.catch(rej);
		});
	}

	/**
	 * Get Web-assembly module path/name for given geometry type
	 * @return {string} path
	 */
	private async getGeoBuilder(): Promise<WascInterface> {
		return new Promise((res, rej) => {
			const builderString =
				this.settings.geometry_type == 0
					? "FractalGeometry.wasm"
					: "BasicGeometry.wasm";
			// use from cache?
			if (cachedBuilders[builderString]) res(cachedBuilders[builderString]);
			// initialize new module
			else {
				sharedWorker(builderString)
					.then((myModule) => {
						// @todo test
						if (myModule.shared) {
							Smallog.debug("Got shared memory access to WebAssembly builder!");
						}
						res((cachedBuilders[builderString] = myModule));
					})
					.catch(rej);
			}
		});
	}

	/**
	 * Get Base-texture path
	 * @return {string} path
	 */
	private getBaseTexPath() {
		switch (this.settings.base_texture) {
			case 0:
				return "./img/galaxy.png";
			case 1:
				return "./img/cuboid.png";
			case 2:
				return "./img/fractal.png";
		}
	}

	/**
	 * create WEBGL objects for each level and subset
	 * @param {Scene} scene sc
	 * @param {Texture} texture tx
	 * @param {Promise} waitFor (optional) promise to wait for
	 * @returns {Promise<void>} action
	 */
	private async initGeometries(
		scene: Scene,
		texture: Texture,
		waitFor?: Promise<void>
	) {
		const sett = this.settings;
		const camZ = this.camera.position.z;

		Smallog.debug("building levels.");
		this.loadHelper.setText("Levels");
		this.loadHelper.setProgress(25);

		// reset Orbit data
		this.levels = new Array<Level>(sett.num_levels);

		// set subset moveback counter
		this.moveBacks = new Int32Array(sett.num_levels);
		this.moveBacks.fill(0);

		const hues = this.colorHelpr.hueValues;
		const subsetDist = sett.level_depth / sett.num_subsets_per_level;
		const hlfDepth = (sett.num_levels * sett.level_depth) / 2;

		// create levels
		for (let l = 0; l < sett.num_levels; l++) {
			// create level object
			this.levels[l] = {
				level: l,
				sets: [],
			};

			const lDist = camZ - sett.level_depth * l;
			// create all subsets
			for (let s = 0; s < sett.num_subsets_per_level; s++) {
				// create particle geometry from orbit vertex data
				const geometry = new BufferGeometry();
				// position attribute (2|3 itemSize)
				geometry.setAttribute(
					"position",
					new BufferAttribute(
						new Float32Array(sett.num_points_per_subset * GEO_DIMS),
						GEO_DIMS
					)
				);

				// make the correct object and material for current settinfs
				const object = this.getSubsetObject(geometry, texture);

				// set material defaults
				object.material.color.setHSL(
					hues[s],
					sett.default_saturation / 100,
					sett.default_brightness / 100
				);

				// set Object defaults
				object.position.x = 0;
				object.position.y = 0;

				// position in space
				if (sett.level_shifting) {
					object.position.z = lDist - s * subsetDist * 2;
					// offset every 2nd subset
					if (l % 2 != 0) object.position.z -= subsetDist;
				} else object.position.z = lDist - s * subsetDist;

				// centered around camera?
				if (sett.xr_mode) object.position.z += hlfDepth;

				// TODO move this to webassembly
				// if (sett.level_spiralize) {
				// 	// split angle across subset and regard previous rotation, lel why not
				// 	object.rotation.z = - (l * deg45rad + (s * deg45rad / sett.num_subsets_per_level));
				// }
				// else object.rotation.z = -deg45rad;

				// add to scene
				scene.add(object);
				this.levels[l].sets[s] = {
					hasNewData: false,
					object: object,
					level: l,
					set: s,
				};
			}
		}

		// trigger level generation once
		await Promise.all(this.levels.map((o, l) => this.generateLevel(l)));

		this.loadHelper.setText("Level Data");

		// apply data
		while (this.afterRenderQueue.length > 0) {
			this.afterRenderQueue.shift()();
		}

		this.loadHelper.setProgress(this.loadHelper.progress + 5);

		// generate standby data for first move-back
		/* const stndBy = */
		Promise.all(this.levels.map((o, l) => this.generateLevel(l)));

		// wait for something else?
		if (waitFor) {
			// wait for 2nd data?
			// await stndBy;

			// apply data
			// while (this.afterRenderQueue.length > 0) {
			// 	this.afterRenderQueue.shift()();
			// }

			// wait for control flow
			await waitFor;
		}
	}

	/**
	 * returns the correct object and Material for a Subset
	 * @param {BufferGeometry} geometry source shape
	 * @param {Texture} texture source style
	 * @return {Object3D} result subset
	 */
	private getSubsetObject(
		geometry: BufferGeometry,
		texture: Texture
	): Object3D {
		let object: Object3D;
		let material: Material;

		// default fractal geometry
		if (this.settings.geometry_type == 0) {
			// create material
			material = new PointsMaterial();
			material.map = texture;
			material.size = this.settings.texture_size;
			material.blending = NormalBlending; // AdditiveBlending; NormalBlending
			material.depthTest = false;
			material.transparent = true;

			// create particle system from geometry and material
			object = new Points(geometry, material);
		} else if (this.settings.geometry_type == 1) {
			// line geometry type
			material = new LineBasicMaterial();
			material.linewidth = this.settings.texture_size;

			// create lineloop system from geometry and material
			object = new LineSegments(geometry, material);
		}

		// !!! @TODO !!!
		// Disable bounding Box generation
		// Stops these errors:
		// BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.
		// See here: https://github.com/mrdoob/three.js/issues/19735
		object.frustumCulled = this.settings.xr_mode;

		return object;
	}

	// /////////////////////////////////////////////
	// FRACTAL GENERATOR
	// /////////////////////////////////////////////

	/**
	 * Sends the numeric worker settings to webassembly
	 * @public
	 * @return {Promise} finished event
	 */
	public updateSettings(): Promise<void> {
		// CAVEAT: only available after init and module load
		if (!this.levelBuilder) return;

		// apply seed & settings
		let tempSettings = Object.assign(
			{ real_seed: this.getSeed() },
			this.settings
		);
		// apply algorithm params
		tempSettings = Object.assign(tempSettings, this.getParameters());

		// transfer settings to worker
		let keys = Object.keys(WasmSettings);
		keys = keys.slice(keys.length / 2);
		const sett = new Float32Array(keys.length);
		for (let index = 0; index < keys.length; index++) {
			const key = keys[index];
			// apply key value
			sett[WasmSettings[key]] = tempSettings[key] * 1 || 0;
		}

		// params Data pass to worker
		const args = {
			data: sett.buffer,
		};
		// WRAP IN isolated Function ran inside worker
		return this.levelBuilder
			.run(({ module, instance, exports, params }) => {
				const ex = instance.exports as any;
				// Data passed in worker
				const { data } = params[0];
				const arrData = new Float32Array(data);
				// get the direct view from the module memory and set the new buffer data
				exports.__getFloat32ArrayView(ex.levelSettings).set(arrData);
				// generate new data structure with updated settings
				ex.update();
			}, args)
			.then(() => {
				Smallog.debug("Sent Settings to Generator: " + JSON.stringify(sett));
			});
	}

	/**
	 * Get randomized or predefined random-seed
	 * @return {number} seed [0-233279]
	 */
	private getSeed(): number {
		if (this.settings.random_seed < 1) {
			const useed = Math.floor(Math.random() * 233279);
			Smallog.debug("Using random seed: " + useed);
			return useed;
		} else return Math.abs(this.settings.random_seed) % 233280;
	}

	/**
	 * Calculate & return algorithm parameters
	 * @return {any} algorithm parameters
	 */
	private getParameters() {
		// @TODO
		return {
			alg_a_min: 6,
			alg_a_max: 7,
			alg_b_min: 8,
			alg_b_max: 9,
			alg_c_min: 10,
			alg_c_max: 11,
			alg_d_min: 12,
			alg_d_max: 13,
			alg_e_min: 14,
			alg_e_max: 15,
		};
	}

	/**
	 * send worker event for generating a level
	 * @param {number} level for what we are generating
	 * @return {Promise} finiished event
	 */
	private generateLevel(level: number): Promise<void> {
		Smallog.debug("generating level: " + level);

		const shared = this.levelBuilder.shared != null;

		const start = performance.now();
		const { run } = this.levelBuilder;

		const lvlPercent = (85 - 25) / this.settings.num_levels; // / 2;

		/**
		 * Data pass to worker
		 * @public
		 */
		const workerParams = {
			level: level,
			isShared: shared,
		};

		// isolated Function ran inside worker
		return run(({ module, instance, exports, params }) => {
			const ex = instance.exports as any;
			// Data passed in worker
			const { level, isShared } = params[0];
			// assembly level Building
			// returns pointer to int32-array with float-references
			const dataPtr = ex.build(level);
			// iterate over all pointers
			const setPtrs = exports.__getInt32Array(dataPtr);

			// gather transferrable float-arrays
			const resultObj = {};
			if (isShared) {
				// copy the pointer, since direct access is possible
				setPtrs.forEach((ptr, i) => (resultObj["ptr_" + i] = ptr));
			} else {
				// we make a hard-copy
				// exports.__getFloat32ArrayView(ptr));
				setPtrs.forEach(
					(ptr, i) =>
						(resultObj["set_" + i] = new Float32Array(
							exports.__getFloat32ArrayView(ptr)
						).buffer)
				);
			}

			// transfer data
			return resultObj;
		}, workerParams)
			.then(async (result) => {
				// worker result, back in main context
				const subbs = this.levels[level].sets;
				const setsPerLvl = this.settings.num_subsets_per_level;

				this.loadHelper.setText(
					`Level<br>${level + 1} / ${this.settings.num_levels}`
				);
				this.loadHelper.setProgress(this.loadHelper.progress + lvlPercent);

				// spread over time for less thread blocking
				for (let s = 0; s < setsPerLvl; s++) {
					let data: Float32Array;
					if (shared) {
						// @todo TEST & check if offset is needed?
						// @todo get correct length from bufferPtr - offset
						// get from shared buffer
						const ptr = result["ptr_" + s];
						// data = new Float32Array(buff.slice(ptr, ptr + ptsPerSet * 3));
						data = await this.levelBuilder.shared.__getFloat32Array(ptr);
					}
					// apply actual last Data from worker
					this.afterRenderQueue.push(async () => {
						if (!shared) {
							// get from transferred data
							data = new Float32Array(result["set_" + s]);
						}
						// console.debug(`DataPeak=`, data.subarray(0, 10));

						(
							subbs[s].object.geometry.attributes
								.position as Float32BufferAttribute
						).set(data, 0);
						subbs[s].hasNewData = true;
					});
				}
				const dbgT = performance.now() - start,
					vertS =
						(this.settings.num_subsets_per_level *
							this.settings.num_points_per_subset) /
						3 /
						(dbgT / 1000);
				// print info
				Smallog.debug(
					`Generated Level=${level}, Time=${dbgT.toFixed(
						2
					)} ms, ${vertS.toFixed(2)} vert/s`
				);
			})
			.catch((e) => {
				Smallog.error(
					"Generate Error at Level='" + level + "', Msg='" + e.toString() + "'"
				);
			});
	}

	// /////////////////////////////////////////////
	// move geometry
	// /////////////////////////////////////////////

	/**
	 * Update position & color with audio data
	 * @param {number} ellapsed ms
	 * @param {number} deltaTime multiplier
	 * @returns {void}
	 */
	private updateWithAudio(ellapsed, deltaTime) {
		const sett = this.settings;

		// calc audio boost
		const lastAudio = this.weas.lastAudio;
		const strengthMult = (20 + sett.audio_increase) / 110;
		const boost = lastAudio.intensity * strengthMult * (sett.equalize ? 4 : 1);

		// get targeted saturation
		const minSat = sett.minimum_saturation / 120;
		const maxSat = sett.maximum_saturation / 100;
		// get targeted brightness
		const minBri = sett.minimum_brightness / 177.77777;
		const maxBri = sett.maximum_brightness / 122.22222;

		// calculate scale helper
		// perceived brightness is not linear but exponential because of "additive" mixing mode!
		// slightly lower sclaing multiplier should account for this...
		const scaleBri = ((maxBri - minBri) * boost) / 120;
		const scaleSat = ((maxSat - minSat) * boost) / 100;

		// move as many calculations out of loop as possible
		const colObject = this.colorHelpr.colorObject;
		const hues = this.colorHelpr.hueValues;
		const color_mode = this.colorHelpr.settings.color_mode;
		const camZ = this.camera.position.z;

		// calculate step distance between levels
		const orbtSize = sett.num_levels * sett.level_depth - NEAR_DIST;
		const step = (orbtSize * 1.2) / 128;
		const reversed = sett.movement_type == 1;

		// speed velocity calculation
		let spvn = (sett.zoom_val / 4) * deltaTime;
		let rot = sett.rotation_val / 5000;
		if (sett.audiozoom_val > 0) {
			spvn += ((boost * sett.audiozoom_val) / 30) * deltaTime;
			rot *= ((boost * sett.audiozoom_val) / 150) * deltaTime;
		}

		// speed / zoom smoothing
		if (sett.audiozoom_smooth) {
			const diff = spvn - this.speedVelocity;
			const mlt = diff > 0 ? sett.audio_increase : sett.audio_decrease;
			spvn -= (diff * mlt) / 300;
		}

		switch (sett.reverse_type) {
			case 1: // no negative zoom?
				if (spvn < 0) spvn = 0;
				break;
			case 2: // convert negative zoom?
				if (spvn < 0) spvn = Math.abs(spvn);
				break;
		}

		// inverted movement type?
		if (reversed) {
			spvn *= -1;
		}

		// velocity and rotation finished
		// Smallog.debug('Audio data: ' + JSON.stringify([lastAudio, boost, step, this.speedVelocity, spvn]));
		this.speedVelocity = spvn;
		rot *= deltaTime;

		// dont re-declare this every time
		let lv: number;
		let level: Level;
		let ss: number;
		let prnt: Subset;
		let stepDist;
		let freqIdx;
		let freqVal;
		let freqLvl;
		let targetHue;
		let targetSat;
		let targetLight;

		const isEQ = this.weas.settings.equalize;

		// process all levels
		for (lv = 0; lv < this.levels.length; lv++) {
			level = this.levels[lv];
			// process all subset childrens
			for (ss = 0; ss < level.sets.length; ss++) {
				prnt = level.sets[ss];

				// velocity & rotation
				prnt.object.position.z += spvn;
				prnt.object.rotation.z -= rot;
				this.checkPosition(prnt);

				// targeted HUE
				targetHue = Math.abs(hues[prnt.set]);

				// use "obj"-to-"camera" distance with "step" to get "frequency" data
				// then process it
				const dist = camZ - prnt.object.position.z;
				stepDist = Math.round(dist / step);
				freqIdx = Math.min(lastAudio.data.length, Math.max(0, stepDist - 2));
				freqVal = lastAudio.data[freqIdx];
				freqLvl = (freqVal * strengthMult) / 3 / lastAudio.average;
				// uhoh ugly special case
				if (color_mode == 4) {
					targetHue += ((colObject.hueB - targetHue) * freqVal) / lastAudio.max;
				} else if (color_mode == 0) {
					targetHue += (freqLvl * sett.color_audio_strength) / 300;
				}
				// quick maths
				targetSat = minSat + freqLvl * scaleSat;
				targetLight = minBri + (freqLvl * scaleBri) / 1.69;

				// update dat shit
				prnt.object.material.color.setHSL(
					this.clamp(targetHue, 0, 1, true),
					this.clamp(targetSat, 0, 2),
					this.clamp(targetLight, 0, 0.9)
				);

				// distance scaling
				const distScale = Math.pow(1.1 - dist / orbtSize, 3) / 2;
				prnt.object.scale.z = distScale * 1.5;

				// variable sizing
				const pm = prnt.object.material as PointsMaterial;
				pm.size =
					this.settings.texture_size * distScale * 0.75 +
					freqLvl / (isEQ ? 1.5 : 3);

				// opacity fading (replaces exp fog)
				// const X = dist / orbtSize + P / 5 - 0.2 + 0.4 * P;
				// pm.opacity = Math.max(
				// 	Math.min(
				// 		1 -
				// 			X +
				// 			(0.1337 + P * 0.1) * Math.sin(1.5 * Math.PI * X),
				// 		1
				// 	),
				// 	0
				// );
			}
		}
	}

	/**
	 * Update position & color without audio
	 * @param {number} ellapsed ms
	 * @param {number} deltaTime multiplier
	 * @returns {void}
	 */
	private updateNoAudio(ellapsed, deltaTime) {
		const sett = this.settings;
		const reversed = sett.movement_type == 1;
		// get targeted saturations & brightness
		const defSat = sett.default_saturation / 100;
		const defBri =
			((sett.default_brightness / 142) * Math.min(5, sett.texture_size)) /
			sett.texture_size;

		const orbtSize = sett.num_levels * sett.level_depth;
		const camZ = this.camera.position.z;

		let spvn = (sett.zoom_val / 4) * deltaTime;
		let rot = sett.rotation_val / 5000;

		// speed / zoom smoothing
		const diff = spvn - this.speedVelocity;
		const mlt = diff > 0 ? sett.audio_increase : sett.audio_decrease;
		spvn -= (diff * mlt) / 300;

		switch (sett.reverse_type) {
			case 1: // no negative zoom?
				if (spvn < 0) spvn = 0;
				break;
			case 2: // convert negative zoom?
				if (spvn < 0) spvn = Math.abs(spvn);
				break;
		}

		// inverted movement type?
		if (reversed) {
			spvn *= -1;
		}

		// velocity and rotation finished
		this.speedVelocity = spvn;
		rot *= deltaTime;

		// move as many calculations out of loop as possible
		const sixtyDelta = deltaTime * 300;
		const hues = this.colorHelpr.hueValues;

		// Opacity
		// const P = sett.fog_thickness / 100;

		// dont re-declare this every time... should be faster
		let lv: number;
		let level: Level;
		let ss: number;
		let prnt: Subset;
		const hsl: HSL = { h: 0, s: 0, l: 0 };
		let targetHue;

		// process all levels
		for (lv = 0; lv < this.levels.length; lv++) {
			level = this.levels[lv];
			// process all subset childrens
			for (ss = 0; ss < level.sets.length; ss++) {
				prnt = level.sets[ss];

				// velocity & rotation
				prnt.object.position.z += spvn;
				prnt.object.rotation.z -= rot;
				this.checkPosition(prnt);

				// targeted HUE
				targetHue = Math.abs(hues[prnt.set]);

				// get current HSL
				prnt.object.material.color.getHSL(hsl);
				// targeted HUE
				if (Math.abs(targetHue - hsl.h) > 0.01) {
					hsl.h += (targetHue - hsl.h) / sixtyDelta;
				}
				// targeted saturation
				if (Math.abs(defSat - hsl.s) > 0.01) {
					hsl.s += (defSat - hsl.s) / sixtyDelta;
				}
				// targeted brightness
				if (Math.abs(defBri - hsl.l) > 0.01) {
					hsl.l += (defBri - hsl.l) / sixtyDelta;
				}
				// clamping happens in method
				prnt.object.material.color.setHSL(hsl.h, hsl.s, hsl.l);

				// helper
				const dist = Math.abs(camZ - prnt.object.position.z);
				const distScale = 1.2 - dist / orbtSize;

				// sizing
				const pm = prnt.object.material as PointsMaterial;
				pm.size = this.settings.texture_size * distScale;

				// scaling
				prnt.object.scale.z = distScale * 2;

				// opacity fading (replaces exp fog)
				// const X = dist / orbtSize + P / 5 - 0.2 + 0.5 * P;
				// pm.opacity = Math.max(
				// 	Math.min(
				// 		-X + 1 + (0.1337 + P * 0.1) * Math.sin(2 * Math.PI * X),
				// 		1
				// 	),
				// 	0
				// );
			}
		}
	}

	/**
	 * Check if a Subset has to be moved back or forth
	 * @param {Subset} prnt Object to check
	 * @returns {void}
	 */
	private checkPosition(prnt: Subset) {
		const orbitSize = this.settings.num_levels * this.settings.level_depth;
		const hlfSize = orbitSize / 2;

		let maxPos = this.camera.position.z + this.settings.level_depth;
		let minPos = maxPos - orbitSize;
		// ceentered around camera movement
		if (this.settings.xr_mode) {
			maxPos += hlfSize;
			minPos += hlfSize;
		}

		let moved = false;
		if (prnt.object.position.z > maxPos) {
			// reset to back if behind cam
			prnt.object.position.z -= orbitSize;
			moved = true;
		} else if (prnt.object.position.z < minPos) {
			// reset behind cam if too far away
			prnt.object.position.z += orbitSize;
			moved = true;
		}
		if (moved) {
			this.moveBacks[prnt.level]++;
			// update the child geometry only when it gets moved
			if (prnt.hasNewData) {
				prnt.hasNewData = false;
				prnt.object.geometry.attributes.position.needsUpdate = true;
			}
			// process subset generation
			if (
				Math.abs(this.moveBacks[prnt.level]) ==
				this.settings.num_subsets_per_level
			) {
				this.moveBacks[prnt.level] = 0;
				this.generateLevel(prnt.level);
			}
		}
	}

	/**
	 * Update managing function
	 * @public
	 * @param {number} ellapsed ms
	 * @param {number} deltaTime multiplier ~1
	 * @returns {void}
	 */
	public updateFrame(ellapsed, deltaTime) {
		if (this.weas.hasAudio()) {
			this.updateWithAudio(ellapsed, deltaTime);
		} else {
			this.updateNoAudio(ellapsed, deltaTime);
		}

		// randomly do one after-render-aqction
		if (this.afterRenderQueue.length > 0) {
			if (this.speedVelocity > 5 || Math.random() > 0.4) {
				const action = this.afterRenderQueue.shift();
				setTimeout(action, 1);
			}
		}
	}

	/**
	 * correct colors to be safe
	 * @param {number} val Origin value
	 * @param {number} min Minimum allowed
	 * @param {number} max Maximum allowed
	 * @param {boolean} goround Wrap around, instead of limiting?
	 * @return {number} corrected value
	 */
	private clamp(val: number, min: number, max: number, goround = false) {
		if (goround) {
			if (val < min) return max - val;
			return val % max;
		} else return Math.max(Math.min(val, max), min);
	}
}
