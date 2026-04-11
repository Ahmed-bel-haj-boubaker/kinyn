import nodemailer from "nodemailer";

/* ================================================================
   Email Service — KINYN
   ================================================================
   Sends transactional emails via Gmail SMTP using Nodemailer.
   Credentials loaded from environment variables.
   ================================================================ */

interface OrderEmailData {
  orderId: string;
  orderRef: string;
  customerName: string;
  totalAmount: number;
  itemCount: number;
  shippingMethod: string;
  paymentMethod: string;
}

/**
 * Send a new-order notification email to the admin.
 */
export async function sendNewOrderEmail(data: OrderEmailData): Promise<void> {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!smtpEmail || !smtpPassword || !adminEmail) {
    console.warn(
      "[Email Service] Missing env vars: SMTP_EMAIL, SMTP_PASSWORD or ADMIN_EMAIL. Skipping.",
    );
    return;
  }

  /* Create transporter lazily so env vars are guaranteed to be loaded */
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/orders`;

  const htmlTemplate = buildNewOrderEmailTemplate({
    ...data,
    dashboardUrl,
  });

  try {
    const info = await transporter.sendMail({
      from: `"Kinyn" <${smtpEmail}>`,
      to: adminEmail,
      subject: `Nouvelle commande #${data.orderRef}`,
      html: htmlTemplate,
    });
    console.log(
      `[Email Service] Order notification sent for ${data.orderRef} → messageId: ${info.messageId}`,
    );
  } catch (error) {
    console.error("[Email Service] Failed to send email:", error);
  }
}

/* ================================================================
   Contact Form — send client message to admin
   ================================================================ */

export interface ContactEmailData {
  name: string;
  email: string;
  inquiry: string;
  subject: string;
  message: string;
}

export async function sendContactEmail(data: ContactEmailData): Promise<void> {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!smtpEmail || !smtpPassword || !adminEmail) {
    console.warn(
      "[Email Service] Missing env vars: SMTP_EMAIL, SMTP_PASSWORD or ADMIN_EMAIL. Skipping contact email.",
    );
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: smtpEmail, pass: smtpPassword },
    tls: { rejectUnauthorized: false },
  });

  const htmlTemplate = buildContactEmailTemplate(data);

  try {
    const info = await transporter.sendMail({
      from: `"Kinyn Contact" <${smtpEmail}>`,
      to: adminEmail,
      replyTo: data.email,
      subject: data.subject
        ? `[Contact] ${data.subject}`
        : `[Contact] Nouveau message de ${data.name}`,
      html: htmlTemplate,
    });
    console.log(
      `[Email Service] Contact email sent from ${data.email} → messageId: ${info.messageId}`,
    );
  } catch (error) {
    console.error("[Email Service] Failed to send contact email:", error);
    throw error;
  }
}

function buildContactEmailTemplate(data: ContactEmailData): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouveau message — Kinyn</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0ec; font-family: 'Georgia', 'Times New Roman', serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f0ec;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 2px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- Brand Header -->
          <tr>
            <td style="background-color: #17171a; padding: 36px 40px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 32px; font-weight: 400; letter-spacing: 6px; color: #ffffff; text-transform: uppercase;">KINYN</h1>
              <div style="margin-top: 8px; width: 40px; height: 2px; background-color: #7a0c1c; display: inline-block;"></div>
            </td>
          </tr>

          <!-- Badge -->
          <tr>
            <td style="padding: 32px 40px 0; text-align: center;">
              <div style="display: inline-block; background-color: #7a0c1c; color: #ffffff; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 8px 20px; border-radius: 1px;">
                Nouveau Message
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 40px 0; text-align: center;">
              <p style="margin: 0; font-family: Georgia, serif; font-size: 18px; color: #17171a; line-height: 1.6;">
                Un visiteur vous a envoye un message via le formulaire de contact.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding: 24px 40px;"><div style="border-top: 1px solid #e8e6e1;"></div></td></tr>

          <!-- Details -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafaf8; border: 1px solid #e8e6e1; border-radius: 2px;">
                <tr>
                  <td style="padding: 24px 28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" style="padding-bottom: 16px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Nom</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a;">${escape(data.name)}</p>
                        </td>
                        <td width="50%" style="padding-bottom: 16px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Email</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a;">
                            <a href="mailto:${escape(data.email)}" style="color: #7a0c1c; text-decoration: none;">${escape(data.email)}</a>
                          </p>
                        </td>
                      </tr>
                      ${
                        data.inquiry
                          ? `
                      <tr>
                        <td width="50%" style="padding-bottom: 16px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Type de demande</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a;">${escape(data.inquiry)}</p>
                        </td>
                        ${
                          data.subject
                            ? `
                        <td width="50%" style="padding-bottom: 16px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Sujet</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a;">${escape(data.subject)}</p>
                        </td>`
                            : "<td></td>"
                        }
                      </tr>`
                          : data.subject
                            ? `
                      <tr>
                        <td colspan="2" style="padding-bottom: 16px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Sujet</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a;">${escape(data.subject)}</p>
                        </td>
                      </tr>`
                            : ""
                      }
                    </table>

                    <!-- Message -->
                    <div style="border-top: 1px solid #e8e6e1; padding-top: 20px; margin-top: 4px;">
                      <p style="margin: 0 0 10px; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Message</p>
                      <p style="margin: 0; font-family: Georgia, serif; font-size: 15px; color: #17171a; line-height: 1.8; white-space: pre-wrap;">${escape(data.message)}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Reply CTA -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <a href="mailto:${escape(data.email)}" style="display: inline-block; background-color: #17171a; color: #ffffff; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 16px 40px; border-radius: 1px;">
                Repondre
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding: 0 40px;"><div style="border-top: 1px solid #e8e6e1;"></div></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px 36px; text-align: center;">
              <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #999; line-height: 1.6;">
                Cet email a &eacute;t&eacute; envoy&eacute; automatiquement par le syst&egrave;me Kinyn.
              </p>
              <p style="margin: 16px 0 0; font-family: Georgia, serif; font-size: 14px; letter-spacing: 3px; color: #ccc; text-transform: uppercase;">KINYN</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ──────────── Luxury HTML Email Template ──────────── */

