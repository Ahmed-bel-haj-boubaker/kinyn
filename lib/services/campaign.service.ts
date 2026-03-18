import connectDB from "@/lib/mongodb";
import nodemailer from "nodemailer";
import NewsletterCampaign, {
  type INewsletterCampaign,
  type SafeCampaign,
  type ICampaignProduct,
  type ICampaignCollection,
  type CampaignType,
  campaignToSafe,
} from "@/models/NewsletterCampaign";
import Newsletter from "@/models/Newsletter";
import User from "@/models/User";

/* ================================================================
   Newsletter Campaign Service — KINYN
   ================================================================ */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────────── Create Campaign ──────────────── */

interface CreateCampaignInput {
  subject: string;
  type: CampaignType;
  heading?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
  products?: ICampaignProduct[];
  collections?: ICampaignCollection[];
  createdBy: string;
}

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<ServiceResult<SafeCampaign>> {
  try {
    await connectDB();

    if (!input.subject?.trim()) {
      return { success: false, error: "Le sujet est requis.", status: 400 };
    }

    const doc = await NewsletterCampaign.create({
      subject: input.subject.trim(),
      type: input.type || "custom",
      heading: input.heading?.trim() || "",
      body: input.body?.trim() || "",
      ctaText: input.ctaText?.trim() || "Découvrir",
      ctaUrl: input.ctaUrl?.trim() || "",
      products: (input.products || []).slice(0, 6),
      collections: (input.collections || []).slice(0, 6),
      createdBy: input.createdBy,
    });

    return { success: true, data: campaignToSafe(doc) };
  } catch (err) {
    console.error("[createCampaign]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Update Campaign ──────────────── */

interface UpdateCampaignInput {
  subject?: string;
  type?: CampaignType;
  heading?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
  products?: ICampaignProduct[];
  collections?: ICampaignCollection[];
}

export async function updateCampaign(
  id: string,
  input: UpdateCampaignInput,
): Promise<ServiceResult<SafeCampaign>> {
  try {
    await connectDB();

    const doc = await NewsletterCampaign.findById(id);
    if (!doc)
      return { success: false, error: "Campagne introuvable.", status: 404 };
    if (doc.status === "sent") {
      return {
        success: false,
        error: "Impossible de modifier une campagne déjà envoyée.",
        status: 400,
      };
    }

    if (input.subject !== undefined) doc.subject = input.subject.trim();
    if (input.type !== undefined) doc.type = input.type;
    if (input.heading !== undefined) doc.heading = input.heading.trim();
    if (input.body !== undefined) doc.body = input.body.trim();
    if (input.ctaText !== undefined) doc.ctaText = input.ctaText.trim();
    if (input.ctaUrl !== undefined) doc.ctaUrl = input.ctaUrl.trim();
    if (input.products !== undefined) doc.products = input.products.slice(0, 6);
    if (input.collections !== undefined) doc.collections = input.collections.slice(0, 6);

    await doc.save();
    return { success: true, data: campaignToSafe(doc) };
  } catch {
    return { success: false, error: "ID invalide.", status: 400 };
  }
}

/* ──────────────── Get Campaign by ID ──────────────── */

export async function getCampaignById(
  id: string,
): Promise<ServiceResult<SafeCampaign>> {
  try {
    await connectDB();
    const doc =
      await NewsletterCampaign.findById(id).lean<INewsletterCampaign>();
    if (!doc)
      return { success: false, error: "Campagne introuvable.", status: 404 };
    return { success: true, data: campaignToSafe(doc) };
  } catch {
    return { success: false, error: "ID invalide.", status: 400 };
  }
}

/* ──────────────── List Campaigns ──────────────── */

interface ListCampaignsInput {
  status?: string;
  page?: number;
  limit?: number;
}

export async function listCampaigns(
  input: ListCampaignsInput = {},
): Promise<ServiceResult<{ campaigns: SafeCampaign[]; total: number }>> {
  try {
    await connectDB();

    const filter: Record<string, unknown> = {};
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));
    const skip = (page - 1) * limit;

    if (input.status && ["draft", "sent"].includes(input.status)) {
      filter.status = input.status;
    }

    const [docs, total] = await Promise.all([
      NewsletterCampaign.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<INewsletterCampaign[]>(),
      NewsletterCampaign.countDocuments(filter),
    ]);

    return {
      success: true,
      data: { campaigns: docs.map(campaignToSafe), total },
    };
  } catch (err) {
    console.error("[listCampaigns]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Delete Campaign ──────────────── */

export async function deleteCampaign(id: string): Promise<ServiceResult<null>> {
  try {
    await connectDB();
    const doc = await NewsletterCampaign.findByIdAndDelete(id);
    if (!doc)
      return { success: false, error: "Campagne introuvable.", status: 404 };
    return { success: true, data: null };
  } catch {
    return { success: false, error: "ID invalide.", status: 400 };
  }
}

/* ──────────────── Send Campaign ──────────────── */

export async function sendCampaign(
  id: string,
): Promise<ServiceResult<{ sentCount: number }>> {
  try {
    await connectDB();

    const campaign = await NewsletterCampaign.findById(id);
    if (!campaign)
      return { success: false, error: "Campagne introuvable.", status: 404 };
    if (campaign.status === "sent") {
      return {
        success: false,
        error: "Cette campagne a déjà été envoyée.",
        status: 400,
      };
    }

    /* Gather ALL customer emails: registered users + newsletter subscribers */
    const [users, subscribers] = await Promise.all([
      User.find({ role: "user" }).select("email").lean<{ email: string }[]>(),
      Newsletter.find().select("email").lean<{ email: string }[]>(),
    ]);

    const emailSet = new Set<string>();
    for (const u of users) emailSet.add(u.email.toLowerCase());
    for (const s of subscribers) emailSet.add(s.email.toLowerCase());

    const emails = [...emailSet];

    if (!emails.length) {
      return {
        success: false,
        error: "Aucun destinataire trouvé.",
        status: 400,
      };
    }

    /* SMTP setup */
    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    if (!smtpEmail || !smtpPassword) {
      return {
        success: false,
        error: "Configuration SMTP manquante.",
        status: 500,
      };
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: smtpEmail, pass: smtpPassword },
      tls: { rejectUnauthorized: false },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const html = buildCampaignEmail(campaign, appUrl);

    /* Send in batches of 10 to avoid rate limits */
    const batchSize = 10;
    let sentCount = 0;

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((email) =>
          transporter.sendMail({
            from: `"Kinyn" <${smtpEmail}>`,
            to: email,
            subject: campaign.subject,
            html,
          }),
        ),
      );
      sentCount += results.filter((r) => r.status === "fulfilled").length;
    }

    /* Mark as sent */
    campaign.status = "sent";
    campaign.sentAt = new Date();
    campaign.sentCount = sentCount;
    await campaign.save();

    console.log(
      `[Campaign] "${campaign.subject}" sent to ${sentCount}/${emails.length} recipients`,
    );

    return { success: true, data: { sentCount } };
  } catch (err) {
    console.error("[sendCampaign]", err);
    return { success: false, error: "Erreur lors de l'envoi.", status: 500 };
  }
}

/* ══════════════════════════════════════════════════════════════
   Email Template Builder — Luxury Kinyn style
   ══════════════════════════════════════════════════════════════ */

const FONT_POPPINS = "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_EROTIQUE = "Georgia, 'Times New Roman', serif";
const COLOR_PRIMARY = "#7a0c1c";
const COLOR_DARK = "#17171a";
const COLOR_BG = "#f0f0ec";

function absUrl(path: string, appUrl: string): string {
  if (!path) return "";
  return path.startsWith("http") ? path : `${appUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function buildCampaignEmail(
  campaign: INewsletterCampaign,
  appUrl: string,
): string {
  const typeLabels: Record<string, string> = {
    promotion: "Promotion",
    new_arrival: "Nouveautés",
    collection: "Nouvelle Collection",
    announcement: "Annonce",
    custom: "Newsletter",
  };
  const typeLabel = typeLabels[campaign.type] || "Newsletter";

  const ctaUrl = campaign.ctaUrl
    ? absUrl(campaign.ctaUrl, appUrl)
    : appUrl;

  /* ── Product cards ── */
  let productsHtml = "";
  if (campaign.products.length > 0) {
    const cards = campaign.products.map((p) => {
      const imgUrl = absUrl(p.image, appUrl);
      const productUrl = `${appUrl}/${p.slug}`;
      const priceHtml = p.promoPrice
        ? `<span style="text-decoration:line-through;color:#999;font-size:13px;font-family:${FONT_POPPINS};">${p.price.toFixed(3)} TND</span>
           <span style="color:${COLOR_PRIMARY};font-weight:700;font-size:15px;margin-left:6px;font-family:${FONT_POPPINS};">${p.promoPrice.toFixed(3)} TND</span>`
        : `<span style="color:${COLOR_DARK};font-weight:700;font-size:15px;font-family:${FONT_POPPINS};">${p.price.toFixed(3)} TND</span>`;

      return `
      <td width="50%" style="padding:8px;vertical-align:top;">
        <a href="${productUrl}" style="text-decoration:none;color:inherit;display:block;">
          <div style="background-color:#f7f7f5;border-radius:4px;overflow:hidden;">
            <img src="${imgUrl}" alt="${p.name}" width="260" style="display:block;width:100%;height:220px;object-fit:cover;" />
            <div style="padding:12px 14px;">
              <p style="margin:0 0 6px;font-family:${FONT_POPPINS};font-size:14px;color:${COLOR_DARK};line-height:1.3;font-weight:500;">
                ${p.name}
              </p>
              <p style="margin:0;">${priceHtml}</p>
            </div>
          </div>
        </a>
      </td>`;
    });

    const rows: string[] = [];
    for (let i = 0; i < cards.length; i += 2) {
      rows.push(`<tr>${cards.slice(i, i + 2).join("")}${cards.length - i === 1 ? '<td width="50%"></td>' : ""}</tr>`);
    }

    productsHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
      ${rows.join("")}
    </table>`;
  }

  /* ── Collection cards ── */
  let collectionsHtml = "";
  if (campaign.collections && campaign.collections.length > 0) {
    const cards = campaign.collections.map((c) => {
      const imgUrl = absUrl(c.image, appUrl);
      const collectionUrl = `${appUrl}/${c.slug}`;

      return `
      <td width="50%" style="padding:8px;vertical-align:top;">
        <a href="${collectionUrl}" style="text-decoration:none;color:inherit;display:block;">
          <div style="border-radius:4px;overflow:hidden;position:relative;">
            <img src="${imgUrl}" alt="${c.name}" width="260" style="display:block;width:100%;height:200px;object-fit:cover;" />
            <div style="background:linear-gradient(transparent,rgba(0,0,0,0.6));padding:16px 14px 14px;position:absolute;bottom:0;left:0;right:0;">
              <p style="margin:0;font-family:${FONT_EROTIQUE};font-size:16px;color:#ffffff;letter-spacing:1px;text-transform:uppercase;">
                ${c.name}
              </p>
            </div>
          </div>
        </a>
      </td>`;
    });

    const rows: string[] = [];
    for (let i = 0; i < cards.length; i += 2) {
      rows.push(`<tr>${cards.slice(i, i + 2).join("")}${cards.length - i === 1 ? '<td width="50%"></td>' : ""}</tr>`);
    }

    collectionsHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
      ${rows.join("")}
    </table>`;
  }

  /* ── Body text paragraphs ── */
  const bodyHtml = campaign.body
    ? campaign.body
        .split("\n")
        .filter((l) => l.trim())
        .map(
          (p) =>
            `<p style="margin:0 0 12px;font-family:${FONT_POPPINS};font-size:15px;line-height:1.7;color:#444;">${p}</p>`,
        )
        .join("")
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${campaign.subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  </style>
  <!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${COLOR_BG};font-family:${FONT_POPPINS};">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${COLOR_BG};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:2px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Brand Header -->
          <tr>
            <td style="background-color:${COLOR_DARK};padding:36px 40px;text-align:center;">
              <h1 style="margin:0;font-family:${FONT_EROTIQUE};font-size:32px;font-weight:400;letter-spacing:6px;color:#ffffff;text-transform:uppercase;">
                KINYN
              </h1>
              <div style="margin-top:8px;width:40px;height:2px;background-color:${COLOR_PRIMARY};display:inline-block;"></div>
            </td>
          </tr>

          <!-- Type Badge -->
          <tr>
            <td style="padding:28px 40px 0;text-align:center;">
              <span style="display:inline-block;padding:4px 16px;background-color:${COLOR_PRIMARY};color:#ffffff;font-family:${FONT_POPPINS};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;border-radius:2px;">
                ${typeLabel}
              </span>
            </td>
          </tr>

          <!-- Heading -->
          ${
            campaign.heading
              ? `<tr>
            <td style="padding:20px 40px 0;text-align:center;">
              <h2 style="margin:0;font-family:${FONT_EROTIQUE};font-size:26px;font-weight:400;color:${COLOR_DARK};line-height:1.3;">
                ${campaign.heading}
              </h2>
            </td>
          </tr>`
              : ""
          }

          <!-- Body -->
          ${
            bodyHtml
              ? `<tr>
            <td style="padding:20px 40px 0;">
              ${bodyHtml}
            </td>
          </tr>`
              : ""
          }

          <!-- Products -->
          ${
            productsHtml
              ? `<tr>
            <td style="padding:0 32px;">
              <p style="margin:0 0 4px 8px;font-family:${FONT_POPPINS};font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR_DARK};">Nos produits</p>
              ${productsHtml}
            </td>
          </tr>`
              : ""
          }

          <!-- Collections -->
          ${
            collectionsHtml
              ? `<tr>
            <td style="padding:${productsHtml ? "16px" : "0"} 32px 0;">
              <p style="margin:0 0 4px 8px;font-family:${FONT_POPPINS};font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR_DARK};">Nos collections</p>
              ${collectionsHtml}
            </td>
          </tr>`
              : ""
          }

          <!-- CTA Button -->
          ${
            campaign.ctaText
              ? `<tr>
            <td style="padding:28px 40px 0;text-align:center;">
              <a href="${ctaUrl}" style="display:inline-block;padding:14px 40px;background-color:${COLOR_PRIMARY};color:#ffffff;font-family:${FONT_POPPINS};font-size:14px;font-weight:600;letter-spacing:1px;text-decoration:none;text-transform:uppercase;border-radius:2px;">
                ${campaign.ctaText}
              </a>
            </td>
          </tr>`
              : ""
          }

          <!-- Divider -->
          <tr>
            <td style="padding:32px 40px 0;">
              <div style="border-top:1px solid #eee;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-family:${FONT_EROTIQUE};font-size:18px;letter-spacing:4px;color:${COLOR_DARK};text-transform:uppercase;">
                KINYN
              </p>
              <p style="margin:0;font-family:${FONT_POPPINS};font-size:12px;color:#999;line-height:1.6;">
                Vous recevez cet email car vous faites partie de notre communauté.<br />
                <a href="${appUrl}" style="color:${COLOR_PRIMARY};text-decoration:underline;">Visiter la boutique</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
