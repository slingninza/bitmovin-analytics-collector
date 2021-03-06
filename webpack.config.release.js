const WriteJsonPlugin = require('write-json-webpack-plugin');
const webpack = require('webpack');
const path = require('path');
const packageProperties = require('./package.json');

const {getGitVersion, banner, entry, externals, loaders} = require('./webpack.config.js');

const releasePackageJson = {
  name: packageProperties.name,
  version: getGitVersion(),
  description: 'Bitmovin Analytics allows you to collect data about HTML5 Video playback',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'git+https://github.com/bitmovin/bitmovin-analytics-collector.git'
  },
  main: 'bitmovinanalytics.min.js',
  readme: 'ERROR: No README data found!',
  author: 'Bitmovin Inc',
  homepage: 'https://bitmovin.com/video-analytics/',
  maintainers: [{
    name: 'bitadmin',
    email: 'admin@bitmovin.com'
  }]
};

module.exports = {
  entry,
  externals,
  output: {
    path: path.resolve('./build/release'),
    filename: 'bitmovinanalytics.min.js',
    libraryTarget: 'umd'
  },
  module: {
    loaders
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    }),
    new webpack.BannerPlugin(banner),
    new WriteJsonPlugin({
      object: releasePackageJson,
      path: '.',
      filename: 'package.json'
    }),
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(getGitVersion())
    })
  ]
};
