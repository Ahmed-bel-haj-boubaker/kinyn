import mongoose, { Schema, type Document, type Model } from "mongoose";

/* ================================================================
   Product Model — KINYN
   ================================================================
   Linked to the Category model through 3 ObjectId references:
   • categoryMere   → a "mere" category
   • categorySous   → a "sous" category (child of mere)
   • categoryFinale → a "finale" category (child of sous)

   Images are stored as an array of URL strings (paths to uploaded files).
   First image in the array is the primary/cover image.

   Slug is auto-generated from the product name.
   ================================================================ */

/* ──────────────────── Types ──────────────────── */

export type ProductStatus = "active" | "draft" | "outofstock";

export interface IProductImage {
  url: string;
  color?: string; // empty string = no color assigned
  colorHex?: string; // hex value for custom colors, empty = use default lookup
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  sku: string;
  categoryMere: mongoose.Types.ObjectId;
  categorySous: mongoose.Types.ObjectId | null;
  categoryFinale: mongoose.Types.ObjectId | null;
  price: number;
  promoPrice: number | null;
  stock: number;
  status: ProductStatus;
  images: IProductImage[];
  sizes: string[];
  colors: string[];
  createdAt: Date;
  updatedAt: Date;
}

/** Product data safe for client responses (IDs resolved to names) */
export interface SafeProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  categoryMere: string;
  categoryMereName: string;
  categorySous: string;
  categorySousName: string;
  categoryFinale: string;
  categoryFinaleName: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  status: ProductStatus;
  images: IProductImage[];
  sizes: string[];
  colors: string[];
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────────── Helpers ──────────────────── */

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ──────────────────── Schema ──────────────────── */

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Le nom du produit est requis."],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères."],
      maxlength: [200, "Le nom ne peut pas dépasser 200 caractères."],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "La description ne peut pas dépasser 5000 caractères."],
    },
    sku: {
      type: String,
      required: [true, "Le SKU est requis."],
      trim: true,
      uppercase: true,
      unique: true,
    },
    categoryMere: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "La catégorie mère est requise."],
    },
    categorySous: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    categoryFinale: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    price: {
      type: Number,
      required: [true, "Le prix est requis."],
      min: [0, "Le prix doit être positif."],
    },
    promoPrice: {
      type: Number,
      default: null,
      min: [0, "Le prix promo doit être positif."],
    },
    stock: {
      type: Number,
      required: [true, "Le stock est requis."],
      min: [0, "Le stock ne peut pas être négatif."],
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "draft", "outofstock"],
        message: "Le statut doit être active, draft ou outofstock.",
      },
      default: "draft",
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          color: { type: String, default: "" },
          colorHex: { type: String, default: "" },
        },
      ],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ──────────────────── Indexes ──────────────────── */

productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ slug: 1 });
productSchema.index({ status: 1 });
productSchema.index({ categoryMere: 1, categorySous: 1, categoryFinale: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ name: "text", description: "text", sku: "text" });

/* ──────────────────── Pre-save: auto-generate slug ──────────────────── */

productSchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name);
  }
});

/* ──────────────────── Validation: promo < price ──────────────────── */

productSchema.pre("validate", function () {
  if (
    this.promoPrice !== null &&
    this.promoPrice !== undefined &&
    this.price !== undefined &&
    this.promoPrice >= this.price
  ) {
    throw new Error("Le prix promo doit être inférieur au prix normal.");
  }
});

/* ──────────────────── Export ──────────────────── */

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", productSchema);

export default Product;
