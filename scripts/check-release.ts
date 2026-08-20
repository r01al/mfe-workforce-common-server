import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface PackageManifest {
	name: string;
	version: string;
}

const packageDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(
	fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'),
) as PackageManifest;
const releaseTag = process.env.RELEASE_TAG ?? process.argv[2];
const expectedTag = `v${manifest.version}`;

if (!releaseTag) throw new Error(`Pass a release tag. Expected ${expectedTag}.`);
if (releaseTag !== expectedTag) {
	throw new Error(`Release tag ${releaseTag} does not match ${manifest.name}@${manifest.version}; expected ${expectedTag}.`);
}

console.log(`Release tag ${releaseTag} matches ${manifest.name}@${manifest.version}.`);
