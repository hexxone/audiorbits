/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2025 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 *
 * @see
 * AudiOrbits project	(https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780)
 * for Wallpaper Engine (https://steamcommunity.com/app/431960)
 * by hexxone 			(https://hexx.one)
 *
 * You don't own Wallpaper Engine but want to see this in action?
 * Go here:	https://orbits.hexx.one
 *
 * @description
 * AudiOrbits for Wallpaper Engine
 *
 * If you're reading this you're either pretty interested in the code or just bored :P
 * Either way thanks for using this Wallpaper I guess.
 * Leave me some feedback on the Workshop-Page for this item if you like!
 */

const DEFAULT_LEVEL_ROTATION = -0.785398;

// custom logging function
function print(arg, force) {
    if (audiOrbits.debug || force) console.log("AudiOrbits: " + JSON.stringify(arg));
}

// what's the wallpaper currently doing?
const RunState = {
    None: 0,
    Initializing: 1,
    Running: 2,
    Paused: 3,
    ReInitializing: 4
};


const chunkBuffers = {};

// base object for wallpaper
const audiOrbits = {
    // holds default wallpaper settings
    // these basically connect 1:1 to wallpaper engine settings.
    // for more explanation on settings visit the Workshop-Item-Forum (link above)
    settings: {
        schemecolor: "0 0 0",
        parallax_option: 0,
        parallax_angle: 180,
        parallax_strength: 3,
        auto_parallax_speed: 2,
        color_fade_speed: 2,
        default_brightness: 60,
        default_saturation: 10,
        zoom_val: 1,
        rotation_val: 0,
        spiral: 0,
        custom_fps: false,
        fps_value: 60,
        minimum_brightness: 10,
        minimum_saturation: 10,
        audio_multiplier: 2,
        audio_smoothing: 75,
        audiozoom_val: 2,
        only_forward: false,
        audiozoom_smooth: false,
        alg_a_min: -25,
        alg_a_max: 25,
        alg_b_min: 0.3,
        alg_b_max: 1.7,
        alg_c_min: 5,
        alg_c_max: 16,
        alg_d_min: 1,
        alg_d_max: 9,
        alg_e_min: 0,
        alg_e_max: 0,
        generate_tunnel: false,
        tunnel_inner_radius: 5,
        tunnel_outer_radius: 5,
        base_texture_path: "./img/galaxy.png",
        texture_size: 7,
        stats_option: -1,
        shader_quality: "low",
        field_of_view: 90,
        fog_thickness: 3,
        scaling_factor: 1800,
        camera_bound: 1000,
        num_points_per_subset: 4096,
        num_subsets_per_level: 12,
        num_levels: 6,
        level_depth: 1200,
        level_shifting: false,
        bloom_filter: false,
        lut_filter: -1,
        mirror_shader: 0,
        mirror_invert: false,
        fx_antialiasing: true,
        blur_strength: 0,
        color_mode: 0,
        user_color_a: "1 0.5 0",
        user_color_b: "0 0.5 1",
        seizure_warning: true,
        // fractal functions represented by weighted chance.
        // If adding/removing these settings, update:
        // GetAttrSettings(), _regen array, and levelWorker.js.
        Hopalong: 40,
        HopalongMod1: 20,
        HopalongMod2: 15,
        HopalongZen: 0,
        FuturisticHUD: 0,
        Stereoscopic: 0,
        SunSpots: 0,
        Trypophobia: 0,
        SuperNovaD: 0,
        SuperNovaE: 0,
        EndlessPit: 0,
        OrderedChaos: 0,
        AlienPhantasms: 0,
        AlienEtching: 0,
        AlienHieroglyphs: 0,
        Wormhole: 0,
        SpaceCarnival: 0,
        Coexistence: 0,
        HawkingRadiation: 0,
        Medusa: 0,
        QuadrupTwo: 5,
        NeonLights: 0,
        NeonSigns: 0,
        MathematicalSpecter: 0,
        OpticalIllusion: 5,
        VisualIllusion: 0,
        SlinkyWorms: 5,
        ObservableUniverse: 0,
        ParallelUniverse: 0,
        HostilePlanet: 0,
        CyberWarfare: 0,
        RaveDance: 0,
        SunBeams: 0,
        WaywardAi: 5,
        Threeply: 0,
        Fiesta: 5,
        WizardsTunnel: 0,
        GapingHole: 0,
        LeapOfFaith: 0,
        BreathingRoom: 0,
        NameMe: 0,
        EasterEgg: 0,
    },
    /* Have you ever wondered,
    how many settings are too many settings?
    No? Me neither */
    precalc: null,

    // state of the Wallpaper
    state: 0,

    // debugging
    debug: false,
    debugTimeout: null,

    // relevant html elements
    container: null,
    mainCanvas: null,
    helperContext: null,
    // these are set once 
    resetBar: null,
    resetText: null,

    // Seconds & interval for reloading the wallpaper
    resetTimespan: 3,
    resetTimeout: null,

    // render relevant stuff
    clock: null,
    renderTimeout: null,

    // interval for swirlHandler
    swirlInterval: null,

    // extended  user settings
    colorObject: null,
    // mouse over canvas
    mouseX: 0,
    mouseY: 0,
    // window half size
    windowHalfX: window.innerWidth / 2,
    windowHalfY: window.innerHeight / 2,

    // Three.js relevant objects
    renderer: null,
    composer: null,
    camera: null,
    scene: null,
    // main orbit data
    levels: [],
    moveBacks: [],
    hueValues: [],
    // actions to perform after render
    afterRenderQueue: [],
    // Array of func pointers mapped to probability values
    fractalFuncs: [],
    // Copy of Attractor settings
    currAttrSett: [],
    lastSpiralRot: DEFAULT_LEVEL_ROTATION,
    spiralRad: 0,

    // Set to a high value if all fractals were unselected
    spinWildly: 0,

    // generator holder
    levelWorker: null,
    levelWorkersRunning: 0,
    levelWorkerCall: null,

    ///////////////////////////////////////////////
    // APPLY SETTINGS
    ///////////////////////////////////////////////

    GetAttrSettings: function () {
        const sett = audiOrbits.settings;

        return [
            sett.Hopalong,
            sett.HopalongMod1,
            sett.HopalongMod2,
            sett.HopalongZen,
            sett.FuturisticHUD,
            sett.Stereoscopic,
            sett.SunSpots,
            sett.Trypophobia,
            sett.SuperNovaD,
            sett.SuperNovaE,
            sett.EndlessPit,
            sett.OrderedChaos,
            sett.AlienPhantasms,
            sett.AlienEtching,
            sett.AlienHieroglyphs,
            sett.Wormhole,
            sett.SpaceCarnival,
            sett.Coexistence,
            sett.HawkingRadiation,
            sett.Medusa,
            sett.QuadrupTwo,
            sett.NeonLights,
            sett.NeonSigns,
            sett.MathematicalSpecter,
            sett.OpticalIllusion,
            sett.VisualIllusion,
            sett.SlinkyWorms,
            sett.ObservableUniverse,
            sett.ParallelUniverse,
            sett.HostilePlanet,
            sett.CyberWarfare,
            sett.RaveDance,
            sett.SunBeams,
            sett.WaywardAi,
            sett.Threeply,
            sett.Fiesta,
            sett.WizardsTunnel,
            sett.GapingHole,
            sett.LeapOfFaith,
            sett.BreathingRoom,
            sett.NameMe,
            sett.EasterEgg
        ];
    },

    // Apply settings from the project.json "properties" object and takes certain actions
    applyCustomProps: function (props) {
        print("applying settings: " + Object.keys(props).length);

        const _ignore = ["debugging", "img_overlay", "img_background", "base_texture", "mirror_invalid_val"];

        const _reInit = ["texture_size", "stats_option", "field_of_view", "fog_thickness", "icue_mode",
            "scaling_factor", "camera_bound", "num_points_per_subset", "num_subsets_per_level",
            "num_levels", "level_depth", "level_shifting", "bloom_filter", "lut_filter", "mirror_shader",
            "mirror_invert", "fx_antialiasing", "blur_strength", "custom_fps", "shader_quality"];

        const _regen = ["alg_a_min", "alg_a_max", "alg_b_min", "alg_b_max",
            "alg_c_min", "alg_c_max", "alg_d_min", "alg_d_max", "alg_e_min", "alg_e_max",
            "Hopalong", "HopalongMod1", "HopalongMod2", "HopalongZen", "FuturisticHUD",
            "Stereoscopic", "SunSpots", "Trypophobia", "SuperNovaD",
            "SuperNovaE", "EndlessPit", "OrderedChaos", "AlienPhantasms",
            "AlienEtching", "AlienHieroglyphs", "Wormhole", "SpaceCarnival",
            "Coexistence", "HawkingRadiation", "Medusa", "QuadrupTwo",
            "NeonLights", "NeonSigns", "MathematicalSpecter", "OpticalIllusion",
            "VisualIllusion", "SlinkyWorms", "ObservableUniverse", "ParallelUniverse",
            "HostilePlanet", "CyberWarfare", "RaveDance", "SunBeams",
            "WaywardAi", "Threeply", "Fiesta", "WizardsTunnel",
            "GapingHole", "LeapOfFaith", "BreathingRoom", "NameMe",
            "EasterEgg"];

        const _spiral = ["spiral"];

        const self = audiOrbits;
        const sett = self.settings;

        let reInitFlag = false;
        let reGenLevels = false;
        let setSpiral = false;

        // possible apply-targets
        const settStorage = [sett, weas.settings, weicue.settings];

        // loop all settings for updated values
        for (const setting in props) {
            // ignore this setting or apply it manually
            if (_ignore.includes(setting) || setting.startsWith("HEADER_")) continue;
            // get the updated setting
            let prop = props[setting];
            // check typing and null value
            if (!prop || !prop.type || prop.type === "text" || prop.value == null) continue;

            let found = false;
            // process all storages
            for (const storage of settStorage) {
                if (storage[setting] != null) {
                    // save b4
                    found = true;
                    const b4Setting = storage[setting];
                    // apply prop value
                    if (prop.type === "bool")
                        storage[setting] = prop.value === true;
                    else
                        storage[setting] = prop.value;

                    if (b4Setting !== storage[setting]) {
                        // This setting has changed
                        if (_reInit.includes(setting)) reInitFlag = true;
                        if (_regen.includes(setting)) reGenLevels = true;
                        if (_spiral.includes(setting)) setSpiral = true;
                    }
                }
            }
            // invalid?
            if (!found) print("Unknown setting: " + setting + ". Are you using an old preset?", true);
        }

        // update preview visibility after setting possibly changed
        weicue.updatePreview();

        // Custom bg color
        if (props.main_color) {
            const spl = props.main_color.value.split(' ');
            for (let i = 0; i < spl.length; i++) spl[i] *= 255;
            document.body.style.backgroundColor = "rgb(" + spl.join(", ") + ")";
        }

        // Custom user images
        if (props.img_background)
            self.setImgSrc("#img_back", props.img_background.value);
        if (props.img_overlay)
            self.setImgSrc("#img_over", props.img_overlay.value);

        // initialize texture splash
        if (props.base_texture) {
            switch (props.base_texture.value) {
                default:
                    sett.base_texture_path = "./img/galaxy.png";
                    break;
                case 1:
                    sett.base_texture_path = "./img/cuboid.png";
                    break;
                case 2:
                    sett.base_texture_path = "./img/fractal.png";
                    break;
            }
            reInitFlag = true;
        }

        // re-initialize colors if mode or user value changed
        if (props.color_mode || props.user_color_a || props.user_color_b) {
            self.initHueValues();
        }

        // debug logging
        if (props.debugging) self.debug = props.debugging.value === true;
        if (!self.debug && self.debugTimeout) {
            clearTimeout(self.debugTimeout);
            self.debugTimeout = null;
        }
        if (self.debug && !self.debugTimeout)
            self.debugTimeout = setTimeout(() => self.applyCustomProps({debugging: {value: false}}), 1000 * 60);

        $("#debugwnd").css("visibility", self.debug ? "visible" : "hidden");

        // fix for centered camera on Parallax "none"
        if (sett.parallax_option === 0) self.mouseX = self.mouseY = 0;
        // set Cursor for "fixed" parallax mode
        if (sett.parallax_option === 3) self.positionMouseAngle(sett.parallax_angle);

        // Regen levels to see the effect of the setting change sooner.
        if (reGenLevels && !reInitFlag) {
            // Destroy any queued levels
            while (self.afterRenderQueue.length > 0) {
                self.afterRenderQueue.shift();
            }
            const attrSet = self.GetAttrSettings();
            for (let l = 0; l < sett.num_levels; l++) {
                // Set all levels to use the same orbital choices
                self.fractalFuncs[l] = self.NormalizeFractChoices(attrSet);
                // Regenerate levels with new choices
                if (self.state !== RunState.None) self.generateLevel(l);
            }
        }

        if (setSpiral) {
            // Update spiral radian field
            self.spiralRad = (sett.spiral * Math.PI / 180);
            // Reset all levels to default rotation
            if (!reInitFlag) {
                self.setToDefaultRotation();
            }
        }

        // Call precalculation after settings are updated
        this.precalculateRuntimeValues();

        // have render-relevant settings been changed?
        return reInitFlag;
    },

    // Set Image
    setImgSrc: function (imgID, srcVal) {
        $(imgID).fadeOut(1000, () => {
            if (srcVal && srcVal !== "") {
                $(imgID).attr("src", "file:///" + srcVal);
                $(imgID).fadeIn(1000);
            }
        });
    },


    ///////////////////////////////////////////////
    // INITIALIZE
    ///////////////////////////////////////////////

    /**
     * Precalculate values that don't change during rendering
     */
    precalculateRuntimeValues: function() {
        const sett = this.settings;

        // Store precalculated values
        this.precalc = {
            // Camera/parallax constants
            cameraBound: sett.camera_bound,
            parallaxStrength: sett.parallax_strength / 50,
            cameraSmoothing: 0.05,

            // Color constants
            colorFadeSpeed: sett.color_fade_speed / 4000,
            minSaturation: sett.minimum_saturation / 100,
            minBrightness: sett.minimum_brightness / 100,
            defaultSaturation: sett.default_saturation / 100,
            defaultBrightness: sett.default_brightness / 100,

            // Movement constants
            baseZoomVelocity: sett.zoom_val / 1.5,
            baseRotation: sett.rotation_val / 5000,

            // Audio constants
            audioZoomBase: sett.audiozoom_val / 3,
            audioZoomFactor: sett.audiozoom_val * 0.03,
            audioRotationFactor: 0.02,
            flmult: (15 + sett.audio_multiplier) * 0.02,
            audioSmoothing: sett.audio_smoothing / 1000,

            // Level constants
            levelStep: (sett.num_levels * sett.level_depth * 1.2) / 128,

            // Spiral calculation
            spiralRad: (sett.spiral * Math.PI / 180)
        };

        return this.precalc;
    },

    initOnce: function () {
        print("initializing...");
        let self = audiOrbits;
        let sett = self.settings;

        // No WebGL ? o.O
        if (!THREE || !Detector.webgl) {
            Detector.addGetWebGLMessage();
            return;
        }

        // bruh...
        ThreePatcher.patch();
        // set global caching
        THREE.Cache.enabled = true;

        // get static elements
        self.resetBar = document.getElementById("reload-bar");
        self.resetText = document.getElementById("reload-text");
        self.container = document.getElementById("renderContainer");

        // add global mouse (parallax) listener
        let mouseUpdate = (event) => {
            if (sett.parallax_option !== 1) return;
            if (event.touches && event.touches.length === 1) {
                event.preventDefault();
                self.mouseX = event.touches[0].pageX - self.windowHalfX;
                self.mouseY = event.touches[0].pageY - self.windowHalfY;
            } else if (event.clientX) {
                self.mouseX = event.clientX - self.windowHalfX;
                self.mouseY = event.clientY - self.windowHalfY;
            }
        }
        document.addEventListener("touchstart", mouseUpdate, false);
        document.addEventListener("touchmove", mouseUpdate, false);
        document.addEventListener("mousemove", mouseUpdate, false);

        // scaling listener
        window.addEventListener("resize", (e) => {
            self.windowHalfX = window.innerWidth / 2;
            self.windowHalfY = window.innerHeight / 2;
            if (!self.camera || !self.renderer) return;
            self.camera.aspect = window.innerWidth / window.innerHeight;
            self.camera.updateProjectionMatrix();
            self.renderer.setSize(window.innerWidth, window.innerHeight);
        }, false);

        // Save a copy of the settings into an array
        self.currAttrSett = self.GetAttrSettings();

        // init plugins
        LUTSetup.run();
        weicue.init();

        // initialize
        self.clock = new THREE.Clock();
        self.initSystem();

        // initialize wrapper
        let initWrap = () => {
            $("#mainCvs").addClass("show");
            self.popupMessage("<h1>" + document.title + "</h1>", true);
        };

        // show seizure warning before initializing?
        if (!sett.seizure_warning) initWrap();
        else WarnHelper.Show(initWrap);
    },

    // re-initializes the wallpaper after some time
    reInitSystem: function () {
        print("re-initializing...");
        // Lifetime variables
        let self = audiOrbits;

        // hide reloader
        ReloadHelper.Hide();
        // kill intervals
        clearInterval(self.swirlInterval);
        self.levelWorker.terminate();
        self.levelWorkersRunning = 0;
        // kill stats
        if (self.stats) self.stats.dispose();
        self.stats = null;
        // kill shader processor
        if (self.composer) self.composer.reset();
        self.composer = null;
        // kill frame animation and webgl
        self.setRenderer(null);
        self.renderer.forceContextLoss();
        // recreate webgl canvas
        self.container.removeChild(self.mainCanvas);
        let mainCvs = document.createElement("canvas");
        mainCvs.id = "mainCvs";
        self.container.appendChild(mainCvs);
        // actual re-init
        self.initSystem();
        // show again
        $("#mainCvs").addClass("show");
    },

    // initialize the geometric & graphics system
    // => starts rendering loop afterward
    initSystem: function () {
        // Lifetime variables
        let self = audiOrbits;
        let sett = self.settings;

        // reset rendering
        self.speedVelocity = 0;
        self.swirlStep = 0;
        // reset Orbit data
        self.levels = [];
        self.moveBacks = [];
        self.hueValues = [];
        self.afterRenderQueue = [];
        // Set the fractalFuncs to equal the number of funcs we have
        self.fractalFuncs = Array(sett.num_levels);
        // Radian representation of spiral
        self.spiralRad = (sett.spiral * Math.PI / 180);


        // setup level generator
        self.levelWorker = new Worker('./js/worker/levelWorker.js');
        self.levelWorker.addEventListener('message', self.levelGenerated, false);
        self.levelWorker.addEventListener('error', self.levelError, false);

        // init stats
        if (sett.stats_option >= 0) {
            print("Init stats: " + sett.stats_option);
            self.stats = new Stats();
            self.stats.showPanel(sett.stats_option); // 0: fps, 1: ms, 2: mb, 3+: custom
            document.body.appendChild(self.stats.dom);
        }

        // get canvases & contexts
        // ensure the canvas sizes are set !!!
        // these are independent of the style sizes
        self.mainCanvas = document.getElementById("mainCvs");
        self.mainCanvas.width = window.innerWidth;
        self.mainCanvas.height = window.innerHeight;

        // set origin Canvas to copy from
        weicue.mainCanvas = self.mainCanvas;

        // setup basic objects
        const attrSet = self.GetAttrSettings();
        for (let l = 0; l < sett.num_levels; l++) {
            self.fractalFuncs[l] = self.NormalizeFractChoices(attrSet);

            let sets = [];
            for (let i = 0; i < sett.num_subsets_per_level; i++) {
                sets[i] = {
                    child: null,
                };
            }
            // set subset moveback counter
            self.moveBacks[l] = 0;
            // create level object
            self.levels[l] = {
                myLevel: l,
                subsets: sets
            };
        }

        print("loading Texture: " + sett.base_texture_path);
        // load main texture
        // path, onLoad, onProgress, onError
        new THREE.TextureLoader().load(sett.base_texture_path,
            self.initWithTexture, undefined, self.textureError
        );
    },

    /// continue initialisation after texture was loaded
    initWithTexture: function (texture) {
        let self = audiOrbits;
        let sett = self.settings;
        print("texture loaded.")

        // create camera
        self.camera = new THREE.PerspectiveCamera(sett.field_of_view, window.innerWidth / window.innerHeight, 1, 3 * sett.scaling_factor);
        self.camera.position.z = sett.scaling_factor / 2;
        // create distance fog
        self.scene = new THREE.Scene();
        self.scene.fog = new THREE.FogExp2(0x000000, sett.fog_thickness / 10000);
        // generate random hue vals
        self.initHueValues();

        // generate level object structure
        self.initGeometries(texture);

        self.renderer = new THREE.WebGLRenderer({
            canvas: self.mainCanvas,
            clearColor: 0x000000,
            clearAlpha: 1,
            alpha: true,
            antialias: false,
            logarithmicDepthBuffer: true
        });
        self.renderer.setSize(window.innerWidth, window.innerHeight);

        // initialize Shader Composer
        self.composer = new THREE.EffectComposer(self.renderer);
        self.initShaders();

        // set function to be called when all levels are generated
        // will apply data and trigger to start rendering
        self.levelWorkerCall = () => {

            // apply data manually
            while (self.afterRenderQueue.length > 0) {
                self.afterRenderQueue.shift()();
            }

            // prepare new orbit levels for the first reset/moveBack already
            for (let l = 0; l < sett.num_levels; l++) {
                self.generateLevel(l);
            }

            // start auto parallax handler
            self.swirlInterval = setInterval(self.swirlHandler, 1000 / 60);

            // start rendering
            self.setRenderer(self.renderLoop);

            print("initializing complete.", true);
        };

        // generate the levels
        for (let l = 0; l < sett.num_levels; l++) {
            self.generateLevel(l);
        }
    },

    // create WEBGL objects for each level and subset
    initGeometries: function (texture) {
        let self = audiOrbits;
        let sett = self.settings;
        print("building geometries.");
        // material properties
        let matprops = {
            map: texture,
            size: sett.texture_size,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true
        };

        let subsetDist = sett.level_depth / sett.num_subsets_per_level;
        // build all levels
        for (let k = 0; k < sett.num_levels; k++) {
            // build all subsets
            for (let s = 0; s < sett.num_subsets_per_level; s++) {
                // create particle geometry from orbit vertex data
                let geometry = new THREE.BufferGeometry();

                // position attribute (2 vertices per point, that's pretty illegal)
                geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sett.num_points_per_subset * 2), 2));

                // create particle material with map & size
                let material = new THREE.PointsMaterial(matprops);
                // set material defaults
                material.color.setHSL(self.hueValues[s], 0, 0);
                // create particle system from geometry and material
                let particles = new THREE.Points(geometry, material);
                particles.myMaterial = material;
                particles.myLevel = k;
                particles.mySubset = s;
                particles.position.x = 0;
                particles.position.y = 0;
                if (sett.level_shifting) {
                    particles.position.z = -sett.level_depth * k - (s * subsetDist * 2) + sett.scaling_factor / 2;
                    if (k % 2 !== 0) particles.position.z -= subsetDist;
                } else particles.position.z = -sett.level_depth * k - (s * subsetDist) + sett.scaling_factor / 2;
                // euler angle 45 deg in radians
                if (self.spiralRad !== 0) self.updateSpiral(particles);
                else particles.rotation.z = DEFAULT_LEVEL_ROTATION;
                particles.needsUpdate = false;
                // add to scene
                self.scene.add(particles);
                self.levels[k].subsets[s].child = particles;
            }
        }
    },

    // initialize shaders after composer
    initShaders: function () {
        let self = audiOrbits;
        let sett = self.settings;
        // last added filter
        let lastEffect = null;
        print("adding shaders to render chain.");
        self.composer.addPass(new THREE.RenderPass(self.scene, self.camera, null, 0x000000, 1));
        // bloom
        if (sett.bloom_filter) {
            let urBloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 3, 0, 0.1);
            urBloomPass.renderToScreen = false;
            self.composer.addPass(urBloomPass);
            lastEffect = urBloomPass;
        }

        // lookup table filter
        if (sett.lut_filter >= 0) {
            // add normal or filtered LUT shader
            let lutInfo = LUTSetup.Textures[sett.lut_filter];
            // get normal or filtered LUT shader
            let lutPass = new THREE.ShaderPass(lutInfo.filter ?
                THREE.LUTShader : THREE.LUTShaderNearest);
            // prepare render queue
            lutPass.renderToScreen = false;
            lutPass.material.transparent = true;
            self.composer.addPass(lutPass);
            lastEffect = lutPass;
            // set shader uniform values
            lutPass.uniforms.lutMap.value = lutInfo.texture;
            lutPass.uniforms.lutMapSize.value = lutInfo.size;
        }

        // fractal mirror shader
        if (sett.mirror_shader > 1) {
            let mirrorPass = new THREE.ShaderPass(THREE.FractalMirrorShader);
            mirrorPass.renderToScreen = false;
            mirrorPass.material.transparent = true;
            self.composer.addPass(mirrorPass);
            lastEffect = mirrorPass;
            // set shader uniform values
            mirrorPass.uniforms.invert.value = sett.mirror_invert;
            mirrorPass.uniforms.numSides.value = sett.mirror_shader;
            mirrorPass.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
        }

        // Nvidia FX antialiasing
        if (sett.ufx_antialiasing) {
            let fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
            fxaaPass.renderToScreen = false;
            fxaaPass.material.transparent = true;
            self.composer.addPass(fxaaPass);
            lastEffect = fxaaPass;
            // set uniform
            fxaaPass.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
        }

        // TWO-PASS Blur using the same directional shader
        if (sett.blur_strength > 0) {
            let bs = sett.blur_strength / 5;
            // X
            let blurPassX = new THREE.ShaderPass(THREE.BlurShader);
            blurPassX.renderToScreen = false;
            blurPassX.material.transparent = true;
            blurPassX.uniforms.u_dir.value = new THREE.Vector2(bs, 0);
            blurPassX.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
            self.composer.addPass(blurPassX);
            // Y
            let blurPassY = new THREE.ShaderPass(THREE.BlurShader);
            blurPassY.renderToScreen = false;
            blurPassY.material.transparent = true;
            blurPassY.uniforms.u_dir.value = new THREE.Vector2(0, bs);
            blurPassY.uniforms.iResolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
            self.composer.addPass(blurPassY);
            // chaining
            lastEffect = blurPassY;
        }

        // render last effect
        if (lastEffect) lastEffect.renderToScreen = true;
    },

    // failed to load texture
    textureError: function (err) {
        print("texture loading error:", true);
        print(err, true);
    },

    // initialize hue-values by color mode
    initHueValues: function () {
        let self = audiOrbits;
        let sett = self.settings;
        let cobj = self.colorObject = self.getColorObject();
        print("initHueValues: a=" + cobj.hsla + ", b=" + cobj.hslb, true);
        for (let s = 0; s < sett.num_subsets_per_level; s++) {
            let col = Math.random();
            switch (sett.color_mode) {
                case 1:
                case 4:
                    col = cobj.hsla;
                    break;
                case 2:
                    col = cobj.hsla + (s / sett.num_subsets_per_level * cobj.range);
                    break;
                case 3:
                    col = cobj.hsla + (col * cobj.range);
                    break;
            }
            self.hueValues[s] = col;
        }
    },

    // returns the processed user color object
    getColorObject: function () {
        let self = audiOrbits;
        let sett = self.settings;
        let a = self.rgbToHue(sett.user_color_a.split(" ")).h;
        let b = self.rgbToHue(sett.user_color_b.split(" ")).h;
        let mi = Math.min(a, b);
        let ma = Math.max(a, b);
        return {
            hsla: a,
            hslb: b,
            min: mi,
            max: ma,
            range: b - a
        };
    },

    // get HUE val
    rgbToHue: function (arr) {
        let rr, gg, bb, h, s;
        const rabs = arr[0] / 255;
        const gabs = arr[1] / 255;
        const babs = arr[2] / 255;
        const v = Math.max(rabs, gabs, babs);
        const diff = v - Math.min(rabs, gabs, babs);
        const diffCalc = c => (v - c) / 6 / diff + 1 / 2;
        if (diff === 0) {
            h = s = 0;
        } else {
            s = diff / v;
            rr = diffCalc(rabs);
            gg = diffCalc(gabs);
            bb = diffCalc(babs);

            if (rabs === v) {
                h = bb - gg;
            } else if (gabs === v) {
                h = (1 / 3) + rr - bb;
            } else if (babs === v) {
                h = (2 / 3) + gg - rr;
            }
            if (h < 0) {
                h += 1;
            } else if (h > 1) {
                h -= 1;
            }
        }
        return {
            h: h,
            s: s,
            v: v
        };
    },

    setToDefaultRotation: function () {
        let self = audiOrbits;
        let sett = self.settings;
        // If it was set to 0, then set all levels to the default rotation.
        if (self.spiralRad === 0 && self.state !== RunState.None) {
            for (let k = 0; k < sett.num_levels; k++) {
                // Reset level rotation
                for (let s = 0; s < sett.num_subsets_per_level; s++) {
                    self.levels[k].subsets[s].child.rotation.z = DEFAULT_LEVEL_ROTATION;
                }
            }
        }
    },

    ///////////////////////////////////////////////
    // RENDERING
    ///////////////////////////////////////////////

    // start or stop rendering
    setRenderer: function (renderFunc) {
        print("setRenderer: " + (renderFunc != null));
        let self = audiOrbits;
        let sett = self.settings;
        // clear all old renderers
        if (self.renderer) {
            self.renderer.setAnimationLoop(null);
        }
        if (self.renderTimeout) {
            clearTimeout(self.renderTimeout);
            self.renderTimeout = null;
        }
        // call new renderer ?
        if (renderFunc != null) {
            // set state to running
            self.state = RunState.Running;
            // initialize rendering
            if (sett.custom_fps) {
                self.renderTimeout = setTimeout(self.renderLoop, 1000 / sett.fps_value);
            } else if (self.renderer) {
                self.renderer.setAnimationLoop(renderFunc);
            } else print("not initialized!", true);
        }
    },

    // root render frame call
    renderLoop: function () {
        let self = audiOrbits;
        let sett = self.settings;
        // paused - stop render
        if (self.state !== RunState.Running) return;

        // custom rendering needs manual re-call
        if (self.renderTimeout)
            self.renderTimeout = setTimeout(self.renderLoop, 1000 / sett.fps_value);

        // track FPS, mem etc.
        if (self.stats) self.stats.begin();

        // Figure out how much time passed since the last animation and calc delta
        // Minimum we should reach is 1 FPS
        let ellapsed = Math.min(1, Math.max(0.001, self.clock.getDelta()));
        let delta = ellapsed * 60;

        // effect render first, then update
        self.composer.render();

        // update objects
        self.animateFrame(ellapsed, delta);

        // ICUE PROCESSING
        // it's better to do this every frame instead of separately timed
        weicue.updateCanvas();

        // randomly do one after-render-action
        // yes this is intended: "()()"
        if (self.afterRenderQueue.length > 0) {
            if (self.speedVelocity > 5 || Math.random() > 0.4)
                self.afterRenderQueue.shift()();
        }

        // stats
        if (self.stats) self.stats.end();
    },

    // render a single frame with the given delta
    animateFrame: function(elapsed, deltaTime) {
        const self = audiOrbits;
        const sett = self.settings;
        const precalc = self.precalc;

        // Calculate camera parallax with smoothing
        if (sett.parallax_option !== 0) {
            const clampCam = (axis) => Math.min(precalc.cameraBound, Math.max(-precalc.cameraBound, axis));
            const newCamX = clampCam(self.mouseX * precalc.parallaxStrength);
            const newCamY = clampCam(self.mouseY * -precalc.parallaxStrength);

            if (self.camera.position.x !== newCamX) {
                self.camera.position.x += (newCamX - self.camera.position.x) * deltaTime * precalc.cameraSmoothing;
            }
            if (self.camera.position.y !== newCamY) {
                self.camera.position.y += (newCamY - self.camera.position.y) * deltaTime * precalc.cameraSmoothing;
            }
        }

        // Shift hue values using precalculated speed
        if (sett.color_mode === 0) {
            const hueAdd = precalc.colorFadeSpeed * deltaTime;
            for (let s = 0; s < sett.num_subsets_per_level - 1; s++) {
                self.hueValues[s] += hueAdd;
                if (self.hueValues[s] >= 1) {
                    self.hueValues[s] -= 1;
                }
            }
        }

        // Set camera view-target to scene-center
        self.camera.lookAt(self.scene.position);

        // Calculate boost strength & step size if data given
        const hasAudio = weas.hasAudio();
        let spvn = precalc.baseZoomVelocity * deltaTime;
        let rot = precalc.baseRotation * deltaTime;

        if (hasAudio) {
            // Get audio data
            const lastAudio = weas.lastAudio;

            // Calculate audio influence using precalculated multipliers
            spvn = (spvn + precalc.audioZoomBase) * deltaTime;
            const boost = lastAudio.intensity * precalc.flmult;

            // Apply audio to velocity
            if (sett.audiozoom_val > 0) {
                spvn += precalc.baseZoomVelocity * boost * 0.01 + boost * precalc.audioZoomFactor * deltaTime;
            }

            // Apply audio to rotation
            rot *= boost * precalc.audioRotationFactor;
        }

        // Apply zoom smoothing
        if (!hasAudio || sett.audiozoom_smooth) {
            spvn -= ((spvn - self.speedVelocity) * precalc.audioSmoothing);
        }

        // No negative zoom?
        if (sett.only_forward && spvn < 0) {
            spvn = 0;
        }

        // Store current velocity
        self.speedVelocity = spvn;

        // Reuse the same HSL object to reduce garbage collection
        if (!self.reusableHSL) {
            self.reusableHSL = { h: 0, s: 0, l: 0 };
        }

        // move as many calculations out of loop as possible
        let minSat = sett.minimum_saturation / 100;
        let minBri = sett.minimum_brightness / 100;
        // get targeted saturation & brightness
        let defSat = sett.default_saturation / 100;
        let defBri = sett.default_brightness / 100;
        let sixtyDelta = deltaTime * 2000;

        let freqData, freqLvl, hsl, tmpHue, setHue, setSat, setLight;

        // Update all objects in the scene
        for (let i = 0; i < self.scene.children.length; i++) {
            const child = self.scene.children[i];

            // Reset if out of bounds
            if (child.position.z > self.camera.position.z) {
                // offset to back
                //print("moved back child: " + i);
                child.position.z -= sett.num_levels * sett.level_depth;
                self.moveBacks[child.myLevel]++;
                if (self.spiralRad !== 0) self.updateSpiral(child);

                // update the child visually
                if (child.needsUpdate) {
                    child.geometry.attributes.position.needsUpdate = true;
                    child.needsUpdate = false;
                }
                // process subset generation
                if (self.moveBacks[child.myLevel] === sett.num_subsets_per_level) {
                    self.moveBacks[child.myLevel] = 0;
                    self.generateLevel(child.myLevel);
                }
            }

            // Update position and rotation
            child.position.z += spvn;
            child.rotation.z -= rot - self.spinWildly;

            // targeted HUE
            tmpHue = Math.abs(self.hueValues[child.mySubset]);

            // HSL calculation with audio?
            if (hasAudio) {
                const lastAudio = weas.lastAudio;
                const step = precalc.levelStep;
                const boost = lastAudio.intensity * precalc.flmult;

                // use obj to camera distance with step to get frequency from data >> do some frequency calculations
                freqData = parseFloat(lastAudio.data[Math.round((self.camera.position.z - child.position.z) / step) + 4]);
                freqLvl = (freqData * precalc.flmult / 3) / lastAudio.max;

                if (sett.color_mode === 4)
                    tmpHue += (self.colorObject.hslb - tmpHue) * freqData / lastAudio.max;
                else if (sett.color_mode === 0)
                    tmpHue += freqLvl;

                // quick maths
                setHue = tmpHue % 1.0;
                setSat = Math.abs(minSat + freqLvl + freqLvl * boost * 0.07);
                setLight = Math.min(0.7, minBri + freqLvl + freqLvl * boost * 0.01);
            } else {
                // get current HSL
                hsl = child.myMaterial.color.getHSL({});
                setHue = hsl.h;
                setSat = hsl.s;
                setLight = hsl.l;

                // targeted HSL
                if (Math.abs(tmpHue - setHue) > 0.01)
                    setHue += (tmpHue - setHue) / sixtyDelta;
                if (Math.abs(defSat - setSat) > 0.01)
                    setSat += (defSat - setSat) / sixtyDelta;
                if (Math.abs(defBri - setLight) > 0.01)
                    setLight += (defBri - setLight) / sixtyDelta;
            }

            // Set HSL without creating new objects
            self.reusableHSL.h = self.clamp(setHue, 0, 1, true);
            self.reusableHSL.s = self.clamp(setSat, 0, 1);
            self.reusableHSL.l = self.clamp(setLight, 0, 1);

            child.myMaterial.color.setHSL(
                self.reusableHSL.h,
                self.reusableHSL.s,
                self.reusableHSL.l
            );
        }
    },

    // correct dem colors to be safe
    clamp: function (val, min, max, goround) {
        if (goround) {
            if (val < min) return max - val;
            return val % max;
        } else {
            return Math.max(Math.min(val, max), min);
        }
    },

    updateSpiral: function (level) {
        let self = audiOrbits;
        let newRotVal = self.lastSpiralRot + self.spiralRad;
        self.lastSpiralRot = newRotVal;
        level.rotation.z = newRotVal;
    },

    ///////////////////////////////////////////////
    // FRACTAL GENERATOR
    ///////////////////////////////////////////////

    // web worker has finished generating the level
    levelGenerated: function(e) {
        const data = e.data;
        print("Received data for level: " + data.id);

        let self = audiOrbits;
        self.levelWorkersRunning--;

        // Handle chunked data
        if (!data.complete) {
            // Initialize the chunk storage if needed
            if (!chunkBuffers[data.id]) {
                chunkBuffers[data.id] = {
                    receivedChunks: 0,
                    totalChunks: data.totalChunks,
                    buffer: new Float32Array(data.totalSize / Float32Array.BYTES_PER_ELEMENT)
                };
            }

            // Store the chunk data
            const chunkData = new Float32Array(data.chunkData);
            const startIdx = data.chunkIndex * (data.chunkData.byteLength / Float32Array.BYTES_PER_ELEMENT);
            chunkBuffers[data.id].buffer.set(chunkData, startIdx);
            chunkBuffers[data.id].receivedChunks++;

            // Check if all chunks have been received
            if (chunkBuffers[data.id].receivedChunks === chunkBuffers[data.id].totalChunks) {
                // Process complete data
                self.processLevelData(data.id, chunkBuffers[data.id].buffer);

                // Clean up
                delete chunkBuffers[data.id];
            }
        } else {
            // This is a complete (non-chunked) message
            self.processLevelData(data.id, new Float32Array(data.xyzBuff));
        }

        // Check if all workers have finished
        if (self.levelWorkersRunning === 0 && self.levelWorkerCall) {
            self.levelWorkerCall();
            self.levelWorkerCall = null;
        }
    },

    processLevelData: function(levelId, xyzBuff) {
        let self = audiOrbits;
        let sett = self.settings;
        let subbs = self.levels[levelId].subsets;

        // Add tasks to the render queue with less blocking
        for (let s = 0; s < sett.num_subsets_per_level; s++) {
            self.afterRenderQueue.push(() => {
                // Calculate the slice indices more efficiently
                const startIdx = s * sett.num_points_per_subset * 2;
                const endIdx = startIdx + sett.num_points_per_subset * 2;

                // Update the geometry data
                const positions = subbs[s].child.geometry.attributes.position;
                for (let i = startIdx, j = 0; i < endIdx; i++, j++) {
                    positions.array[j] = xyzBuff[i];
                }
                positions.needsUpdate = true;
                subbs[s].child.needsUpdate = true;
            });
        }
    },

    // uh oh
    levelError: function (e) {
        print("level error: [" + e.filename + ", Line: " + e.lineno + "] " + e.message, true);
    },

    // queue worker event
    generateLevel: function (level) {
        print("generating level: " + level);
        audiOrbits.levelWorkersRunning++;
        let parms = {
            id: level,
            settings: audiOrbits.settings,
            frac: audiOrbits.fractalFuncs[level]
        };

        audiOrbits.levelWorker.postMessage(parms);
    },

    NormalizeFractChoices: function (attrSet) {
        let self = audiOrbits;
        let sett = self.settings;
        let i, temp;

        let normalizedChoices;
        const exclusiveParams = attrSet.filter(p => p === 100);
        if (exclusiveParams.length > 0) {
            // Any 100s are treated as exclusive parameters.
            normalizedChoices = attrSet.map(p => p === 100 ? (1 / exclusiveParams.length) : 0);
        } else {
            // Otherwise use the normal weight calculation
            let total = attrSet.reduce((a, b) => a + b, 0);
            if (total === 0) {
                // User selected all 0s. Randomly select a fractal
                if (sett.rotation_val === -10) {
                    // Camera rotation value was set to -10
                    // As an added bonus, spin the camera a lot as a little Easter egg.
                    self.spinWildly = 5;
                }
                // Pick a random index within our array size
                let rand = Math.floor(Math.random() * (attrSet.length + 1));
                normalizedChoices = self.GetAttrSettings();
                normalizedChoices[rand] = 1;
            } else {
                if (self.spinWildly !== 0) {
                    // Revert camera spin back to normal
                    self.spinWildly = 0;
                    if (self.state === RunState.Running) {
                        self.setToDefaultRotation();
                    }
                }
                normalizedChoices = attrSet.map(p => total > 0 ? p / total : 0);
            }
        }

        // Map each fractal choice to an index into a lookup-table used by the web worker
        mapArrToFuncIndx = (c) => {
            const fc = Array(c.length);
            for (i = 0; i < c.length; i++) {
                fc[i] = [c[i], i];
            }
            return fc;
        }
        // Bubble sort intern func. Highest to lowest. Remove any indexes with a 0 value.
        bubSort = (arr, size) => {
            // Sort
            for (i = 0; i < size - 1; i++) {
                for (let j = 0; j < size - i - 1; j++) {
                    if (arr[j][0] < arr[j + 1][0]) {
                        temp = arr[j];
                        arr[j] = arr[j + 1];
                        arr[j + 1] = temp;
                    }
                }
            }
        }
        // Sum up the fields, saving as we go
        sumNormalization = (arr, size) => {
            let j = 0;
            // Save first element's value
            let culm = arr[0][0];

            // Iterate through the array starting at index 1. Sum
            // all saving the rolling sum as we go.
            for (i = 1; i < size - j; i++) {
                if (arr[i][0] === 0) {
                    arr.pop();
                    i--;
                    j++;
                    continue;
                }
                culm += arr[i][0];
                arr[i][0] = culm;
            }

            if (culm === 0) {
                // Everything was 0. Pop off first element so array is empty.
                arr.pop();
            }
        }
        const fc = mapArrToFuncIndx(normalizedChoices);
        bubSort(fc, fc.length);
        sumNormalization(fc, fc.length);

        return fc;
    },


    ///////////////////////////////////////////////
    // EVENT HANDLER & TIMERS
    ///////////////////////////////////////////////

    // Auto Parallax handler
    swirlHandler: function () {
        let sett = audiOrbits.settings;
        if (sett.parallax_option !== 2) {
            return;
        }
        audiOrbits.swirlStep += sett.auto_parallax_speed / 8;
        if (audiOrbits.swirlStep > 360) audiOrbits.swirlStep -= 360;
        else if (audiOrbits.swirlStep < 0) audiOrbits.swirlStep += 360;
        audiOrbits.positionMouseAngle(audiOrbits.swirlStep);
    },
    // position Mouse with angle
    positionMouseAngle: function (degrees) {
        let ang = degrees * Math.PI / 180;
        let w = window.innerHeight;
        if (window.innerWidth < w) w = window.innerWidth;
        w /= 2;
        audiOrbits.mouseX = w * Math.sin(ang);
        audiOrbits.mouseY = w * Math.cos(ang);
    },
    // popup message handler
    popupMessage: function (msg, hideAfter) {
        const txtElm = $("#txtholder");
        txtElm.html(msg);
        txtElm.fadeIn({queue: false, duration: "slow"});
        txtElm.animate({bottom: "40px"}, "slow");
        if (hideAfter) setTimeout(() => {
            txtElm.fadeOut({queue: false, duration: "slow"});
            txtElm.animate({bottom: "-40px"}, "slow");
        }, 7000);
    }
};


