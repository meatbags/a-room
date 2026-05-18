// vite.config.js

import path from 'path';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default {
  base: './',
  build: {
    rollupOptions: {
      treeshake: false,
    }
  },
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      'engine': path.resolve(__dirname, './../engine/src/index.js'),
      'three/addons': path.resolve(__dirname, './../engine/node_modules/three/examples/jsm'),
      'three/tsl': path.resolve(__dirname, './../engine/node_modules/three/build/three.tsl.js'),
      'three/webgpu':  path.resolve(__dirname, './../engine/node_modules/three/build/three.webgpu.js'),
      'three': path.resolve(__dirname, './../engine/node_modules/three'),
      'postprocessing': path.resolve(__dirname, './../engine/node_modules/postprocessing'),
    }
  },
};