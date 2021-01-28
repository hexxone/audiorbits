/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
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

import * as THREE from 'three';

import { ASUtil } from '@assemblyscript/loader';

import { ColorHelper } from './ColorHelper';
import { WEAS } from './we_utils/src/weas/WEAS';
import { Smallog } from './we_utils/src/Smallog';
import { CSettings } from "./we_utils/src/CSettings";
import { CComponent } from './we_utils/src/CComponent';

import wascWorker from './we_utils/src/wasc-worker';

interface Level {
	level: number;
	sets: Subset[];
}

interface Subset {
	needsUpdate: boolean;
	object: THREE.Object3D;
	level: number;
	set: number;
}

class LevelSettings extends CSettings {
	geometry_type: number = 0;
	num_levels: number = 6;
	level_depth: number = 1200;
	level_shifting: boolean = false;
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
	audio_multiplier: number = 2;
	audiozoom_val: number = 2;
	reverse_type: number = 0;
	audiozoom_smooth: boolean = false;
	// time-value smoothing ratio
	// mirrored on WEAS
	audio_increase: number = 75;
	audio_decrease: number = 35;
}

// settings required in worker
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
}

export class LevelHolder extends CComponent {

	public settings: LevelSettings = new LevelSettings();

	// main orbit data
	private levels: Level[] = [];
	private moveBacks: number[] = [];
	// speed smoothing helper
	private speedVelocity = 0;

	// generator holder
	private levelBuilder: any = null;

	// color holder
	private colorHolder: ColorHelper = new ColorHelper();

	// keep camera position for moving subsets around
	private camera: THREE.Camera = null;

	// actions to perform after render
	private afterRenderQueue = [];

	// audio provider
	private weas: WEAS = null;

	constructor(weas: WEAS) {
		super();
		this.weas = weas;
		this.children.push(this.colorHolder);
	}

	// initialize geometry generator, data & objects
	public async init(scene: THREE.Scene, cam: THREE.Camera, call) {
		this.camera = cam;
		var sett = this.settings;
		// reset generator
		this.afterRenderQueue = [];

		// setup fractal generator -> get exported functions
		this.levelBuilder = await wascWorker(this.getGeoModName(), {}, true);
		await this.updateSettings();

		// reset rendering
		this.speedVelocity = 0;

		// prepare colors
		this.colorHolder.init();

		// load texture sync and init geometry
		var texture: THREE.Texture = null;
		if (sett.geometry_type == 0) {
			// get texture path
			const texPth = this.getBaseTexPath();
			Smallog.Debug("loading Texture: " + texPth);
			texture = new THREE.TextureLoader().load(texPth);
		}

		// initialize
		this.initGeometries(scene, texture, call);
	}

	private getGeoModName() {
		switch (this.settings.geometry_type) {
			case 0: return "FractalGeometry.wasm";
			case 1: return "BasicGeometry.wasm";
		}
	}

	private getBaseTexPath() {
		switch (this.settings.base_texture) {
			case 0: return "./img/galaxy.png";
			case 1: return "./img/cuboid.png";
			case 2: return "./img/fractal.png";
		}
	}

