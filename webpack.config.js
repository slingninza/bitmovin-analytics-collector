const webpack = require('webpack');
const execSync = require('child_process').execSync;
const packageProperties = require('./package.json');

const getGitVersion = () => {
  return execSync('git describe --abbrev=0').toString().trim();
};

const getFullGitVersion = () => {
  return execSync('git describe').toString().trim();
};

const banner =
        '\n' +
        'Copyright (C) ' + new Date().getFullYear() + ', Bitmovin, Inc., All Rights Reserved\n' +
        '\n' +
        'This source code and its use and distribution, is subject to the terms\n' +
        'and conditions of the applicable license agreement.\n' +
        '\n' +
        packageProperties.name + ' version ' + getFullGitVersion() + '\n';

const entry = './js/core/BitmovinAnalyticsExport.js';

let loaders = [{
  test   : /\.js$/,
  exclude: /node_modules/,
  loader : 'babel-loader'
}];

const externals = {
  'hls.js': 'Hls'
};

module.exports = {
  banner,
  entry,
  externals,
  plugins: [
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(getGitVersion())
    })
  ],
  loaders,
  getGitVersion
};
