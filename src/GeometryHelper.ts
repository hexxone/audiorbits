
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

import {AdditiveBlending, BufferAttribute, BufferGeometry, Camera, Color, HSL, LineBasicMaterial, LineSegments, Material, NormalBlending, Object3D, Points, PointsMaterial, Scene, Texture, TextureLoader} from 'three';

import {ColorHelper} from './ColorHelper';
import {CComponent, CSettings, Smallog, WEAS, WascInterface, wascWorker} from './we_utils';
import {NEAR_DIST} from './ContextHelper';

export const GEO_DIMS = 3;

/**
* @public
*/
interface Level {
	level: number;
	sets: Subset[];
}

/**
* @public
*/
interface Subset {
	hasNewData: boolean;
	object: T3Object;
	level: number;
	set: number;
}

/**
* Custom object helper
* @public
*/
class T3Object extends Object3D {
	geometry: BufferGeometry & { attributes: { position: BufferAttribute } };
	material: Material & { color: Color };
}

/**
* Level generator settings
* @public
*/
class LevelSettings extends CSettings {
	geometry_type: number = 0;
	num_levels: number = 6;
	level_depth: number = 1200;
	level_shifting: boolean = false;
	level_spiralize: boolean = false;
	num_subsets_per_level: number = 12;
	num_points_per_subset: number = 4096;
	base_texture: number = 0;
	texture_size: number = 7;
	// Tunnel generator
	generate_tunnel: boolean = false;
	tunnel_inner_radius: number = 5;
	tunnel_outer_radius: number = 5;
	// Algorithm params
	alg_a_min: number = -25;
	alg_a_max: number = 25;
	alg_b_min: number = 0.3;
	alg_b_max: number = 1.7;
	alg_c_min: number = 5;
	alg_c_max: number = 16;
	alg_d_min: number = 1;
	alg_d_max: number = 9;
	alg_e_min: number = 1;
	alg_e_max: number = 10;
	// mirrored setting
	scaling_factor: number = 1500;
	// Movement category
	movement_type: number = 0;
	zoom_val: number = 1;
	rotation_val: number = 0;
	// Brightness category
	default_brightness: number = 60;
	minimum_brightness: number = 10;
	maximum_brightness: number = 90;
	// Saturation category
	default_saturation: number = 10;
	minimum_saturation: number = 10;
	maximum_saturation: number = 90;
	// Audio category
	audiozoom_val: number = 2;
	reverse_type: number = 0;
	audiozoom_smooth: boolean = false;
	// time-value smoothing ratio
	// mirrored on WEAS
	audio_increase: number = 75;
	audio_decrease: number = 25;
	// seeded random for fractal generator
	random_seed: number = 0; // user setting
	real_seed: number = 0; // transfer settings
	// VR mode
	xr_mode: boolean = false;
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

	/**
	* construct component
	* @param {ColorHelper} colorHelp color provider
	* @param {WEAS} weas audio provider
	*/
	constructor(colorHelp: ColorHelper, weas: WEAS) {
		super();
		this.colorHelpr = colorHelp;
		this.weas = weas;
	}

	/**
	* initialize geometry generator, data & objects
	* @public
	* @param {Scene} scene parent
	* @param {Camera} cam renderer
	* @param {Promise} waitFor (optional)
	*/
	public async init(scene: Scene, cam: Camera, waitFor?: Promise<void>) {
		this.camera = cam;

		const sett = this.settings;
		// reset generator
		this.afterRenderQueue = [];

		// setup fractal generator -> get exported functions
		this.levelBuilder = await wascWorker(this.getGeoModName());

		// assert
		if (this.levelBuilder) Smallog.debug('Got Level Builder!');
		else {
			Smallog.error('Could not create WebAssembly Level Builder! [Null-Object]');
			return;
		}

		await this.updateSettings();

		// reset rendering
		this.speedVelocity = 0;

		// load texture sync and init geometry
		let texture: Texture = null;
		if (sett.geometry_type == 0) {
			// get texture path
			const texPth = this.getBaseTexPath();
			Smallog.debug('loading Texture: ' + texPth);
			texture = new TextureLoader().load(texPth);
		}

		// initialize
		await this.initGeometries(scene, texture, waitFor);
	}

