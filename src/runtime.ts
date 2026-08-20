import compression from 'compression';
import express, { type Express } from 'express';
import type { Server } from 'node:http';
import path from 'node:path';

export interface RemoteServerOptions {
	service: string;
	directory: string;
	defaultPort: number;
	corsOrigin?: string;
}

export interface ShellServerOptions {
	directory: string;
	defaultPort?: number;
	service?: string;
}

function createBaseApplication(): Express {
	const app = express();
	app.disable('x-powered-by');
	app.use(compression());
	return app;
}

export function serveRemote({
	service,
	directory,
	defaultPort,
	corsOrigin = process.env.CORS_ORIGIN ?? '*',
}: RemoteServerOptions): Server {
	const app = createBaseApplication();
	const dist = path.join(directory, 'dist');
	const port = Number(process.env.PORT ?? defaultPort);

	app.use((_request, response, next) => {
		response.setHeader('Access-Control-Allow-Origin', corsOrigin);
		next();
	});
	app.use(
		express.static(dist, {
			immutable: true,
			maxAge: '1y',
			setHeaders(response, file) {
				if (file.endsWith('remoteEntry.js')) {
					response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
				}
			},
		}),
	);
	app.get('/health', (_request, response) => response.json({ service, status: 'ok' }));
	return app.listen(port, () => console.log(`${service} remote listening on port ${port}`));
}

export function serveShell({ directory, defaultPort = 3000, service = 'shell' }: ShellServerOptions): Server {
	const app = createBaseApplication();
	const dist = path.join(directory, 'dist');
	const port = Number(process.env.PORT ?? defaultPort);

	app.use(express.static(dist, { maxAge: '1h' }));
	app.get('/health', (_request, response) => response.json({ service, status: 'ok' }));
	app.get('/{*path}', (_request, response) => response.sendFile(path.join(dist, 'index.html')));
	return app.listen(port, () => console.log(`${service} listening on port ${port}`));
}