	// create WEBGL objects for each level and subset
	private initGeometries(scene: THREE.Scene, texture: THREE.Texture, resolve) {
		var sett = this.settings;
		var camZ = this.camera.position.z;

		Smallog.Debug("building geometries.");

		// reset Orbit data
		this.levels = [];
		this.moveBacks = [];

		var hues = this.colorHolder.hueValues;
		var subsetDist = sett.level_depth / sett.num_subsets_per_level;
		// build all levels
		for (var l = 0; l < sett.num_levels; l++) {
			// create level object
			this.levels[l] = {
				level: l,
				sets: []
			};
			// set subset moveback counter
			this.moveBacks[l] = 0;

			const lDist = - camZ - sett.level_depth * l;
			// build all subsets
			for (var s = 0; s < sett.num_subsets_per_level; s++) {

				// create particle geometry from orbit vertex data
				var geometry = new THREE.BufferGeometry();
				// position attribute (2 vertices per point, thats pretty illegal)
				geometry.setAttribute('position',
					new THREE.BufferAttribute(
						new Float32Array(sett.num_points_per_subset * 2),
						2
					)
				);

				// make the correct object and material for current settinfs
				const { setObj, material } = this.getSubsetObject(geometry, texture);

				// set material defaults
				material.color.setHSL(hues[s], sett.default_saturation / 100, sett.default_brightness / 100);

				// set Object defaults
				setObj.position.x = 0;
				setObj.position.y = 0;
				// position in space
				if (sett.level_shifting) {
					setObj.position.z = lDist - (s * subsetDist * 2);
					if (l % 2 != 0) setObj.position.z -= subsetDist;
				}
				else setObj.position.z = lDist - (s * subsetDist);
				// euler angle 45 deg in radians
				setObj.rotation.z = -0.785398;
				// add to scene
				scene.add(setObj);
				this.levels[l].sets[s] = {
					needsUpdate: false,
					object: setObj,
					level: l,
					set: s
				}
			}
		}

		// trigger level generation once
		const firstWait: Promise<void>[] = [];
		for (var l = 0; l < sett.num_levels; l++) {
			firstWait.push(this.generateLevel(l));
		}
		// wait for all generators to finish
		Promise.all(firstWait);

		// apply data manually
		while (this.afterRenderQueue.length > 0) {
			this.afterRenderQueue.shift()();
		}

		// generate standby data for first move-back
		for (var l = 0; l < sett.num_levels; l++) {
			this.generateLevel(l);
		}
		// return control flow
		resolve();
	}

	// returns the correct object and Material for a Subset
	private getSubsetObject(geometry, texture) {
		var setObj, material;

		// default fractal geometry
		if (this.settings.geometry_type == 0) {
			// create material
			material = new THREE.PointsMaterial({
				map: texture,
				size: this.settings.texture_size,
				blending: THREE.AdditiveBlending,
				depthTest: false,
				transparent: true
			});
			// create particle system from geometry and material
			setObj = new THREE.Points(geometry, material);
		}

		// line geometry type
		else if (this.settings.geometry_type == 1) {
			material = new THREE.LineBasicMaterial({
				linewidth: this.settings.texture_size,
			});
			// create lineloop system from geometry and material
			setObj = new THREE.LineSegments(geometry, material);
		}

		return { setObj, material };
	}

	///////////////////////////////////////////////
	// FRACTAL GENERATOR
	///////////////////////////////////////////////

	// CAVEAT: only available after init and module load
	public async updateSettings() {
		if (!this.levelBuilder) return;

		var keys = Object.keys(WasmSettings);
		keys = keys.slice(keys.length / 2);
		const sett = new Float32Array(keys.length);
		for (let index = 0; index < keys.length; index++) {
			const key = keys[index];
			sett[WasmSettings[key]] = this.settings[key] || 0;
		}

		// WRAP IN isolated Function ran inside worker
		const { run } = this.levelBuilder;
		await run(({ module, instance, importObject, params }) => {
			const { exports } = instance;
			const { data } = params[0];
			const io = importObject as ASUtil;

			const transfer = io.__getFloat32ArrayView(exports.levelSettings);
			transfer.set(data);

			// generate the data structure with updated settings
			exports.update();

			console.debug("Sent Settings to Worker: " + JSON.stringify(data));
		}, {
			// Data passed to worker
			data: sett
		});
	}

