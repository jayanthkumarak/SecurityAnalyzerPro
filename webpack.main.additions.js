/** Merge into electron-webpack's main config */
module.exports = {
  entry: { preload: './src/main/preload.ts' }, // ensure dist/preload.js is emitted
}; 