---
title: File Uploads with Multer
tags: uploads, multer, files, multipart
---

## File Uploads with Multer

Handle file uploads using NestJS built-in Multer integration.

### Single File Upload

```typescript
// modules/users/users.controller.ts
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('users')
export class UsersController {
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
        cb(new BadRequestException('Only JPEG, PNG, and WebP images are allowed'), false);
      }
      cb(null, true);
    },
  }))
  uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.usersService.updateAvatar(id, file);
  }
}
```

### Multiple File Upload

```typescript
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('products')
export class ProductsController {
  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10, { // max 10 files
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('At least one file is required');
    return this.productsService.addImages(id, files);
  }
}
```

### File Validation Pipe

```typescript
// common/pipes/file-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(
    private readonly options: {
      maxSize?: number;
      allowedMimes?: string[];
      required?: boolean;
    },
  ) {}

  transform(file: Express.Multer.File) {
    if (!file) {
      if (this.options.required) {
        throw new BadRequestException('File is required');
      }
      return file;
    }

    if (this.options.maxSize && file.size > this.options.maxSize) {
      throw new BadRequestException(
        `File size ${file.size} exceeds maximum ${this.options.maxSize}`,
      );
    }

    if (this.options.allowedMimes && !this.options.allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed: ${this.options.allowedMimes.join(', ')}`,
      );
    }

    return file;
  }
}

// Usage
@UploadedFile(new FileValidationPipe({
  maxSize: 5 * 1024 * 1024,
  allowedMimes: ['image/jpeg', 'image/png'],
  required: true,
}))
file: Express.Multer.File
```

### S3 Upload Service

```typescript
@Injectable()
export class StorageService {
  constructor(
    @Inject('S3_CLIENT') private readonly s3: S3Client,
    private readonly config: ConfigService,
  ) {}

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    const key = `${folder}/${randomUUID()}-${file.originalname}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.config.get('s3.bucket'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    return `https://${this.config.get('s3.bucket')}.s3.amazonaws.com/${key}`;
  }
}
```

### Rules

- Always set `fileSize` limits — prevent memory exhaustion from large uploads
- Validate file MIME types in `fileFilter` — don't trust file extensions
- Use `ParseFilePipe` or custom validation pipes for reusable file validation
- Store files in S3/cloud storage — don't save to local disk in production
- Generate unique filenames (UUID) to prevent collisions and path traversal
- Return the file URL in the response, not the file itself
