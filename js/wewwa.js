/*
 * Copyright (c) 2019 D.Thiele All rights reserved.  
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.  
 * 
 * WEWWA
 * Wallpaper Engine Web Wallpaper Adapter
 * 
 * This is an aditional JS file to be included in any Wallpaper Engine
 * Web-Wallpaper project so you can test, run & configure it from a normal web browser.
 * 
 * REQUIRES:
 * - JQUERY >= 3.3.1
 * - HTML5 supported Browser (for audio & webGL)
 * - this file needs to be in the same (root) folder as your project.json to find it.
 * 
 * FEATURES:
 * - automatically detecting if the web wallpaper is opened by wallpaper engine or browser
 * - if opened by wallpaper engine, nothing will happen
 * - if opened by a browser:
 *   - automatically load the project.json from wallpaper engine
 *     - parse the settings, strings & conditions
 *     - add respective html elements for each setting type & condition
 *     - put these html elements into an option menu wich can be hidden
 *     - check cookies for saved/custom values
 *     - apply all settings once
 * - react to changes made in the ui and reporting them to the wallpaper
 * - save changes made in the ui to the cookies
 * 
 * NOT WORKING:
 * - keep loaded files after reloading the page (due to html)
 *   - maybe save to local browser website storage & load from there?
 * 
 * TODO:
 * - file stream input
 * - file drag drop handler on menu
 * - condition fix
 * - cookie fix
 * - project.json translation selector & applier
*/

var wewwApp = wewwApp || {};

wewwApp.Init = () => {
    wewwApp.LoadProjectJSON((proj) => {
        if (proj.type != "web") {
            console.log("Error! Loaded project.json is not a web Wallpaper. Aborting...");
            return;
        }
        wewwApp.project = proj;
        wewwApp.LoadCookies();
        wewwApp.AddStyle();
        wewwApp.AddMenu();
        wewwApp.UpdateSettings();
        wewwApp.ApplyProp(proj.general.properties);
    });

    window.addEventListener('drop', (e) => {
        e.stopPropagation();
        e.preventDefault();
        var droppedFiles = e.dataTransfer.files;
        initiateAudio(droppedFiles[0]);
    }, false);

    $('#file-input').change((e) => {
        var file = e.target.files[0];
        if (!file) return;
        initiateAudio(file);
    });
}

wewwApp.LoadProjectJSON = (complete) => {
    // load json via html request
    $.ajax({
        url: "project.json",
        success: (result) => complete(result),
        error: (xhr, status, error) => {
            console.log(status + ': ajax error!\r\n' + error);
        }
    });
}

wewwApp.LoadCookies = () => {
    var cook = wewwApp.GetCookie('wewwaData');
    if (cook && cook != "") {
        var arr = JSON.parse(cook);
        var props = wewwApp.project.general.properties;
        for (var p in props)
            for (var a of arr)
                if (a == p)
                    props[p].value = arr[a];
    }
}

