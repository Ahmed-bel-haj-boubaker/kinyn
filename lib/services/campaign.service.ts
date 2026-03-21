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
    if (input.collections !== undefined)
      doc.collections = input.collections.slice(0, 6);

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
   Email Template Builder — KinyN Luxury Editorial
   ══════════════════════════════════════════════════════════════ */

const FONT_POPPINS =
  "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_EROTIQUE =
  "'ErotiqueTrial', Georgia, 'Times New Roman', Times, serif";
const COLOR_PRIMARY = "#7a0c1c";
const COLOR_DARK = "#17171a";
const COLOR_BG = "#f0f0ec";

function absUrl(path: string, appUrl: string): string {
  if (!path) return "";
  return path.startsWith("http")
    ? path
    : `${appUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function buildCampaignEmail(
  campaign: INewsletterCampaign,
  appUrl: string,
): string {
  const logoUrl = `${appUrl}/images/logo.png`;

  const typeLabels: Record<string, string> = {
    promotion: "Offre Exclusive",
    new_arrival: "Nouveautés",
    collection: "Nouvelle Collection",
    announcement: "Annonce",
    custom: "Newsletter",
  };
  const typeLabel = typeLabels[campaign.type] || "Newsletter";

  const ctaUrl = campaign.ctaUrl ? absUrl(campaign.ctaUrl, appUrl) : appUrl;

  /* ── Product cards ── */
  let productsHtml = "";
  if (campaign.products.length > 0) {
    const cards = campaign.products.map((p) => {
      const imgUrl = absUrl(p.image, appUrl);
      const productUrl = `${appUrl}/${p.slug}`;
      const priceHtml = p.promoPrice
        ? `<span style="text-decoration:line-through;color:${COLOR_DARK};opacity:0.35;font-size:12px;font-family:${FONT_POPPINS};font-weight:400;">${p.price.toFixed(3)} TND</span>
           <span style="color:${COLOR_PRIMARY};font-weight:600;font-size:14px;margin-left:6px;font-family:${FONT_POPPINS};">${p.promoPrice.toFixed(3)} TND</span>`
        : `<span style="color:${COLOR_DARK};font-weight:600;font-size:14px;font-family:${FONT_POPPINS};">${p.price.toFixed(3)} TND</span>`;

      return `
      <td width="50%" class="mobile-stack" style="padding:6px;vertical-align:top;">
        <a href="${productUrl}" style="text-decoration:none;color:inherit;display:block;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="background-color:${COLOR_BG};text-align:center;">
                <img src="${imgUrl}" alt="${p.name}" width="260" class="mobile-img" style="display:block;width:100%;height:280px;object-fit:cover;" />
              </td>
            </tr>
            <tr>
              <td style="padding:14px 4px 16px;">
                <p style="margin:0 0 6px;font-family:${FONT_POPPINS};font-size:13px;color:${COLOR_DARK};line-height:1.4;font-weight:500;letter-spacing:0.2px;">
                  ${p.name}
                </p>
                <p style="margin:0;">${priceHtml}</p>
              </td>
            </tr>
          </table>
        </a>
      </td>`;
    });

    const rows: string[] = [];
    for (let i = 0; i < cards.length; i += 2) {
      rows.push(
        `<tr>${cards.slice(i, i + 2).join("")}${cards.length - i === 1 ? '<td width="50%" style="padding:6px;"></td>' : ""}</tr>`,
      );
    }

    productsHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
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
      <td width="50%" class="mobile-stack" style="padding:6px;vertical-align:top;">
        <a href="${collectionUrl}" style="text-decoration:none;color:inherit;display:block;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="background-color:${COLOR_DARK};text-align:center;">
                <img src="${imgUrl}" alt="${c.name}" width="260" class="mobile-img" style="display:block;width:100%;height:240px;object-fit:cover;opacity:0.8;" />
              </td>
            </tr>
            <tr>
              <td style="background-color:${COLOR_DARK};padding:0 16px 16px;">
                <p style="margin:0;font-family:${FONT_EROTIQUE};font-size:15px;color:#ffffff;letter-spacing:2px;text-transform:uppercase;line-height:1.4;">
                  ${c.name}
                </p>
                <p style="margin:6px 0 0;">
                  <span style="font-family:${FONT_POPPINS};font-size:10px;font-weight:600;color:#ffffff;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid ${COLOR_PRIMARY};padding-bottom:2px;">
                    D\u00e9couvrir
                  </span>
                </p>
              </td>
            </tr>
          </table>
        </a>
      </td>`;
    });

    const rows: string[] = [];
    for (let i = 0; i < cards.length; i += 2) {
      rows.push(
        `<tr>${cards.slice(i, i + 2).join("")}${cards.length - i === 1 ? '<td width="50%" style="padding:6px;"></td>' : ""}</tr>`,
      );
    }

    collectionsHtml = `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
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
            `<p style="margin:0 0 16px;font-family:${FONT_POPPINS};font-size:15px;line-height:1.8;color:${COLOR_DARK};opacity:0.7;font-weight:300;">${p}</p>`,
        )
        .join("")
    : "";

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${campaign.subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <!--[if !mso]><!-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
    @font-face {
      font-family: 'ErotiqueTrial';
      src: url('${appUrl}/fonts/ErotiqueTrial-Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 24px !important; padding-right: 24px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
      .mobile-img { height: 200px !important; }
    }
  </style>
  <!--<![endif]-->
  <!--[if mso]>
  <style>
    * { font-family: 'Georgia', serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${COLOR_BG};font-family:${FONT_POPPINS};-webkit-font-smoothing:antialiased;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:${COLOR_BG};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${campaign.heading || campaign.subject} \u2014 KinyN
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${COLOR_BG};">
    <tr>
      <td align="center" style="padding:0;">

        <!-- Top spacer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width:600px;">
          <tr><td style="height:40px;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>

        <!-- Main Email Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width:600px;background-color:#ffffff;">

          <!-- Brand Header -->
          <tr>
            <td style="background-color:${COLOR_DARK};padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="height:44px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding:0 40px;">
                    <img src="${logoUrl}" alt="KinyN" width="120" style="display:block;width:120px;height:auto;" />
                  </td>
                </tr>
                <tr><td style="height:12px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:32px;height:1px;background-color:${COLOR_PRIMARY};font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:36px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="height:48px;font-size:0;line-height:0;">&nbsp;</td></tr>

                <!-- Type Badge -->
                <tr>
                  <td align="center" class="mobile-padding" style="padding:0 48px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:5px 20px;border:1px solid ${COLOR_PRIMARY};font-family:${FONT_POPPINS};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${COLOR_PRIMARY};text-align:center;">
                          ${typeLabel}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  campaign.heading
                    ? `<tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" class="mobile-padding" style="padding:0 48px;">
                    <h1 style="margin:0;font-family:${FONT_EROTIQUE};font-size:34px;font-weight:400;color:${COLOR_DARK};line-height:1.25;letter-spacing:0.5px;text-align:center;">
                      ${campaign.heading}
                    </h1>
                  </td>
                </tr>`
                    : ""
                }

                <!-- Thin accent line under heading -->
                <tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:48px;height:1px;background-color:${COLOR_DARK};opacity:0.15;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                ${
                  bodyHtml
                    ? `<tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td class="mobile-padding" style="padding:0 56px;text-align:center;">
                    ${bodyHtml}
                  </td>
                </tr>`
                    : ""
                }

                <tr><td style="height:12px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          ${
            productsHtml
              ? `<!-- Products Section -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td class="mobile-padding" style="padding:0 42px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="border-top:1px solid ${COLOR_DARK};opacity:0.08;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>
                      <tr>
                        <td>
                          <p style="margin:0 0 4px;font-family:${FONT_POPPINS};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${COLOR_DARK};opacity:0.4;">
                            S\u00e9lection
                          </p>
                        </td>
                      </tr>
                      <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>
                    ${productsHtml}
                  </td>
                </tr>
                <tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          ${
            collectionsHtml
              ? `<!-- Collections Section -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td class="mobile-padding" style="padding:0 42px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="border-top:1px solid ${COLOR_DARK};opacity:0.08;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>
                      <tr>
                        <td>
                          <p style="margin:0 0 4px;font-family:${FONT_POPPINS};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${COLOR_DARK};opacity:0.4;">
                            Collections
                          </p>
                        </td>
                      </tr>
                      <tr><td style="height:8px;font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>
                    ${collectionsHtml}
                  </td>
                </tr>
                <tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          ${
            campaign.ctaText
              ? `<!-- CTA Button -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="height:32px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding:0 48px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:${COLOR_DARK};padding:16px 52px;">
                          <a href="${ctaUrl}" style="font-family:${FONT_POPPINS};font-size:12px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;display:block;">
                            ${campaign.ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:40px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>`
              : ""
          }

          <!-- Footer -->
          <tr>
            <td style="background-color:${COLOR_DARK};padding:0;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr><td style="height:40px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding:0 40px;">
                    <img src="${logoUrl}" alt="KinyN" width="80" style="display:block;width:80px;height:auto;opacity:0.6;" />
                  </td>
                </tr>
                <tr><td style="height:16px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:24px;height:1px;background-color:${COLOR_PRIMARY};font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:20px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding:0 40px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:0 12px;">
                          <a href="${appUrl}" style="font-family:${FONT_POPPINS};font-size:10px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#ffffff;opacity:0.5;text-decoration:none;">Boutique</a>
                        </td>
                        <td style="width:1px;background-color:#ffffff;opacity:0.15;font-size:0;">&nbsp;</td>
                        <td style="padding:0 12px;">
                          <a href="${appUrl}/about" style="font-family:${FONT_POPPINS};font-size:10px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#ffffff;opacity:0.5;text-decoration:none;">\u00c0 propos</a>
                        </td>
                        <td style="width:1px;background-color:#ffffff;opacity:0.15;font-size:0;">&nbsp;</td>
                        <td style="padding:0 12px;">
                          <a href="${appUrl}/contact" style="font-family:${FONT_POPPINS};font-size:10px;font-weight:500;letter-spacing:2px;text-transform:uppercase;color:#ffffff;opacity:0.5;text-decoration:none;">Contact</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>
                <tr>
                  <td align="center" style="padding:0 48px;">
                    <p style="margin:0;font-family:${FONT_POPPINS};font-size:10px;color:#ffffff;opacity:0.3;line-height:1.7;font-weight:300;">
                      Vous recevez cet email car vous faites partie de la communaut\u00e9 KinyN.<br />
                      &copy; ${new Date().getFullYear()} KinyN. Tous droits r\u00e9serv\u00e9s.
                    </p>
                  </td>
                </tr>
                <tr><td style="height:40px;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

        </table>

        <!-- Bottom spacer -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width:600px;">
          <tr><td style="height:40px;font-size:0;line-height:0;">&nbsp;</td></tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
