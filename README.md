<h1 align="center"><a href="https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780">AudiOrbits</a></h1>
<br/>
<p align="center">
<img alt="Logo" src="https://github.com/hexxone/audiorbits/blob/main/lively/public/preview.gif?raw=true" height=256 />
<br/>
<a href="https://github.com/hexxone/audiorbits/blob/main/LICENSE">
<img alt="GPL 3.0 License" src="https://img.shields.io/github/license/hexxone/audiorbits"/>
</a>
<a href="https://github.com/hexxone/audiorbits/releases">
<img alt="Current Release" src="https://img.shields.io/github/release/hexxone/audiorbits"/>
</a>
<a href="https://github.com/hexxone/audiorbits/releases">
<img alt="Current Release Date" src="https://img.shields.io/github/release-date/hexxone/audiorbits?color=blue"/>
</a>
<a href="https://github.com/hexxone/audiorbits/releases">
<img alt="GitHub Downloads" src="https://img.shields.io/github/downloads/hexxone/audiorbits/total"/>
</a>
<a href="https://github.com/hexxone/audiorbits/stargazers">
<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/hexxone/audiorbits"/>
</a>
<br/>
<br/>
A web wallpaper designed for <a href="https://steamcommunity.com/app/431960">Wallpaper Engine</a>
</p>

## About

The Wallpaper is made for and maintained on the **Steam Workshop**.
It is however basically a website and can easily run in _most_ browsers.

_Note_: Chrome-based browsers are preferred. Firefox may have some smaller problems.

### Steam Links

- [Wallpaper](https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780)
- [Problems / Issues / Bugs](https://steamcommunity.com/workshop/filedetails/discussion/1396475780/1744478429683052516/)
- [New Features / Improvements](https://steamcommunity.com/workshop/filedetails/discussion/1396475780/1698300679759373495/)
- [Settings in Detail](https://steamcommunity.com/workshop/filedetails/discussion/1396475780/1729828401678316327/)

## Usage Notice

You are allowed to use this Wallpaper for your favourite party, event, video, stream, etc.
Please just include a link to THIS repository or the Steam-Page (see urls above).
Thanks 🙂

## Downloads

- [Latest Web Version](https://github.com/hexxone/audiorbits/releases/download/2.4-beta1/audiorbits_2.4_beta.zip)
- [Latest Wallpaper Engine Version](https://github.com/hexxone/audiorbits/releases/download/2.3/audiorbits-2.3-release.zip)
- [Latest Lively Wallpaper Version](https://github.com/hexxone/audiorbits/releases/download/2.4-beta1/audiorbits_lively.zip)

## Using the code

Prerequisites:

- Git, NodeJs and NPM
- yarn package manager (`npm install -g yarn`)

Install steps:

1. `git clone https://github.com/hexxone/audiorbits.git`
2. `cd audiorbits`
3. `yarn install`
4. `yarn start` for debugging or `yarn prod` for an optimized build

## The little things

Certain HTML/JS/WebAssembly features need a secure web context to mitigate security risks.
[For example, this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements)

Therefore this web-app needs to be served with the following html headers:

```raw
 'https': true,
 'Access-Control-Allow-Origin': '*',
 'Cross-Origin-Opener-Policy': 'same-origin',
 'Cross-Origin-Embedder-Policy': 'require-corp',
```

-> See webpack.config.js -> devServer

## Dependencies

- [we_utils](https://github.com/hexxone/we_utils) Custom utilities for TS-Wallpapers
- [we_project_helper](https://github.com/hexxone/we_project_helper) manipulating `project.json`

## Tech-Stack

- [yarn](https://yarnpkg.com/) package manager
- [HTML5](https://html5test.com/) WebGL & WebAudio
- [TypeScript](https://www.typescriptlang.org/) typization
- [WebPack](https://webpack.js.org/) building & testing everything
- [three.js](https://threejs.org/) & Examples for webgl rendering
- [WebAssembly](https://webassembly.org/) efficient fractal-generation
- [AssemblyScript](https://www.assemblyscript.org/) = "TypeScript" + "Webassembly"
- [deepl.com](https://www.deepl.com/translator) translating `project.json`

## Authors

- [hexxone](https://hexx.one) main code
- [mrdoob](http://mrdoob.com) THREE.js
- [alteredq](http://alteredqualia.com/) THREE.js examples
- [Mugen87](https://github.com/Mugen87) XR / VR examples
- [davidedc](http://www.sketchpatch.net/) FXAA shader
- [bhouston](http://clara.io/) Blur shader
- [mbasso](https://github.com/mbasso) Web-Assembly worker
- [Alessandro Caminiti](https://www.dafont.com/de/hexagon-cup.font) hexagon-font
- [Barry Martin](https://www.fraktalwelt.de/myhome/simpiter2.htm) Hopalong Attractor

## [Web Preview](https://orbits.hexx.one/)

## [Feature list](https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780)

## [Changelog.md](https://github.com/hexxone/audiorbits/blob/master/CHANGELOG.md)

## License(s)

This Wallpaper is incorporating pieces of Software with different Licenses, as seen above.
The project itself is licensed under the GPLv3 and several portions of it under MIT.
Users of any part of this Code must therefore abide by the conditions of all licences which covered it as they received it.
