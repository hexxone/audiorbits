#!/bin/bash

rm -rf ./dist && \
cp -R public dist && \
yarn run pack && \
yarn run dev