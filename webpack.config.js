/**
* Webpack build config for AudiOrbits.
*
* Probably not a good example to start from :D
*/

const path = require('path');

const OfflinePlugin = require('./src/we_utils/src/offline/OfflinePlugin');
const WascBuilderPlugin = require('./src/we_utils/src/wasc-worker/WascBuilderPlugin');

const propertiesRenameTransformer = require('ts-transformer-properties-rename').default;

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const TerserPlugin = require('terser-webpack-plugin');

const ENTRY_FILE = './src/AudiOrbi.ts';
const BUILD_PATH = path.resolve(__dirname, 'dist');

module.exports = (env) => {
	const prod = env.production || false;

	return {
		mode: 'production',
		entry: {
			// audiorbits: './dist/tsc/AudiOrbits.js',
			audiorbits: ENTRY_FILE,
		},
		output: {
			chunkFilename: '[id].bundle.js',
			path: BUILD_PATH,
		},
		devServer: {
			contentBase: BUILD_PATH,
			port: 9000,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'https': true,
			},
		},
		resolve: {
			extensions: ['.ts', '.js'],
		},
		module: {
			rules: [
				// TypeScript loader
				{
					test: /\.tsx?$/,
					loader: require.resolve('awesome-typescript-loader'), // || ts-loader
					options: {
						compiler: 'ttypescript',
						context: __dirname,
						getCustomTransformers: (program) => {
							return {
								before: [
									propertiesRenameTransformer(program, {entrySourceFiles: [ENTRY_FILE]}),
								],
							};
						},
					},
				},
				// use a specific loader for workers...
				{
					test: /\.worker\.(c|m)?js$/i,
					loader: 'worker-loader',
					options: {
						esModule: true,
						chunkFilename: '[id].[chunkhash].worker.js',
					},
				},
				// exclude .asc from the bundle
				{
					test: /.*\.asc$/i,
					loader: 'null-loader',
				},
				// exclude live reloading from the bundle -_- no other way?
				{
					test: path.resolve(__dirname, 'node_modules/webpack-dev-server/client'),
					loader: 'null-loader',
				},
			],
		},
		plugins: [
			// The TS Syntax checking
			new ForkTsCheckerWebpackPlugin({

			}),
			// manual wasm module build
			// just so you don't have to modify the process everytime...
			// this will compile all modules in 'rootpath' (recursive)
			// where the 'include' (regex) matches a filename.
			new WascBuilderPlugin({
				production: prod,
				relpath: '../../../',
				extension: 'asc',
				cleanup: true,
			}),
			// offline worker helper
			// will create a list of all app-files.
			// this list is used to cache the app offline in browser.
			new OfflinePlugin({
				staticdir: 'dist/',
				outfile: 'offlinefiles.json',
				extrafiles: ['/'],
				pretty: !prod,
			}),
		],
		// remove dead code in production
		optimization: prod ? {
			minimizer: [
				new TerserPlugin({
					// https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
					terserOptions: {
						parse: {},
						compress: {
							unsafe: true,
							pure_funcs: ['console.warn'], // ~40kb of three.js messages... errors will stil come through.
						},
						mangle: {
							properties: {
								regex: /^_(private|internal)_/, // the same prefixes like for custom transformer
							},
						},
						module: false,
						sourceMap: false,
					},
				}),
			],
		}: {},
	};
};
