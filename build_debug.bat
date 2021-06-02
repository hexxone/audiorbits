@echo on

del "dist\*.*" /Q /S && ^
xcopy "public\*.*" "dist\" /e /i /y /s && ^
yarn run pack && ^
yarn run dev