function buildNewOrderEmailTemplate(
  data: OrderEmailData & { dashboardUrl: string },
): string {
  const formattedTotal = `${data.totalAmount.toFixed(3)} TND`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nouvelle Commande — Kinyn</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0ec; font-family: 'Georgia', 'Times New Roman', serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f0ec;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 2px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Brand Header -->
          <tr>
            <td style="background-color: #17171a; padding: 36px 40px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 32px; font-weight: 400; letter-spacing: 6px; color: #ffffff; text-transform: uppercase;">
                KINYN
              </h1>
              <div style="margin-top: 8px; width: 40px; height: 2px; background-color: #7a0c1c; display: inline-block;"></div>
            </td>
          </tr>

          <!-- Notification Badge -->
          <tr>
            <td style="padding: 32px 40px 0; text-align: center;">
              <div style="display: inline-block; background-color: #7a0c1c; color: #ffffff; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; padding: 8px 20px; border-radius: 1px;">
                Nouvelle Commande
              </div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 40px 0; text-align: center;">
              <p style="margin: 0; font-family: Georgia, serif; font-size: 18px; color: #17171a; line-height: 1.6;">
                Une nouvelle commande vient d&rsquo;&ecirc;tre pass&eacute;e sur votre boutique.
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 24px 40px;">
              <div style="border-top: 1px solid #e8e6e1;"></div>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafaf8; border: 1px solid #e8e6e1; border-radius: 2px;">
                <tr>
                  <td style="padding: 24px 28px;">
                    <!-- Order Ref -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 16px;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">R&eacute;f&eacute;rence</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 16px; color: #17171a; font-weight: 600;">${data.orderRef}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Details Grid -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="50%" style="padding-bottom: 14px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Client</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a;">${data.customerName}</p>
                        </td>
                        <td width="50%" style="padding-bottom: 14px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Articles</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a;">${data.itemCount} article${data.itemCount > 1 ? "s" : ""}</p>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom: 14px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Livraison</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a; text-transform: capitalize;">${data.shippingMethod}</p>
                        </td>
                        <td width="50%" style="padding-bottom: 14px; vertical-align: top;">
                          <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Paiement</p>
                          <p style="margin: 4px 0 0; font-family: Georgia, serif; font-size: 15px; color: #17171a;">${data.paymentMethod === "cod" ? "Contre remboursement" : "Carte bancaire"}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Total -->
                    <div style="border-top: 1px solid #e8e6e1; padding-top: 16px; margin-top: 4px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td>
                            <p style="margin: 0; font-family: Arial, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: #999;">Montant Total</p>
                          </td>
                          <td align="right">
                            <p style="margin: 0; font-family: Georgia, serif; font-size: 22px; color: #7a0c1c; font-weight: 700;">${formattedTotal}</p>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <a href="${data.dashboardUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #17171a; color: #ffffff; font-family: Arial, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 16px 40px; border-radius: 1px; transition: background-color 0.2s;">
                Voir la commande
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 1px solid #e8e6e1;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 40px 36px; text-align: center;">
              <p style="margin: 0; font-family: Arial, sans-serif; font-size: 12px; color: #999; line-height: 1.6;">
                Cet email a &eacute;t&eacute; envoy&eacute; automatiquement par le syst&egrave;me Kinyn.<br />
                Merci de ne pas r&eacute;pondre &agrave; ce message.
              </p>
              <p style="margin: 16px 0 0; font-family: Georgia, serif; font-size: 14px; letter-spacing: 3px; color: #ccc; text-transform: uppercase;">
                KINYN
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