wewwApp.GetCookie = (cname) => {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

wewwApp.SaveCookies = () => {
    var data = [];
    var props = wewwApp.project.general.properties;
    for (var p in props) data[p] = props[p].value;
    var d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "wewwaData=" + JSON.stringify(data) + ";expires=" + d.toUTCString() + ";path=/";
}

// add style after loading page
wewwApp.AddStyle = () => {
    var st = document.createElement('style');
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
    .wewwaMenu table {
        width:100%;
        table-layout: fixed;
    }
    .wewwaMenu td {
        width: 50%;
    }
    .wewwaMenu img {
        width: 200px;
        max-width: 90%;
        heigth: auto;
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
wewwApp.AddMenu = () => {
    var ce = (e) => document.createElement(e);

    var proj = wewwApp.project;
    var props = proj.general.properties;

    var menu = ce("div");
    menu.classList.add("wewwaMenu");

    var preview = ce("img");
    preview.setAttribute("src", proj.preview);

    var header = ce("div");
    header.innerHTML = "<h2>" + proj.title + "</h2>";

    var link = ce("a");
    link.setAttribute("href", "https://steamcommunity.com/sharedfiles/filedetails/?id=" + proj.workshopid);
    link.innerHTML = "<h3>Open Workshop Page</h3>";

    var settings = ce("div");
    settings.innerHTML = "<br><h2>Settings:</h2><hr>";

    var table = ce("table");
    settings.appendChild(table);

    if (proj.general.supportsaudioprocessing) {
        var row = ce("tr");
        var td1 = ce("td");
        td1.innerHTML = "<h4>Audio Input Method</h4>";
        var td2 = ce("td");
        var aud = ce("select");
        aud.innerHTML = "<option value=0>None</option><option value=1>Microphone</option><option value=2>File</option>";
        aud.addEventListener("change", function (e) {
            switch (this.value) {
                case "0": wewwApp.stopAudioInterval(); break;
                case "1": wewwApp.requestMicrophone(); break;
                case "2": break;
            }
        });
        td2.append(aud)
        row.append(td1, td2);
        table.append(row);
    }

    var sortable = [];
    for (var p in props) sortable.push([p, props[p]]);
    sortable.sort((a, b) => a[1].order - b[1].order);
    for (var s of sortable)
        table.append(wewwApp.CreateItem(s[0], s[1]));

    var footer = ce("div");
    footer.innerHTML = "<br><hr><h3 style='width:130px;text-align:left;display:block;margin:0 auto;'>[W]allpaper<br>[E]ngine<br>[W]eb<br>[W]allpaper<br>[A]dapter<br>by <a href='https://hexxon.me'>Hexxon</a>";

    menu.append(preview, header, link, settings, footer)

    var icon = ce("div");
    icon.classList.add("wewwaIcon");

    icon.addEventListener("click", () => {
        $('.wewwaMenu, .wewwaIcon').toggleClass("open");
    });
    var bar1 = ce("div");
    var bar2 = ce("div");
    var bar3 = ce("div");
    icon.append(bar1, bar2, bar3);

    document.body.append(menu, icon);
}

// create html elements & tree for a settings item
wewwApp.CreateItem = (prop, itm) => {
    var ce = (e) => document.createElement(e);

    var row = ce("tr");
    row.setAttribute("id", "wewwa_" + prop);
    var td1 = ce("td");
    var td2 = ce("td");
    var txt = ce("div");
    txt.innerHTML = itm.text;
    var inp = ce("input");
    switch (itm.type) {
        case 'text':
            inp = null;
            td1.setAttribute("colspan", 2);
            break;
        case 'combo':
            inp = ce("select");
            // set options
            for (var o of itm.options) {
                var opt = ce("option");
                opt.setAttribute("value", o.value);
                opt.innerText = o.label;
                inp.appendChild(opt);
            }
            break;
        case 'color':
            inp.setAttribute("type", "color");
            break;
        case 'bool':
            inp.setAttribute("type", "checkbox");
            break;
        case 'slider':
            inp.setAttribute("type", "range");
            break;
        case 'textinput':
            inp.setAttribute("type", "text");
            break;
        case 'file':
            inp.setAttribute("type", "file");
            break;
        default: break;
    }
    row.append(td1, td2);
    td1.append(txt);
    if (inp) {
        inp.addEventListener("change", function (e) { wewwApp.SetProperty(prop, this); });
        td2.append(inp);
    }
    return row;
}

// apply html value/setting to object
wewwApp.SetProperty = (prop, elm) => {
    console.log("In SetProperty! p: " + prop + " v: " + elm.value);

    var props = wewwApp.project.general.properties;
    for (var p in props) {
        if (p === prop) {
            switch (props[p].type) {
                case 'color':
                    // TODO: hex to "r g b"
                    props[p].value = elm.value;
                    break;
                case 'bool':
                    props[p].value = elm.checked;
                    break;
                case 'slider':
                case 'combo':
                case 'textinput':
                case 'file':
                    props[p].value = elm.value;
                    break;
                default: break;
            }
            wewwApp.UpdateSettings();
            var obj = {};
            obj[p] = props[p];
            wewwApp.ApplyProp(obj);
            return;
        }
    }
}

// apply object values/settings to html
wewwApp.UpdateSettings = () => {
    var props = wewwApp.project.general.properties;
    for (var p in props) {

        var prop = props[p];

        if (prop.condition != null && false) {
            var result = function (str) {
                return eval(str);
            }.call(props, prop.condition);


            if (!result)
                $("#wewwa_" + p).fadeOut();
        }
        else $("#wewwa_" + p).fadeIn();

        var elm = document.getElementById("wewwa_" + p).childNodes[1].childNodes[0];
        switch (prop.type) {
            case 'color':
                var arr = prop.value.split(' ');
                var hex = wewwApp.rgbToHex(arr[0], arr[1], arr[2]);
                elm.value = hex;
                break;
            case 'bool':
                elm.checked = prop.value;
                break;
            case 'slider':
            case 'combo':
            case 'textinput':
                elm.value = prop.value;
                break;
            default: break;
        }
    }
}

// apply settings object to we
wewwApp.ApplyProp = (prop) => {
    wewwApp.SaveCookies();
    var wpl = window.wallpaperPropertyListener;
    if (wpl && wpl.applyUserProperties) {
        wpl.applyUserProperties(prop);
    }
}

// convert r g b ints to #XXXXXX hex string
wewwApp.rgbToHex = (r, g, b) => {
    function cth(c) {
        var h = c.toString(16);
        return h.length == 1 ? "0" + h : h;
    }
    return "#" + cth(r) + cth(g) + cth(b);
}

// convert hex string to r g b object
wewwApp.hexToRgb = (hex) => {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// start microphone
wewwApp.requestMicrophone = () => {

    navigator.getUserMedia({
        audio: true
    }, (stream) => {
        wewwApp.stopAudioInterval();

        window.persistAudioStream = stream;

        wewwApp.ctx = new (window.AudioContext || window.webkitAudioContext)();
        wewwApp.source = wewwApp.ctx.createMediaStreamSource(stream);
        wewwApp.analyser = wewwApp.ctx.createAnalyser();
        wewwApp.analyser.smoothingTimeConstant = 0.35;
        wewwApp.analyser.fftSize = 256;

        wewwApp.source.connect(wewwApp.analyser);
        wewwApp.startAudioInterval();

    }, (error) => {
        console.log(error);
        if (location.protocol != 'https:') {
            var r = confirm('The Browser might require the site to be loaded using HTTPS for this feature to work! Press "ok"/"yes" to get redirected to HTTPS."');
            if (r) window.location.href = window.location.href.replace('http', 'https');
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
        stereo[64 + i] = data[sIdx++] / 255;
    }
    return stereo;
}


// starts playing & analysing a dropped file
wewwApp.initiateAudio = (data) => {

    wewwApp.stopAudioInterval();

    wewwApp.audio = document.createElement('audio');
    wewwApp.audio.src = data.name ? URL.createObjectURL(data) : data;
    wewwApp.audio.autoplay = true;
    wewwApp.audio.setAttribute("controls", "true");
    wewwApp.audio.play = true;

    // TODO APPEND AT RIGHT PLACE
    $('#visualizerinput').children()[1].prepend(app.audio);

    wewwApp.ctx = new (window.AudioContext || window.webkitAudioContext)();
    wewwApp.source = wewwApp.ctx.createMediaElementSource(app.audio);
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
    wewwApp.audioInterval = setInterval(() => {
        if (!wewwApp.audioCallback) return;
        wewwApp.analyser.getByteFrequencyData(data);
        var stereo = wewwApp.convertAudio(data);
        wewwApp.audioCallback(stereo);
    }, 33); // 33ms ~~ 30fps
}


// stops audio analyser interval and playing audio
wewwApp.stopAudioInterval = () => {

    window.persistAudioStream = null;

    if (wewwApp.audio)
        wewwApp.audio.remove();

    if (wewwApp.audioInterval) {
        clearInterval(wewwApp.audioInterval);
        wewwApp.audioInterval = null;
    }
}


if (window.wallpaperRegisterAudioListener) console.log("WEWWA detected wallpaper engine context - Standby.");
else {
    console.log("WEWWA wallpaper engine context not found - Init..");
    // define audio listener first, so we dont miss when it gets registered.
    window.wallpaperRegisterAudioListener = (callback) => {
        // set callback to be called later with analysed audio data
        wewwApp.audioCallback = callback;
    };
    // intialize when ready
    $(() => wewwApp.Init());
}