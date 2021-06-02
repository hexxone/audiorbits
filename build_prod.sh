#!/bin/bash

export GENERATE_SOURCEMAP=false
export PRODUCTION=true

rm -rf ./dist && \
cp -R public dist && \
yarn run pack-prod && \
yarn run dev-prod