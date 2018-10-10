#!/bin/bash

yarn build:release

BASEPATH="gs://cloudflare-cdn-origin-bucket/analytics/web"
VERSION=`git describe`
if [[ $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]] 
then
  FULL=$(git describe | cut -c 2-)
  MAJOR=$(echo $FULL | cut -d'.' -f1)
  MINOR=$(echo $FULL | cut -d'.' -f2)
  REVISION=$(echo $FULL | cut -d'.' -f3) # Not needed right now

  echo "Version matches release tag: $FULL - publishing to CDN"
  mkdir -p ./build/$FULL/
  cp ./build/release/bitmovinanalytics.min.js ./build/$FULL/
  echo "Deploying $FULL to /web/$FULL"
  gsutil cp -a public-read ./build/$FULL/bitmovinanalytics.min.js $BASEPATH/$FULL/bitmovinanalytics.min.js

  echo "Deploying $FULL to /web/$MAJOR"
  gsutil cp -a public-read ./build/$FULL/bitmovinanalytics.min.js $BASEPATH/$MAJOR/bitmovinanalytics.min.js
  echo "Deploying $FULL to /web/$MAJOR.$MINOR"
  gsutil cp -a public-read ./build/$FULL/bitmovinanalytics.min.js $BASEPATH/$MAJOR.$MINOR/bitmovinanalytics.min.js

  echo "CDN URLs:"
  echo "[  direct  ] https://cdn.bitmovin.com/analytics/web/$FULL/bitmovinanalytics.min.js"
  echo "[  major   ] https://cdn.bitmovin.com/analytics/web/$MAJOR/bitmovinanalytics.min.js"
  echo "[  minor   ] https://cdn.bitmovin.com/analytics/web/$MAJOR.$MINOR/bitmovinanalytics.min.js"
fi
