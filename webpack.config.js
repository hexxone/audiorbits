const path = require('path');

const OfflinePlugin = require('./src/we_utils/src/OfflinePlugin');

module.exports = {
  mode: 'production',
  entry: {
    audiorbits: './dist/babel/AudiOrbits.js'
  },
  output: {
    chunkFilename: '[id].bundle.js',
    path: path.resolve(__dirname, 'dist') + '/pack' // TODO ADD /js/ path back ???
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist') + '/pack',
    port: 9000,
    hot: false,
    inline: false,
    liveReload: false
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
      },
      // exlude lvie reloading from the bundle -_-
      // @TODO find another way?
      {
        test: path.resolve(__dirname, 'node_modules/webpack-dev-server/client'),
        loader: 'null-loader'
      }
    ]
  },
  plugins: [
    new OfflinePlugin({
      outdir: "dist/pack",
      outfile: 'offlinefiles.json',
      extrafiles: ["/"]
    })
  ]
};
