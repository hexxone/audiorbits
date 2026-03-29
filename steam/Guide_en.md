[h1]Settings Guide[/h1]

As mentioned in the description, the Wallpaper takes quite some resources to run.

Here I will give a little insight behind the settings and what you can do to optimize performance and looks.

Keep in mind that a lot of the settings depend entirely on:

- your PC / hardware / screen resolution
- taste / type of music you listen to
- audio volume
- your own preference

So, take your time to play around, there are a lot of settings :)

[h2]How it works:[/h2]

Everything you see is made of a single base texture called a "Point".
Many Points are grouped together in a 2D fractal "Subset".
Multiple Subsets come together as a "Level".
And multiple Levels will become an orbit ;)

Points are processed using the "Hopalong Attractor" in the beginning and when a level passes the camera.
Click here to learn more about the algorithm: <http://www.fraktalwelt.de/myhome/simpiter2_2.htm>

Current builds also support a larger attractor family. The attractor sliders are weights, not fixed selectors.

- `Hopalong` defaults to `100` for backwards compatibility.
- The new attractors default to `0`, so old presets keep their previous look.
- Any attractor weight set to `100` becomes exclusive.
- If all attractor weights are `0`, the generator falls back to `Hopalong`.
- `Spiral` is now a numeric angle instead of a simple on/off toggle.

The audio-spectrum is analyzed and mapped in realtime.
It works by manipulating the movement, hue, saturation, light and size of subsets.

[h2]Wallpaper is not reacting to audio?[/h2]

Check you Wallpaper Engine Audio Settings:
First, check the correct input/output device in Wallpaper Engine Settings (default)
Next, confirm your input volume (mine is set to 100)

If this does not help, take a look at your Windows Audio Devices or the Wallpaper Engine official forum.
I can only help with issues related to this wallpaper, not necessarily your PC ://

[h2]Settings in Detail:[/h2]

@ TODO

╠╦═ 📐 Geometry
║╠══ Variant
║║
║║
║╠══ Texture & Size
║║
║║
║╠══ Tunnel generator
║║
║║
║╠══ Number, scale, depth, quantity
║║
║║
║╚══ Random seed
║
║
╠╦═ 🎥 Camera
║╠══ Cursor/Automatic/Fixed Position
║║
║║
║╠══ Parallax
║║
║║
║╠══ Strength, FOV, Fog
║║
║║
║╚══ Override VSYNC (FPS)
║
║
╠╦═ ⏫ Motion
║╠══ Direction
║║
║║
║╠══ Speed
║║
║║
║╠══ Audio zoom strength, smoothing
║║
║║
║╚══ Rotation
║
║
╠╦═ 🌈 Colors
║║
║║
║╠══ Background
║║
║║
║╠══ 6x color mode's
║║
║║
║║
║╠══ Color change
║║
║║
║╚══ Audio response strength
║
║
╠╦═ 🔆 Brightness
║╚══ Standard, Audio min & max
║
║
╠╦═ 📊 Saturation
║╚══ Default, audio min & max
║
║
╠╦═ 🕶 Shader
║╠══ bloom
║║
║║
║╠══ Look-up table
║║
║║
║╠══ Mirror
║║
║║
║╠══ FXAA
║║
║║
║╠══ BLUR
║║
║║
║╚══ ChromeA
║
║
╠╦═ 🖼 Pictures
║║
║║
║╠══ Foreground
║║
║║
║╚══ Background
║
║
╠╦═ 🔊 Audio
║╠══ Dynamic equalizer
║║
║║
║╠══ Mono/stereo switching
║║
║║
║╠══ Mapping direction
║║
║║
║╠══ Peaks, smoothing, strength, response
║║
║║
║╚══ Minimum volume
║
║
╠╦═ 💡 LED / iCUE
║╠══ Projection/color mode
║║
║║
║╠══ Range/Color adjustment
║║
║║
║╚══ Blur, color loss
║
║
╠═ ⚙️ Advanced
╠══ Quality (low,medium,high)
║
║
╠══ Low latency
║
║
╠══ VR mode (experimental)
║
║
╠══ Toggle Epillepsy Warning
║
║
╚══ Toggle debugging

[h2]feel free to ask more.[/h2]
