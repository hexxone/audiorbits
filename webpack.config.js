/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Webpack build config for AudiOrbits.
 *
 * Probably not a good example to start from :D
 */

const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const BundleAnalyzerPlugin =
	require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// custom plugins
const OfflinePlugin = require("./src/we_utils/src/offline/OfflinePlugin");
const WascBuilderPlugin = require("./src/we_utils/src/wasc-worker/WascBuilderPlugin");
const RenamerPlugin = require("./src/we_utils/src/renamer/RenamerPlugin");

module.exports = (env) => {
	const prod = env.production || false;
	const stringMode = prod ? "production" : "development";

	return {
		mode: stringMode,
		entry: "./dist/tsc/AudiOrbi.js",
		// compile target
		// target: ["web", "es6", "es2020"],
		output: {
			chunkFormat: "module",
			path: path.resolve(__dirname, "dist", stringMode),
			publicPath: "/",
			library: "ao",
			libraryTarget: "commonjs",
			filename: "ao.js",
			globalObject: "this",
			chunkFilename: (_pathData) => "ao.[id].js",
		},
		// remove dead code
		optimization: {
			minimize: true,
			nodeEnv: stringMode,
			minimizer: [
				new TerserPlugin({
					// https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
					terserOptions: {
						// ecma: 2020,
						parse: {},
						compress: {
							unsafe: prod,
							hoist_funs: prod,
						},
						format: {
							comments: false,
						},
						mangle: {
							properties: {
								keep_quoted: true,
								// reserved: propss,
								regex: /_(private|internal)_/, // the same prefixes like for custom transformer
							},
						},
						module: false,
						toplevel: true,
						sourceMap: false,
						keep_fnames: !prod,
					},
					extractComments: false,
				}),
			],
			chunkIds: "deterministic",
			concatenateModules: true,
			moduleIds: "size",
			mangleExports: "size",
			mangleWasmImports: true,
			providedExports: true,
			usedExports: true,
			innerGraph: true,
		},
		devtool: false,
		module: {
			rules: [
				// JS loader
				{
					test: /\.jsx?$/, // If you are using TypeScript: /\.tsx?$/
					include: path.resolve(__dirname, "src"),
					use: [
						{
							loader: "babel-loader",
							options: {
								cacheDirectory: true,
							},
						},
					],
				},
				// shader loader
				{
					test: /\.(glsl)$/,
					loader: require.resolve("./src/we_utils/src/three/shader/loader"),
				},
				// exclude .asc from the bundle
				{
					test: /.*\.asc$/i,
					loader: "null-loader",
				},
			],
		},
		resolve: {
			extensions: [".tsx", ".ts", ".js", ".glsl"],
			// plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],

			alias: {
				"we_utils/src": path.resolve(__dirname, "./dist/tsc/we_utils/src"),
				"three.ts/src": path.resolve(
					__dirname,
					"./dist/tsc/we_utils/src/three.ts/src"
				),
				// reverse mapping shaders (dont get copied by tsc)
				// "fragment/*.glsl": path.resolve(__dirname, "./src/we_utils/src/three/shader/fragment"),
			},
		},
		// plugins
		plugins: [
			// copy static files
			new CopyWebpackPlugin({
				patterns: [{ from: "public" }],
			}),

			// manual wasm module build
			// just so you don't have to modify the process everytime...
			// this will compile all modules in 'rootpath' (recursive)
			// where the 'include' (regex) matches a filename.
			new WascBuilderPlugin({
				production: prod,
				relpath: "../../../",
				extension: "asc",
				cleanup: prod,
				shared: true,
			}),

			// offline worker helper
			// will create a list of all app-files.
			// this list is used to cache the app offline in browser.
			new OfflinePlugin({
				staticdir: "dist/tsc",
				outfile: "offlinefiles.json",
				extrafiles: ["/"],
				pretty: !prod,
			}),

			// webpack bundle analyzer
			new BundleAnalyzerPlugin({
				analyzerMode: "static",
				reportFilename: "../out/ao_bundle_report.html",
				openAnalyzer: false,
			}),

			// custom renamer
			// new RenamerPlugin({
			// 	regex: /[a-z0-9_]*_webpack_[a-z0-9_]*/gi,
			// }),

			// detect circular
			new CircularDependencyPlugin({
				exclude: /node_modules/,
				include: /dist/,
				failOnError: true,
			}),
		],
		devServer: {
			static: {
				directory: path.resolve(__dirname, "dist", stringMode),
				watch: true,
			},
			client: false,
			compress: true,
			https: false,
			liveReload: false,
			hot: false,
			port: 8443,
			headers: {
				https: true,
				"Access-Control-Allow-Origin": "*",
				"Cross-Origin-Opener-Policy": "same-origin",
				"Cross-Origin-Embedder-Policy": "require-corp",
			},
		},
		// print statistics
		stats: {
			children: true,
			errorDetails: true,
			// Display bailout reasons
			optimizationBailout: true,
		},
	};
};
