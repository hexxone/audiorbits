# This is an Experimental branch! Nothing may stay the same.


## [AudiOrbits](https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780) is a web wallpaper designed for [Wallpaper Engine](https://steamcommunity.com/app/431960)

### [THIS](https://github.com/hexxone/audiorbits) is the wallpaper's public git repository.

### PLEASE NOTE

The Wallpaper is made for and maintained on the Steam Workshop.

It is however basically a website and can be easily run in any browser.

Since you need to own Wallpaper Engine in order to access it's Workshop Content and this Wallpaper, I published this for some interested people...

*But:* If you encounter any issues of have suggestions **please address them on Steam.**


P.S.: Feel free to use this "wallpaper" at your favourite party, event, video, stream, etc.
Just remember to give credit where due :)


### Dependencies / Libraries
- [we_utils](https://github.com/hexxone/we_utils) utilities for WE-Web-Wallpapers
- [we_project_helper](https://github.com/hexxone/we_project_helper) manipulating `project.json`
- [jQuery](https://jquery.com/) gui editing
- [three.js](https://threejs.org/) & Examples for webgl rendering
- [typescript](https://www.typescriptlang.org/) for typization
- [yarn](https://yarnpkg.com/) for TypeScript packages
- [webpack](https://webpack.js.org/) for bundling & testing
- [HTML5](https://html5test.com/) for WebGL & WebAudio


### Features:

Please head over to the Workshop-Page for a full list (see title for the link).


### Changelog:

Version 2.4:
- reworked Settings categories / ordering
  - Add "Audio Direction" Combobox (normal & invert)
  - Add Audio "Equalize" Setting
  - Add Audio "Mono/Stereo" Setting
  - Add "Movement Direction" Combobox (normal & invert)
  - Add Color Mode "Level Splitting"
  - Add "Geometry Mode" Setting (default: Points)
    - Add Geometry Mode "Particles"
    - Add Geometry Mode "Experimental"
- level generation allows more points per level now
- shortened fade-in time and fixxed reload bar
- internally switched to TypeScript and Webpack
- when ran in browser, App will make itself available offline

Version 2.3:
- added "shader_quality"-setting (Advanced)
- outsourced and restructured most libraries
- added lots of languages (see we_project_helper)

Version 2.2:
- fixed "no audio = screen black" issue
- fixed rendering/zoom speed issue
- fixed transparency for all shaders 
- fixed some LED / iCUE issues
- added Custom Color option for Background 
- added "Only Forward Zoom" option
- shortened animations & reload-time

Version 2.1:
- added blur-filter
- added FXAA-filter
- added "reload" indicator
- added custom timed rendering (see further notes in Settings Guide)
- added audio peak filter
- added audio (neighbour) "value smoothing"
- renamed "audio smoothing" to "time smoothing"
- many many internal changes and fixes to improve performance
- updated three.js and jquery
- removed moment.js

Version 2.0:
- added "filter"-tab
- added invertable mirror-filter
- moved bloom-filter to "filter"-tab
- moved LUT-filter to "filter"-tab
- internal rendering & initialisation changes
- removed "system drawing"

Version 1.9:
- added "minimum volume" setting

Version 1.8:
- added "fixed" parallax mode
- added "color"-tab and three new color modes
- added LUT (LookUpTable)-filter with three modes to "color"-tab
- moved color-fade-speed to "color"-tab
- moved bloom-filter to "color"-tab
- level shifting is now ON by default
- removed "no_pause"-setting (there is an equivalent option in WE)
- updated WEWWA.js for browser usage
- updated https://orbits.hexx.one/
- updated preview image to a gif
- improved rendering performance


Version 1.7:
- !!! Please reset your config for one last time !!!
- a lot of internal changes have been made
- default settings have been lowered
- removed Easteregg
- added german translation
- added Corsair ICUE Support with 2 modes
- added epilepsy warning (as a safety measure)
- added WEWWA.js for Browser usage (experimental)
- added Bloom PostProcessing shader (experimental)
- fixed stats not being removed after reload
- fixed background image smooth fade-in/out
- fixed alpha-blending of textures and background images
- overhauled audio processing & smoothing again
- audio processing is now reusable (WEAS.js)
- uploaded some awesome pre-configs :)


Version 1.6:
- added overlay & background image options
- added default brightness & saturation options
- added "playing audio" minimum brightness & saturation options 
- added custom font & greeting message
- improved smooth fade-in 
- renamed "camera position" to "camera bound"


Version 1.5:
- grouped settings by categories
- added fog thickness setting
- added texture size setting
- added alternate "rendering mode"
- added fps settings back to wallpaper
- rendering is now independent of fps (deltaTime calculation)
- added a small Easteregg :)


Version 1.4:
- fixed screen going black due to invalid audio data
- fixed wallpaper-engine fps limiter
- updated render lib
- changed orbit generation to dynamic
- changed start rotation of subsets (0° to 45° angle)
- increased audio zoom
- improved smoothing
- added 2 more choosable textures
- added smooth fade-in when starting
- added debug mode & logging
- added "tunnel" effect (avoids camera blocking)
- added level shifting (experimental)
- removed progression


Version 1.3:
- audio-processing improved for different music genres
- better smoothing, cache & performance
- "Volume Level" wont affect "Zoom speed" anymore
- fixed some bugs (hopefully)


Version 1.2:
- overhauled settings
- added optional stats & smoothing
- changed audio data processing
- fixed vertex data update
- fixed "silent"-empty bug
