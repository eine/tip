//@ts-check

'use strict';

/**@type {import('webpack').Configuration}*/

const join = require('path').join;

module.exports = {
  entry: './ts/main.ts',
  target: 'node',
  resolve: {
    mainFields: ['main', 'module'],
//    extensions: ['.ts', '.js'],
  },
  output: {
    path: join(__dirname, 'dist'),
    filename: 'main.js'
//    libraryTarget: "commonjs2",
  },
  devtool: 'source-map',
//  optimization: { minimize: false },
  module: {
    rules: [{
      test: /\.ts$/,
      exclude: /node_modules/,
      use: [{
        loader: 'ts-loader',
//        options: {
//          compilerOptions: {
//            "module": "es6" // override `tsconfig.json` so that TypeScript emits native JavaScript modules.
//          }
//        }
      }]
    }]
  },
};
