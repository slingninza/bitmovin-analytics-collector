module.exports = {
  "env"    : {
    "browser": true,
    "jquery" : true,
    "commonjs": true,
    "es6": true
  },
  "parser": "babel-eslint",
  "plugins": [
    "html"
  ],
  "extends": "eslint:recommended",
  "rules"  : {
    "semi"              : [2, "always"],
    "quotes"            : [2, "single"],
    "curly"             : 2,
    "no-undef"          : 2,
    "no-console"        : 1,
    "no-unused-vars"    : 1,
    "indent"            : [2, 2, {"SwitchCase": 1}],
    "one-var"           : [2, "never"],
    "no-inline-comments": 2,
    "eol-last"          : 2,
    "no-fallthrough"    : 1,
    "no-debugger"       : 1
  },
  "globals": {
    VERSION: true
  }
};
