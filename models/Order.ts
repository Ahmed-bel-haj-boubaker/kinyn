import mongoose, { Schema, type Document, type Model } from "mongoose";

/* ================================================================
   Order Model — KINYN
   ================================================================
   Standalone collection for orders with references to User & Product.
   
   Status flow:
   pending → confirmed → processing → shipped → delivered
   Any status can transition to → cancelled
   delivered → returned
   ================================================================ */

/* ──────────────────── Types ──────────────────── */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentMethod = "card" | "cod";
export type ShippingMethod = "standard" | "express";

/* ─── Sub-document interfaces ─── */

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface IShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
}

export interface IOrder extends Document {
  ref: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: IShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ─── Safe types for client responses ─── */

export interface SafeOrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface SafeShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
}

export interface SafeOrder {
  id: string;
  ref: string;
  user: string;
  items: SafeOrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: SafeShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────────── Helpers ──────────────────── */

/**
 * Generate a unique order reference: KNY-YYYYMMDD-XXXXX
 */
function generateOrderRef(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `KNY-${date}-${rand}`;
}

/* ──────────────────── Schema ──────────────────── */

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Le produit est requis."],
    },
    name: { type: String, required: true },
    image: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: "" },
    color: { type: String, default: "" },
  },
  { _id: false },
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    ref: {
      type: String,
      required: true,
      unique: true,
      default: generateOrderRef,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'utilisateur est requis."],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: "La commande doit contenir au moins un article.",
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "delivered",
          "cancelled",
          "returned",
        ],
        message: "Le statut '{VALUE}' n'est pas valide.",
      },
      default: "pending",
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    shippingMethod: {
      type: String,
      enum: ["standard", "express"],
      default: "standard",
    },
    paymentMethod: {
      type: String,
      enum: ["card", "cod"],
      default: "cod",
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

orderSchema.index({ ref: 1 }, { unique: true });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

/* ──────────────────── Pre-save: ensure unique ref ──────────────────── */

orderSchema.pre("save", async function () {
  if (this.isNew && !this.ref) {
    let ref = generateOrderRef();
    const Order = this.constructor as Model<IOrder>;
    let exists = await Order.exists({ ref });
    let attempts = 0;
    while (exists && attempts < 10) {
      ref = generateOrderRef();
      exists = await Order.exists({ ref });
      attempts++;
    }
    this.ref = ref;
  }
});

/* ──────────────────── Static: toSafe helper ──────────────────── */

export function orderToSafe(doc: IOrder): SafeOrder {
  return {
    id: doc._id.toString(),
    ref: doc.ref,
    user: doc.user.toString(),
    items: doc.items.map((item) => ({
      product: item.product.toString(),
      name: item.name,
      image: item.image,
      price: item.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    })),
    subtotal: doc.subtotal,
    shippingCost: doc.shippingCost,
    totalAmount: doc.totalAmount,
    status: doc.status,
    shippingAddress: {
      firstName: doc.shippingAddress.firstName,
      lastName: doc.shippingAddress.lastName,
      phone: doc.shippingAddress.phone,
      country: doc.shippingAddress.country,
      city: doc.shippingAddress.city,
      address: doc.shippingAddress.address,
      postalCode: doc.shippingAddress.postalCode,
    },
    shippingMethod: doc.shippingMethod,
    paymentMethod: doc.paymentMethod,
    notes: doc.notes,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/* ──────────────────── Export ──────────────────── */

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default Order;
