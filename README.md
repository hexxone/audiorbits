# [AudiOrbits](https://github.com/Hexxonite/audiorbits)

AudiOrbits is a web wallpaper designed for Wallpaper Engine.


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



### Changelog:

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
