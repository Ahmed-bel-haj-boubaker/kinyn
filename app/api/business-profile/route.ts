import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import type { IBusinessProfile } from "@/models/User";

/* ================================================================
   /api/business-profile  (PUBLIC)
   ================================================================
   Returns the business profile of the first admin/super_admin user.
   Used by the storefront footer for contact info & social links.
   Cached for 5 minutes.
   ================================================================ */

export async function GET() {
  try {
    await connectDB();

    // Prefer an admin who actually filled in profile data, prioritise super_admin
    const admin = await User.findOne({
      role: { $in: ["admin", "super_admin"] },
      status: "active",
      "businessProfile.email": { $ne: "" },
    })
      .sort({ role: -1 }) // super_admin before admin
      .select("businessProfile")
      .lean<{ businessProfile?: IBusinessProfile }>()
    ?? await User.findOne({
      role: { $in: ["admin", "super_admin"] },
      status: "active",
    })
      .sort({ role: -1 })
      .select("businessProfile")
      .lean<{ businessProfile?: IBusinessProfile }>();

    const bp = admin?.businessProfile;
    const sl = bp?.socialLinks;

    const profile = {
      phone: bp?.phone ?? "",
      email: bp?.email ?? "",
      address: bp?.address ?? "",
      city: bp?.city ?? "",
      country: bp?.country ?? "",
      postalCode: bp?.postalCode ?? "",
      socialLinks: {
        instagram: sl?.instagram ?? "",
        facebook: sl?.facebook ?? "",
      },
    };

    return NextResponse.json(
      { profile },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    console.error("[Business Profile] Error:", error);
    return NextResponse.json({ profile: null }, { status: 500 });
  }
}