	// queue worker event
	private generateLevel(level): Promise<void> {
		Smallog.Debug("generating level: " + level);

		const start = performance.now();
		const { run } = this.levelBuilder;
		// isolated Function ran inside worker
		return run(({ module, instance, importObject, params }) => {
			const { exports } = instance;
			const { level } = params[0];
			const io = importObject as ASUtil;

			// assembly level Building
			// returns pointer to int32-array with float-references
			const dataPtr = exports.build(level);
			// will contain transferrable float-arrays
			var resultObj = {};
			// iterate over all pointers
			const setPtrs = io.__getInt32Array(dataPtr);

			// TODO REMOVE
			console.log(dataPtr);
			console.log(setPtrs);

			for (let set = 0; set < setPtrs.length; set++) {
				const setPtr = setPtrs[set];
				const setArr = io.__getFloat32ArrayView(setPtr);

				// TODO REMOVE
				console.log(setArr);

				resultObj["set_" + set] = setArr;
			}
			return resultObj;
		}, {
			// Data passed to worker
			level: level

		}).then((result) => {
			// worker result, back in main context
			const subbs = this.levels[level].sets as any[];
			const setsPerLvl = this.settings.num_subsets_per_level;
			// spread over time for less thread blocking
			for (let s = 0; s < setsPerLvl; s++) {
				// apply actual last Data from worker
				this.afterRenderQueue.push(() => {
					// get & set xyzBuffer data, then update child
					const data = new Float32Array(result["set_" + s]);
					subbs[s].object.geometry.attributes.position.set(data, 0);
					subbs[s].needsUpdate = true;
				});
			}
			// print info
			Smallog.Debug("Generated Level=" + level + ", Time= " + (performance.now() - start));
			return true;

		}).catch(e => {
			Smallog.Error("Generate Error at Level='" + level + "', Msg='" + e.toString() + "'");
			console.error(e);
			return false;
		});
	}


	///////////////////////////////////////////////
	// move geometry
	///////////////////////////////////////////////

