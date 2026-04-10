import { unlink } from "node:fs/promises";

import multer from "multer";
import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth";
import { ensureLocalStorageDir, ensureStoredFileExists, getLocalStorageDir } from "../services/file-storage";
import { createSpectralFileRecord, getSpectralFileDetail, listSampleFiles, serializeSpectralFile } from "../services/files";

const router = Router();

const uploadsDir = getLocalStorageDir();
ensureLocalStorageDir();

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadsDir);
  },
  filename: (_req, file, callback) => {
    const safeOriginalName = file.originalname.replace(/\s+/g, "-");
    callback(null, `${Date.now()}-${safeOriginalName}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

const fileMetaSchema = z.object({
  sampleCode: z.string().trim().min(1),
  wavelengthStart: z.coerce.number().optional(),
  wavelengthEnd: z.coerce.number().optional(),
  bandCount: z.coerce.number().int().positive().optional()
});

router.post("/files/upload", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({
        message: "File is required."
      });
      return;
    }

    const body = fileMetaSchema.parse(req.body);
    const spectralFile = await createSpectralFileRecord({
      sampleCode: body.sampleCode,
      file: req.file,
      wavelengthStart: body.wavelengthStart,
      wavelengthEnd: body.wavelengthEnd,
      bandCount: body.bandCount
    });

    res.status(201).json({
      file: {
        ...serializeSpectralFile(spectralFile)
      }
    });
  } catch (error) {
    if (req.file) {
      await unlink(req.file.path).catch(() => undefined);
    }
    next(error);
  }
});

router.get("/files/:fileId", async (req, res, next) => {
  try {
    const spectralFile = await getSpectralFileDetail(z.string().trim().min(1).parse(req.params.fileId));
    res.json({
      file: {
        ...serializeSpectralFile(spectralFile),
        sample: {
          sampleCode: spectralFile.sample.sampleCode,
          originName: spectralFile.sample.origin.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/files", async (req, res, next) => {
  try {
    const sampleCode = z.string().trim().min(1).parse(req.query.sampleCode);
    const files = await listSampleFiles(sampleCode);
    res.json({
      items: files.map((file) => serializeSpectralFile(file))
    });
  } catch (error) {
    next(error);
  }
});

router.get("/files/:fileId/download", requireAuth, async (req, res, next) => {
  try {
    const fileId = z.string().trim().min(1).parse(req.params.fileId);
    const spectralFile = await getSpectralFileDetail(fileId);
    const absolutePath = ensureStoredFileExists(spectralFile.storagePath);

    res.download(absolutePath, spectralFile.originalName);
  } catch (error) {
    next(error);
  }
});

export { router as filesRouter };
