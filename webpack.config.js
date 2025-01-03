const path = require('path');
var webpack = require("webpack");

module.exports = (env, argv) => {
   return {
      entry: './src/main.ts',
      devtool: 'inline-source-map',
      module: {
         rules: [
            {
               test: /\.tsx?$/,
               use: 'ts-loader',
               exclude: /node_modules/
            }
         ]
      },
      resolve: {
         extensions: ['.tsx', '.ts', '.js']
      },
      output: {
         filename: 'web.js',
         path: path.resolve(__dirname, 'web')
      },
      devServer: {
         static: {
            directory: path.resolve(__dirname, 'web'),
         },
         compress: true,
         port: 8000,
      },
      plugins: [
         new webpack.DefinePlugin({
            _DEVMODE: !!(argv.mode == 'development')
         })
      ],
      // ignore file size warning
      performance: {
         hints: false,
      },
   }
};