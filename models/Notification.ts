import mongoose, { Schema, type Document } from "mongoose";

/* ================================================================
   Notification Model — KINYN
   ================================================================
   Stores admin notifications for real-time dashboard updates.
   
   Types: order, system, delivery, stock, user
   ================================================================ */

/* ──────────────────── Types ──────────────────── */

export type NotificationType =
  | "order"
  | "system"
  | "delivery"
  | "stock"
  | "user";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ──────────────────── Schema ──────────────────── */

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'identifiant de l'administrateur est requis."],
      index: true,
    },
    type: {
      type: String,
      enum: ["order", "system", "delivery", "stock", "user"],
      required: [true, "Le type de notification est requis."],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Le titre de la notification est requis."],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, "Le message de la notification est requis."],
      trim: true,
      maxlength: 1000,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

/* ─── Compound indexes ─── */
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

/* ─── Conversion helper ─── */

export function notificationToSafe(doc: INotification): SafeNotification {
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    orderId: doc.orderId?.toString(),
    isRead: doc.isRead,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/* ──────────────────── Model ──────────────────── */

const Notification =
  (mongoose.models.Notification as mongoose.Model<INotification>) ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
