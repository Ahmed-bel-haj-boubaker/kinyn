import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CollectionStatus = "active" | "hidden";

export interface ICollection extends Document {
  name: string;
  slug: string;
  description: string;
  image: string;
  products: mongoose.Types.ObjectId[];
  status: CollectionStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: string[];
  productCount: number;
  status: CollectionStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const collectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: [true, "Le nom de la collection est requis."],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères."],
      maxlength: [150, "Le nom ne peut pas dépasser 150 caractères."],
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
      maxlength: [2000, "La description ne peut pas dépasser 2000 caractères."],
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    products: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
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

collectionSchema.index({ slug: 1 });
collectionSchema.index({ status: 1 });
collectionSchema.index({ order: 1 });

collectionSchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name);
  }
});

const Collection: Model<ICollection> =
  mongoose.models.Collection ||
  mongoose.model<ICollection>("Collection", collectionSchema);

export default Collection;
