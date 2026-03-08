import mongoose, { Schema, type Document, type Model } from "mongoose";

/* ================================================================
   Category Model — KINYN
   ================================================================
   Three-level hierarchy: mère → sous → finale
   
   • "mere"   — Top-level category (e.g. Femme, Homme)
   • "sous"   — Subcategory under a mère (e.g. Hauts, Bas)
   • "finale" — Leaf category under a sous (e.g. T-shirt, Jean)
   
   Parent reference uses ObjectId for data integrity.
   slug is auto-generated from name for URL-friendly paths.
   ================================================================ */

/* ──────────────────── Types ──────────────────── */

export type CategoryLevel = "mere" | "sous" | "finale";
export type CategoryStatus = "active" | "hidden";

export interface ICategory extends Document {
  name: string;
  slug: string;
  level: CategoryLevel;
  parent: mongoose.Types.ObjectId | null;
  status: CategoryStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  /* Virtual / instance helpers */
  toSafeObject(): SafeCategory;
}

/** Category data safe for client responses */
export interface SafeCategory {
  id: string;
  name: string;
  slug: string;
  level: CategoryLevel;
  parent: string | null;
  parentName: string;
  status: CategoryStatus;
  order: number;
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

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, "Le nom de la catégorie est requis."],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères."],
      maxlength: [100, "Le nom ne peut pas dépasser 100 caractères."],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    level: {
      type: String,
      required: [true, "Le niveau est requis."],
      enum: {
        values: ["mere", "sous", "finale"],
        message: "Le niveau doit être mere, sous ou finale.",
      },
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["active", "hidden"],
        message: "Le statut doit être active ou hidden.",
      },
      default: "active",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ──────────────────── Indexes ──────────────────── */

categorySchema.index({ level: 1, parent: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ status: 1 });
categorySchema.index({ order: 1 });

/* ──────────────────── Pre-save: auto-generate slug ──────────────────── */

categorySchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name);
  }
});

/* ──────────────────── Validation: parent logic ──────────────────── */

categorySchema.pre("validate", function () {
  if (this.level === "mere" && this.parent) {
    throw new Error("Une catégorie mère ne peut pas avoir de parent.");
  }
  if ((this.level === "sous" || this.level === "finale") && !this.parent) {
    throw new Error(
      "Une sous-catégorie ou catégorie finale doit avoir un parent.",
    );
  }
});

/* ──────────────────── Instance Methods ──────────────────── */

categorySchema.methods.toSafeObject = function (): SafeCategory {
  const populated = this.populated("parent");
  const parentDoc = populated ? (this.parent as unknown as ICategory) : null;

  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    level: this.level,
    parent: this.parent ? this.parent.toString() : null,
    parentName: parentDoc ? parentDoc.name : "",
    status: this.status,
    order: this.order,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/* ──────────────────── Export ──────────────────── */

const Category: Model<ICategory> =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", categorySchema);

export default Category;
