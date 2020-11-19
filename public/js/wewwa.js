/**
 * @author D.Thiele @https://hexx.one
 * 
 * @license
 * Copyright (c) 2020 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * @see
 * REQUIREMENTS:
 * - JQUERY >= 3.3.1
 * - HTML5 supported Browser (for webAudio processing)
 * - this file needs to be in the same (root) folder as your "project.json"
 * - this file needs to be included/loaded in your "index.html"
 * 
 * @description
 * WEWWA
 * Wallpaper Engine Web Wallpaper Adapter
 * 
 * This is an aditional JS file to be included in any Wallpaper Engine
 * Web-Wallpaper project so you can test, run & configure it from a normal web browser.
 * 
 * FEATURES:
 * - automatically detecting if the web wallpaper is opened by wallpaper engine or browser
 * - if opened by wallpaper engine, nothing will happen
 * - if opened by a browser:
 *   - automatically load the "project.json"
 *   - parse the settings, languages & conditions
 *   - add respective html elements for each setting type & condition
 *   - put these elements into an option menu which can be hidden
 *   - check localStorage for already saved/customized values
 *   - apply all settings once
 * - react to changes made in the ui and update them in the wallpaper
 * - save changes made in the ui to localStorage
 * 
 * @todo
 * - check for correct audio data
*/

var wewwApp = wewwApp || {};

wewwApp.Init = () => {
    wewwApp.LoadProjectJSON((proj) => {
        if (proj.type != "web") {
            console.error("Error! Loaded project.json is not a web Wallpaper. How did this happen? Aborting...");
            return;
        }
        wewwApp.project = proj;
        wewwApp.LoadStorage();
        wewwApp.AddStyle();
        wewwApp.AddMenu(localStorage.getItem("wewwaLang"));
        wewwApp.UpdateSettings();
        wewwApp.ApplyProp(proj.general.properties);
    });
}


// load json via ajax request
wewwApp.LoadProjectJSON = (complete) => {
    $.ajax({
        url: "project.json",
        beforeSend: (xhr) => xhr.overrideMimeType("text/plain;"),
        success: (result) => complete(JSON.parse(result)),
        error: (xhr, status, error) => console.error(status + ": ajax error!\r\n" + error)
    });
}

wewwApp.LoadStorage = () => {
    var props = wewwApp.project.general.properties;
    var last = localStorage.getItem("wewwaLastProps");
    if (last != null) {
        var merged = Object.assign(props, JSON.parse(last));
        wewwApp.project.general.properties = merged;
        console.debug("Loaded & merged settings.")
    }
}

// add style after loading page
wewwApp.AddStyle = () => {
    var st = document.createElement("style");
    st.innerHTML = `
    .wewwaMenu, .wewwaIcon {
        transform: none;
        transition: transform 500ms ease;
        position:absolute;
        top:0px;
        padding:10px;
        margin:10px;
        z-index:9999;
    }
    .wewwaMenu {
        border: solid 2px #444;
        width:400px;
        right:-440px;
        color:white;
        background-color:#333333;
        overflow-x:hidden;
        overflow-y:scroll;
        max-height:95%;
        max-width: 90%;
        font-family: Helvetica, Verdana, Arial;
        font-size: larger;
    }
    .wewwaMenu.open {
        transform: translateX(-440px);
        transition: transform 500ms ease;
    }
    @media all and (max-width: 520px) {
        .wewwaMenu.open {
            max-height:85%;
            transform: translateX(-440px) translateY(55px);
            transition: transform 500ms ease;
        }
    }
    .wewwaMenu a {
        color: white;
        border: 2px solid #4CAF50;
        padding: 5px 20px;
        text-decoration: none;
        display: inline-block;
    }
    .wewwaMenu a:hover {
        background: #4CAF50;
    }
    .wewwaMenu audio {
        width: 100%;
    }
    .wewwaMenu table {
        width:100%;
        table-layout: fixed;
    }
    .wewwaMenu td {
        width: 50%;
        padding: 5px;
    }
    .wewwaMenu img {
        width: 200px;
        max-width: 90%;
        heigth: auto;
    }
    .wewwaMenu input[type='checkbox'][readonly]{
        pointer-events: none;
    }
    .wewwaMenu .droparea {
        border: 2px dashed #bbb;
        -webkit-border-radius: 5px;
        border-radius: 5px;
        padding: 20px;
        text-align: center;
        font: 18pt;
        color: #bbb;
    }
    .wewwaIcon {
        right:0px;
        cursor:pointer;
    }
    .wewwaIcon div {
        width:35px;
        height:5px;
        background-color:#888888;
        margin:6px 0;
    }
    @media all and (min-width: 520px) {
        .wewwaIcon.open {
            transform: translateX(-440px);
            transition: transform 500ms ease;
        }
    }
    `;
    document.head.append(st);
}