///////////////////////////////////////////////
// Actual Initialisation
///////////////////////////////////////////////

// will apply settings edited in Wallpaper Engine
// this will also cause initialization for the first time
window.wallpaperPropertyListener = {
    applyUserProperties: (props) => {
        let initFlag = audiOrbits.applyCustomProps(props);
        // very first initialization
        if (audiOrbits.state === RunState.None) {
            audiOrbits.state = RunState.Initializing;
            $(() => audiOrbits.initOnce());
        } else if (initFlag) {
            audiOrbits.state = RunState.ReInitializing;
            print("got reInit-flag from applying settings!", true);
            if (audiOrbits.resetTimeout) clearTimeout(audiOrbits.resetTimeout);
            audiOrbits.resetTimeout = setTimeout(audiOrbits.reInitSystem, audiOrbits.resetTimespan * 1000);
            // show reloader
            ReloadHelper.Show();
            $("#mainCvs").removeClass("show");
        }
    },
    setPaused: (isPaused) => {
        weicue.PAUSED = isPaused;
        if (audiOrbits.state === RunState.Paused) {
            if (isPaused) return;
            audiOrbits.state = RunState.Running;
        } else if (audiOrbits.state === RunState.Running) {
            if (!isPaused) return;
            audiOrbits.state = RunState.Paused;
        }
        console.log("Set pause: " + isPaused);
        audiOrbits.setRenderer(isPaused ? null : audiOrbits.renderLoop);
    }
};

// after the page finished loading: if the wallpaper context is not given
// AND wewwa fails for some reason => start wallpaper manually with default settings.
$(() => {
    if (!window.wallpaperRegisterAudioListener && audiOrbits.state === RunState.None) {
        print("wallpaperRegisterAudioListener not defined. We are probably outside of wallpaper engine. Manual init..", true);
        audiOrbits.applyCustomProps({});
        audiOrbits.state = RunState.Initializing;
        audiOrbits.initOnce();
    }
});
