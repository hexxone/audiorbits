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


var geoHolder = {

	settings: {
		geometry_type: 0,
		num_levels: 6,
		level_depth: 1200,
		level_shifting: false,
		num_subsets_per_level: 12,
		num_points_per_subset: 4096,
		base_texture_path: "./img/galaxy.png",
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
	},

	// main orbit data
	levels: [],
	moveBacks: [],
	// speed smoothing helper
	speedVelocity: 0,

	// generator holder
	levelWorker: null,
	levelWorkersRunning: 0,
	levelWorkerCall: null,

	// actions to perform after render
	afterRenderQueue: [],

	// initialize geometry generator, data & objects
	init: function (scene, call) {
		var self = geoHolder;
		var sett = self.settings;
		// reset generator
		if (self.levelWorker) self.levelWorker.terminate();
		self.levelWorkersRunning = 0;
		self.afterRenderQueue = [];
		// reset rendering
		self.speedVelocity = 0;

		// prepare colors
		colorHolder.init();

		// setup fractal generator for "default" / "particle" mode
		if (sett.geometry_type < 2) {
			self.levelWorker = new Worker('./js/worker/levelWorker.js');
			self.levelWorker.addEventListener('message', self.levelGenerated, false);
			self.levelWorker.addEventListener('error', self.levelError, false);
		}

		var texture = null;
		// load texture sync and init geometry
		if (sett.geometry_type == 0) {
			print("loading Texture: " + sett.base_texture_path);
			texture = new THREE.TextureLoader().load(sett.base_texture_path);
		}

		// initialize
		self.initGeometries(scene, call, texture);
	},

	// create WEBGL objects for each level and subset
	initGeometries: function (scene, call, texture) {
		var self = geoHolder;
		var sett = self.settings;

		print("building geometries.");
		// material properties
		var matprops = {
			map: texture,
			size: sett.texture_size,
			blending: THREE.AdditiveBlending,
			depthTest: false,
			transparent: true
		};

		// reset Orbit data
		self.levels = [];
		self.moveBacks = [];

		var hues = colorHolder.hueValues;
		var subsetDist = sett.level_depth / sett.num_subsets_per_level;
		// build all levels
		for (var l = 0; l < sett.num_levels; l++) {
			// create level object
			self.levels[l] = {
				myLevel: l,
				subsets: []
			};
			// set subset moveback counter
			self.moveBacks[l] = 0;
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
				particles.myLevel = l;
				particles.mySubset = s;
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
				particles.needsUpdate = false;
				// add to scene
				scene.add(particles);
				self.levels[l].subsets[s] = particles;
			}
		}

		// run fractal generator for "default" / "particle" mode
		if (sett.geometry_type < 2) {
			// set function to be called when all levels are generated, will apply data
			self.levelWorkerCall = () => {
				// apply data manually
				while (self.afterRenderQueue.length > 0) {
					self.afterRenderQueue.shift()();
				}
				// prepare new orbit levels for the first reset/moveBack already
				for (var l = 0; l < sett.num_levels; l++) {
					// make new vertex shit 
					for(var s = 0; s < sett.num_subsets_per_level; s++) {
						self.levels[l].subsets[s].geometry.computeVertexNormals();
					}
					// prepare next position shit
					self.generateLevel(l);
				}
				// tell parent to continue
				if (call) call();
			};

			// generate levels in web worker
			for (var l = 0; l < sett.num_levels; l++) {
				self.generateLevel(l);
			}
		}
		// call directly
		else if (call) call();
	},

	// failed to load texture
	textureError: function (err) {
		print("texture loading error:", true);
		print(err, true);
	},

	///////////////////////////////////////////////
	// FRACTAL GENERATOR
	///////////////////////////////////////////////

	// web worker has finished generating the level
	levelGenerated: function (e) {
		let ldata = e.data;
		print("generated level: " + ldata.id);

		var self = geoHolder;
		var sett = self.settings;
		self.levelWorkersRunning--;

		let xyzBuf = new Float32Array(ldata.xyzBuff);
		var subbs = self.levels[ldata.id].subsets;

		// spread over time for less thread blocking
		for (let s = 0; s < sett.num_subsets_per_level; s++) {
			self.afterRenderQueue.push(() => {
				// copy start index
				var from = (s * sett.num_points_per_subset) * 2;
				// copy end index
				var tooo = (s * sett.num_points_per_subset + sett.num_points_per_subset) * 2;
				// slice & set xyzBuffer data, then update child
				subbs[s].geometry.attributes.position.set(xyzBuf.slice(from, tooo), 0);
				subbs[s].needsUpdate = true;
			});
		}

		// if all workers finished and we have a queued event, trigger it
		// this is used as "finished"-trigger for initial level generation...
		if (self.levelWorkersRunning == 0 && self.levelWorkerCall) {
			self.levelWorkerCall();
			self.levelWorkerCall = null;
		}
	},

	// uh oh
	levelError: function (e) {
		print("level error: [" + e.filename + ", Line: " + e.lineno + "] " + e.message, true);
	},

	// queue worker event
	generateLevel: function (level) {
		print("generating level: " + level);
		geoHolder.levelWorkersRunning++;
		geoHolder.levelWorker.postMessage({
			id: level,
			settings: geoHolder.settings
		});
	},

	///////////////////////////////////////////////
	// move geometry
	///////////////////////////////////////////////

	update: function (ellapsed, deltaTime) {
		var self = geoHolder;
		var sett = self.settings;

		// calculate boost strength & step size if data given
		var flmult = (15 + sett.audio_multiplier) / 65;
		var spvn = sett.zoom_val / 1.5 * deltaTime;

		// audio stuff
		var hasAudio = weas.hasAudio();
		var lastAudio, boost, step;
		if (hasAudio) {
			spvn = (spvn + sett.audiozoom_val / 3) * deltaTime;
			// get 
			lastAudio = weas.lastAudio;
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
			var diff = spvn - self.speedVelocity;
			var mlt = diff > 0 ? sett.audio_increase : sett.audio_decrease;
			spvn -= diff * mlt / 300;
		}
		// no negative zoom?
		if (sett.only_forward && spvn < 0) {
			spvn = 0;
		}
		// debug
		print("Audio data: " + JSON.stringify([lastAudio, boost, step, self.speedVelocity, spvn]))

		self.speedVelocity = spvn;

		// rotation calculation
		var rot = sett.rotation_val / 5000;
		if (hasAudio) rot *= boost * 0.02;
		rot *= deltaTime;

		// move as many calculations out of loop as possible
		var sixtyDelta = deltaTime * 2000;
		var colObject = colorHolder.colorObject;
		var hues = colorHolder.hueValues;

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
		var lv, level, ss, child, dist, freqIdx, freqData, freqLvl, hsl, tmpHue, setHue, setSat, setLight;

		// process all levels
		for (lv = 0; lv < self.levels.length; lv++) {
			level = self.levels[lv];
			// process all subset childrens
			for (ss = 0; ss < level.subsets.length; ss++) {
				child = level.subsets[ss];

				// velocity & rotation
				child.position.z += spvn;
				child.rotation.z -= rot;

				// reset if out of bounds
				if (child.position.z > camPos) {
					// offset to back
					//print("moved back child: " + i);
					child.position.z -= sett.num_levels * sett.level_depth;
					self.moveBacks[child.myLevel]++;

					// update the child visually
					if (child.needsUpdate) {
						child.geometry.attributes.position.needsUpdate = true;
						child.needsUpdate = false;
					}
					// process subset generation
					if (self.moveBacks[child.myLevel] == sett.num_subsets_per_level) {
						self.moveBacks[child.myLevel] = 0;
						self.generateLevel(child.myLevel);
					}
				}

				// targeted HUE
				tmpHue = Math.abs(hues[child.mySubset]);

				// HSL calculation with audio?
				if (hasAudio) {
					// use "obj"-to-"camera" distance with "step" to get "frequency" data
					// then process it
					dist = Math.round((camPos - child.position.z) / step);
					freqIdx = Math.min(lastAudio.data.length, Math.max(0, dist - 2));
					freqData = parseFloat(lastAudio.data[freqIdx]);
					freqLvl = (freqData * flmult / 3) / lastAudio.max;
					// uhoh ugly special case
					if (sett.color_mode == 4)
						tmpHue += (colObject.hslb - tmpHue) * freqData / lastAudio.max;
					else if (sett.color_mode == 0)
						tmpHue += freqLvl;
					// quick maths
					setHue = tmpHue % 1.0;
					setSat = Math.abs(minSat + freqLvl + freqLvl * boost * 0.07);
					setLight = Math.abs(minBri + freqLvl + freqLvl * boost * 0.01);

					//print("Debug: " + JSON.stringify([step, freqIdx, freqData, freqLvl, tmpHue]))
				}
				else {
					// get current HSL
					hsl = {};
					child.material.color.getHSL(hsl);
					print("got hsl: " + JSON.stringify(hsl));

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
				print("setHSL | child: " + (lv * level.subsets.length + ss) + " | h: " + setHue + " | s: " + setSat + " | l: " + setLight);

				// update dat shit
				//child.material.color.setHSL( self.clamp(setHue, 0, 1, true), 1, 0.7);
				/*child.material.color.setHSL(
					self.clamp(setHue, 0, 1, true),
					self.clamp(setSat, 0, maxSat),
					self.clamp(setLight, 0, maxBri));*/
				child.material.color.setHSL(setHue, setSat, setLight);
			}
		}

		// randomly do one after-render-aqction
		// yes this is intended: "()()"
		if (self.afterRenderQueue.length > 0) {
			if (self.speedVelocity > 5 || Math.random() > 0.4)
				self.afterRenderQueue.shift()();
		}
	},

	// correct colors to be safe
	clamp: function (val, min, max, goround) {
		if (goround) {
			if (val < min) return max - val;
			return val % max;
		}
		else return Math.max(Math.min(val, max), min);
	}
}