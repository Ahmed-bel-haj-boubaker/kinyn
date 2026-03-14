import mongoose, { Schema, type Document, type Model } from "mongoose";

/* ================================================================
   Shipment Model — KINYN
   ================================================================
   Tracks the assignment of an order to a delivery company.
   
   Status flow:
   pending → picked_up → in_transit → delivered
   Any status can transition to → failed
   ================================================================ */

/* ──────────────────── Types ──────────────────── */

export type ShipmentStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

export interface IShipment extends Document {
  deliveryCompany: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  status: ShipmentStatus;
  trackingNumber: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Safe types for client responses ─── */

export interface SafeShipment {
  id: string;
  deliveryCompany: string;
  order: string;
  status: ShipmentStatus;
  trackingNumber: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────────── Schema ──────────────────── */

const shipmentSchema = new Schema<IShipment>(
  {
    deliveryCompany: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryCompany",
      required: [true, "La société de livraison est requise."],
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "La commande est requise."],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "picked_up", "in_transit", "delivered", "failed"],
        message: "Le statut '{VALUE}' n'est pas valide.",
      },
      default: "pending",
    },
    trackingNumber: {
      type: String,
      trim: true,
      default: "",
      maxlength: [
        100,
        "Le numéro de suivi ne peut pas dépasser 100 caractères.",
      ],
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

shipmentSchema.index({ status: 1 });
shipmentSchema.index({ createdAt: -1 });
shipmentSchema.index({ deliveryCompany: 1, order: 1 });

/* ──────────────────── Static: toSafe helper ──────────────────── */

export function shipmentToSafe(doc: IShipment): SafeShipment {
  return {
    id: doc._id.toString(),
    deliveryCompany: doc.deliveryCompany.toString(),
    order: doc.order.toString(),
    status: doc.status,
    trackingNumber: doc.trackingNumber,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ──────────────────── Export ──────────────────── */

const Shipment: Model<IShipment> =
  mongoose.models.Shipment ||
  mongoose.model<IShipment>("Shipment", shipmentSchema);

export default Shipment;
