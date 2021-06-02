@echo on
SET GENERATE_SOURCEMAP=false
SET PRODUCTION=true

del "dist\*.*" /Q /S && ^
xcopy "public\*.*" "dist\" /e /i /y /s && ^
yarn run pack-prod && ^
yarn run dev-prod

