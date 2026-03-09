import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import type { IAddress } from "@/models/User";
import mongoose from "mongoose";

/* ================================================================
   /api/auth/me/addresses
   ================================================================
   GET  — List the authenticated user's saved addresses
   POST — Add a new address (max 10)
   ================================================================ */

/* ──────────── GET /api/auth/me/addresses ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(payload.userId)
    .select("addresses")
    .lean<{ addresses: (IAddress & { _id: mongoose.Types.ObjectId })[] }>();

  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur introuvable." },
      { status: 404 },
    );
  }

  const addresses = (user.addresses ?? []).map((a) => ({
    id: a._id.toString(),
    label: a.label ?? "Maison",
    country: a.country,
    city: a.city,
    address: a.address,
    postalCode: a.postalCode,
    isDefault: a.isDefault ?? false,
  }));

  return NextResponse.json({ addresses }, { status: 200 });
}

/* ──────────── POST /api/auth/me/addresses ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, { rateLimit: { limit: 20, windowSec: 60 } });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
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

  const user = await User.findById(payload.userId);
  if (!user) {
    return NextResponse.json(
      { error: "Utilisateur introuvable." },
      { status: 404 },
    );
  }

  if (user.addresses.length >= 10) {
    return NextResponse.json(
      { error: "Maximum 10 adresses autorisées." },
      { status: 400 },
    );
  }

  const isFirst = user.addresses.length === 0;
  user.addresses.push({
    label: label?.trim() || "Maison",
    country: country.trim(),
    city: city.trim(),
    address: address.trim(),
    postalCode: postalCode.trim(),
    isDefault: isFirst,
  } as IAddress);

  await user.save();

  const saved = user.addresses[user.addresses.length - 1] as IAddress & {
    _id: mongoose.Types.ObjectId;
  };

  return NextResponse.json(
    {
      address: {
        id: saved._id.toString(),
        label: saved.label,
        country: saved.country,
        city: saved.city,
        address: saved.address,
        postalCode: saved.postalCode,
        isDefault: saved.isDefault,
      },
    },
    { status: 201 },
  );
}