	/**
	* Get Web-assembly module path/name for given geometry type
	* @return {string} path
	*/
	private getGeoModName() {
		switch (this.settings.geometry_type) {
		case 0: return 'FractalGeometry.wasm';
		case 1: return 'BasicGeometry.wasm';
		}
	}

	/**
	* Get Base-texture path
	* @return {string} path
	*/
	private getBaseTexPath() {
		switch (this.settings.base_texture) {
		case 0: return './img/galaxy.png';
		case 1: return './img/cuboid.png';
		case 2: return './img/fractal.png';
		}
	}

	/**
	* create WEBGL objects for each level and subset
	* @param {Scene} scene sc
	* @param {Texture} texture tx
	* @param {Promise} waitFor (optional) promise to wait for
	*/
	private async initGeometries(scene: Scene, texture: Texture, waitFor?: Promise<void>) {
		const sett = this.settings;
		const camZ = this.camera.position.z;

		Smallog.debug('building geometries.');

		// reset Orbit data
		this.levels = new Array<Level>(sett.num_levels);

		// set subset moveback counter
		this.moveBacks = new Int32Array(sett.num_levels);
		this.moveBacks.fill(0);

		const hues = this.colorHelpr.hueValues;
		const subsetDist = sett.level_depth / sett.num_subsets_per_level;
		const deg45rad = 0.785398;
		const hlfDepth = sett.num_levels * sett.level_depth / 2;

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
				geometry.setAttribute('position',
					new BufferAttribute(
						new Float32Array(sett.num_points_per_subset * GEO_DIMS),
						GEO_DIMS),
				);

				// make the correct object and material for current settinfs
				const object = this.getSubsetObject(geometry, texture);

				// set material defaults
				object.material.color.setHSL(hues[s], sett.default_saturation / 100, sett.default_brightness / 100);

				// set Object defaults
				object.position.x = 0;
				object.position.y = 0;

				// position in space
				if (sett.level_shifting) {
					object.position.z = lDist - (s * subsetDist * 2);
					// offset every 2nd subset
					if (l % 2 != 0) object.position.z -= subsetDist;
				} else object.position.z = lDist - (s * subsetDist);

				// centered around camera?
				if (sett.xr_mode) object.position.z += hlfDepth;

				// TODO move this to webassembly
				if (sett.level_spiralize) {
					// split angle across subset and regard previous rotation, lel why not
					object.rotation.z = - (l * deg45rad + (s * deg45rad / sett.num_subsets_per_level));
				}
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

		// apply data
		while (this.afterRenderQueue.length > 0) {
			this.afterRenderQueue.shift()();
		}

		// generate standby data for first move-back
		const stndBy = Promise.all(this.levels.map((o, l) => this.generateLevel(l)));

		// wait for something else?
		if (waitFor) {
			// wait for data
			await stndBy;
			// apply data
			while (this.afterRenderQueue.length > 0) {
				this.afterRenderQueue.shift()();
			}
			// wait for control flow
			await waitFor;
		}
	}

	/**
	* returns the correct object and Material for a Subset
	* @param {BufferGeometry} geometry
	* @param {Texture} texture
	* @return {Object}
	*/
	private getSubsetObject(geometry, texture): T3Object {
		let object; let material;

		// default fractal geometry
		if (this.settings.geometry_type == 0) {
			// create material
			material = new PointsMaterial({
				map: texture,
				size: this.settings.texture_size,
				blending: NormalBlending, // AdditiveBlending, NormalBlending
				depthTest: false,
				transparent: true,
			});
			// create particle system from geometry and material
			object = new Points(geometry, material);
		} else if (this.settings.geometry_type == 1) {
			// line geometry type
			material = new LineBasicMaterial({
				linewidth: this.settings.texture_size,
			});
			// create lineloop system from geometry and material
			object = new LineSegments(geometry, material);
		}

		// !!! @TODO !!!
		// Disable bounding Box generation
		// Stops these errors:
		// THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.
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

		// apply random seed
		this.settings.real_seed = this.getSeed();

		// transfer settings to worker
		let keys = Object.keys(WasmSettings);
		keys = keys.slice(keys.length / 2);
		const sett = new Float32Array(keys.length);
		for (let index = 0; index < keys.length; index++) {
			const key = keys[index];
			// apply key value
			sett[WasmSettings[key]] = this.settings[key] * 1 || 0;
		}

		// WRAP IN isolated Function ran inside worker
		const {run} = this.levelBuilder;
		return run(({module, instance, exports, params}) => {
			const ex = instance.exports as any;
			const {data} = params[0];
			const arrData = new Float32Array(data);
			// get the direct view from the module memory and set the new buffer data
			exports.__getFloat32ArrayView(ex.levelSettings).set(arrData);
			// generate new data structure with updated settings
			ex.update();
		}, {
			// Data passed to worker
			data: sett.buffer,
		}).then(() => {
			Smallog.debug('Sent Settings to Generator: ' + JSON.stringify(sett));
		});
	}

