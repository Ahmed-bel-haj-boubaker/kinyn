import { NextRequest, NextResponse } from "next/server";
import {
  sendContactEmail,
  type ContactEmailData,
} from "@/lib/services/email.service";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, inquiry, subject, message } = body as Record<
    string,
    unknown
  >;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return NextResponse.json(
      { error: "Les champs nom, email et message sont obligatoires." },
      { status: 422 },
    );
  }

  // Basic email format check
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Adresse email invalide." },
      { status: 422 },
    );
  }

  const data: ContactEmailData = {
    name: name.trim().slice(0, 200),
    email: email.trim().slice(0, 200),
    inquiry: typeof inquiry === "string" ? inquiry.trim().slice(0, 100) : "",
    subject: typeof subject === "string" ? subject.trim().slice(0, 300) : "",
    message: message.trim().slice(0, 5000),
  };

  try {
    await sendContactEmail(data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 },
    );
  }
}
