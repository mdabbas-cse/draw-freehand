import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";
import resolve from '@rollup/plugin-node-resolve'


const terserOptions = {
  compress: {
    passes: 10,
    drop_console: false,
  },
  output: {
    comments: false,
  },
}

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/freehand.min.js',
      format: 'iife',
      name: 'freehand',
      plugins: [
        terser(terserOptions),
        resolve(),
      ],
      globals: {
        window: 'window',
        document: 'document'
      }
    }
  ],
  plugins: [
    json()
  ]
}