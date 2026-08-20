import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const artifactsDirectory = path.join(packageDirectory, 'artifacts');

fs.rmSync(artifactsDirectory, { recursive: true, force: true });
fs.mkdirSync(artifactsDirectory, { recursive: true });

const child = spawn(
	'npm',
	['pack', '--ignore-scripts', '--pack-destination', artifactsDirectory],
	{ cwd: packageDirectory, stdio: 'inherit', shell: false },
);

const exitCode = await new Promise<number | null>((resolve, reject) => {
	child.on('error', reject);
	child.on('exit', resolve);
});

if (exitCode !== 0) throw new Error(`npm pack exited with ${exitCode ?? 'no exit code'}.`);
console.log(`Package artifact created in ${artifactsDirectory}.`);
