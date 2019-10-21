## [AudiOrbits](https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780) is a web wallpaper designed for [Wallpaper Engine](https://steamcommunity.com/sharedfiles/filedetails/?id=1396475780)


### WEAS (Wallpaper Engine Audio Supplier)

When reworking the audio processing of the Wallpaper, I encapsulated it and made it reusable.

To see how it works exactly take a look at the code in "js/weas.js".



### WEWWA (Wallpaper Engine Web Wallpaper Adapter)

I started working on a possibility to use any Web Wallpaper as "website" including working audio and customizable settings.

To use it, simply copy the "js/wewwa.js" file from this repostiroy into your desired web wallpaper folder and include it in your "index.html" file like so:

```html
$ <script type="text/javascript" src="js/wewwa.js"></script>
```

then upload your folder to a server and/or open it in your browser.

You can see this running [HERE](https://experiment.hexxon.me/)



### Features:

- optional 3D-Parallax effect
- dynamic fractal orbit generator
  - default brightness & saturation settings (when no audio is playing)
  - zoom speed setting
  - rotation speed setting
  - color fade speed setting
  - system drawing mode
  - fps lock (avoids stressing your pc)
- audio processing & mapping
  - minimum brightness & saturation settings
  - volume multiplier
  - audio smoothing
  - audio zoom multiplier
  - audio zoom smoothing
- "tunnel generator" (avoids particles in front of camera)
- optional overlay and background images
- customizable algorithm parameters
- advanced settings
  - 3 choosable base textures
  - texture size setting
  - rendering stats
  - FOV setting
  - Scaling factor
  - orbit level amount
  - orbit level depth
  - orbit subset per level amount
  - orbit point per subset amount
  - fog thickness setting
  - level shifting (experimental)
  - bloom shader (experimental)
- iCUE Integration
  - single color mode
  - projection mode
- "No Pause" mode
- smooth fade-in
- seizure warning
- debug logging



### Support:

If you have issues with the wallpaper on Steam, please make sure you have thoroughly read the description and the Settings Guide on Steam.
If your problem persists or you found a bug, please leave a message in the "Bugreport Thread" **on Steam - NOT ON GITHUB**.



### Patchnotes:

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
