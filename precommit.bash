#!/bin/bash

# (git status --porcelain | grep .js$ | awk 'match($0, "M"){print $2}' | xargs ./node_modules/.bin/eslint) && npm run lint:html

# above command isnt't working in all cases it seems, and doesn't really have any gain (except sometimes run git commit "faster"),
# we will just run lint on all for every commit as that is more reliable

npm run lint
