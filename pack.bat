@echo on
SET GENERATE_SOURCEMAP=false
yarn run build-win && yarn run startdev
