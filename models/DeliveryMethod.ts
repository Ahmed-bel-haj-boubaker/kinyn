import mongoose, { Schema, type Document, type Model } from "mongoose";

/* ================================================================
   DeliveryMethod Model — KINYN
   ================================================================
   Shipping method types (e.g. Standard, Express) with pricing.
   Admin-configurable; only active methods appear at checkout.
   ================================================================ */

/* ──────────────────── Types ──────────────────── */

export type DeliveryMethodStatus = "active" | "inactive";

export interface IDeliveryMethod extends Document {
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  status: DeliveryMethodStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Safe types for client responses ─── */

export interface SafeDeliveryMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  status: DeliveryMethodStatus;
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────────── Schema ──────────────────── */

const deliveryMethodSchema = new Schema<IDeliveryMethod>(
  {
    name: {
      type: String,
      required: [true, "Le nom de la méthode est requis."],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères."],
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères."],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "La description ne peut pas dépasser 300 caractères."],
    },
    price: {
      type: Number,
      required: [true, "Le prix est requis."],
      min: [0, "Le prix ne peut pas être négatif."],
    },
    estimatedDays: {
      type: String,
      trim: true,
      default: "",
      maxlength: [50, "Le délai ne peut pas dépasser 50 caractères."],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Le statut '{VALUE}' n'est pas valide.",
      },
      default: "active",
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

deliveryMethodSchema.index({ status: 1 });
deliveryMethodSchema.index({ createdAt: -1 });

/* ──────────────────── Safe helper ──────────────────── */

export function deliveryMethodToSafe(
  doc: IDeliveryMethod | Record<string, unknown>,
): SafeDeliveryMethod {
  const d = doc as Record<string, unknown>;
  return {
    id: String(d._id ?? d.id ?? ""),
    name: (d.name as string) ?? "",
    description: (d.description as string) ?? "",
    price: (d.price as number) ?? 0,
    estimatedDays: (d.estimatedDays as string) ?? "",
    status: (d.status as DeliveryMethodStatus) ?? "active",
    createdAt: d.createdAt as Date,
    updatedAt: d.updatedAt as Date,
  };
}

/* ──────────────────── Model ──────────────────── */

const DeliveryMethod: Model<IDeliveryMethod> =
  mongoose.models.DeliveryMethod ??
  mongoose.model<IDeliveryMethod>("DeliveryMethod", deliveryMethodSchema);

export default DeliveryMethod;
