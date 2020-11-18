/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * Geometry Helper for AudiOrbits.
 * 
 * basically some code outsourcing to make main file more readable.
 * 
 * @todo
 * 
 * - implement particle system
 * - implement ps4 experiment
 * - implement cloud experiment
 * - new color mode "level splitting"?
 * 
 * - experimental: set buffergeometry drawrange on audio?
 */

import * as THREE from 'three';

import { colorHolder } from './colorHolder';
import { WEAS } from '../we_utils/src/WEAS';

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

export class geoHolder {

	weas: WEAS = null;

	settings = {
		geometry_type: 0,
		num_levels: 6,
		level_depth: 1200,
		level_shifting: false,
		num_subsets_per_level: 12,
		num_points_per_subset: 4096,
		base_texture: 0,
		texture_size: 7,
		// Tunnel generator
		generate_tunnel: false,
		tunnel_inner_radius: 5,
		tunnel_outer_radius: 5,
		// Algorithm params
		alg_a_min: -25,
		alg_a_max: 25,
		alg_b_min: 0.3,
		alg_b_max: 1.7,
		alg_c_min: 5,
		alg_c_max: 16,
		alg_d_min: 1,
		alg_d_max: 9,
		alg_e_min: 1,
		alg_e_max: 10,
		// mirrored setting
		scaling_factor: 1800,
		// Movement category
		movement_type: 0,
		zoom_val: 1,
		rotation_val: 0,
		// Brightness category
		default_brightness: 60,
		minimum_brightness: 10,
		maximum_brightness: 90,
		// Saturation category
		default_saturation: 10,
		minimum_saturation: 10,
		maximum_saturation: 90,
		// Audio category
		audio_multiplier: 2,
		audiozoom_val: 2,
		only_forward: false,
		audiozoom_smooth: false,
		// time-value smoothing ratio
		// mirrored on WEAS
		audio_increase: 75,
		audio_decrease: 35,
		// experimental on points material
		sAttenuation: false,
	}

	// main orbit data
	levels: Level[] = [];
	moveBacks: number[] = [];
	// speed smoothing helper
	speedVelocity = 0;

	// generator holder
	levelWorker: Worker = null;
	levelWorkersRunning: number = 0;
	levelWorkerCall = null;

	// color holder
	colorHolder: colorHolder = null;

	// actions to perform after render
	afterRenderQueue = [];

	constructor(weas: WEAS) {
		this.weas = weas;
		this.colorHolder = new colorHolder();
	}

	// initialize geometry generator, data & objects
	init(scene, call) {
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
			this.levelWorker = new Worker('./js/worker/levelWorker.js');

			// LEVEL GENERATED CALLBACK
			this.levelWorker.addEventListener('message', (e) => {
				let ldata = e.data;
				console.log("generated level: " + ldata.id);

				var sett = this.settings;
				this.levelWorkersRunning--;

				let xyzBuf = new Float32Array(ldata.xyzBuff);
				var subbs = this.levels[ldata.id].sets;

				// spread over time for less thread blocking
				for (let s = 0; s < sett.num_subsets_per_level; s++) {
					this.afterRenderQueue.push(() => {
						// copy start index
						var from = (s * sett.num_points_per_subset) * 2;
						// copy end index
						var tooo = (s * sett.num_points_per_subset + sett.num_points_per_subset) * 2;
						// slice & set xyzBuffer data, then update child
						(((subbs[s].object as THREE.Points).geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute).set(xyzBuf.slice(from, tooo), 0);

						subbs[s].needsUpdate = true;
					});
				}

				// if all workers finished and we have a queued event, trigger it
				// this is used as "finished"-trigger for initial level generation...
				if (this.levelWorkersRunning == 0 && this.levelWorkerCall) {
					this.levelWorkerCall();
					this.levelWorkerCall = null;
				}
			}, false);

			// ERROR CALLBACK
			this.levelWorker.addEventListener('error', (e) => {
				console.log("level error: [" + e.filename + ", Line: " + e.lineno + "] " + e.message, true);
			}, false);
		}

		var texture = null;
		// load texture sync and init geometry
		if (sett.geometry_type == 0) {
			// get texture path
			var texPth = "./img/galaxy.png";
			switch (sett.base_texture) {
				case 1: texPth = "./img/cuboid.png"; break;
				case 2: texPth = "./img/fractal.png"; break;
			}
			console.log("loading Texture: " + texPth);
			texture = new THREE.TextureLoader().load(texPth);
		}

		// initialize
		this.initGeometries(scene, call, texture);
	}

	// create WEBGL objects for each level and subset
	initGeometries(scene, call, texture) {
		var sett = this.settings;

		console.log("building geometries.");
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
					particles.position.z = - sett.level_depth * l - (s * subsetDist * 2) + sett.scaling_factor / 2;
					if (l % 2 != 0) particles.position.z -= subsetDist;
				}
				else particles.position.z = - sett.level_depth * l - (s * subsetDist) + sett.scaling_factor / 2;
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

