/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2023 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 *
 * Webpack build config for AudiOrbits.
 * Probably not a good example to start from :D
 */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require("fs");
const path = require("path");
const { networkInterfaces } = require("os");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const BundleAnalyzerPlugin =
	require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// custom plugins
const OfflinePlugin = require("./src/we_utils/src/offline/OfflinePlugin");
const WascBuilderPlugin = require("./src/we_utils/src/wasc-worker/WascBuilderPlugin");
const RenamerPlugin = require("./src/we_utils/src/renamer/RenamerPlugin");

const lanIp =
	networkInterfaces()["Ethernet"].find(
		(item) => item.family == "IPv4" && !item.internal && item.address
	).address ?? "0.0.0.0";
console.log("Got Lan IP: " + lanIp);

module.exports = (env) => {
	const prod = env.production || false;
	const stringMode = prod ? "production" : "development";

	return {
		mode: stringMode,
		entry: {
			ao: {
				import: "./src/AudiOrbi.ts",
			},
		},
		// compile target
		// target: ["web", "es6", "es2020"],
		output: {
			chunkFormat: "module",
			path: path.resolve(__dirname, "dist", stringMode),
			// publicPath: "dist/" + stringMode,
			library: {
				name: "ao",
				type: "var", // window
			},
			// libraryTarget: "commonjs",
			// filename: "ao.js",
			filename: "[name].js",
			chunkFilename: "[name].js",
			globalObject: "this",
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
						// parse: {},
						// compress: {
						// 	unsafe: prod,
						// 	hoist_funs: prod,
						// },
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
						module: true,
						toplevel: true,
						sourceMap: false,
						// keep_fnames: !prod,
						keep_classnames: !prod,
					},
					extractComments: false,
				}),
			],
			chunkIds: "size",
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
				// loader for workers...
				// {
				// 	test: /\.worker\.js$/i,
				// 	loader: "src/we_utils/src/worker-loader-fork/src/index.js",
				// 	options: {
				// 		esModule: true,
				// 		filename: "asdasd.foo.js",
				// 		chunkFilename: "sdf.custom.js",
				// 	},
				// },
				// loader for Typescript
				{
					test: /\.tsx?$/,
					loader: "ts-loader",
					exclude: /node_modules/,
					options: {
						compiler: "typescript", // ttypescript
						transpileOnly: true,
						// getCustomTransformers: (program) => {
						// 	return {
						// 		before: prod
						// 			? [
						// 				propertiesRenameTransformer(program, {
						// 					entrySourceFiles: ["main.ts"],
						// 					reserved: ["a", "b", "c", "d", "w", "x", "y", "z", "min", "max"],
						// 					// noImplicitAny: true,
						// 				}),
						// 			]
						// 			: [],
						// 	};
						// },
					},
				},
				// Process any JS outside of the app with Babel.
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
		resolveLoader: {
			alias: {
				"worker-loader": path.resolve(
					__dirname,
					"./src/we_utils/src/worker-loader-fork/dist"
				),
			},
		},
		resolve: {
			extensions: [".tsx", ".ts", ".js", ".glsl"],
			// plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],

			alias: {
				"we_utils/src": path.resolve(__dirname, "./src/we_utils/src"),
				"three.ts/src": path.resolve(
					__dirname,
					"./src/we_utils/src/three.ts/src"
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
				basedir: "../../../../assembly",
				modules: ["BasicGeometry.ts", "FractalGeometry.ts"],
				cleanup: true,
				shared: true,
			}),
			new WascBuilderPlugin({
				production: prod,
				basedir: "../weas/assembly",
				modules: ["WEAS.ts"],
				cleanup: true,
				shared: true,
			}),

			// offline worker helper
			// will create a list of all app-files.
			// this list is used to cache the app offline in browser.
			new OfflinePlugin({
				staticdir: __dirname + "\\public",
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
			new RenamerPlugin({
				regex: /[a-z0-9_]*_webpack_[a-z0-9_]*/gi,
			}),

			// detect circular
			new CircularDependencyPlugin({
				exclude: /node_modules/,
				include: /dist/,
				failOnError: true,
			}),
		],
		devServer: {
			host: lanIp,
			allowedHosts: ["all"], // or use 'auto' for slight more security
			static: {
				directory: path.resolve(__dirname, "dist", stringMode),
				watch: true,
			},
			client: false,
			liveReload: false,
			compress: true,
			https: {
				key: fs.readFileSync("../../localhost+1-key.pem"),
				cert: fs.readFileSync("../../localhost+1.pem"),
				// ca: fs.readFileSync("ca.crt"),
			},
			server: "https",
			// disableHostCheck: true,
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