	/**
	* Get randomized or predefined random-seed
	* @return {number} seed [0-233279]
	*/
	private getSeed(): number {
		if (this.settings.random_seed < 1) {
			const useed = Math.floor(Math.random() * 233279);
			Smallog.info('Using random seed: ' + useed);
			return useed;
		} else return Math.abs(this.settings.random_seed) % 233280;
	}

	/**
	* send worker event for generating a level
	* @param {number} level for what we are generating
	* @return {Promise} finiished event
	*/
	private generateLevel(level: number): Promise<void> {
		Smallog.debug('generating level: ' + level);

		const start = performance.now();
		const {run} = this.levelBuilder;
		// isolated Function ran inside worker
		return run(({module, instance, exports, params}) => {
			const ex = instance.exports as any;
			const {level} = params[0];
			// assembly level Building
			// returns pointer to int32-array with float-references
			const dataPtr = ex.build(level);
			// iterate over all pointers
			const setPtrs = exports.__getInt32Array(dataPtr);
			// gather transferrable float-arrays
			const resultObj = {};
			// we make a hard-copy of the buffer so the data doesnt get lost.
			setPtrs.forEach((ptr, i) => resultObj['set_' + i] = new Float32Array(exports.__getFloat32ArrayView(ptr)).buffer);
			return resultObj;
		}, {
			// Data passed to worker
			level: level,

		}).then((result) => {
			// worker result, back in main context
			const subbs = this.levels[level].sets;
			const setsPerLvl = this.settings.num_subsets_per_level;
			// spread over time for less thread blocking
			for (let s = 0; s < setsPerLvl; s++) {
				// apply actual last Data from worker
				this.afterRenderQueue.push(() => {
					// get & set xyzBuffer data, then update child
					const data = new Float32Array(result['set_' + s]);
					subbs[s].object.geometry.attributes.position.set(data, 0);
					subbs[s].hasNewData = true;
				});
			}
			// print info
			Smallog.debug(`Generated Level=${level}, Time= ${(performance.now() - start)} ms`);
		}).catch((e) => {
			Smallog.error('Generate Error at Level=\'' + level + '\', Msg=\'' + e.toString() + '\'');
		});
	}


	// /////////////////////////////////////////////
	// move geometry
	// /////////////////////////////////////////////