// create menu after loading page
wewwApp.AddMenu = (lang) => {
    if (wewwApp.html) {
        document.body.removeChild(wewwApp.html.menu);
        document.body.removeChild(wewwApp.html.icon);
        wewwApp.html = null;
    }
    // quick wrapper, we need this a lot
    var ce = (e) => document.createElement(e);
    // local vars faster
    var proj = wewwApp.project;
    var props = proj.general.properties;

    // create root menu
    var menu = ce("div");
    menu.classList.add("wewwaMenu");
    // create preview img wrap
    var preview = ce("img");
    preview.setAttribute("src", proj.preview);
    // create menu app title
    var header = ce("div");
    header.innerHTML = "<h2>" + proj.title + "</h2>";
    // create workshop link
    var link = ce("a");
    link.setAttribute("href", "https://steamcommunity.com/sharedfiles/filedetails/?id=" + proj.workshopid);
    link.setAttribute("target", "_blank");
    link.innerHTML = "<h3>Open Workshop Page</h3>";

    // table is better for formatting
    var tmain = ce("table")
    tmain.innerHTML = "<col style=\"width:50%\"> <col style=\"width:30%\"> <col style=\"width:20%\">";
    var table = ce("tbody");
    tmain.append(table);

    // if app supports audio, add input menu & handlers
    if (proj.general.supportsaudioprocessing) {

        // audio input methods
        var row = ce("tr");
        var td1 = ce("td");
        td1.innerHTML = "<br><hr><h2>Audio Input</h2><hr>";
        td1.setAttribute("colspan", 3);
        var aBtn1 = ce("a");
        var aBtn2 = ce("a");
        var aBtn3 = ce("input");
        aBtn1.innerHTML = "Microphone";
        aBtn1.addEventListener("click", function (e) {
            wewwApp.requestMicrophone();
        });
        aBtn2.innerHTML = "Select URL";
        aBtn2.addEventListener("click", function (e) {
            var uri = prompt("Please enter some audio file URL\r\n\r\nYouTube, Soundcloud etc. ARE NOT YET SUPPORTED!", "https://example.com/test.mp3");
            wewwApp.initiateAudio(uri);
        });
        aBtn3.id = "wewwaAudioInput";
        aBtn3.innerHTML = "Select File";
        aBtn3.setAttribute("type", "file");
        aBtn3.addEventListener("change", function (e) {
            var file = e.target.files[0];
            if (!file) return;
            wewwApp.initiateAudio(file);
        });
        td1.append(aBtn1, aBtn2, aBtn3);
        row.append(td1);

        // file drag & drop area
        var dropRow = ce("tr");
        var dropt1 = ce("td");
        var dropt2 = ce("td");
        dropt1.setAttribute("colspan", 3);
        var dropArea = ce("div");
        dropArea.innerHTML = "Drag & Drop"
        dropArea.classList.add("droparea");
        dropArea.addEventListener('dragover', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = 'copy';
        }, false);
        dropArea.addEventListener("drop", (e) => {
            e.stopPropagation();
            e.preventDefault();
            var droppedFiles = e.dataTransfer.files;
            wewwApp.initiateAudio(droppedFiles[0]);
        }, false);
        dropt1.append(dropArea);
        dropRow.append(dropt1, dropt2);

        // Player & Stop Btn
        var hrrow = ce("tr");
        var hrtd1 = ce("td");
        var hrtd2 = ce("td");
        var hrstop = ce("a");
        hrstop.innerHTML = "Stop All Audio";
        hrstop.addEventListener("click", function (e) {
            wewwApp.stopAudioInterval();
        });
        var hrhr = ce("hr")
        hrtd1.id = "audioMarker";
        hrtd1.setAttribute("colspan", 3);
        hrtd1.append(hrstop, hrhr);
        hrrow.append(hrtd1, hrtd2);

        // finally add rows to table
        table.append(row, dropRow, hrrow);
    }

    // create actual settings wrapper
    var settings = ce("tr");
    settings.innerHTML = "<td colspan=3><h2>Settings</h2></td>";
    table.append(settings);

    // process languages?
    var local = proj.general.localization;
    if (local) {
        // set default language
        if (!lang) lang = "en-us";
        // add html struct
        var row = ce("tr");
        var td1 = ce("td");
        td1.innerHTML = "<h4>🇩🇪🇬🇧🇮🇹🇷🇺🇨🇳</h4>";
        var td2 = ce("td");
        var lan = ce("select");
        // process all
        for (var loc in local) {
            // build select option for this
            var lcs = ce("option");
            lcs.value = loc;
            lcs.innerHTML = loc.toUpperCase();
            lan.append(lcs);
            // check for correct language code
            if (loc != lang) continue;
            else lcs.setAttribute("selected", true);
            // set properties translated text
            for (var p in props) {
                var itm = props[p];
                var pTxt = itm.text;
                var rTxt = local[loc][pTxt];
                if (rTxt) itm.realText = rTxt;
                // process combo box values
                if (itm.type == "combo") {
                    for (var o of itm.options) {
                        var lTxt = local[loc][o.label];
                        if (lTxt) o.realLabel = lTxt;
                    }
                }
            }
        }
        // if changed, do it all over again.
        lan.addEventListener("change", function (e) {
            localStorage.setItem("wewwaLang", this.value);
            wewwApp.AddMenu(this.value);
            wewwApp.UpdateSettings();
            wewwApp.html.icon.click();
        });
        td2.setAttribute("colspan", 2);
        td2.append(lan);
        row.append(td1, td2);
        table.append(row);
    }

    // split content from actual settings
    var splitr = ce("tr");
    splitr.innerHTML = "<td colspan=3><hr></td>";
    table.append(splitr);

    // sort settings by order
    var sortable = [];
    for (var p in props) sortable.push([p, props[p]]);
    sortable.sort((a, b) => a[1].order - b[1].order);
    // add setting html elements
    for (var s of sortable)
        table.append(wewwApp.CreateItem(s[0], s[1]));

    // pre-footer for resetting saved settings
    var preFoot = ce("div");
    preFoot.innerHTML = "<br><hr>";
    var reset = ce("a");
    reset.innerHTML = "Reset Settings";
    reset.addEventListener("click", function (e) {
        localStorage.clear();
        location = location;
    });
    preFoot.append(reset);

    // footer with ident
    var footer = ce("div");
    footer.innerHTML = "<br><hr><h3 style='width:130px;text-align:left;display:block;margin:0 auto;'>[W] allpaper<br>[E] ngine<br>[W] eb<br>[W] allpaper<br>[A] dapter<a target=\"_blank\" href='https://hexx.one'>hexxone</a>";
    // finish up menu
    menu.append(preview, header, link, tmain, preFoot, footer)

    // create icon for opening & closing the menu
    var icon = ce("div");
    icon.classList.add("wewwaIcon");
    icon.addEventListener("click", () => {
        $(".wewwaMenu, .wewwaIcon").toggleClass("open");
    });
    var bar1 = ce("div");
    var bar2 = ce("div");
    var bar3 = ce("div");
    icon.append(bar1, bar2, bar3);

    // finally add the menu to the DOM
    document.body.append(menu, icon);
    wewwApp.html = {
        menu: menu,
        icon: icon
    };
}

