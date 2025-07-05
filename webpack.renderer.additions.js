const webpack = require('webpack');
module.exports = {
  target: 'electron-renderer',
  plugins: [
    new webpack.ProvidePlugin({
      global: require.resolve('./src/renderer/shims/global'),
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
}; 