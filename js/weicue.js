/**
 * @author D.Thiele @https://hexxon.me
 *
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @see
 * REQUIRES:
 * - jQuery
 * - some html
 * - some css
 * 
 * @description
 * WEICUE
 * Wallpaper Engine iCUE effects for web wallpapers
 * 
 * Uses several different methods to create
 * Lighting effects for Corsair ICUE devices.
 */

var weicue = {
    // runtime values
    available: false,
    canvasX: 23,
    canvasY: 7,
    devices: [],
    preview: null,
    icueInterval: null,
    mainCanvas: null,
    helperCanvas: null,
    helperContext: null,
    // settings
    settings: {
        icue_mode: 1,
        icue_area_xoff: 50,
        icue_area_yoff: 90,
        icue_area_width: 75,
        icue_area_height: 30,
        icue_area_blur: 5,
        icue_area_decay: 15,
        icue_area_preview: false,
        icue_main_color: "0 0.8 0",
    },

    // show a message by icue
    icueMessage: function (msg) {
        $("#icuetext").html(msg);
        $("#icueholder").fadeIn({ queue: false, duration: "slow" });
        $("#icueholder").animate({ top: "0px" }, "slow");
        setTimeout(() => {
            $("#icueholder").fadeOut({ queue: false, duration: "slow" });
            $("#icueholder").animate({ top: "-120px" }, "slow");
        }, 12000);
    },

    // helper
    getArea: function (inPx) {
        var sett = weicue.settings;
        var wwid = window.innerWidth;
        var whei = window.innerHeight;
        var w = wwid * sett.icue_area_width / 100;
        var h = whei * sett.icue_area_height / 100;
        var l = ((wwid - w) * sett.icue_area_xoff / 100);
        var t = ((whei - h) * sett.icue_area_yoff / 100);
        return {
            width: w + (inPx ? "px" : ""),
            height: h + (inPx ? "px" : ""),
            left: l + (inPx ? "px" : ""),
            top: t + (inPx ? "px" : ""),
        };
    },

    // get data for icue
    getEncodedCanvasImageData: function (imageData) {
        var colorArray = [];
        for (var d = 0; d < imageData.data.length; d += 4) {
            var write = d / 4 * 3;
            colorArray[write] = imageData.data[d];
            colorArray[write + 1] = imageData.data[d + 1];
            colorArray[write + 2] = imageData.data[d + 2];
        }
        return String.fromCharCode.apply(null, colorArray);
    },

    // canvas blur helper function
    gBlurCanvas: function (canvas, ctx, blur) {
        var sum = 0;
        var delta = 5;
        var alpha_left = 1 / (2 * Math.PI * delta * delta);
        var step = blur < 3 ? 1 : 2;

        var x, weight;
        for (var y = -blur; y <= blur; y += step) {
            for (x = -blur; x <= blur; x += step) {
                weight = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta));
                sum += weight;
            }
        }
        for (var y = -blur; y <= blur; y += step) {
            for (x = -blur; x <= blur; x += step) {
                ctx.globalAlpha = alpha_left * Math.exp(-(x * x + y * y) / (2 * delta * delta)) / sum * blur * blur;
                ctx.drawImage(canvas, x, y);
            }
        }
        ctx.globalAlpha = 1;
    },

    // show or hide preview
    updatePreview: function () {
        var self = weicue;
        var sett = self.settings;
        // create preview?
        if (!self.preview && sett.icue_area_preview) {
            self.preview = document.createElement("div");
            self.preview.classList.add("cuePreview");
            document.body.appendChild(self.preview);
        }
        // update settings or destroy
        if (self.preview) {
            if (!sett.icue_area_preview) {
                document.body.removeChild(self.preview);
                self.preview = null;
            }
            else Object.assign(self.preview.style, self.getArea(true));
        }
    },

    // will initialize ICUE api & usage
    init: function (originCanvas) {
        var self = weicue;
        if (!self.available) {
            self.icueMessage("iCUE: Not available!");
            return;
        }
        // start
        self.mainCanvas = originCanvas;
        print("weiCUE: init...");

        // recreate if reinit
        if (self.icueInterval) clearInterval(self.icueInterval);
        if (self.helperCanvas) document.body.removeChild(self.helperCanvas);
        // setup canvas
        self.helperCanvas = document.createElement("canvas");
        self.helperCanvas.id = "helpCvs";
        self.helperCanvas.width = self.canvasX;
        self.helperCanvas.height = self.canvasY;
        self.helperCanvas.style.display = "none";
        self.helperContext = self.helperCanvas.getContext("2d");
        document.body.appendChild(self.helperCanvas);

        // setup devices
        self.devices = [];
        window.cue.getDeviceCount((deviceCount) => {
            self.icueMessage("iCUE: " + deviceCount + " devices found.");
            for (var xi = 0; xi < deviceCount; xi++) {
                var xl = xi;
                window.cue.getDeviceInfo(xl, (info) => {
                    info.id = xl;
                    window.cue.getLedPositionsByDeviceIndex(xl, function (leds) {
                        info.leds = leds;
                        self.devices[xl] = info;
                    });
                });
            }
        });
        // update devices about every 33ms/30fps. iCue doesnt really support higher values 
        self.icueInterval = setInterval(self.updateFrame, 1000 / 30);
    },

    // do the thing...
    updateFrame: function () {
        var self = weicue;
        var sett = self.settings;
        if (audiOrbits.state == RunState.Paused || !self.available || sett.icue_mode == 0 || self.devices.length < 1) return;
        // projection mode
        if (sett.icue_mode == 1) {
            // get scaled down image data and encode it for icue
            var encDat = self.getEncodedCanvasImageData(self.helperContext.getImageData(0, 0, self.canvasX, self.canvasY));
            // update all devices with data
            for (var xi = 0; xi < self.devices.length; xi++) {
                window.cue.setLedColorsByImageData(xi, encDat, self.canvasX, self.canvasY);
            }
        }
        // color mode
        if (sett.icue_mode == 2) {
            // get lol objects
            var col = sett.icue_main_color.split(" ");
            var ledColor = {
                r: col[0] * 255,
                g: col[1] * 255,
                b: col[2] * 255
            };;
            // try audio multiplier processing
            if (weas.hasAudio()) {
                var aud = weas.lastAudio;
                var mlt = 255 * aud.average / aud.range / aud.intensity * 10;
                ledColor = {
                    r: Math.min(255, Math.max(0, col[0] * mlt)),
                    g: Math.min(255, Math.max(0, col[1] * mlt)),
                    b: Math.min(255, Math.max(0, col[2] * mlt))
                };
            }
            // update all devices with data
            for (var xi = 0; xi < self.devices.length; xi++) {
                window.cue.setAllLedsColorsAsync(xi, ledColor);
            }
        }
    },

    // prepare canvas
    updateCanvas: function () {
        var self = weicue;
        var sett = self.settings;
        if (!self.available || sett.icue_mode == 0 || self.devices.length < 1) return;

        if (sett.icue_mode == 1) {
            // get helper vars
            var cueWid = self.canvasX;
            var cueHei = self.canvasY;
            var area = self.getArea();
            var hctx = self.helperContext;
            // overlay "decay"
            hctx.fillStyle = "rgba(0, 0, 0, " + sett.icue_area_decay / 100 + ")";
            hctx.fillRect(0, 0, cueWid, cueHei);
            // scale down and copy the image to the helper canvas
            hctx.drawImage(self.mainCanvas, area.left, area.top, area.width, area.height, 0, 0, cueWid, cueHei);
            // blur the helper projection canvas
            if (sett.icue_area_blur > 0) self.gBlurCanvas(self.helperCanvas, hctx, sett.icue_area_blur);
        }
    }
};

// will initialize icue functionality if available
if (!window.wallpaperPluginListener)
    window.wallpaperPluginListener = {};

// actual plugin handler
var pluginLoad = function (name, version) {
    print("weiCUE plugin: " + name + ", Version: " + version);
    if (name === "cue") weicue.available = true;
};

// register event handler or wrap it, if it exists
if (!window.wallpaperPluginListener.onPluginLoaded)
    window.wallpaperPluginListener.onPluginLoaded = pluginLoad;
else {
    var passCall = window.wallpaperPluginListener.onPluginLoaded;
    window.wallpaperPluginListener.onPluginLoaded = (n, v) => {
        pluginLoad(n, v);
        passCall(n, v);
    }
}
