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

Everything you see is made of a single "base texture" called point.
Points are grouped in 2D fractal geometry-"Subsets".
Multiple Subsets come together as a level.

The position for each Point in its Subset is processed using the "Hopalong Attractor".
Click here to learn more about this algorithm: http://www.fraktalwelt.de/myhome/simpiter2_2.htm

After all Subsets of a level have passed the camera, the level is re-generated and moved back to the end.
The color, brightness and light are processed in realtime per Subset.

The Audio-Spectrum is mapped onto the whole size of the Levels, beginning with low frequencies "near" the camera to high frequencies "away" from the camera. I might later add an option to invert that, however some more tweaking will be required.


[h2]When experiencing low "synced" FPS in Wallpaper Engine:[/h2]

The Wallpaper-Engine embedded Chrome Browser seems to have problems V-Syncing the correct Monitor refresh rate to the wallpaper.
To try and fix this, you may take the following steps. Please keep in mind that this will affect all running web-wallpapers
and may cause weird behaviours elsewhere.

1. Open Wallpaper Engine Window
2. klick the "Settings Wheel" at the top right, then navigate to the 2nd Tab "Common" 
3. Scroll down to "Comanndline for CEF"
4. Enter or append " --disable-gpu-vsync" (without quotes).
5. Press "OK" - That should do the trick.


[h2]Wallpaper is not reacting to audio?[/h2]

Check you Wallpaper Engine Audio Settings:
First, select the correct input/output device in Wallpaper Engine Settings (Default should do it)
Next, set your Input Volume (mine is set to 100)

If this doesnt help, take a look at your Windows Audio Devices or the Wallpaper Engine official forum.
I can only help with issues related to this wallpaper, not necessarily your PC :)


[h2]Settings in Detail:[/h2]

╔ optional 3D-Parallax effect
║- None = no effect applied (default)
║- Mouse = Mouse Position to camera position mapping, effect strength can be set
║- Automatic = Rotating Parallax, effect strength and speed can be set
║- Fixed = Custom static angle & strength
║
╠╦ dynamic fractal orbit generator
║║
║╠══ default brightness & saturation settings 
║║   these values will be used if no audio is playing.
║║
║╠══ zoom speed setting
║║   the speed at which subsets are moved closer to the camera
║║   if audio is playing, the audio zoom speed is added to this value
║║
║╠══ rotation speed setting
║║   the speed at which subsets are rotated
║║   if audio is playing, this value is slightly influenced by the "boost" factor.
║║
║╠══ color fade speed setting
║║   the speed at wich the "hue" values are cycled through.
║║
║╚══ custom render timing
║    If you have a monitor with more than 60hz, it is not 100% certain that the system
║    will trigger to render a frame as often as the monitor would support it. 
║    If you enable this setting, it may make things smoother - but usually it doesn't.
║    (Use the FPS stats to check it if you're not sure)
║
╠╦ audio processing & mapping
║║
║╠══ minimum brightness & saturation settings
║║   adjust the minimum values when audio is playing
║║
║╠══ volume multiplier
║║   fine-adjust how much the input audio data is amplified
║║
║╠══ peak filter
║║   apply "pow()" on every audio value with "peak-filter-value" + 1
║║   Afterwards re-scale the values to their previous maximum.
║║
║╠══ time smoothing
║║   adjust the relative percentage of changes applied to values
║║   this can have great influence on the experience.
║║   if the wallpaper is "flashing" alot while listening to music, turn down the values.
║║
║╠══ value smoothing
║║   Takes the average of "(value-smoothing)*2+1" audio values instead of only "1".
║║   Should be especially usefull when using the peak filter :)
║║
║╠══ audio zoom multiplier
║║   adjust, how much the audio can "boost" the zoom speed.
║║   higher value means more frequent level generation, means more stress for your pc.
║║
║╚══ audio zoom smoothing
║    like it very smooth? this setting is for you.
║
╠═ "tunnel generator" (avoids particles in front of camera)
║  if active, causes about 30% more cpu usage when generating a level.
║  This might be worth disabling if your PC is struggling with the wallpaper.
║
╠═ optional overlay and background images
║  want to use the wallpaper in a stream or a party using a beamer? This might help.
║
╠═ customizable algorithm parameters
║  want to know what they do? Take a look at the link above.
║
╠╦ advanced settings
║║
║╠══ 3 choosable base textures
║║
║╠══ texture size setting
║║   If you have a big screen or had to turn down the points per subset 
║║   due to performance, try turning this value up.
║║
║╠══ rendering stats
║║   check and monitor the wallpaper performance with different settings
║║
║╠══ FOV setting
║║   Field of View - Google if you dont know :)
║║
║╠══ Scaling factor
║║   Maximum Unit Size for Orbit Subsets
║║
║╠══ orbit level amount
║║   each level contains (Subset amount * Points per Subset) objects
║║
║╠══ orbit level depth
║║   higher value means more space between each subset, too high might make it boring
║║
║╠══ orbit subset per level amount
║║   How much subsets each level contains.
║║
║╠══ orbit point per subset amount
║║   Basically the amount of points your PC has to process for each Frame per Second.
║║   default is 256.000 Points ( 8 * 8 * 4000 ). Just doubling one of the parameters will result 
║║   in a much larger workload for your PC (especially bad on Laptops). Keep that in mind.
║║
║╠══ fog thickness setting
║║   if you see things spawning in the back or want to see overall less, turn it up
║║   if you increased the level depth or want to see more, turn it down
║║
║╚══ level shifting (levels are overlapping each other by half)
║    doesn't cause additional cpu usage over time and makes the level transitions smoother
║
╠═ smooth fade-in
╠═ epilepsy warning
╚═ debug logging


[h2]feel free to ask more.[/h2]