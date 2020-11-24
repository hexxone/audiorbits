const path = require('path');

//const CircularDependencyPlugin = require('circular-dependency-plugin')

module.exports = {
  entry: {
    audiorbits: './dist/babel/AudiOrbits.js'
  },
  output: {
    chunkFilename: '[id].bundle.js',
    path: path.resolve(__dirname, 'dist') + '/pack/js'
  },
  //devtool: "source-map",
  devServer: {
    contentBase: path.join(__dirname, 'dist') + '/pack',
    port: 9000
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.worker\.(c|m)?js$/i,
        use: [
          {
            loader: 'worker-loader',
            options: {
              esModule: true,
              chunkFilename: '[id].[chunkhash].worker.js',
            },
          },
        ],
      }
    ]
  }
};
