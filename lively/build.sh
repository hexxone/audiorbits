#!/bin/bash
# requires: node, npm, yarn, python, zip

echo "Building AudiOrbits..."
cd ..
yarn install
yarn prod
cd lively

# Checking if python is available
if command -v python &> /dev/null
then
    echo "Running python property transformer..."
    python transform.py
else
    echo "Python is not installed. Skipping property transform..."
fi

echo "Copying extra files..."
cp -r ./public/* ../dist/production/

echo "Creating Zip-Archive..."
zip -r ./audiorbits_lively.zip ../dist/production/*
