# @fabtom/media-engine

A backend library to upload and store files in SQLite, then to serve them.

## How to create a `MediaStorage`

The `MediaStorage` stores the files in a relational database. It resizes images in the configured dimensions.

Open a connection with [LADC](https://www.npmjs.com/package/ladc) using the [adapter for SQLite](https://www.npmjs.com/package/@ladc/sqlite3-adapter) and the [integration](https://www.npmjs.com/package/@ladc/sql-bricks-modifier) with the query builder SQL Bricks:

```sh
npm install @fabtom/media-engine ladc @ladc/sqlite3-adapter @ladc/sql-bricks-modifier
```

```ts
import ladc from "ladc"
import sqlite3Adapter from "@ladc/sqlite3-adapter"
import sqlBricksModifier from "@ladc/sql-bricks-modifier"

let cn = ladc({
  adapter: sqlite3Adapter({ fileName: "path/to/db.sqlite" }),
  modifier: sqlBricksModifier()
}
```

Then, create the storage:

```ts
export async function createStorage(cn: import("@ladc/sql-bricks-modifier").SBMainConnection, execDdl: boolean) {
  return await createMediaStorage({
    execInitScript: execDdl ? "sqlite" : undefined,
    cn,
    imagesConf: IMAGES_CONF
  })
}

const IMAGES_CONF: import("@fabtom/media-engine").ImageVariantsConfiguration = {
  "imageType1": [
    {
      code: "34x34",
      width: 68,
      height: 68,
      mediaType: "image/png"
    },
    {
      code: "200x200",
      width: 200,
      height: 200,
      mediaType: "image/jpeg"
    }
  ],
  "imageType2": [
    {
      code: "200x100",
      width: 200,
      height: 100,
      embed: true,
      mediaType: "image/jpeg"
    }
  ]
}
```

Notice: The `MediaStorage` can be used without an `UploadEngine`.

## How to create an `UploadEngine`

The `UploadEngine` declares and implements the routes to `express`.

Here is how to create an `UploadEngine`:

```ts
import { Request } from "express"
import { ExternalRef, MediaRef, Media, MulterFile, MediaStorage, createMediaStorage, isSupportedImage } from "@fabtom/media-engine"
import { createUploadEngine, UploadEngine, UploadEngineManager } from "@fabtom/media-engine/upload"

export async function createUpload(storage: MediaStorage) {
  return createUploadEngine({
    manager: createUploadEngineManager(storage),
    storage,
    baseUrl: `url/to/medias`
  })
}

function createUploadEngineManager(storage: MediaStorage): UploadEngineManager {
  return {
    canUpload(req: Request, externalRef: ExternalRef, overwrite: boolean, file: MulterFile) {
      // TODO: Implement
      return {
        canUpload: true,
        ownerId: "123"
      }
    },

    async makeJsonResponseForUpload(req: Request, mediaId: string, overwritten: boolean) {
      // TODO: Implement
      return { /* your JSON response */ }
    },

    canRead(req: Request, mediaRef: MediaRef) {
      // TODO: Implement
      return true
    },

    canDelete(req: Request, mediaRef: MediaRef) {
      // TODO: Implement
      return true
    },

    async makeJsonResponseForDelete(req: Request, deletedMedia: Media) {
      // TODO: Implement
      return { /* your JSON response */ }
    }
  }
}
```

Then, let it declare the routes:

```ts
const express = require("express")

let router = express.Router()
uploadEngine.declareRoutes(router)

let app = express()
app.use(router)
let server = http.createServer(app)
server.listen(8080)
```

Now, three routes are available:

* `url/to/medias/upload` (`POST`) Upload a file and create a media. A JSON object of type `UploadedFile` must be sent as a parameter with the file.
* `url/to/medias/delete` (`POST`) Delete a media. A JSON object of type `{ mediaId: string }` must be sent as a request body.
* `url/to/medias/:year/:variantId/:fileName?download=1` (`GET`) Serve a file. An optional URL parameter `download` can be set.

The `UploadedFile` type:

```ts
interface UploadedFile {
  ref {
    type: string
    id: string
  }
  overwrite?: boolean
}
```