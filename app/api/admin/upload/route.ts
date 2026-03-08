import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

/* ================================================================
   /api/admin/upload
   ================================================================
   POST — Upload one or more images (multipart/form-data)
   Returns an array of public URL paths for the uploaded files.
   Files are stored in /public/uploads/products/.
   Admin-only endpoint.
   ================================================================ */

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
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

    /* Ensure upload directory exists */
    await mkdir(UPLOAD_DIR, { recursive: true });

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
            error: `Le fichier "${file.name}" dépasse la taille maximale de 5 MB.`,
          },
          { status: 400 },
        );
      }

      /* Generate unique filename */
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
      const filePath = path.join(UPLOAD_DIR, uniqueName);

      /* Write to disk */
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      /* Public URL path */
      urls.push(`/uploads/products/${uniqueName}`);
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
