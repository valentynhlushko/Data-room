import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { isUniqueConstraintError } from '../../prisma/prisma.errors';
import { FOLDER_ERRORS } from '../folder/constants/folder.errors';
import {
  FILE_ERRORS,
  FILE_LIST_DEFAULT_LIMIT,
  FILE_MAX_BYTES,
  PDF_MIME_TYPE,
} from './constants/file.errors';
import { FileRepository } from './repositories/file.repository';
import { StorageService } from '../storage/storage.service';
import type { FileRecord } from './types/file.types';
import type { Folder } from '../folder/types/folder.types';
import { AccessService, type AccessViewer } from '../share/access.service';
import { ShareService } from '../share/share.service';

type UploadedPdf = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class FileService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storageService: StorageService,
    private readonly accessService: AccessService,
    private readonly shareService: ShareService,
  ) {}

  async getById(id: string, viewer: AccessViewer) {
    return this.toSummary(await this.getReadableFile(id, viewer));
  }

  async getPreviewUrl(id: string, viewer: AccessViewer) {
    const file = await this.getReadableFile(id, viewer);
    const url = await this.storageService.createSignedUrl(file.storageKey);

    return { url, expiresIn: 3600 };
  }

  async listByFolder(
    folderId: string,
    query: { cursor?: string; limit?: number } = {},
  ) {
    return this.fileRepository.findPageByFolderId(folderId, {
      cursor: query.cursor,
      limit: query.limit ?? FILE_LIST_DEFAULT_LIMIT,
    });
  }

  async upload(userId: string, folderId: string, file: UploadedPdf) {
    const folder = await this.getOwnedFolder(folderId, userId);
    this.assertPdf(file);

    const name = await this.allocateUniqueName(
      folder.id,
      this.sanitizeName(file.originalname),
    );
    const id = randomUUID();
    const storageKey = this.storageService.buildKey(folder.dataRoomId, id);

    await this.storageService.upload(storageKey, file.buffer, PDF_MIME_TYPE);

    try {
      return await this.fileRepository.create({
        id,
        name,
        mimeType: PDF_MIME_TYPE,
        sizeBytes: file.size,
        storageKey,
        folderId: folder.id,
        dataRoomId: folder.dataRoomId,
        uploadedById: userId,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const retryName = await this.allocateUniqueName(folder.id, name);
        try {
          return await this.fileRepository.create({
            id,
            name: retryName,
            mimeType: PDF_MIME_TYPE,
            sizeBytes: file.size,
            storageKey,
            folderId: folder.id,
            dataRoomId: folder.dataRoomId,
            uploadedById: userId,
          });
        } catch (retryError) {
          await this.storageService.remove([storageKey]).catch(() => undefined);
          this.throwIfNameConflict(retryError);
          throw retryError;
        }
      }

      await this.storageService.remove([storageKey]).catch(() => undefined);
      throw error;
    }
  }

  async update(
    id: string,
    userId: string,
    input: { name?: string; folderId?: string },
  ) {
    const file = await this.getOwnedFile(id, userId);
    const nextName = input.name ? this.sanitizeName(input.name) : file.name;
    let nextFolderId = file.folderId;

    if (input.folderId && input.folderId !== file.folderId) {
      const destination = await this.getOwnedFolder(input.folderId, userId);

      if (destination.dataRoomId !== file.dataRoomId) {
        throw new ForbiddenException(FILE_ERRORS.FORBIDDEN);
      }

      nextFolderId = destination.id;
    }

    if (nextName !== file.name || nextFolderId !== file.folderId) {
      await this.assertUniqueName(nextFolderId, nextName, file.id);
    }

    try {
      return await this.fileRepository.update(file.id, {
        name: nextName,
        folderId: nextFolderId,
      });
    } catch (error) {
      this.throwIfNameConflict(error);
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    const file = await this.getOwnedFile(id, userId);
    await this.shareService.deleteSharesForFile(file.id);
    await this.fileRepository.deleteById(file.id);
    await this.storageService.remove([file.storageKey]).catch(() => undefined);

    return { id: file.id };
  }

  async deleteStorageForFolder(folderId: string) {
    const keys = await this.fileRepository.findStorageKeysInSubtree(folderId);

    if (keys.length > 0) {
      await this.storageService.remove(keys).catch(() => undefined);
    }
  }

  countInSubtree(folderId: string) {
    return this.fileRepository.countInSubtree(folderId);
  }

  private async getReadableFile(
    id: string,
    viewer: AccessViewer,
  ): Promise<FileRecord> {
    const file = await this.fileRepository.findById(id);

    if (!file) {
      throw new NotFoundException(FILE_ERRORS.NOT_FOUND);
    }

    await this.accessService.assertCanViewFile(viewer, file);
    return file;
  }

  private async getOwnedFile(id: string, userId: string): Promise<FileRecord> {
    const file = await this.fileRepository.findById(id);

    if (!file) {
      throw new NotFoundException(FILE_ERRORS.NOT_FOUND);
    }

    const folder = await this.fileRepository.findOwnedFolder(
      file.folderId,
      userId,
    );

    if (!folder) {
      throw new ForbiddenException(FILE_ERRORS.FORBIDDEN);
    }

    return file;
  }

  private async getOwnedFolder(folderId: string, userId: string): Promise<Folder> {
    const folder = await this.fileRepository.findOwnedFolder(folderId, userId);

    if (!folder) {
      throw new NotFoundException(FOLDER_ERRORS.NOT_FOUND);
    }

    return folder;
  }

  private assertPdf(file: UploadedPdf) {
    if (!file || !file.buffer) {
      throw new BadRequestException(FILE_ERRORS.FILE_REQUIRED);
    }

    if (file.size <= 0 || file.buffer.length === 0) {
      throw new BadRequestException(FILE_ERRORS.EMPTY);
    }

    if (file.size > FILE_MAX_BYTES) {
      throw new PayloadTooLargeException(FILE_ERRORS.TOO_LARGE);
    }

    const looksLikePdf = file.buffer.subarray(0, 4).toString('utf8') === '%PDF';

    if (!looksLikePdf) {
      throw new BadRequestException(FILE_ERRORS.PDF_REQUIRED);
    }
  }

  private sanitizeName(name: string) {
    const trimmed = name.trim().replace(/[/\\]/g, '-');

    if (!trimmed) {
      throw new BadRequestException(FILE_ERRORS.NAME_REQUIRED);
    }

    return trimmed.slice(0, 255);
  }

  private async allocateUniqueName(folderId: string, name: string) {
    const existing = await this.fileRepository.findNamesInFolder(folderId);
    const taken = new Set(existing.map((row) => row.name));

    if (!taken.has(name)) {
      return name;
    }

    const extensionMatch = name.match(/(\.[^.]+)$/);
    const extension = extensionMatch?.[1] ?? '';
    const base = extension ? name.slice(0, -extension.length) : name;
    let index = 1;

    while (taken.has(`${base} (${index})${extension}`)) {
      index += 1;
    }

    return `${base} (${index})${extension}`.slice(0, 255);
  }

  private async assertUniqueName(
    folderId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.fileRepository.findSiblingByName(
      folderId,
      name,
      excludeId,
    );

    if (existing) {
      throw new ConflictException(FILE_ERRORS.NAME_CONFLICT);
    }
  }

  private throwIfNameConflict(error: unknown): void {
    if (isUniqueConstraintError(error)) {
      throw new ConflictException(FILE_ERRORS.NAME_CONFLICT);
    }
  }

  private toSummary(file: FileRecord) {
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      folderId: file.folderId,
      dataRoomId: file.dataRoomId,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
}
