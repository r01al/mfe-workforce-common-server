import { createRequire } from 'node:module';
import path from 'node:path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import webpack, { type Configuration } from 'webpack';
import type {} from 'webpack-dev-server';

const require = createRequire(import.meta.url);
const { ModuleFederationPlugin } = webpack.container;

export interface RemoteBuildOptions {
	appDirectory: string;
	name: string;
	port: number;
	exposes: Record<string, string>;
}

export interface HostRemoteOptions {
	port: number;
	productionUrl?: string;
}

export interface HostBuildOptions {
	appDirectory: string;
	remotes: Record<string, HostRemoteOptions>;
}

export interface BuildArguments {
	mode?: Configuration['mode'];
}

const shared = {
	react: { singleton: true, requiredVersion: false },
	'react-dom': { singleton: true, requiredVersion: false },
	'react-router-dom': { singleton: true, requiredVersion: false },
} as const;

function baseConfig(appDirectory: string, entry: string, port: number, mode: Configuration['mode']): Configuration {
	const production = mode === 'production';
	return {
		context: appDirectory,
		mode,
		devtool: production ? 'source-map' : 'eval-cheap-module-source-map',
		entry: path.resolve(appDirectory, entry),
		output: {
			path: path.resolve(appDirectory, 'dist'),
			filename: production ? '[name].[contenthash:8].js' : '[name].js',
			chunkFilename: production ? '[name].[contenthash:8].js' : '[name].js',
			publicPath: 'auto',
			clean: true,
		},
		resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: {
						loader: require.resolve('ts-loader'),
						options: { transpileOnly: true, configFile: path.resolve(appDirectory, 'tsconfig.json') },
					},
				},
				{
					test: /\.css$/i,
					use: [
						production ? MiniCssExtractPlugin.loader : require.resolve('style-loader'),
						{ loader: require.resolve('css-loader'), options: { sourceMap: false } },
					],
				},
			],
		},
		plugins: production ? [new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' })] : [],
		devServer: {
			port,
			hot: true,
			historyApiFallback: true,
			headers: { 'Access-Control-Allow-Origin': '*' },
			client: { overlay: true },
		},
		optimization: { runtimeChunk: false },
		performance: { maxAssetSize: 750_000, maxEntrypointSize: 1_000_000 },
	};
}

function defaultRemoteUrl(scope: string, port: number, mode: Configuration['mode'], configuredFallback?: string): string {
	const environmentName = `MFE_${scope.toUpperCase()}_URL`;
	return process.env[environmentName]
		?? configuredFallback
		?? (mode === 'development' ? `http://localhost:${port}/remoteEntry.js` : `/remotes/${scope}/remoteEntry.js`);
}

export function createRemoteConfig(
	options: RemoteBuildOptions,
	_environment: Record<string, unknown> = {},
	argv: BuildArguments = {},
): Configuration {
	const { appDirectory, name, port, exposes } = options;
	const mode = argv.mode ?? 'development';
	const config = baseConfig(appDirectory, 'src/index.ts', port, mode);
	config.plugins?.push(new ModuleFederationPlugin({ name: `${name}Mfe`, filename: 'remoteEntry.js', exposes, shared }));
	return config;
}

export function createHostConfig(
	options: HostBuildOptions,
	_environment: Record<string, unknown> = {},
	argv: BuildArguments = {},
): Configuration {
	const { appDirectory, remotes } = options;
	const mode = argv.mode ?? 'development';
	const config = baseConfig(appDirectory, 'src/index.tsx', 3000, mode);
	if (config.output) config.output.publicPath = '/';
	const defaultRemoteUrls = Object.fromEntries(
		Object.entries(remotes).map(([scope, value]) => [
			scope,
			defaultRemoteUrl(scope, value.port, mode, value.productionUrl),
		]),
	);
	config.plugins?.push(
		new webpack.DefinePlugin({
			__MFE_DEFAULT_REMOTES__: JSON.stringify(defaultRemoteUrls),
		}),
		new ModuleFederationPlugin({ name: 'shell', shared }),
		new CopyWebpackPlugin({
			patterns: [{ from: path.resolve(appDirectory, 'public'), to: '.', noErrorOnMissing: true }],
		}),
		new HtmlWebpackPlugin({
			title: 'Workforce Hub',
			meta: {
				viewport: 'width=device-width, initial-scale=1',
				description: 'A clear, friendly workspace for managing your team.',
				'theme-color': '#ffffff',
			},
			templateContent: ({ htmlWebpackPlugin }) => `<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<title>${htmlWebpackPlugin.options.title}</title>
		<script>window.__MFE_REMOTES__ = window.__MFE_REMOTES__ || {};</script>
	</head>
	<body><div id="root"></div></body>
</html>`,
		}),
	);
	return config;
}
