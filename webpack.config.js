/**
* Webpack build config for AudiOrbits.
*
* Probably not a good example to start from :D
*/

// system
const path = require('path');

// custom
const OfflinePlugin = require('./src/we_utils/src/offline/OfflinePlugin');
const WascBuilderPlugin = require('./src/we_utils/src/wasc-worker/WascBuilderPlugin');
const RenamerPlugin = require('./src/we_utils/src/renamer/RenamerPlugin');

// optimizing
const propertiesRenameTransformer = require('ts-transformer-properties-rename').default;
const TerserPlugin = require('terser-webpack-plugin');
const ThreeMinifierPlugin = require('@yushijinhun/three-minifier-webpack');
const threeMinifier = new ThreeMinifierPlugin();

// analyzing
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// prop list
const propss = Object.keys(JSON.parse(require('fs').readFileSync('./public/project.json')).general.properties);
propss.push('general', 'supportsaudioprocessing', 'preview', 'visibility', 'workshopid',
	'condition', 'editable', 'min', 'max', 'order', 'text', 'type', 'value', 'title', 'tags',
	'localization', 'description', 'approved', 'file', 'path', 'language', 'properties', 'time',
	'module', 'instance', 'exports', 'params', 'run', 'env', 'memory', 'payload', 'id',
	'action', 'func', 'data', 'set', 'get', 'buffer', 'props', 'result', 'ellapsed',
	'levelSettings', 'audioSettings', 'build', 'update', 'outputData', 'audioProps', 'audioprocessing',
	'crossOriginIsolated', 'initial', 'maximum', 'shared', 'common', 'vertex', 'vertexShader', 'fragment', 'fragmentShader',
	'normal', 'position', 'uv', 'precision',
	'ascender', 'boundingBox', 'yMin', 'xMin', 'yMax', 'xMax', 'cssFontStyle', 'cssFontWeight', 'descender', 'familyName',
	'glyphs', 'original_font_information', 'format', 'fontFamily', 'fontSubfamily', 'uniqueID', 'fullName', 'resolution',
	'underlinePosition', 'underlineThickness', '__getFloat64ArrayView', '__getFloat32ArrayView', '__getInt32Array');

// const
const ENTRY_FILE = './src/AudiOrbi.ts';
const BUILD_PATH = path.resolve(__dirname, 'dist');

module.exports = (env) => {
	const prod = env.production || false;

	return {
		mode: prod ? 'production' : 'development',
		entry: {
			// ao: './dist/tsc/AudiOrbits.js',
			ao: ENTRY_FILE,
		},
		output: {
			// libraryTarget: 'commonjs2',
			chunkFilename: '[id].bundle.js',
			path: BUILD_PATH,
		},
		devServer: {
			contentBase: BUILD_PATH,
			port: 9000,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'https': true,
				'Cross-Origin-Opener-Policy': 'same-origin',
				'Cross-Origin-Embedder-Policy': 'require-corp',
			},
		},
		resolve: {
			extensions: ['.ts', '.js'],
			plugins: [
				// THREE.JS tree shaking helper
				threeMinifier.resolver,
			],
		},
		module: {
			rules: [
				// TypeScript loader
				{
					test: /\.(t)sx?$/,
					loader: require.resolve('awesome-typescript-loader'), // || ts-loader
					options: {
						compiler: 'ttypescript',
						context: __dirname,
						getCustomTransformers: (program) => {
							return {
								before: [
									propertiesRenameTransformer(program, {
										entrySourceFiles: [
											ENTRY_FILE,
										],
									}),
								],
							};
						},
					},
				},
				// loader for workers...
				{
					test: /\.worker\.(c|m)?js$/i,
					loader: 'worker-loader',
					options: {
						esModule: true,
						chunkFilename: '[id].[chunkhash].worker.js',
					},
				},
				// ts shader loader
				{
					test: /\.(glsl)$/,
					loader: require.resolve('./src/we_utils/src/three/shader/loader'),
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
		// compile target
		target: ['es2020'],
		// plugins
		plugins: [
			// THREE.JS tree shaking helper
			threeMinifier,
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
			// webpack bundle analyzer
			new BundleAnalyzerPlugin({
				analyzerMode: 'static',
				reportFilename: '../out/ao_bundle_report.html',
				openAnalyzer: false,
			}),
			// custom renamer
			new RenamerPlugin({
				regex: /[a-z0-9_]*_webpack_[a-z0-9_]*/gi,
			}),
		],
		// remove dead code in production
		optimization: prod ? {
			nodeEnv: 'production',
			minimize: true,
			minimizer: [
				new TerserPlugin({
					// https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
					terserOptions: {
						ecma: 2020,
						parse: {},
						compress: {
							unsafe: true,
							pure_funcs: ['console.warn'], // ~40kb of three.js messages... errors will stil come through.
							hoist_funs: true,
						},
						mangle: {
							properties: {
								keep_quoted: true,
								reserved: propss,
								// regex: /_(private|internal)_/, // the same prefixes like for custom transformer
							},
						},
						module: false,
						toplevel: true,
						sourceMap: false,
						keep_fnames: false,
					},
				}),
			],
			moduleIds: 'size',
			mangleExports: 'size',
			mangleWasmImports: true,
			providedExports: true,
			usedExports: true,
			concatenateModules: true,
			sideEffects: true,
			innerGraph: true,
		}: {},
	};
};
