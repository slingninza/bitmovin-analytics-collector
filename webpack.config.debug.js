const path = require('path');
const webpack = require('webpack');
const packageProperties = require('./package.json');

const {banner, entry, externals, loaders, getGitVersion} = require('./webpack.config.js');

module.exports = {
  entry,
  externals,
  output: {
    path: path.resolve('./build/debug'),
    filename: 'bitmovinanalytics.min.js',
    libraryTarget: 'umd'
  },
  module: {
    loaders
  },
  plugins: [
    new webpack.BannerPlugin(banner),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(getGitVersion())
    })
  ],
  devtool: 'source-map'
};
