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
 * - new color mode "level splitting"?
 * 
 * - experimental: set buffergeometry drawrange on audio?
 */

import * as THREE from 'three';

import { ColorHolder } from './ColorHolder';
import { WEAS } from './we_utils/src/WEAS';
import { Smallog } from './we_utils/src/Smallog';
import { CSettings } from "./we_utils/src/CSettings";
import { CComponent } from './we_utils/src/CComponent';

import LevelWorker from 'worker-loader!./LevelWorker';

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

class GeoSettings extends CSettings {
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
	only_forward: boolean = false;
	audiozoom_smooth: boolean = false;
	// time-value smoothing ratio
	// mirrored on WEAS
	audio_increase: number = 75;
	audio_decrease: number = 35;
}

export class GeoHolder extends CComponent {

	public settings: GeoSettings = new GeoSettings();

	// main orbit data
	private levels: Level[] = [];
	private moveBacks: number[] = [];
	// speed smoothing helper
	private speedVelocity = 0;

	// generator holder
	private levelWorker: LevelWorker = null;
	private levelWorkersRunning: number = 0;
	private levelWorkerCall = null;

	// color holder
	private colorHolder: ColorHolder = new ColorHolder();

	// keep camera position for moving subsets around
	private camera: THREE.Camera = null;

	// actions to perform after render
	private afterRenderQueue = [];

	private weas: WEAS = null;

	constructor(weas: WEAS) {
		super();
		this.weas = weas;
		this.children.push(this.colorHolder);
	}

	// initialize geometry generator, data & objects
	public init(scene: THREE.Scene, cam: THREE.Camera, call) {
		this.camera = cam;
		var sett = this.settings;
		// reset generator
		if (this.levelWorker) this.levelWorker.terminate();
		this.levelWorkersRunning = 0;
		this.afterRenderQueue = [];
		// reset rendering
		this.speedVelocity = 0;

		// prepare colors
		this.colorHolder.init();

		// setup fractal generator for "default" / "particle" mode
		if (sett.geometry_type < 2) {
			this.levelWorker = new LevelWorker();


			// LEVEL GENERATED CALLBACK
			this.levelWorker.addEventListener('message', (e) => {
				let dat = e.data;
				if (dat.action == "level") {
					Smallog.Debug("generated level: " + dat.level);
					// if all workers finished and we have a queued event, trigger it
					// this is used as "finished"-trigger for initial level generation...
					this.levelWorkersRunning--;
					if (this.levelWorkersRunning == 0 && this.levelWorkerCall) {
						this.levelWorkerCall();
						this.levelWorkerCall = null;
					}
				}
				else if (dat.action == "subset") {
					Smallog.Debug("generated subset: " + dat.level + "/" + dat.subset);
					// transfer buffer array and get subset
					let xyBuff = new Float32Array(dat.xyBuff);
					var subSet: any = this.levels[dat.level].sets[dat.subset];
					// spread over time for less thread blocking
					this.afterRenderQueue.push(() => {
						// set buffer geometry data, then tell the child it's update ready
						subSet.object.geometry.attributes.position.set(xyBuff, 0);
						subSet.needsUpdate = true;
					});
				}
			}, false);



			// ERROR CALLBACK
			this.levelWorker.addEventListener('error', (e) => {
				Smallog.Error("level error: [" + e.filename + ", Line: " + e.lineno + "] " + e.message);
			}, false);
		}

		var texture: THREE.Texture = null;
		// load texture sync and init geometry
		if (sett.geometry_type == 0) {
			// get texture path
			var texPth = "./img/galaxy.png";
			switch (sett.base_texture) {
				case 1: texPth = "./img/cuboid.png"; break;
				case 2: texPth = "./img/fractal.png"; break;
			}
			Smallog.Debug("loading Texture: " + texPth);
			texture = new THREE.TextureLoader().load(texPth);
		}

		// initialize
		this.initGeometries(scene, texture, call);
	}

