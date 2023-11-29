# build audiorbits
cd ..
yarn install
yarn prod
cd ./lively

# update LivelyProperties.json
python transform.py

# copy config & extra files from public into prod folder (override existing)
cp ./public/* ../dist/production

# make zip file
Compress-Archive -Force -Path ../dist/production/* -DestinationPath ./audiorbits_lively.zip
