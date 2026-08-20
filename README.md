# @workforce/server

The Node and build-side Workforce Hub platform library.

`@workforce/server/build` exports reusable Webpack 5 Module Federation configuration factories:

```ts
import { createHostConfig, createRemoteConfig } from '@workforce/server/build';
```

`@workforce/server/runtime` exports production Express hosting with compression, CORS, cache policy, health endpoints, and shell history fallback:

```ts
import { serveRemote, serveShell } from '@workforce/server/runtime';
```