	// create WEBGL objects for each level and subset
	private initGeometries(scene: THREE.Scene, texture: THREE.Texture, call) {
		var sett = this.settings;
		var camZ = this.camera.position.z;

		Smallog.Debug("building geometries.");
		// material properties
		var matprops = {
			map: texture,
			size: sett.texture_size,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		};

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
				geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sett.num_points_per_subset * 2), 2));

				// create material
				var material = new THREE.PointsMaterial(matprops);
				// set material defaults
				material.color.setHSL(hues[s], sett.default_saturation / 100, sett.default_brightness / 100);

				// create particle system from geometry and material
				var particles = new THREE.Points(geometry, material);
				particles.position.x = 0;
				particles.position.y = 0;
				// position in space
				if (sett.level_shifting) {
					particles.position.z = lDist - (s * subsetDist * 2);
					if (l % 2 != 0) particles.position.z -= subsetDist;
				}
				else particles.position.z = lDist - (s * subsetDist);
				// euler angle 45 deg in radians
				particles.rotation.z = -0.785398;
				// add to scene
				scene.add(particles);
				this.levels[l].sets[s] = {
					needsUpdate: false,
					object: particles,
					level: l,
					set: s
				}
			}
		}

		// run fractal generator for "default" / "particle" mode
		if (sett.geometry_type < 2) {
			// set function to be called when all levels are generated, will apply data
			this.levelWorkerCall = () => {
				// apply data manually
				while (this.afterRenderQueue.length > 0) {
					this.afterRenderQueue.shift()();
				}
				// prepare new orbit levels for the first reset/moveBack already
				for (var l = 0; l < sett.num_levels; l++) {
					// prepare next position shit
					this.generateLevel(l);
				}
				// tell parent to continue
				if (call) call();
			};

			// generate levels in web worker
			for (var l = 0; l < sett.num_levels; l++) {
				this.generateLevel(l);
			}
		}
		// call directly
		else if (call) call();
	}

	///////////////////////////////////////////////
	// FRACTAL GENERATOR
	///////////////////////////////////////////////

	// queue worker event
	private generateLevel(level) {
		Smallog.Debug("generating level: " + level);
		this.levelWorkersRunning++;
		this.levelWorker.postMessage({
			id: level,
			settings: this.settings
		});
	}

	///////////////////////////////////////////////
	// move geometry
	///////////////////////////////////////////////

	public update(ellapsed, deltaTime) {
		var sett = this.settings;

		// calculate boost strength & step size if data given
		var spvn = sett.zoom_val / 1.5 * deltaTime;
		var reversed = sett.movement_type == 1;

		// get targeted saturations
		var defSat = sett.default_saturation / 100;
		var minSat = sett.minimum_saturation / 100;
		var maxSat = sett.maximum_saturation / 100;
		// get targeted brightness's
		var defBri = sett.default_brightness / 100;
		var minBri = sett.minimum_brightness / 100;
		var maxBri = sett.maximum_brightness / 100;


		// audio stuff
		var hasAudio = this.weas.hasAudio();
		var flmult = (15 + sett.audio_multiplier) / 65;
		var lastAudio, boost, step, scaleBri, scaleSat;
		if (hasAudio) {
			spvn = (spvn + sett.audiozoom_val / 3) * deltaTime;
			// get 
			lastAudio = this.weas.lastAudio;
			// calc audio boost
			boost = lastAudio.intensity * flmult;
			// calculate scale helper
			scaleBri = (maxBri - minBri) * boost / 100;
			// calculate step distance between levels
			step = (sett.num_levels * sett.level_depth * 1.2) / 128;
			// speed velocity calculation
			if (sett.audiozoom_val > 0)
				spvn += sett.zoom_val * boost * 0.01 + boost * sett.audiozoom_val * 0.03 * deltaTime;

		}

		// speed / zoom smoothing
		if (!hasAudio || sett.audiozoom_smooth) {
			var diff = spvn - this.speedVelocity;
			var mlt = diff > 0 ? sett.audio_increase : sett.audio_decrease;
			spvn -= diff * mlt / 300;
		}
		// no negative zoom?
		if (sett.only_forward && spvn < 0) {
			spvn = 0;
		}
		// reverse zoom?
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
					freqLvl = (freqData * flmult / 3) / lastAudio.max;
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
				//Smallog.Debug("setHSL | child: " + (lv * level.subsets.length + ss) + " | h: " + setHue + " | s: " + setSat + " | l: " + setLight);

				// update dat shit
				child.material.color.setHSL(
					this.clamp(setHue, 0, 1, true),
					this.clamp(setSat, 0, maxSat),
					this.clamp(setLight, 0, maxBri));
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