// create html elements & tr for a settings item
wewwApp.CreateItem = (prop, itm) => {
    var ce = (e) => document.createElement(e);
    var row = ce("tr");
    row.setAttribute("id", "wewwa_" + prop);
    var td1 = ce("td");
    var td2 = ce("td");
    var td3 = null;
    var txt = ce("div");
    txt.innerHTML = itm.realText ? itm.realText : itm.text;
    // create real input element
    var inp = ce("input");
    inp.setAttribute("id", "wewwa_inp_" + prop);
    switch (itm.type) {
        // only have text
        case "text":
            inp = null;
            td1.setAttribute("colspan", 3);
            break;
        // add combo select options
        case "combo":
            inp = ce("select");
            // set options
            for (var o of itm.options) {
                var opt = ce("option");
                opt.setAttribute("value", o.value);
                opt.innerText = o.realLabel ? o.realLabel : o.label;
                if (itm.value == o.value) opt.setAttribute("selected", true);
                inp.appendChild(opt);
            }
            break;
        // browser color picker
        case "color":
            inp.setAttribute("type", "color");
            break;
        // Checkbox
        case "bool":
            inp.setAttribute("type", "checkbox");
            inp.setAttribute("readonly", true);
            // makes ticking checkboxes easier
            row.addEventListener("click", (e) => {
                inp.click();
            });
            break;
        // Slider input
        case "slider":
            var canEdit = itm.editable;
            // create numeric-up-down
            var sliderVal = ce(canEdit ? "input" : "output");
            sliderVal.name = "wewwa_out_" + prop;
            sliderVal.setAttribute("id", sliderVal.name);
            sliderVal.setAttribute("type", "number");
            sliderVal.style.width = "75%";
            if (canEdit) {
                sliderVal.setAttribute("value", itm.value);
                sliderVal.addEventListener("change", function (e) { wewwApp.SetProperty(prop, this); });
            }
            else {
                sliderVal.innerHTML = itm.value;
            }
            // create td3
            td3 = ce("td");
            td3.append(sliderVal);
            // create actual slider & values
            inp.setAttribute("type", "range");
            inp.style.width = "100%";
            inp.max = itm.max;
            inp.min = itm.min;
            inp.step = 0.1;
            break;
        case "textinput":
            inp.setAttribute("type", "text");
            break;
        case "file":
            inp.setAttribute("type", "file");
            break;
        default:
            console.error("unkown setting type: " + itm.type);
            break;
    }
    td1.append(txt);
    // listen for changes if input type (no text)
    if (inp) {
        inp.addEventListener("change", function (e) { wewwApp.SetProperty(prop, this); });
        td2.prepend(inp);
    }
    // append td3 or stretch td2?
    if (td3) {
        row.append(td1, td2, td3)
    }
    else {
        td2.setAttribute("colspan", 2);
        row.append(td1, td2);
    }
    return row;
}

