@echo on

del "dist\*.*" /Q /S && ^
yarn run compile && ^
xcopy "public\*.*" "dist\pack\" /e /i /y /s && ^
yarn run pack && ^
Rmdir /Q /S "dist\tsc" && ^
yarn run dev
