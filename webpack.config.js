/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Webpack build config for AudiOrbits.
 *
 * Probably not a good example to start from :D
 */

// system
const path = require("path");
const webp = require("webpack");

// custom
const OfflinePlugin = require("./src/we_utils/src/offline/OfflinePlugin");
const WascBuilderPlugin = require("./src/we_utils/src/wasc-worker/WascBuilderPlugin");
const RenamerPlugin = require("./src/we_utils/src/renamer/RenamerPlugin");

// optimizing
const propertiesRenameTransformer =
	require("ts-transformer-properties-rename").default;
const TerserPlugin = require("terser-webpack-plugin");

// analyzing
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const BundleAnalyzerPlugin =
	require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

// prop list
const propss = Object.keys(
	JSON.parse(require("fs").readFileSync("./public/project.json")).general
		.properties
);
propss.push(
	"general",
	"supportsaudioprocessing",
	"preview",
	"visibility",
	"workshopid",
	"condition",
	"editable",
	"min",
	"max",
	"order",
	"text",
	"type",
	"value",
	"title",
	"tags",
	"localization",
	"description",
	"approved",
	"file",
	"path",
	"language",
	"properties",
	"time",
	"module",
	"instance",
	"exports",
	"params",
	"run",
	"env",
	"memory",
	"payload",
	"id",
	"action",
	"func",
	"data",
	"set",
	"get",
	"buffer",
	"props",
	"result",
	"ellapsed",
	"levelSettings",
	"audioSettings",
	"build",
	"update",
	"outputData",
	"audioProps",
	"audioprocessing",
	"crossOriginIsolated",
	"initial",
	"maximum",
	"shared",
	"common",
	"vertex",
	"vertexShader",
	"fragment",
	"fragmentShader",
	"normal",
	"position",
	"uv",
	"precision",
	"ascender",
	"boundingBox",
	"yMin",
	"xMin",
	"yMax",
	"xMax",
	"cssFontStyle",
	"cssFontWeight",
	"descender",
	"familyName",
	"glyphs",
	"original_font_information",
	"format",
	"fontFamily",
	"fontSubfamily",
	"uniqueID",
	"fullName",
	"resolution",
	"x",
	"y",
	"z",
	"w",
	"a"
);

// const
const ENTRY_FILE = path.resolve(__dirname, "./src/AudiOrbi.ts");

const BUILD_PATH = path.resolve(__dirname, "dist");

module.exports = (env) => {
	const prod = env.production || false;

	return {
		mode: prod ? "production" : "development",
		entry: {
			ao: ENTRY_FILE,
		},
		output: {
			chunkFormat: "module",
			path: BUILD_PATH,
		},
		devServer: {
			static: {
				directory: BUILD_PATH,
			},
			compress: true,
			https: false,
			port: 8443,
			liveReload: false,
			hot: false,
			headers: {
				https: true,
				"Access-Control-Allow-Origin": "*",
				"Cross-Origin-Opener-Policy": "same-origin",
				"Cross-Origin-Embedder-Policy": "require-corp",
			},
		},
		resolve: {
			extensions: [".ts", ".js"],
			plugins: [
				// THREE.JS tree shaking helper
				// threeMinifier.resolver,
			],
		},
		module: {
			rules: [
				// TypeScript loader
				{
					test: /\.(t)sx?$/,
					loader: require.resolve("ts-loader"), // || ts-loader
					options: {
						compiler: "typescript", // ttypescript
						context: __dirname,
						getCustomTransformers: (program) => {
							return {
								before:
									prod && !prod
										? [
												propertiesRenameTransformer(program, {
													entrySourceFiles: [ENTRY_FILE],
													reserved: propss,
													// noImplicitAny: true,
												}),
										  ]
										: [],
							};
						},
					},
				},
				// loader for workers...
				{
					test: /\.worker\.(c|m)?js$/i,
					loader: "worker-loader",
					options: {
						esModule: true,
						chunkFilename: "[id].[chunkhash].worker.js",
					},
				},
				// ts shader loader
				{
					test: /\.(glsl)$/,
					loader: require.resolve("./src/we_utils/src/three/shader/loader"),
				},
				// exclude .asc from the bundle
				{
					test: /.*\.asc$/i,
					loader: "null-loader",
				},
				// exclude live reloading from the bundle -_- no other way?
				{
					test: path.resolve(
						__dirname,
						"node_modules/webpack-dev-server/client"
					),
					loader: "null-loader",
				},
			],
		},
		// compile target
		target: ["web", "es6"],
		// fuck eval shittery
		devtool: false,
		// plugins
		plugins: [
			// THREE.JS tree shaking helper
			// threeMinifier,
			// new webp.optimize.ModuleConcatenationPlugin(),

			// The TS Syntax checking
			new ForkTsCheckerWebpackPlugin({}),

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
				staticdir: "dist/",
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
		],
		// remove dead code in production
		optimization: prod
			? {
					nodeEnv: "production",
					minimize: true,
					minimizer: [
						new TerserPlugin({
							// https://github.com/webpack-contrib/terser-webpack-plugin#terseroptions
							terserOptions: {
								ecma: 2020,
								parse: {},
								compress: {
									unsafe: true,
									// pure_funcs: ["console.warn"], // ~40kb of three.js messages... errors will stil come through.
									hoist_funs: true,
								},
								mangle: {
									properties: {
										keep_quoted: true,
										reserved: propss,
										regex: /_(private|internal)_/, // the same prefixes like for custom transformer
									},
								},
								module: false,
								toplevel: true,
								sourceMap: false,
								keep_fnames: false,
							},
						}),
					],
					moduleIds: "size",
					mangleExports: "size",
					mangleWasmImports: true,
					providedExports: true,
					usedExports: true,
					concatenateModules: true,
					innerGraph: true,
			  }
			: {},
		// print statistics
		stats: {
			// Examine all modules
			// maxModules: Infinity,
			// Display bailout reasons
			optimizationBailout: true,
		},
	};
};
