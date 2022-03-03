# Todo's

## project.json

-   rework algorithm params
    ~ update translations -> project.json -> steam
-   update preview image?
-   convert .pngs to webp ?

## main code

-   Star cloud mode
-   release memory on pause option

-   fix rgba color
-   fix shaders (lut, blur, chroma)
-   check new re-init vars
-   disable debug loggin by default
-   wewa: Pause unfocus save
-   finish implementing Web-XR
    -   controls

## other

-   does bufferattrribute has no version ?

-   spotify integration?
-   music recognition?
-   record "how to debug"-video?

### Shared WebAssembly module memory patch

after:
env.memory || 65 6e 76 06 6d 65 6d 6f 75 79 02
insert replace "00 01" with -> "03 01 80 20"
eg. "65 6E 76 06 6D 65 6D 6F 72 79 02 00 01" ---> "65 6E 76 06 6D 65 6D 6F 72 79 02 03 01 80 20"

-2 bytes before:
env.abort || 65 6e 76 05 61 62 6f 72 74 00
increment byte +2
eg. "1B 02 03 65 6E 76 05 61 62 6F 72 74 00" ---> "1D 02 03 65 6E 76 05 61 62 6F 72 74 00"
