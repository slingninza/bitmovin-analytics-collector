#!/bin/bash

# isnt't working in all cases it seems, and doesn't really have any gain,
# we will just run lint on all for every commit as that is more reliable
# (git status --porcelain | grep .js$ | awk 'match($0, "M"){print $2}' | xargs ./node_modules/.bin/eslint) && npm run lint:html

npm run lint
