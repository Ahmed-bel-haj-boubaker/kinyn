import mongoose, { Schema, Document, Model } from "mongoose";

/* ================================================================
   FAQ Model — KINYN
   ================================================================ */

/* ──────────────── Types ──────────────── */

export type FAQStatus = "published" | "draft";

export interface IFAQ extends Document {
  _id: mongoose.Types.ObjectId;
  question: string;
  answer: string;
  category: string;
  status: FAQStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeFAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: FAQStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────── Instance method helper ──────────────── */

export function faqToSafe(doc: IFAQ): SafeFAQ {
  return {
    id: doc._id.toString(),
    question: doc.question,
    answer: doc.answer,
    category: doc.category,
    status: doc.status,
    order: doc.order,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ──────────────── Schema ──────────────── */

const FAQSchema = new Schema<IFAQ>(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      trim: true,
      default: "Général",
    },
    status: {
      type: String,
      enum: ["published", "draft"],
      default: "draft",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

/* Indexes */
FAQSchema.index({ status: 1, order: 1 });
FAQSchema.index({ category: 1 });

/* ──────────────── Model ──────────────── */

const FAQ: Model<IFAQ> =
  mongoose.models.FAQ ?? mongoose.model<IFAQ>("FAQ", FAQSchema);

export default FAQ;
