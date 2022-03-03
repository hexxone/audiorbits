# [AudiOrbits](https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780)

## A web wallpaper designed for [Wallpaper Engine](https://steamcommunity.com/app/431960)

## [THIS](https://github.com/hexxone/audiorbits) is the wallpaper's public git repository

## About

The Wallpaper is made for and maintained on the **Steam Workshop**.
It is however basically a website and can easily run in _most_ browsers.

_Note_: Chrome-based browsers are preferred. Firefox may have some smaller problems.

**Please address any [Issues](https://steamcommunity.com/workshop/filedetails/discussion/1396475780/1744478429683052516/) and [Ideas](https://steamcommunity.com/workshop/filedetails/discussion/1396475780/1744478429683052516/) on Steam.**

## License(s)

The Wallpaper is incorporating pieces of Software with different Licenses.
This project itself is licensed under the GPLv3 and several portions of it under MIT.
Users of any part of this Code must therefore abide by the conditions of all licences which covered it as they received it.

You are allowed to use this Wallpaper for your favourite party, event, video, stream, etc.
Please just include a link to THIS repository or the Steam-Page (see urls above).
Thanks 🙂

## Using the code

Prerequisites:

-   Git, NodeJs and NPM
-   yarn package manager (`npm install -g yarn`)

Install steps:

1. `git clone https://github.com/hexxone/audiorbits.git`
2. `cd audiorbits`
3. `yarn install`
4. `yarn dbg` on Unix or `yarn dbg-win` on Windows

## The little things

Certain HTML/JS/WebAssembly features need a secure web context to mitigate security risks.
[For example, this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements)

Therefore this web-app needs to be served with the following html headers:

```
 'https': true,
 'Access-Control-Allow-Origin': '*',
 'Cross-Origin-Opener-Policy': 'same-origin',
 'Cross-Origin-Embedder-Policy': 'require-corp',
```

-> See webpack.config.js -> devServer

## References

-   [HTML5](https://html5test.com/) WebGL & WebAudio
-   [TypeScript](https://www.typescriptlang.org/) typization
-   [yarn](https://yarnpkg.com/) better package manager
-   [three.js](https://threejs.org/) THREE.js & Examples for webgl rendering
-   [WebPack](https://webpack.js.org/) bundling & testing everything
-   [WebAssembly](https://webassembly.org/) more efficient processing
-   [AssemblyScript](https://www.assemblyscript.org/) "TypeScript" + Webassembly
-   [we_utils](https://github.com/hexxone/we_utils) Custom utilities for TS-Wallpapers
-   [we_project_helper](https://github.com/hexxone/we_project_helper) manipulating `project.json`
-   [deepl.com](https://www.deepl.com/translator) translating `project.json`

## Authors

-   [hexxone](https://hexx.one) main code
-   [mrdoob](http://mrdoob.com) THREE.js
-   [alteredq](http://alteredqualia.com/) THREE.js examples
-   [Mugen87](https://github.com/Mugen87) XR / VR examples
-   [davidedc](http://www.sketchpatch.net/) FXAA shader
-   [bhouston](http://clara.io/) Blur shader
-   [mbasso](https://github.com/mbasso) Web-Assembly worker
-   [Alessandro Caminiti](https://www.dafont.com/de/hexagon-cup.font) hexagon-font
-   [Barry Martin](https://www.fraktalwelt.de/myhome/simpiter2.htm) Hopalong Attractor

## [Web Preview](https://orbits.hexx.one/)

## [Feature list](https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780)

## [Changelog.md](https://github.com/hexxone/audiorbits/blob/master/CHANGELOG.md)
