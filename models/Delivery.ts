import mongoose, { Schema, type Document, type Model } from "mongoose";

/* ================================================================
   DeliveryCompany Model — KINYN
   ================================================================
   Catalog of delivery companies with contact info and pricing.
   ================================================================ */

/* ──────────────────── Types ──────────────────── */

export type DeliveryCompanyStatus = "active" | "inactive";

export interface IDeliveryCompany extends Document {
  name: string;
  phone: string;
  email: string;
  address: string;
  price: number;
  status: DeliveryCompanyStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Safe types for client responses ─── */

export interface SafeDeliveryCompany {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  price: number;
  status: DeliveryCompanyStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────────── Schema ──────────────────── */

const deliveryCompanySchema = new Schema<IDeliveryCompany>(
  {
    name: {
      type: String,
      required: [true, "Le nom de la société de livraison est requis."],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères."],
      maxlength: [150, "Le nom ne peut pas dépasser 150 caractères."],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: [30, "Le téléphone ne peut pas dépasser 30 caractères."],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: [150, "L'email ne peut pas dépasser 150 caractères."],
    },
    address: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "L'adresse ne peut pas dépasser 300 caractères."],
    },
    price: {
      type: Number,
      required: [true, "Le prix de livraison est requis."],
      min: [0, "Le prix ne peut pas être négatif."],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Le statut '{VALUE}' n'est pas valide.",
      },
      default: "active",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Les notes ne peuvent pas dépasser 1000 caractères."],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

/* ──────────────────── Indexes ──────────────────── */

deliveryCompanySchema.index({ name: 1 });
deliveryCompanySchema.index({ status: 1 });
deliveryCompanySchema.index({ createdAt: -1 });

/* ──────────────────── Static: toSafe helper ──────────────────── */

export function deliveryCompanyToSafe(
  doc: IDeliveryCompany,
): SafeDeliveryCompany {
  return {
    id: doc._id.toString(),
    name: doc.name,
    phone: doc.phone,
    email: doc.email,
    address: doc.address,
    price: doc.price,
    status: doc.status,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ──────────────────── Export ──────────────────── */

const DeliveryCompany: Model<IDeliveryCompany> =
  mongoose.models.DeliveryCompany ||
  mongoose.model<IDeliveryCompany>("DeliveryCompany", deliveryCompanySchema);

export default DeliveryCompany;
