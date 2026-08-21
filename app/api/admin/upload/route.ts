import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import crypto from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

/* ================================================================
   /api/admin/upload
   ================================================================
   POST — Upload one or more images (multipart/form-data)
   Returns an array of public URL paths for the uploaded files.

   Files are stored on the local filesystem, under UPLOAD_DIR
   (default: <project>/public/uploads). They are served back at
   /uploads/products/<file> — either by Next's static handler or,
   in production, directly by Nginx.
   Admin-only endpoint.
   ================================================================ */

const UPLOAD_SUBDIR = "products"; // folder inside the uploads directory
const PUBLIC_PREFIX = "/uploads"; // URL prefix the files are served under

/* Absolute origin for returned URLs.
   Next's production server only serves public/ files that existed at build
   time, so a freshly uploaded image 404s on the internal fetch that
   /_next/image performs — the image then fails with a 400. Returning an
   absolute URL makes next/image treat it as a remote image and fetch it
   over HTTP, where Nginx serves it from disk. Requires a matching entry in
   `images.remotePatterns` (see next.config.ts). */
const PUBLIC_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(
  /\/+$/,
  "",
);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES = 10;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

/* Extension per mime type — never trust the extension sent by the client */
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/* Absolute directory images are written to */
const UPLOAD_ROOT =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "public", "uploads");

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

    /* Ensure the destination exists (first upload after a fresh deploy) */
    const destDir = path.join(UPLOAD_ROOT, UPLOAD_SUBDIR);
    await mkdir(destDir, { recursive: true });

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
            error: `Le fichier "${file.name}" dépasse la taille maximale de 10 MB.`,
          },
          { status: 400 },
        );
      }

      /* Generate unique filename — derived from the mime type, not user input */
      const ext = EXT_BY_TYPE[file.type] ?? "jpg";
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;

      /* Write to disk */
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(destDir, uniqueName), buffer);

      /* Public URL — absolute when the app URL is known, relative otherwise */
      urls.push(
        `${PUBLIC_ORIGIN}${PUBLIC_PREFIX}/${UPLOAD_SUBDIR}/${uniqueName}`,
      );
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