	public update(ellapsed, deltaTime) {
		var sett = this.settings;

		// calculate boost strength & step size if data given
		var spvn = sett.zoom_val / 1.5 * deltaTime;
		const reversed = sett.movement_type == 1;

		// get targeted saturations
		const defSat = sett.default_saturation / 100;
		const minSat = sett.minimum_saturation / 100;
		const maxSat = sett.maximum_saturation / 100;
		// get targeted brightness's
		const defBri = sett.default_brightness / 100;
		const minBri = sett.minimum_brightness / 100;
		const maxBri = sett.maximum_brightness / 100;


		// audio stuff
		const hasAudio = this.weas.hasAudio();
		const flmult = (15 + sett.audio_multiplier) / 60;
		var lastAudio, boost, step, scaleBri, scaleSat;
		if (hasAudio) {
			spvn = (spvn + sett.audiozoom_val / 3) * deltaTime;
			// get 
			lastAudio = this.weas.lastAudio;
			// calc audio boost
			boost = lastAudio.intensity * flmult;
			// calculate scale helper
			scaleBri = (maxBri - minBri) * boost / 75;
			scaleSat = (maxSat - minSat) * boost / 75;
			// calculate step distance between levels
			step = (sett.num_levels * sett.level_depth * 1.2) / 128;
			// speed velocity calculation
			if (sett.audiozoom_val > 0)
				spvn += sett.zoom_val * boost / 150 + boost * sett.audiozoom_val / 200 * deltaTime;

		}

		// speed / zoom smoothing
		if (!hasAudio || sett.audiozoom_smooth) {
			var diff = spvn - this.speedVelocity;
			var mlt = diff > 0 ? sett.audio_increase : sett.audio_decrease;
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
		// debug
		Smallog.Debug("Audio data: " + JSON.stringify([lastAudio, boost, step, this.speedVelocity, spvn]));
		this.speedVelocity = spvn;

		// rotation calculation
		var rot = sett.rotation_val / 5000;
		if (hasAudio) rot *= boost * 0.02;
		rot *= deltaTime;

		// move as many calculations out of loop as possible
		var sixtyDelta = deltaTime * 2000;
		var colObject = this.colorHolder.colorObject;
		var hues = this.colorHolder.hueValues;
		var color_mode = this.colorHolder.settings.color_mode;

		// this is a bit hacky
		var camZ = this.camera.position.z;
		var orbitSize = sett.num_levels * sett.level_depth;
		var backPos = camZ - orbitSize;

		// dont re-declare this shit every time... should be faster
		// first the objects
		var lv, level: Level, ss, prnt: Subset, child;
		// second the attributes
		var dist, freqIdx, freqData, freqLvl, hsl, targetHue, setHue, setSat, setLight;

		// process all levels
		for (lv = 0; lv < this.levels.length; lv++) {
			level = this.levels[lv];
			// process all subset childrens
			for (ss = 0; ss < level.sets.length; ss++) {
				prnt = level.sets[ss];
				child = prnt.object;

				// velocity & rotation
				child.position.z += spvn;
				child.rotation.z -= rot;

				// reset to back if out of bounds
				var moved = false;
				if (!reversed && child.position.z > camZ) {
					child.position.z -= orbitSize;
					moved = true;
				}
				// reset to front
				else if (reversed && child.position.z < backPos) {
					child.position.z += orbitSize;
					moved = true;
				}
				if (moved) {
					this.moveBacks[prnt.level]++;
					// update the child visually
					if (prnt.needsUpdate) {
						child.geometry.attributes.position.needsUpdate = true;
						prnt.needsUpdate = false;
					}
					// process subset generation
					if (this.moveBacks[prnt.level] == sett.num_subsets_per_level) {
						this.moveBacks[prnt.level] = 0;
						this.generateLevel(prnt.level);
					}
				}

				// targeted HUE
				targetHue = Math.abs(hues[prnt.set]);

				// HSL calculation with audio?
				if (hasAudio) {
					// use "obj"-to-"camera" distance with "step" to get "frequency" data
					// then process it
					dist = Math.round((camZ - child.position.z) / step);
					freqIdx = Math.min(lastAudio.data.length, Math.max(0, dist - 2));
					freqData = parseFloat(lastAudio.data[freqIdx]);
					freqLvl = (freqData * flmult / 3) / lastAudio.average;
					// uhoh ugly special case
					if (color_mode == 4)
						targetHue += (colObject.hslb - targetHue) * freqData / lastAudio.max;
					else if (color_mode == 0)
						targetHue += freqLvl;
					// quick maths
					setHue = targetHue;
					setSat = minSat + freqLvl * scaleSat;
					setLight = minBri + freqLvl * scaleBri;
				}
				else {
					// get current HSL
					hsl = {};
					child.material.color.getHSL(hsl);
					setHue = hsl.h;
					setSat = hsl.s;
					setLight = hsl.l;
					// targeted HUE
					if (Math.abs(targetHue - setHue) > 0.01)
						setHue += (targetHue - setHue) / sixtyDelta;
					// targeted saturation
					if (Math.abs(defSat - setSat) > 0.01)
						setSat += (defSat - setSat) / sixtyDelta;
					// targeted brightness
					if (Math.abs(defBri - setLight) > 0.01)
						setLight += (defBri - setLight) / sixtyDelta;
				}
				// debug
				Smallog.Debug("setHSL | child: " + (lv * level.sets.length + ss) + " | h: " + setHue + " | s: " + setSat + " | l: " + setLight);

				// update dat shit
				child.material.color.setHSL(
					this.clamp(setHue, 0, 1, true),
					this.clamp(setSat, 0, 1),
					this.clamp(setLight, 0, 1));
			}
		}

		// randomly do one after-render-aqction
		// yes this is intended: "()()"
		if (this.afterRenderQueue.length > 0) {
			if (this.speedVelocity > 5 || Math.random() > 0.4)
				this.afterRenderQueue.shift()();
		}
	}

	// correct colors to be safe
	private clamp(val: number, min: number, max: number, goround = false) {
		if (goround) {
			if (val < min) return max - val;
			return val % max;
		}
		else return Math.max(Math.min(val, max), min);
	}
}