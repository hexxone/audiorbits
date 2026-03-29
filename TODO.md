# Todo's

## project.json

- [x] check the "LOD" and "hotspot" translations, fix them and make them the same.
- fix "condition" for algorithm waits: && parent header
- rework algorithm params
    ~ update translations -> project.json -> steam
- update preview image?
- convert .pngs to webp ?

## main code

- cleanup code, make files and functions smaller, separation of concerns, "best practices," etc.
- further optimize ".innerHTML =" template strings? is there a way to "inline" do this without breaking the current code styling?

- Star cloud mode -> essentially complete random positioning?

- [x] fix Colors dont work properly atm
- [x] fix fancy text?
- [x] fix rgba color
- check new re-init vars
- finish implementing Web-XR
  - improve "WEB-XR" Button CSS (bigger, background)
    - controls
    - movement strength?

## we_utils

- fix shaders (lut - everything black, chroma - just makes image darker?)
- implement/add "TAA" (Temporal Anti-Aliasing)

## Three.ts

- update/add new features from three.js upstream:
    - reverseDepthBuffer: likely 0-5% here. It mainly improves depth precision and is faster than log depth in general, but your particle path currently uses depthTest = false, so it does not attack the real bottleneck.
    - alphaHash: this is the one modern feature that could plausibly help materially, maybe 10-30% in dense hotspot scenes, because it replaces blended transparency with a hashed cutoff and avoids some transparency/sorting pain. But it changes the look and really wants TAA to hide noise.
    - WebGPU / newer renderer backend: not a safe bet for >20%. Your current regression looks fragment-overdraw bound, and WebGPU does not magically solve “too many transparent fragments in the same pixels”. I’d treat this as a migration project, not a fast performance fix.

## Stats

- [x] fix FpStats nonsensical way too high GPU Usage:
    - `FPS: 98.00 / 144\nCPU: 0.57 %\nGPU: 247.73 %\nAll: 147.25 %\nRAM: 1.05 GB\nVRAM: 13.34 MB\nDOM: 453.02 KB\nBPM: n/a\nAudio: n/a`
    - Probably caused by "skipped frames" being calculated wrongly or something?
- render an additional third canvas with historical diagram for the stuff like bass, mids, peaks, etc. below.

## WEWA

- [x] dropdown defaults not properly set/selected in WEWA ?
- improve CSS (rounded corners, scroll bar, shadows, etc.)
- [x] only apply "values" from localstorage... not the whole object/translations etc?
- Add button to "copy to clipboard" the whole settings and "apply from clipboard" btn. Above/ Next to "Reset"

## WEAS

- improve CSS (rounded corners, scroll bar, shadows, etc.)
- music recognition?

## other

- update & cleanup packages without breaking everything...
- update all Steam-Guides with updated Features and Infos...
  - integrate the changes from 2.3.x branch.. 
- record "how to debug"-video?

- update lively json files, make a new tag & release, upload built files.
