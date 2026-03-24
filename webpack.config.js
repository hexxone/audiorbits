/**
 * @author hexxone / https://hexx.one
 *
 * @license
 * Copyright (c) 2024 hexxone All rights reserved.
 * Licensed under the GNU GENERAL PUBLIC LICENSE.
 * See LICENSE file in the project root for full license information.
 *
 * Webpack build config for AudiOrbits.
 * Probably not a good example to start from :D
 */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');

const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

// custom plugins
const OfflinePlugin = require('./src/we_utils/src/offline/OfflinePlugin');
const WascBuilderPlugin = require('./src/we_utils/src/wasc-worker/WascBuilderPlugin');
const RenamerPlugin = require('./src/we_utils/src/renamer/RenamerPlugin');

const lanIp = Object.values(networkInterfaces())
    .flat()
    .find((item) => {
        return item.family === 'IPv4' && !item.internal && item.address;
    })
    ?.address ?? '0.0.0.0';

console.log(`Got Lan IP: ${lanIp}`);

module.exports = (env) => {
    const prod = env.production || false;
    const stringMode = prod ? 'production' : 'development';

    return {
        mode: stringMode,
        entry: {
            ao: {
                import: './src/AudiOrbi.ts'
            }
        },
        output: {
            chunkFormat: 'module',
            path: path.resolve(__dirname, 'dist', stringMode),
            library: {
                name: 'ao',
                type: 'var' // window - exposes the entry point as window.ao
            },
            filename: '[name].js', // Main output file, e.g., ao.js
            chunkFilename: '[name].js', // For dynamically imported chunks
            globalObject: 'this' // Ensures compatibility in various environments for the UMD wrapper / library type 'var'
        },
        optimization: {
            minimize: prod, // Only minimize in production
            nodeEnv: stringMode, // Sets process.env.NODE_ENV, Webpack does this by default based on mode
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        format: {
                            comments: false
                        },
                        mangle: {
                            properties: {
                                keep_quoted: true,
                                regex: /_(private|internal)_/
                            }
                        },
                        module: true,
                        toplevel: true,
                        sourceMap: !prod,
                        keep_classnames: !prod,
                        keep_fnames: !prod
                        // Aggressive compression can be enabled if needed and tested
                        // compress: prod ? { unsafe: true, hoist_funs: true, passes: 2 } : false,
                    },
                    extractComments: false
                })
            ],
            // Following options are generally good defaults for production builds
            chunkIds: prod ? 'size' : 'named',
            concatenateModules: prod, // Scope hoisting
            moduleIds: prod ? 'size' : 'named',
            mangleExports: prod ? 'size' : false,
            mangleWasmImports: true, // Good for Wasm size
            providedExports: true,
            usedExports: true, // Essential for tree-shaking
            innerGraph: prod // More effective tree shaking in prod
        },
        devtool: prod ? false : 'source-map',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/,
                    options: {
                        compiler: 'typescript', // Specify compiler if using ttypescript or similar
                        transpileOnly: true // Speeds up compilation; type checking can be a separate step (e.g. `tsc --noEmit`)
                    }
                },
                {
                    test: /\.jsx?$/, // If you are using TypeScript: /\.tsx?$/
                    include: path.resolve(__dirname, 'src'),
                    use: [
                        {
                            loader: 'babel-loader',
                            options: {
                                cacheDirectory: true
                            }
                        }
                    ]
                },
                // shader loader
                {
                    test: /\.(glsl)$/,
                    loader: require.resolve(
                        './src/we_utils/src/three/shader/loader'
                    )
                },
                // exclude .asc from the bundle
                {
                    test: /.*\.asc$/i,
                    loader: 'null-loader'
                }
            ]
        },
        resolveLoader: {
            alias: {
                'worker-loader': path.resolve(
                    __dirname,
                    './src/we_utils/src/worker-loader-fork/dist'
                )
            }
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.glsl'],
            alias: {
                'we_utils/src': path.resolve(__dirname, './src/we_utils/src'),
                'three.ts/src': path.resolve(__dirname, './src/we_utils/src/three.ts/src')
            }
        },
        plugins: [
            // copy static files
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: 'public'
                    }
                ]
            }),

            // manual wasm module build
            // just so you don't have to modify the process everytime...
            // this will compile all modules in 'rootpath' (recursive)
            // where the 'include' (regex) matches a filename.
            new WascBuilderPlugin({
                production: prod,
                basedir: path.resolve(__dirname, 'assembly'),
                modules: ['BasicGeometry.ts', 'FractalGeometry.ts'],
                cleanup: true,
                shared: true
            }),
            new WascBuilderPlugin({
                production: prod,
                basedir: path.resolve(__dirname, 'src/we_utils/src/weas/assembly'),
                modules: ['WEAS.ts'],
                cleanup: true,
                shared: true
            }),
            new OfflinePlugin({
                staticdir: path.resolve(__dirname, 'public'),
                outfile: 'offlinefiles.json',
                extrafiles: ['/'], // Cache the root path
                pretty: !prod
            }),
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                reportFilename: path.resolve(__dirname, 'dist', 'report', 'ao_bundle_report.html'),
                openAnalyzer: false
            }),

            // custom renamer
            new RenamerPlugin({
                regex: /[a-z0-9_]*_webpack_[a-z0-9_]*/gi
            }),

            new CircularDependencyPlugin({
                exclude: /node_modules/,
                include: /src/,
                failOnError: true,
                cwd: process.cwd()
            })
        ],
        devServer: {
            allowedHosts: ['localhost'],
            static: {
                directory: path.resolve(__dirname, 'dist', stringMode), // Serve from the output directory
                watch: true // Watch for file changes
            },
            client: false, // Disable webpack client logging in the browser console
            liveReload: false, // Disable live reload (can be enabled if preferred)
            compress: true, // Enable gzip compression
            https: {
                // See README.md for instructions on how to create these keys.
                key: fs.readFileSync(path.resolve(__dirname, 'localhost+2-key.pem')),
                cert: fs.readFileSync(path.resolve(__dirname, 'localhost+2.pem'))
            },
            server: 'https', // Use HTTPS
            hot: false, // Disable Hot Module Replacement (HMR)
            port: 8443, // Dev server port
            headers: {
                https: true,
                'Access-Control-Allow-Origin': '*',
                'Cross-Origin-Opener-Policy': 'same-origin',
                'Cross-Origin-Embedder-Policy': 'require-corp',
                'Content-Security-Policy': "worker-src 'self' blob:"
            },
            setupMiddlewares: (middlewares, devServer) => {
                devServer.app.use((req, res, next) => {
                    // res.setHeader(
                    //     'Content-Security-Policy',
                    //     "default-src 'self' blob:; worker-src 'self' blob:"
                    // );
                    next();
                });

                return middlewares;
            }
        },
        // print statistics
        stats: {
            children: true,
            errorDetails: true,
            // Display bailout reasons
            optimizationBailout: true
        }
    };
};
