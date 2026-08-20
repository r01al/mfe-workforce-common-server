# @r01al/mfe-workforce-common-server

The Node and build-side platform library for the Workforce micro-frontends.

`@r01al/mfe-workforce-common-server/build` exports reusable Webpack 5 Module Federation configuration factories:

```ts
import { createHostConfig, createRemoteConfig } from '@r01al/mfe-workforce-common-server/build';
```

`@r01al/mfe-workforce-common-server/runtime` exports production Express hosting with compression, CORS, cache policy, health endpoints, and shell history fallback:

```ts
import { serveRemote, serveShell } from '@r01al/mfe-workforce-common-server/runtime';
```

## Development

```bash
npm ci
npm run typecheck
npm run build
npm run package
```

`npm run package` creates a publishable tarball under `artifacts/` after typechecking, building, and validating the public outputs.

## Publishing

For the first `1.0.0` publication, commit these files, create the tag with `git tag v1.0.0`, and push it with `git push origin main --tags`.

For later releases:

1. Update the version with `npm version patch`, `npm version minor`, or `npm version major`.
2. Push the commit and tag with `git push --follow-tags`.
3. Create and publish a GitHub Release using the `v<version>` tag.
4. The `publish.yml` workflow validates the tag and publishes the package to npm with provenance.

For the first publication, add an npm granular access token as the `NPM_TOKEN` GitHub Actions repository secret. The token must be allowed to publish public packages and bypass publishing 2FA. After the package exists on npm, the workflow can be registered as an npm Trusted Publisher and the long-lived token can be removed.

Breaking runtime or build-contract changes require a new major version.
