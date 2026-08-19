import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_ERRORS } from './constants/storage.errors';

const DEFAULT_BUCKET = 'dataroom-files';
const MAX_FILE_BYTES = 50 * 1024 * 1024;

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly supabaseUrl: string;
  private readonly serviceRoleKey: string;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    const url = configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!url || !serviceRoleKey) {
      throw new Error(STORAGE_ERRORS.ENV_REQUIRED);
    }

    this.supabaseUrl = url.replace(/\/$/, '');
    this.serviceRoleKey = serviceRoleKey;
    this.bucket =
      configService.get<string>('SUPABASE_STORAGE_BUCKET') ?? DEFAULT_BUCKET;
  }

  async onModuleInit() {
    try {
      await this.ensureBucket();
    } catch (error) {
      this.logger.error(
        error instanceof Error ? error.message : STORAGE_ERRORS.BUCKET_FAILED,
      );
    }
  }

  buildKey(dataRoomId: string, fileId: string) {
    return `${dataRoomId}/${fileId}.pdf`;
  }

  async upload(key: string, body: Buffer, contentType: string) {
    const response = await fetch(this.objectUrl(key), {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      body: new Uint8Array(body),
    });

    if (!response.ok) {
      this.logger.error(
        `Storage upload failed (${response.status}): ${await response.text()}`,
      );
      throw new InternalServerErrorException(STORAGE_ERRORS.UPLOAD_FAILED);
    }
  }

  async createSignedUrl(key: string, expiresInSeconds = 3600) {
    const response = await fetch(this.signUrl(key), {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (!response.ok) {
      this.logger.error(
        `Storage sign failed (${response.status}): ${await response.text()}`,
      );
      throw new InternalServerErrorException(STORAGE_ERRORS.SIGN_FAILED);
    }

    const payload = (await response.json()) as {
      signedURL?: string;
      signedUrl?: string;
    };
    const signedPath = payload.signedURL ?? payload.signedUrl;

    if (!signedPath) {
      throw new InternalServerErrorException(STORAGE_ERRORS.SIGN_FAILED);
    }

    if (signedPath.startsWith('http')) {
      return signedPath;
    }

    return `${this.supabaseUrl}/storage/v1${signedPath.startsWith('/') ? signedPath : `/${signedPath}`}`;
  }

  async remove(keys: string[]) {
    if (keys.length === 0) {
      return;
    }

    const response = await fetch(
      `${this.supabaseUrl}/storage/v1/object/${this.bucket}`,
      {
        method: 'DELETE',
        headers: {
          ...this.authHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefixes: keys }),
      },
    );

    if (!response.ok) {
      this.logger.error(
        `Storage delete failed (${response.status}): ${await response.text()}`,
      );
      throw new InternalServerErrorException(STORAGE_ERRORS.DELETE_FAILED);
    }
  }

  private async ensureBucket() {
    const existing = await fetch(
      `${this.supabaseUrl}/storage/v1/bucket/${this.bucket}`,
      { headers: this.authHeaders() },
    );

    if (existing.ok) {
      return;
    }

    const created = await fetch(`${this.supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        ...this.authHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: this.bucket,
        name: this.bucket,
        public: false,
        file_size_limit: MAX_FILE_BYTES,
        allowed_mime_types: ['application/pdf'],
      }),
    });

    if (!created.ok && created.status !== 409) {
      this.logger.error(
        `Storage bucket setup failed (${created.status}): ${await created.text()}`,
      );
      throw new Error(STORAGE_ERRORS.BUCKET_FAILED);
    }
  }

  private objectUrl(key: string) {
    return `${this.supabaseUrl}/storage/v1/object/${this.bucket}/${this.encodeKey(key)}`;
  }

  private signUrl(key: string) {
    return `${this.supabaseUrl}/storage/v1/object/sign/${this.bucket}/${this.encodeKey(key)}`;
  }

  private encodeKey(key: string) {
    return key.split('/').map(encodeURIComponent).join('/');
  }

  private authHeaders() {
    return {
      Authorization: `Bearer ${this.serviceRoleKey}`,
      apikey: this.serviceRoleKey,
    };
  }
}
