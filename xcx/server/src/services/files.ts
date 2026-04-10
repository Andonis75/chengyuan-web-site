import type { Express } from "express";

import { prisma } from "../lib/prisma";
import { buildFileDownloadUrl, normalizeStoragePath } from "./file-storage";

function createHttpError(message: string, status: number) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

export async function createSpectralFileRecord(input: {
  sampleCode: string;
  file: Express.Multer.File;
  wavelengthStart?: number;
  wavelengthEnd?: number;
  bandCount?: number;
}) {
  const sample = await prisma.sample.findUnique({
    where: {
      sampleCode: input.sampleCode
    }
  });

  if (!sample) {
    throw createHttpError("Sample not found.", 404);
  }

  const spectralFile = await prisma.spectralFile.create({
    data: {
      sampleId: sample.id,
      fileName: input.file.filename,
      originalName: input.file.originalname,
      mimeType: input.file.mimetype,
      fileSize: input.file.size,
      storagePath: normalizeStoragePath(input.file.path),
      wavelengthStart: input.wavelengthStart,
      wavelengthEnd: input.wavelengthEnd,
      bandCount: input.bandCount
    }
  });

  return spectralFile;
}

export function serializeSpectralFile(file: {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  wavelengthStart: number | null;
  wavelengthEnd: number | null;
  bandCount: number | null;
  uploadedAt: Date;
}) {
  return {
    id: file.id,
    fileName: file.fileName,
    originalName: file.originalName,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    storagePath: file.storagePath,
    downloadUrl: buildFileDownloadUrl(file.id),
    wavelengthStart: file.wavelengthStart,
    wavelengthEnd: file.wavelengthEnd,
    bandCount: file.bandCount,
    uploadedAt: file.uploadedAt.toISOString()
  };
}

export async function getSpectralFileDetail(fileId: string) {
  const spectralFile = await prisma.spectralFile.findUnique({
    where: {
      id: fileId
    },
    include: {
      sample: {
        include: {
          origin: true
        }
      }
    }
  });

  if (!spectralFile) {
    throw createHttpError("File not found.", 404);
  }

  return spectralFile;
}

export async function listSampleFiles(sampleCode: string) {
  const sample = await prisma.sample.findUnique({
    where: {
      sampleCode
    },
    include: {
      spectralFiles: {
        orderBy: {
          uploadedAt: "desc"
        }
      }
    }
  });

  if (!sample) {
    throw createHttpError("Sample not found.", 404);
  }

  return sample.spectralFiles;
}
