import mongoose, { Schema, Document, Model } from "mongoose";

/* ================================================================
   Newsletter Campaign Model — KINYN
   ================================================================
   Stores reusable email templates / campaigns that admins
   can create and send to all active newsletter subscribers.
   ================================================================ */

/* ──────────────── Types ──────────────── */

export type CampaignType =
  | "promotion"
  | "new_arrival"
  | "collection"
  | "announcement"
  | "custom";

export type CampaignStatus = "draft" | "sent";

export interface ICampaignProduct {
  name: string;
  slug: string;
  image: string;
  price: number;
  promoPrice?: number;
}

export interface ICampaignCollection {
  name: string;
  slug: string;
  image: string;
}

export interface INewsletterCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  subject: string;
  type: CampaignType;
  heading: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  products: ICampaignProduct[];
  collections: ICampaignCollection[];
  status: CampaignStatus;
  sentAt: Date | null;
  sentCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeCampaign {
  id: string;
  subject: string;
  type: CampaignType;
  heading: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  products: ICampaignProduct[];
  collections: ICampaignCollection[];
  status: CampaignStatus;
  sentAt: Date | null;
  sentCount: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────── Helper ──────────────── */

export function campaignToSafe(doc: INewsletterCampaign): SafeCampaign {
  return {
    id: doc._id.toString(),
    subject: doc.subject,
    type: doc.type,
    heading: doc.heading,
    body: doc.body,
    ctaText: doc.ctaText,
    ctaUrl: doc.ctaUrl,
    products: doc.products,
    collections: doc.collections,
    status: doc.status,
    sentAt: doc.sentAt,
    sentCount: doc.sentCount,
    createdBy: doc.createdBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ──────────────── Schema ──────────────── */

const CampaignProductSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    promoPrice: { type: Number, default: undefined },
  },
  { _id: false },
);

const CampaignCollectionSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, required: true },
  },
  { _id: false },
);

const NewsletterCampaignSchema = new Schema<INewsletterCampaign>(
  {
    subject: {
      type: String,
      required: [true, "Le sujet est requis."],
      trim: true,
      maxlength: [200, "Le sujet ne peut pas dépasser 200 caractères."],
    },
    type: {
      type: String,
      enum: [
        "promotion",
        "new_arrival",
        "collection",
        "announcement",
        "custom",
      ],
      required: true,
      default: "custom",
    },
    heading: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Le titre ne peut pas dépasser 300 caractères."],
    },
    body: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "Le contenu ne peut pas dépasser 5000 caractères."],
    },
    ctaText: {
      type: String,
      trim: true,
      default: "Découvrir",
      maxlength: [
        100,
        "Le texte du bouton ne peut pas dépasser 100 caractères.",
      ],
    },
    ctaUrl: {
      type: String,
      trim: true,
      default: "",
    },
    products: {
      type: [CampaignProductSchema],
      default: [],
      validate: [
        (v: ICampaignProduct[]) => v.length <= 6,
        "Maximum 6 produits par campagne.",
      ],
    },
    collections: {
      type: [CampaignCollectionSchema],
      default: [],
      validate: [
        (v: ICampaignCollection[]) => v.length <= 6,
        "Maximum 6 collections par campagne.",
      ],
    },
    status: {
      type: String,
      enum: ["draft", "sent"],
      default: "draft",
    },
    sentAt: {
      type: Date,
      default: null,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

/* Indexes */
NewsletterCampaignSchema.index({ status: 1, createdAt: -1 });
NewsletterCampaignSchema.index({ type: 1 });

/* ──────────────── Model ──────────────── */

const NewsletterCampaign: Model<INewsletterCampaign> =
  mongoose.models.NewsletterCampaign ??
  mongoose.model<INewsletterCampaign>(
    "NewsletterCampaign",
    NewsletterCampaignSchema,
  );

export default NewsletterCampaign;