// apply html value/setting to object
wewwApp.SetProperty = (prop, elm) => {
    // get the type and apply the value
    var props = wewwApp.project.general.properties;
    // check for legit setting...
    if (!props[prop]) {
        console.error("SetProperty name not found!");
        return;
    }
    // enabled delayed call of settings update
    var applyCall = (val) => {
        // save the updated value to storage
        props[prop].value = val;

        //console.debug("Property set: " + prop + " v: " + val);

        // update
        wewwApp.UpdateSettings();
        var obj = {};
        obj[prop] = props[prop];
        wewwApp.ApplyProp(obj);
    };
    // process value based on DOM element type
    switch (props[prop].type) {
        case "bool":
            applyCall(elm.checked == true);
            break;
        case "color":
            applyCall(wewwApp.hexToRgb(elm.value));
            break;
        case "file":
            wewwApp.XHRLoadAndSaveLocal(elm.value, res => applyCall(res));
            break;
        case "slider":
            if (elm.name.includes("_out_")) {
                var inpt = document.querySelector("#wewwa_" + prop);
                if (inpt) inpt.value = elm.value;
                else console.error("Slider not found: " + prop);
            }
            else {
                var slide = document.querySelector("#wewwa_out_" + prop);
                if (slide) slide.value = elm.value;
                else console.error("Numericupdown not found: " + prop);
            }
        case "combo":
        case "textinput":
            applyCall(elm.value);
            break;
    }
}

