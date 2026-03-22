import { NextResponse } from "next/server";
import { listActiveDeliveryMethods } from "@/lib/services/deliveryMethod.service";

/* ================================================================
   /api/delivery-methods  (Public)
   ================================================================
   GET — Returns all active delivery methods for checkout.
   ================================================================ */

export async function GET() {
  const result = await listActiveDeliveryMethods();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    { methods: result.data },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
