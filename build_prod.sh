#!/bin/bash

export GENERATE_SOURCEMAP=false
export PRODUCTION=true

rm -rf ./dist && \
yarn run compile-prod && \
cp -R public dist/pack && \
yarn run pack-prod && \
rm -rf ./dist/tsc && \
yarn run dev-prod