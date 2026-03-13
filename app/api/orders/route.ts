import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import {
  createOrder,
  getUserOrders,
  findOrCreateGuestUser,
} from "@/lib/services/order.service";
import { notifyAdminsNewOrder } from "@/lib/services/notification.service";

/* ================================================================
   /api/orders
   ================================================================
   POST — Create a new order (authenticated OR guest)
   GET  — Get current user's orders
   ================================================================ */

/* ──────────── POST /api/orders ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);

  const parsed = await parseBody<{
    items: {
      productId: string;
      name: string;
      image: string;
      price: number;
      quantity: number;
      size?: string;
      color?: string;
    }[];
    shippingAddress: {
      firstName: string;
      lastName: string;
      phone: string;
      country: string;
      city: string;
      address: string;
      postalCode: string;
    };
    shippingMethod: "standard" | "express";
    paymentMethod: "card" | "cod";
    notes?: string;
    guest?: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  }>(req);

  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  /* Basic validation */
  if (!body.items || body.items.length === 0) {
    return NextResponse.json(
      { error: "La commande doit contenir au moins un article." },
      { status: 400 },
    );
  }

  if (!body.shippingAddress) {
    return NextResponse.json(
      { error: "L'adresse de livraison est requise." },
      { status: 400 },
    );
  }

  const requiredFields = [
    "firstName",
    "lastName",
    "phone",
    "country",
    "city",
    "address",
    "postalCode",
  ] as const;
  for (const field of requiredFields) {
    if (!body.shippingAddress[field]?.trim()) {
      return NextResponse.json(
        { error: `Le champ "${field}" de l'adresse est requis.` },
        { status: 400 },
      );
    }
  }

  /* Resolve userId — authenticated user OR guest */
  let userId: string | undefined;

  if (payload) {
    userId = payload.userId;
  } else {
    /* Guest checkout — require at least name */
    if (!body.guest?.firstName?.trim() || !body.guest?.lastName?.trim()) {
      return NextResponse.json(
        { error: "Le prénom et le nom sont requis." },
        { status: 400 },
      );
    }

    const guestEmail = body.guest.email?.trim().toLowerCase();

    /* If guest provided an email, find or create a user account */
    if (guestEmail) {
      const guestResult = await findOrCreateGuestUser({
        firstName: body.guest.firstName.trim(),
        lastName: body.guest.lastName.trim(),
        email: guestEmail,
        phone: body.guest.phone?.trim() || "",
      });

      if (!guestResult.success || !guestResult.data) {
        return NextResponse.json(
          { error: guestResult.error ?? "Impossible de créer le compte." },
          { status: guestResult.status ?? 500 },
        );
      }

      userId = guestResult.data;
    }
    /* If no email, userId stays undefined → anonymous order */
  }

  const result = await createOrder({
    userId,
    items: body.items,
    shippingAddress: body.shippingAddress,
    shippingMethod: body.shippingMethod ?? "standard",
    paymentMethod: body.paymentMethod ?? "cod",
    notes: body.notes,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  /* Notify admins (non-blocking — don't delay the response) */
  if (result.data) {
    notifyAdminsNewOrder(result.data).catch((err) =>
      console.error("[Orders API] Notification error:", err),
    );
  }

  return NextResponse.json({ order: result.data }, { status: 201 });
}

/* ──────────── GET /api/orders ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  const result = await getUserOrders(payload.userId, page, limit);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(
    { orders: result.data!.orders, total: result.data!.total },
    { status: 200 },
  );
}
