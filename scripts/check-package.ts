import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

interface PackageManifest {
	name: string;
	version: string;
	repository?: { url?: string };
}

const packageDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(
	fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'),
) as PackageManifest;

const failures: string[] = [];
const requiredFiles = [
	'dist/build.js',
	'dist/build.d.ts',
	'dist/runtime.js',
	'dist/runtime.d.ts',
	'README.md',
];

interface BuildModule {
	createRemoteConfig(
		options: {
			appDirectory: string;
			name: string;
			port: number;
			exposes: Record<string, string>;
			standalone: { entry: string };
		},
		environment: Record<string, unknown>,
		arguments_: { mode: 'development' },
	): { output?: { publicPath?: unknown } };
}

if (!/^@[^/]+\/[^/]+$/.test(manifest.name)) failures.push('Package name must use an npm scope.');
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) failures.push('Package version must be valid semver.');
if (!manifest.repository?.url) failures.push('Package repository metadata is required for npm provenance.');

for (const relativePath of requiredFiles) {
	if (!fs.existsSync(path.join(packageDirectory, relativePath))) failures.push(`Missing package output: ${relativePath}`);
}

const buildModuleUrl = pathToFileURL(path.join(packageDirectory, 'dist/build.js')).href;
const { createRemoteConfig } = await import(buildModuleUrl) as BuildModule;
const standaloneConfig = createRemoteConfig({
	appDirectory: packageDirectory,
	name: 'validation',
	port: 3999,
	exposes: { './Validation': './src/validation' },
	standalone: { entry: './src/dev.ts' },
}, {}, { mode: 'development' });

if (standaloneConfig.output?.publicPath !== 'auto') {
	failures.push('Standalone remotes must preserve publicPath "auto" for federated chunk loading.');
}

if (failures.length > 0) {
	throw new Error(`Package validation failed:\n- ${failures.join('\n- ')}`);
}

console.log(`${manifest.name}@${manifest.version} package outputs are valid.`);
