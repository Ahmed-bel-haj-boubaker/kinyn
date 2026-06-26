import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import { put } from "@vercel/blob";
import crypto from "crypto";

/* ================================================================
   /api/admin/upload
   ================================================================
   POST — Upload one or more images (multipart/form-data)
   Returns an array of public URL paths for the uploaded files.
   Files are stored on Vercel Blob (product images).
   Admin-only endpoint.

   Requires the BLOB_READ_WRITE_TOKEN env var. On Vercel this is
   injected automatically once a Blob store is connected to the
   project; locally add it to .env (see `vercel env pull`).
   ================================================================ */

const BLOB_PREFIX = "products"; // folder/prefix inside the blob store
const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5 MB — Vercel serverless body limit
const MAX_FILES = 10;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

function requireAdmin(req: NextRequest) {
  const payload = getAuthFromRequest(req);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }
  if (payload.role !== "admin" && payload.role !== "super_admin") {
    return {
      error: NextResponse.json(
        { error: "Accès refusé. Droits insuffisants." },
        { status: 403 },
      ),
    };
  }
  return { payload };
}

export async function POST(req: NextRequest) {
  /* Skip CSRF for file upload (multipart), keep rate-limit */
  const guardError = apiGuard(req, {
    csrf: false,
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  try {
    const formData = await req.formData();
    const files = formData.getAll("images") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier envoyé." },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} fichiers autorisés.` },
        { status: 400 },
      );
    }

    const urls: string[] = [];

    for (const file of files) {
      /* Validate type */
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `Type de fichier non autorisé : ${file.type}. Formats acceptés : JPEG, PNG, WebP, AVIF, GIF.`,
          },
          { status: 400 },
        );
      }

      /* Validate size */
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `Le fichier "${file.name}" dépasse la taille maximale de 4.5 MB.`,
          },
          { status: 400 },
        );
      }

      /* Generate unique filename */
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const uniqueName = `${BLOB_PREFIX}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

      /* Upload to Vercel Blob */
      const blob = await put(uniqueName, file, {
        access: "public",
        contentType: file.type,
      });

      /* Public CDN URL */
      urls.push(blob.url);
    }

    return NextResponse.json(
      { message: "Images uploadées avec succès.", urls },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error("[upload]", err);
    return NextResponse.json(
      { error: "Erreur lors de l'upload." },
      { status: 500 },
    );
  }
}
