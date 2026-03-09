import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import type { IAddress } from "@/models/User";
import mongoose from "mongoose";

/* ================================================================
   /api/auth/me/addresses/[id]
   ================================================================
   PUT    — Update a specific address (owner only)
   DELETE — Delete a specific address (owner only)
   ================================================================ */

interface Params {
  params: Promise<{ id: string }>;
}

/* ──────────── PUT /api/auth/me/addresses/[id] ──────────── */

export async function PUT(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, { rateLimit: { limit: 20, windowSec: 60 } });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }

  const parsed = await parseBody<{
    label?: string;
    country: string;
    city: string;
    address: string;
    postalCode: string;
  }>(req);
  if ("error" in parsed) return parsed.error;
  const { label, country, city, address, postalCode } = parsed.data;

  if (
    !country?.trim() ||
    !city?.trim() ||
    !address?.trim() ||
    !postalCode?.trim()
  ) {
    return NextResponse.json(
      { error: "Tous les champs sont requis." },
      { status: 400 },
    );
  }

  await connectDB();

  /* Use positional operator to update the matching subdocument in-place */
  const updated = await User.findOneAndUpdate(
    {
      _id: payload.userId,
      "addresses._id": new mongoose.Types.ObjectId(id),
    },
    {
      $set: {
        "addresses.$.label": label?.trim() || "Maison",
        "addresses.$.country": country.trim(),
        "addresses.$.city": city.trim(),
        "addresses.$.address": address.trim(),
        "addresses.$.postalCode": postalCode.trim(),
      },
    },
    { new: true },
  )
    .select("addresses")
    .lean<{ addresses: (IAddress & { _id: mongoose.Types.ObjectId })[] }>();

  if (!updated) {
    return NextResponse.json(
      { error: "Adresse introuvable." },
      { status: 404 },
    );
  }

  const saved = updated.addresses.find((a) => a._id.toString() === id);

  return NextResponse.json(
    {
      address: saved
        ? {
            id: saved._id.toString(),
            label: saved.label,
            country: saved.country,
            city: saved.city,
            address: saved.address,
            postalCode: saved.postalCode,
            isDefault: saved.isDefault,
          }
        : null,
    },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/auth/me/addresses/[id] ──────────── */

export async function DELETE(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, { rateLimit: { limit: 20, windowSec: 60 } });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }

  await connectDB();

  const result = await User.findByIdAndUpdate(payload.userId, {
    $pull: { addresses: { _id: new mongoose.Types.ObjectId(id) } },
  });

  if (!result) {
    return NextResponse.json(
      { error: "Utilisateur introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
