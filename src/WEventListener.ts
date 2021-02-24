/**
 * @author D.Thiele @https://hexx.one
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @description
 * AudiOrbits Eventlistener Object
 * 
 * @todo
 * - FIX this
 */

import { AudiOrbits, RunState } from './AudiOrbits';
import { Ready } from './we_utils/src/Ready';
import { Smallog } from './we_utils/src/Smallog';

export default class WEventListener {

    ao: AudiOrbits;

    constructor(ao: AudiOrbits) {
        this.ao = ao;
    }

    public applyGeneralProperties(props) {

    }

    public applyUserProperties(props) {
        var initFlag = this.ao.applyCustomProps(props);
        // very first initialization
        if (this.ao.state == RunState.None) {
            this.ao.state = RunState.Initializing;
            Ready().then(() => this.ao.initOnce());
        }
        else if (initFlag) {
            this.ao.state = RunState.ReInitializing;
            Smallog.Debug("got reInit-flag from applying settings!");
            if (this.ao.resetTimeout) clearTimeout(this.ao.resetTimeout);
            this.ao.resetTimeout = setTimeout(() => this.ao.reInitSystem(), this.ao.resetTimespan * 1000);
            // show reloader
            this.ao.reloadHelper.Show();
            // stop frame animation
            this.ao.ctxHolder.setRenderer(false);
        }
    }

    public setPaused(isPaused: boolean) {
        if (this.ao.state == RunState.Paused) {
            if (isPaused) return;
            this.ao.state = RunState.Running;
        }
        else if (this.ao.state == RunState.Running) {
            if (!isPaused) return;
            this.ao.state = RunState.Paused;
        }
        Smallog.Debug("set pause: " + isPaused);
        this.ao.ctxHolder.setRenderer(!isPaused);
    }

}