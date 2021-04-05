@echo on
SET GENERATE_SOURCEMAP=false
SET PRODUCTION=true

del "dist\*.*" /Q /S && ^
yarn run compile-prod && ^
xcopy "public\*.*" "dist\pack\" /e /i /y /s && ^
yarn run pack-prod && ^
Rmdir /Q /S "dist\tsc" && ^
yarn run dev-prod

