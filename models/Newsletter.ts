import mongoose, { Schema, Document, Model } from "mongoose";

/* ================================================================
   Newsletter Model — KINYN
   ================================================================ */

/* ──────────────── Types ──────────────── */

export type NewsletterStatus = "active" | "unsubscribed";

export interface INewsletter extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  status: NewsletterStatus;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsletterCustomer {
  id: string;
  firstName: string;
  lastName: string;
}

export interface SafeNewsletter {
  id: string;
  email: string;
  status: NewsletterStatus;
  subscribedAt: Date;
  unsubscribedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /** Populated at query time when the email matches a registered customer */
  customer: NewsletterCustomer | null;
}

/* ──────────────── Instance method helper ──────────────── */

export function newsletterToSafe(
  doc: INewsletter,
  customer: NewsletterCustomer | null = null,
): SafeNewsletter {
  return {
    id: doc._id.toString(),
    email: doc.email,
    status: doc.status,
    subscribedAt: doc.subscribedAt,
    unsubscribedAt: doc.unsubscribedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    customer,
  };
}

/* ──────────────── Schema ──────────────── */

const NewsletterSchema = new Schema<INewsletter>(
  {
    email: {
      type: String,
      required: [true, "L'email est requis."],
      trim: true,
      lowercase: true,
      unique: true,
      maxlength: [254, "L'email ne peut pas dépasser 254 caractères."],
      match: [/^\S+@\S+\.\S+$/, "Email invalide."],
    },
    status: {
      type: String,
      enum: ["active", "unsubscribed"],
      default: "active",
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    unsubscribedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

/* Indexes */
NewsletterSchema.index({ status: 1 });
NewsletterSchema.index({ email: 1 }, { unique: true });
NewsletterSchema.index({ subscribedAt: -1 });

/* ──────────────── Model ──────────────── */

const Newsletter: Model<INewsletter> =
  mongoose.models.Newsletter ??
  mongoose.model<INewsletter>("Newsletter", NewsletterSchema);

export default Newsletter;