	/**
	* Update position & color with audio data
	* @param {number} ellapsed ms
	* @param {number} deltaTime multiplier
	*/
	private updateWithAudio(ellapsed, deltaTime) {
		const sett = this.settings;

		// calc audio boost
		const lastAudio = this.weas.lastAudio;
		const flmult = (20 + sett.audio_increase) / 110;
		const boost = lastAudio.intensity * flmult;

		// get targeted saturation
		const minSat = sett.minimum_saturation / 120;
		const maxSat = sett.maximum_saturation / 100;
		// get targeted brightness
		const minBri = sett.minimum_brightness / 177.77777;
		const maxBri = sett.maximum_brightness / 166.6666;

		// calculate scale helper
		// perceived brightness is not linear but exponential because of "additive" mixing mode!
		// slightly lower sclaing multiplier should account for this...
		const scaleBri = (maxBri - minBri) * boost / 120;
		const scaleSat = (maxSat - minSat) * boost / 100;

		// move as many calculations out of loop as possible
		const colObject = this.colorHelpr.colorObject;
		const hues = this.colorHelpr.hueValues;
		const color_mode = this.colorHelpr.settings.color_mode;
		const camZ = this.camera.position.z;

		// calculate step distance between levels
		const orbtSize = (sett.num_levels * sett.level_depth) - NEAR_DIST;
		const step = orbtSize * 1.2 / 128;
		const reversed = sett.movement_type == 1;

		// speed velocity calculation
		let spvn = sett.zoom_val / 4 * deltaTime;
		let rot = sett.rotation_val / 5000;
		if (sett.audiozoom_val > 0) {
			spvn += boost * sett.audiozoom_val / 33 * deltaTime;
			rot *= boost * sett.audiozoom_val / 150 * deltaTime; ;
		}

		// speed / zoom smoothing
		if (sett.audiozoom_smooth) {
			const diff = spvn - this.speedVelocity;
			const mlt = diff > 0 ? sett.audio_increase : sett.audio_decrease;
			spvn -= diff * mlt / 300;
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
		let lv: number; let level: Level; let ss: number; let prnt: Subset;
		let stepDist; let freqIdx; let freqData; let freqLvl;
		let targetHue; let targetSat; let targetLight;

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
				freqData = lastAudio.data[freqIdx];
				freqLvl = (freqData * flmult / 3) / lastAudio.average;
				// uhoh ugly special case
				if (color_mode == 4) {
					targetHue += (colObject.hueB - targetHue) * freqData / lastAudio.max;
				} else if (color_mode == 0) {
					targetHue += freqLvl;
				}
				// quick maths
				targetSat = minSat + freqLvl * scaleSat;
				targetLight = minBri + freqLvl * scaleBri / 1.69;

				// update dat shit
				prnt.object.material.color.setHSL(
					this.clamp(targetHue, 0, 1, true),
					this.clamp(targetSat, 0, 1),
					this.clamp(targetLight, 0, 0.8));

				// variable sizing
				const pm = (prnt.object.material as PointsMaterial);
				const distScale = Math.pow(1.1 - (dist / orbtSize), 3) / 2;
				const audiScale = 0.3 + Math.abs(freqLvl) / 3;
				pm.size = this.settings.texture_size * distScale * audiScale;
			}
		}
	}

	/**
		* Update position & color without audio
		* @param {number} ellapsed ms
		* @param {number} deltaTime multiplier
		*/
	private updateNoAudio(ellapsed, deltaTime) {
		const sett = this.settings;
		const reversed = sett.movement_type == 1;
		// get targeted saturations & brightness
		const defSat = sett.default_saturation / 100;
		const defBri = sett.default_brightness / 142 * Math.min(5, sett.texture_size) / sett.texture_size;

		const orbtSize = sett.num_levels * sett.level_depth;
		const camZ = this.camera.position.z;

		let spvn = sett.zoom_val / 4 * deltaTime;
		let rot = sett.rotation_val / 5000;

		// speed / zoom smoothing
		const diff = spvn - this.speedVelocity;
		const mlt = diff > 0 ? sett.audio_increase : sett.audio_decrease;
		spvn -= diff * mlt / 300;

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

		// dont re-declare this every time... should be faster
		let lv: number; let level: Level; let ss: number; let prnt: Subset; const hsl: HSL = {h: 0, s: 0, l: 0}; let targetHue;

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

				// update dat shit
				prnt.object.material.color.setHSL(
					this.clamp(hsl.h, 0, 1, true),
					this.clamp(hsl.s, 0, 1),
					this.clamp(hsl.l, 0, 1));

				// fixed sizing
				const dist = Math.abs(camZ - prnt.object.position.z);
				const pm = (prnt.object.material as PointsMaterial);
				const distScale = 1.2 - (dist / orbtSize);
				pm.size = this.settings.texture_size * distScale;
			}
		}
	}

	/**
			* Check if a Subset has to be moved back or forth
			* @param {Subset} prnt Object to check
			*/
	private checkPosition(prnt: Subset) {
		const orbitSize = this.settings.num_levels * this.settings.level_depth;
		const hlfSize = orbitSize / 2;

		let maxPos = this.camera.position.z;
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
			if (Math.abs(this.moveBacks[prnt.level]) == this.settings.num_subsets_per_level) {
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
			*/
	public updateFrame(ellapsed, deltaTime) {
		if (this.weas.hasAudio()) {
			this.updateWithAudio(ellapsed, deltaTime);
		} else {
			this.updateNoAudio(ellapsed, deltaTime);
		}

		// randomly do one after-render-aqction
		// yes this is intended: "()()"
		if (this.afterRenderQueue.length > 0) {
			if (this.speedVelocity > 5 || Math.random() > 0.4) {
				this.afterRenderQueue.shift()();
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