	// failed to load texture
	textureError(err) {
		console.log("texture loading error:");
		console.log(err);
	}

	///////////////////////////////////////////////
	// FRACTAL GENERATOR
	///////////////////////////////////////////////

	// queue worker event
	generateLevel(level) {
		console.log("generating level: " + level);
		this.levelWorkersRunning++;
		this.levelWorker.postMessage({
			id: level,
			settings: this.settings
		});
	}

	///////////////////////////////////////////////
	// move geometry
	///////////////////////////////////////////////

	update(ellapsed, deltaTime) {
		var sett = this.settings;

		// calculate boost strength & step size if data given
		var flmult = (15 + sett.audio_multiplier) / 65;
		var spvn = sett.zoom_val / 1.5 * deltaTime;

		// audio stuff
		var hasAudio = this.weas.hasAudio();
		var lastAudio, boost, step;
		if (hasAudio) {
			spvn = (spvn + sett.audiozoom_val / 3) * deltaTime;
			// get 
			lastAudio = this.weas.lastAudio;
			// calc audio boost
			boost = lastAudio.intensity * flmult;
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
		if(sett.movement_type == 1) {
			spvn *= -1;
		}
		// debug
		//console.log("Audio data: " + JSON.stringify([lastAudio, boost, step, this.speedVelocity, spvn]))

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

		// get targeted saturations
		var defSat = sett.default_saturation / 100;
		var minSat = sett.minimum_saturation / 100;
		var maxSat = sett.maximum_saturation / 100;
		// get targeted brightness's
		var defBri = sett.default_brightness / 100;
		var minBri = sett.minimum_brightness / 100;
		var maxBri = sett.maximum_brightness / 100;

		// this is a bit hacky
		var camPos = sett.scaling_factor / 2;

		// dont re-declare this shit every time... should be faster
		// first the objects
		var lv, level : Level, ss, prnt : Subset, child;
		// second the attributes
		var dist, freqIdx, freqData, freqLvl, hsl, tmpHue, setHue, setSat, setLight;

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


				// TODO ADD REVERSE MODE???


				// reset if out of bounds
				if (child.position.z > camPos) {
					// offset to back
					//print("moved back child: " + i);
					child.position.z -= sett.num_levels * sett.level_depth;
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
				tmpHue = Math.abs(hues[prnt.set]);

				// HSL calculation with audio?
				if (hasAudio) {
					// use "obj"-to-"camera" distance with "step" to get "frequency" data
					// then process it
					dist = Math.round((camPos - child.position.z) / step);
					freqIdx = Math.min(lastAudio.data.length, Math.max(0, dist - 2));
					freqData = parseFloat(lastAudio.data[freqIdx]);
					freqLvl = (freqData * flmult / 3) / lastAudio.max;
					// uhoh ugly special case
					if (color_mode == 4)
						tmpHue += (colObject.hslb - tmpHue) * freqData / lastAudio.max;
					else if (color_mode == 0)
						tmpHue += freqLvl;
					// quick maths
					setHue = tmpHue % 1.0;
					setSat = Math.abs(minSat + freqLvl + freqLvl * boost * 0.07);
					setLight = Math.abs(minBri + freqLvl + freqLvl * boost * 0.01);

					//console.log("Debug: " + JSON.stringify([step, freqIdx, freqData, freqLvl, tmpHue]))
				}
				else {
					// get current HSL
					hsl = {};
					child.material.color.getHSL(hsl);
					//console.log("got hsl: " + JSON.stringify(hsl));

					setHue = hsl.h;
					setSat = hsl.s;
					setLight = hsl.l;
					// targeted HUE
					if (Math.abs(tmpHue - setHue) > 0.01)
						setHue += (tmpHue - setHue) / sixtyDelta;
					// targeted saturation
					if (Math.abs(defSat - setSat) > 0.01)
						setSat += (defSat - setSat) / sixtyDelta;
					// targeted brightness
					if (Math.abs(defBri - setLight) > 0.01)
						setLight += (defBri - setLight) / sixtyDelta;
				}
				// debug
				//console.log("setHSL | child: " + (lv * level.subsets.length + ss) + " | h: " + setHue + " | s: " + setSat + " | l: " + setLight);

				// update dat shit
				child.material.color.setHSL(
					this.clamp(setHue, 0, 1, true),
					this.clamp(setSat, 0, maxSat),
					this.clamp(setLight, 0, maxBri));

				//child.material.color.setHSL(setHue, setSat, setLight);
				//child.material.color.setHSL( this.clamp(setHue, 0, 1, true), 1, 0.7);
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
	clamp(val: number, min: number, max: number, goround = false) {
		if (goround) {
			if (val < min) return max - val;
			return val % max;
		}
		else return Math.max(Math.min(val, max), min);
	}
}