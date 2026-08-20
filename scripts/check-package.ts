import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

if (!/^@[^/]+\/[^/]+$/.test(manifest.name)) failures.push('Package name must use an npm scope.');
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.version)) failures.push('Package version must be valid semver.');
if (!manifest.repository?.url) failures.push('Package repository metadata is required for npm provenance.');

for (const relativePath of requiredFiles) {
	if (!fs.existsSync(path.join(packageDirectory, relativePath))) failures.push(`Missing package output: ${relativePath}`);
}

if (failures.length > 0) {
	throw new Error(`Package validation failed:\n- ${failures.join('\n- ')}`);
}

console.log(`${manifest.name}@${manifest.version} package outputs are valid.`);
