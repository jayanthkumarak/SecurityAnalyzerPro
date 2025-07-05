const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/main/index.ts',
  target: 'electron-main',
  devtool: 'source-map',
  
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@main': path.resolve(__dirname, 'src/main'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  
  output: {
    path: path.resolve(__dirname, 'dist/main'),
    filename: 'index.js',
  },
  
  node: {
    __dirname: false,
    __filename: false,
  },
  
  externals: {
    // Native modules should be external
    'better-sqlite3': 'commonjs better-sqlite3',
    'electron': 'commonjs electron',
    '@anthropic-ai/sdk': 'commonjs @anthropic-ai/sdk',
  },
  
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
  },
  
  watchOptions: {
    ignored: /node_modules/,
    poll: 1000,
  },
};