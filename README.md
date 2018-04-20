# @fabtom/media-engine

A backend library to upload and store files in SQLite, then to serve them.

## How to create a `MediaStorage`

The `MediaStorage` stores the files in a relational database. It resizes images in the configured dimensions.

```ts
import { DatabaseConnectionWithSqlBricks } from "mycn-with-sql-bricks"
import { ImageVariantsConfiguration } from "@fabtom/media-engine"

export async function createStorage(cn: DatabaseConnectionWithSqlBricks, execDdl: boolean) {
  return await createMediaStorage({
    initDb: {
      dbEngine: "sqlite",
      execDdl
    },
    cn,
    imagesConf: IMAGES_CONF
  })
}

const IMAGES_CONF: ImageVariantsConfiguration = {
  "imageType1": [
    {
      code: "34x34",
      width: 68,
      height: 68,
      imType: "image/png"
    },
    {
      code: "200x200",
      width: 200,
      height: 200,
      imType: "image/jpeg"
    }
  ],
  "imageType2": [
    {
      code: "200x100",
      width: 200,
      height: 100,
      embed: true,
      imType: "image/jpeg"
    }
  ]
}
```

Notice: The `MediaStorage` can be used without an `UploadEngine`.

## How to create an `UploadEngine`

The `UploadEngine` declares and implements the routes to `express`.

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
        ownerId: 123
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