// will load the given file and return it as dataURL.
// this way we can easily store whole files in the configuration/localStorage.
// its not safe that this works with something else than image files.
wewwApp.XHRLoadAndSaveLocal = (url, resCall) => {
    // Create XHR and FileReader objects
    var xhr = new XMLHttpRequest();
    var fileReader = new FileReader();
    xhr.open("GET", url, true);
    xhr.responseType = "blob";
    xhr.addEventListener("load", function () {
        if (xhr.status == 200) {
            // onload needed since Google Chrome doesn't support addEventListener for FileReader
            fileReader.onload = function (evt) {
                // Read out file contents as a Data URL
                resCall(evt.target.result)
            };
            // Load blob as Data URL
            fileReader.readAsDataURL(xhr.response);
        }
    }, false);
    // Send XHR
    xhr.send();
}

// apply object values/settings to html
wewwApp.UpdateSettings = () => {
    var wewwaProps = wewwApp.project.general.properties;
    localStorage.setItem("wewwaLastProps", JSON.stringify(wewwaProps));
    for (var p in wewwaProps) {
        var prop = wewwaProps[p];

        // some eval magic
        var visible = true;
        if (prop.condition != null) {
            // copy our condition string to modify
            var cprop = String(prop.condition).split(" ").join("");
            // remove whitespaces and split to partials by logic operators
            var partials = cprop.split(/&&|\|\|/);
            // loop all partial values of the check
            for (var part of partials) {
                var prefix = "wewwaProps.";
                var onlyVal = part.match(/[!a-zA-Z0-9_\.]*/)[0];
                if (!onlyVal.startsWith(prefix) && !onlyVal.startsWith("!" + prefix)) {
                    // fix for inverted values
                    var replW = onlyVal;
                    if (replW.startsWith("!")) {
                        replW = replW.substr(1);
                        prefix = "!" + prefix;
                    }
                    //console.debug("replace: " + onlyVal + " >> " + prefix + replW);
                    cprop = cprop.replace(onlyVal, prefix + replW);
                }

            }
            try {
                visible = eval(cprop) == true;
            }
            catch (e) {
                console.error("Error: (" + cprop + ") for: " + p + " => " + e);
            }
        }


        if (visible) $("#wewwa_" + p).fadeIn();
        else $("#wewwa_" + p).fadeOut();

        // get input dom element
        var elm = document.getElementById("wewwa_" + p).childNodes[1].childNodes[0];
        switch (prop.type) {
            case "color":
                elm.value = wewwApp.rgbToHex(prop.value);
                break;
            case "bool":
                elm.checked = prop.value == true;
                break;
            case "slider":
            case "combo":
            case "textinput":
                elm.value = prop.value;
                break;
        }
    }
}

// apply settings object to we
wewwApp.ApplyProp = (prop) => {
    var wpl = window.wallpaperPropertyListener;
    if (wpl && wpl.applyUserProperties) {
        wpl.applyUserProperties(prop);
    }
}

// converts float "r g b" into to #XXXXXX hex string
wewwApp.rgbToHex = (rgb) => {
    function cth(c) {
        var h = Math.floor(c * 255).toString(16);
        return h.length == 1 ? "0" + h : h;
    }
    var spl = rgb.split(" ");
    return "#" + cth(spl[0]) + cth(spl[1]) + cth(spl[2]);
}

// converts hex string to "r g b" float string
wewwApp.hexToRgb = (hex) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255].join(" ") : null;
}

