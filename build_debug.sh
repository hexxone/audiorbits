#!/bin/bash

rm -rf ./dist && \
yarn run compile && \
cp -R public dist/pack && \
yarn run pack && \
rm -rf ./dist/tsc && \
yarn run dev