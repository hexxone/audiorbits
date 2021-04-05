/**
* @author hexxone / https://hexx.one
*
* @license
* Copyright (c) 2021 hexxone All rights reserved.
* Licensed under the GNU GENERAL PUBLIC LICENSE.
* See LICENSE file in the project root for full license information.
*/

import {AudiOrbits, RunState} from './AudiOrbits';
import {waitReady} from './we_utils/src/Util';
import {Smallog} from './we_utils/src/Smallog';

/**
* AudiOrbits Eventlistener Object
 */
export default class WEventListener {
	ao: AudiOrbits;

	/**
	 * Create listener
	 * @param {AudiOrbits} ao
	 */
	constructor(ao: AudiOrbits) {
		this.ao = ao;
	}

	/**
	 * Apply system settings
	 * @param {Object} props
	 */
	public applyGeneralProperties(props) {

	}

	/**
	 * Apply custom settings
	 * @param {Object} props
	 */
	public applyUserProperties(props) {
		const initFlag = this.ao.applyCustomProps(props);
		// very first initialization
		if (this.ao.state == RunState.None) {
			this.ao.state = RunState.Initializing;
			waitReady().then(() => this.ao.initOnce());
		} else if (initFlag) {
			this.ao.state = RunState.ReInitializing;
			Smallog.debug('got reInit-flag from applying settings!');
			if (this.ao.resetTimeout) clearTimeout(this.ao.resetTimeout);
			this.ao.resetTimeout = setTimeout(() => this.ao.reInitSystem(), this.ao.resetTimespan * 1000);
			// show reloader
			this.ao.reloadHelper.show(true);
			// stop frame animation
			this.ao.ctxHolder.setRenderer(false);
		}
	}

	/**
	 * Set paused
	 * @param {boolean} isPaused
	 */
	public setPaused(isPaused: boolean) {
		if (this.ao.state == RunState.Paused) {
			if (isPaused) return;
			this.ao.state = RunState.Running;
		} else if (this.ao.state == RunState.Running) {
			if (!isPaused) return;
			this.ao.state = RunState.Paused;
		}
		Smallog.debug('set pause: ' + isPaused);
		this.ao.ctxHolder.setRenderer(!isPaused);
	}
}
