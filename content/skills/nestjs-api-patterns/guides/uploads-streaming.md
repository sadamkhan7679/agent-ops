---
title: Streaming Uploads and Downloads
tags: uploads, streaming, download, large-files
---

## Streaming Uploads and Downloads

Handle large files efficiently with streams instead of buffering entire files in memory.

### Streaming Upload to S3

```typescript
// modules/storage/storage.service.ts
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  async uploadStream(
    stream: Readable,
    key: string,
    contentType: string,
  ): Promise<string> {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.config.get('s3.bucket'),
        Key: key,
        Body: stream,
        ContentType: contentType,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024, // 5MB parts
    });

    upload.on('httpUploadProgress', (progress) => {
      this.logger.debug(`Upload progress: ${progress.loaded}/${progress.total}`);
    });

    await upload.done();
    return key;
  }
}
```

### Streaming File Download

```typescript
// modules/files/files.controller.ts
import { StreamableFile, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('files')
export class FilesController {
  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.filesService.getMetadata(id);
    if (!file) throw new NotFoundException();

    const stream = await this.storageService.getStream(file.storageKey);

    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'Content-Length': file.size,
    });

    return new StreamableFile(stream);
  }
}
```

### CSV Export Streaming

```typescript
@Controller('reports')
export class ReportsController {
  @Get('users/export')
  async exportUsers(@Res({ passthrough: true }) res: Response) {
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="users.csv"',
    });

    const stream = new PassThrough();

    // Write header
    stream.write('id,name,email,created_at\n');

    // Stream data in chunks to avoid loading all into memory
    const batchSize = 1000;
    let offset = 0;
    let hasMore = true;

    (async () => {
      while (hasMore) {
        const users = await this.usersService.findBatch(offset, batchSize);
        for (const user of users) {
          stream.write(`${user.id},${user.name},${user.email},${user.createdAt.toISOString()}\n`);
        }
        offset += batchSize;
        hasMore = users.length === batchSize;
      }
      stream.end();
    })();

    return new StreamableFile(stream);
  }
}
```

### Rules

- Use `StreamableFile` for all file download responses — NestJS handles proper streaming
- Use `@Res({ passthrough: true })` to set headers while still using NestJS response handling
- Stream large uploads directly to storage (S3) — don't buffer in memory
- Use `@aws-sdk/lib-storage` `Upload` class for multipart S3 uploads with progress tracking
- Stream exports (CSV, JSON) in batches — don't load entire datasets into memory
- Set proper `Content-Type`, `Content-Disposition`, and `Content-Length` headers on downloads
