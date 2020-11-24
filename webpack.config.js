const path = require('path');

const CircularDependencyPlugin = require('circular-dependency-plugin')

module.exports = {
  entry: {
    magicIO: './dist/babel/AudiOrbits.js'
  },
  output: {
    filename: 'AudiOrbits.bundle.js',
    path: path.resolve(__dirname, 'dist') + '/pack/js'
  },
  devtool: "source-map",
  devServer: {
    contentBase: path.join(__dirname, 'dist') + '/pack',
    port: 9000
  },
  module: {
    rules: [
      {
        test: /\.worker\.(c|m)?js$/i,
        use: [
          {
            loader: 'worker-loader',
          },
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      }
    ]
  },
  plugins: [
    new CircularDependencyPlugin({
      // exclude detection of files based on a RegExp
      exclude: /a\.js|node_modules/,
      // include specific files based on a RegExp
      include: /dir/,
      // add errors to webpack instead of warnings
      failOnError: true,
      // allow import cycles that include an asyncronous import,
      // e.g. via import(/* webpackMode: "weak" */ './file.js')
      allowAsyncCycles: false,
      // set the current working directory for displaying module paths
      cwd: process.cwd(),
    })
  ]
};