// start microphone
wewwApp.requestMicrophone = () => {
    navigator.mediaDevices.getUserMedia({
        audio: true
    }).then(function (stream) {
        wewwApp.stopAudioInterval();

        window.persistAudioStream = stream;

        wewwApp.ctx = new (window.AudioContext || window.webkitAudioContext)();
        wewwApp.source = wewwApp.ctx.createMediaStreamSource(stream);
        wewwApp.analyser = wewwApp.ctx.createAnalyser();
        wewwApp.analyser.smoothingTimeConstant = 0.35;
        wewwApp.analyser.fftSize = 256;

        wewwApp.source.connect(wewwApp.analyser);
        wewwApp.startAudioInterval();
    }).catch(function (err) {
        console.error(err);
        if (location.protocol != "https:") {
            var r = confirm("Activating the Microphone failed! Your Browser might require the site to be loaded using HTTPS for this feature to work! Press 'ok'/'yes' to get redirected to HTTPS and try again.");
            if (r) window.location.href = window.location.href.replace("http", "https");
        }
    });
}

// html5 audio analyser gives us mono data from 0(bass) to 128(treble)
// however, wallpaper engine expects stereo data in following format:
// 0(L: low) to 63(L: treble) and 64(R: low) to 128(R: treble)
// so we do some array transformation... and divide by 255 (8bit-uint becomes float)
wewwApp.convertAudio = (data) => {
    var stereo = [];
    var sIdx = 0;
    for (var i = 0; i < 64; i++) {
        stereo[i] = data[sIdx++] / 255;
        stereo[127 - i] = data[sIdx++] / 255;
    }
    return stereo;
}

// starts playing & analysing a dropped file
wewwApp.initiateAudio = (data) => {
    // clear up
    wewwApp.stopAudioInterval();
    // create player
    wewwApp.audio = document.createElement("audio");
    wewwApp.audio.src = data.name ? URL.createObjectURL(data) : data;
    wewwApp.audio.autoplay = true;
    wewwApp.audio.setAttribute("controls", "true");
    wewwApp.audio.play = true;

    $("#audioMarker").prepend(wewwApp.audio);

    wewwApp.ctx = new (window.AudioContext || window.webkitAudioContext)();
    wewwApp.source = wewwApp.ctx.createMediaElementSource(wewwApp.audio);
    wewwApp.analyser = wewwApp.ctx.createAnalyser();
    wewwApp.analyser.smoothingTimeConstant = 0.35;
    wewwApp.analyser.fftSize = 256;

    wewwApp.source.connect(wewwApp.ctx.destination);
    wewwApp.source.connect(wewwApp.analyser);
    wewwApp.startAudioInterval();
}

// starts audio analyser interval
wewwApp.startAudioInterval = () => {
    var data = new Uint8Array(128);
    // 33ms ~~ 30fps
    wewwApp.audioInterval = setInterval(() => {
        if (!wewwApp.audioCallback) {
            wewwApp.stopAudioInterval();
            alert("no AudioCallback!");
            return;
        }
        wewwApp.analyser.getByteFrequencyData(data);
        var stereo = wewwApp.convertAudio(data);
        wewwApp.audioCallback(stereo);
    }, 33);
    // tell Wallpaper we are sending audio
    wewwApp.ApplyProp({ audioprocessing: { value: true } })
}

// stops audio analyser interval and playing audio
wewwApp.stopAudioInterval = () => {
    window.persistAudioStream = null;
    $("#wewwaAudioInput").val("");
    if (wewwApp.audio)
        wewwApp.audio.remove();
    if (wewwApp.audioInterval) {
        clearInterval(wewwApp.audioInterval);
        wewwApp.audioInterval = null;
    }
}

if (window.wallpaperRegisterAudioListener) console.info("[WEWWA] detected wallpaper engine => Standby.");
else {
    console.info("[WEWWA] wallpaper engine not detected => Init!");
    // define audio listener first, so we dont miss when it gets registered.
    window.wallpaperRegisterAudioListener = function (callback) {
        // set callback to be called later with analysed audio data
        wewwApp.audioCallback = callback;
    }
    // intialize when ready
    $(() => wewwApp.Init());
}