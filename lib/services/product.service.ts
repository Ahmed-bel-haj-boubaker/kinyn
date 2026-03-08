import connectDB from "@/lib/mongodb";
import Product, {
  type SafeProduct,
  type ProductStatus,
} from "@/models/Product";
import Category from "@/models/Category";
import mongoose from "mongoose";

/* ================================================================
   Product Service — KINYN
   ================================================================
   Server-side service layer for product CRUD operations.
   All functions connect to DB, validate, and return structured results.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────── Lean document shape after populate ──────────── */

interface PopulatedCatRef {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface LeanProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  sku: string;
  categoryMere: PopulatedCatRef | mongoose.Types.ObjectId;
  categorySous: PopulatedCatRef | mongoose.Types.ObjectId | null;
  categoryFinale: PopulatedCatRef | mongoose.Types.ObjectId | null;
  price: number;
  promoPrice: number | null;
  stock: number;
  status: ProductStatus;
  images: string[];
  sizes: string[];
  colors: string[];
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────── Helper: resolve populated refs ──────────────── */

function resolveCatRef(ref: PopulatedCatRef | mongoose.Types.ObjectId | null): {
  id: string;
  name: string;
} {
  if (!ref) return { id: "", name: "" };
  if (typeof ref === "object" && "_id" in ref && "name" in ref) {
    return {
      id: (ref as PopulatedCatRef)._id.toString(),
      name: (ref as PopulatedCatRef).name,
    };
  }
  return { id: String(ref), name: "" };
}

function leanToSafe(doc: LeanProduct): SafeProduct {
  const mere = resolveCatRef(doc.categoryMere);
  const sous = resolveCatRef(doc.categorySous);
  const finale = resolveCatRef(doc.categoryFinale);

  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    description: doc.description,
    sku: doc.sku,
    categoryMere: mere.id,
    categoryMereName: mere.name,
    categorySous: sous.id,
    categorySousName: sous.name,
    categoryFinale: finale.id,
    categoryFinaleName: finale.name,
    price: doc.price,
    promoPrice: doc.promoPrice,
    stock: doc.stock,
    status: doc.status,
    images: doc.images ?? [],
    sizes: doc.sizes ?? [],
    colors: doc.colors ?? [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const POPULATE_CATS = [
  { path: "categoryMere", select: "name" },
  { path: "categorySous", select: "name" },
  { path: "categoryFinale", select: "name" },
];

/* ──────────────── List Products ──────────────── */

interface ListProductsInput {
  search?: string;
  categoryMere?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listProducts(
  input: ListProductsInput = {},
): Promise<ServiceResult<{ products: SafeProduct[]; total: number }>> {
  try {
    await connectDB();

    const filter: Record<string, unknown> = {};

    if (input.search?.trim()) {
      const q = input.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { sku: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    if (input.categoryMere && mongoose.isValidObjectId(input.categoryMere)) {
      filter.categoryMere = input.categoryMere;
    }
    if (
      input.status &&
      ["active", "draft", "outofstock"].includes(input.status)
    ) {
      filter.status = input.status;
    }

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate(POPULATE_CATS)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<LeanProduct[]>(),
      Product.countDocuments(filter),
    ]);

    const safe = products.map(leanToSafe);
    return { success: true, data: { products: safe, total } };
  } catch (err: unknown) {
    console.error("[listProducts]", err);
    return {
      success: false,
      error: "Erreur lors du chargement des produits.",
      status: 500,
    };
  }
}

/* ──────────────── Get Single Product ──────────────── */

export async function getProductById(
  id: string,
): Promise<ServiceResult<SafeProduct>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const product = await Product.findById(id)
      .populate(POPULATE_CATS)
      .lean<LeanProduct>();
    if (!product) {
      return { success: false, error: "Produit introuvable.", status: 404 };
    }

    return { success: true, data: leanToSafe(product) };
  } catch (err: unknown) {
    console.error("[getProductById]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Create Product ──────────────── */

interface CreateProductInput {
  name: string;
  description?: string;
  sku: string;
  categoryMere: string;
  categorySous?: string;
  categoryFinale?: string;
  price: number;
  promoPrice?: number | null;
  stock: number;
  status?: ProductStatus;
  images?: string[];
  sizes?: string[];
  colors?: string[];
}

export async function createProduct(
  input: CreateProductInput,
): Promise<ServiceResult<SafeProduct>> {
  try {
    await connectDB();

    const {
      name,
      description,
      sku,
      categoryMere,
      categorySous,
      categoryFinale,
      price,
      promoPrice,
      stock,
      status,
      images,
      sizes,
      colors,
    } = input;

    /* Basic validation */
    if (!name?.trim())
      return { success: false, error: "Le nom est requis.", status: 400 };
    if (!sku?.trim())
      return { success: false, error: "Le SKU est requis.", status: 400 };
    if (price === undefined || price < 0)
      return { success: false, error: "Prix invalide.", status: 400 };
    if (stock === undefined || stock < 0)
      return { success: false, error: "Stock invalide.", status: 400 };

    /* Validate categoryMere */
    if (!categoryMere || !mongoose.isValidObjectId(categoryMere)) {
      return { success: false, error: "Catégorie mère invalide.", status: 400 };
    }
    const mereCat = await Category.findById(categoryMere);
    if (!mereCat || mereCat.level !== "mere") {
      return {
        success: false,
        error: "La catégorie mère est introuvable ou invalide.",
        status: 400,
      };
    }

    /* Validate categorySous if provided */
    let sousId: mongoose.Types.ObjectId | null = null;
    if (categorySous) {
      if (!mongoose.isValidObjectId(categorySous)) {
        return {
          success: false,
          error: "Sous-catégorie invalide.",
          status: 400,
        };
      }
      const sousCat = await Category.findById(categorySous);
      if (!sousCat || sousCat.level !== "sous") {
        return {
          success: false,
          error: "Sous-catégorie introuvable ou invalide.",
          status: 400,
        };
      }
      if (sousCat.parent?.toString() !== categoryMere) {
        return {
          success: false,
          error:
            "La sous-catégorie n'appartient pas à la catégorie mère sélectionnée.",
          status: 400,
        };
      }
      sousId = sousCat._id as mongoose.Types.ObjectId;
    }

    /* Validate categoryFinale if provided */
    let finaleId: mongoose.Types.ObjectId | null = null;
    if (categoryFinale) {
      if (!mongoose.isValidObjectId(categoryFinale)) {
        return {
          success: false,
          error: "Catégorie finale invalide.",
          status: 400,
        };
      }
      const finaleCat = await Category.findById(categoryFinale);
      if (!finaleCat || finaleCat.level !== "finale") {
        return {
          success: false,
          error: "Catégorie finale introuvable ou invalide.",
          status: 400,
        };
      }
      if (!sousId || finaleCat.parent?.toString() !== sousId.toString()) {
        return {
          success: false,
          error:
            "La catégorie finale n'appartient pas à la sous-catégorie sélectionnée.",
          status: 400,
        };
      }
      finaleId = finaleCat._id as mongoose.Types.ObjectId;
    }

    /* Check SKU uniqueness */
    const existing = await Product.findOne({ sku: sku.trim().toUpperCase() });
    if (existing) {
      return { success: false, error: "Ce SKU est déjà utilisé.", status: 409 };
    }

    const product = await Product.create({
      name: name.trim(),
      description: description?.trim() ?? "",
      sku: sku.trim(),
      categoryMere: mereCat._id,
      categorySous: sousId,
      categoryFinale: finaleId,
      price,
      promoPrice: promoPrice ?? null,
      stock,
      status: status ?? "draft",
      images: images ?? [],
      sizes: sizes ?? [],
      colors: colors ?? [],
    });

    const populated = await Product.findById(product._id)
      .populate(POPULATE_CATS)
      .lean<LeanProduct>();
    return { success: true, data: leanToSafe(populated!) };
  } catch (err: unknown) {
    console.error("[createProduct]", err);
    if (err instanceof Error && err.name === "ValidationError") {
      const mongoErr = err as mongoose.Error.ValidationError;
      const messages = Object.values(mongoErr.errors).map((e) => e.message);
      return { success: false, error: messages.join(" "), status: 400 };
    }
    if (
      err instanceof Error &&
      "code" in err &&
      (err as Record<string, unknown>).code === 11000
    ) {
      return { success: false, error: "Ce SKU est déjà utilisé.", status: 409 };
    }
    return {
      success: false,
      error: "Erreur lors de la création.",
      status: 500,
    };
  }
}

/* ──────────────── Update Product ──────────────── */

interface UpdateProductInput {
  name?: string;
  description?: string;
  sku?: string;
  categoryMere?: string;
  categorySous?: string | null;
  categoryFinale?: string | null;
  price?: number;
  promoPrice?: number | null;
  stock?: number;
  status?: ProductStatus;
  images?: string[];
  sizes?: string[];
  colors?: string[];
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput,
): Promise<ServiceResult<SafeProduct>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const product = await Product.findById(id);
    if (!product) {
      return { success: false, error: "Produit introuvable.", status: 404 };
    }

    /* Simple fields */
    if (input.name !== undefined) product.name = input.name.trim();
    if (input.description !== undefined)
      product.description = input.description.trim();
    if (input.price !== undefined) product.price = input.price;
    if (input.promoPrice !== undefined) product.promoPrice = input.promoPrice;
    if (input.stock !== undefined) product.stock = input.stock;
    if (input.status !== undefined) product.status = input.status;
    if (input.images !== undefined) product.images = input.images;
    if (input.sizes !== undefined) product.sizes = input.sizes;
    if (input.colors !== undefined) product.colors = input.colors;

    /* SKU update */
    if (input.sku !== undefined) {
      const upper = input.sku.trim().toUpperCase();
      if (upper !== product.sku) {
        const dup = await Product.findOne({
          sku: upper,
          _id: { $ne: product._id },
        });
        if (dup) {
          return {
            success: false,
            error: "Ce SKU est déjà utilisé.",
            status: 409,
          };
        }
        product.sku = upper;
      }
    }

    /* Category updates */
    const newMereId = input.categoryMere ?? product.categoryMere?.toString();
    if (input.categoryMere !== undefined) {
      if (!mongoose.isValidObjectId(input.categoryMere)) {
        return {
          success: false,
          error: "Catégorie mère invalide.",
          status: 400,
        };
      }
      const mereCat = await Category.findById(input.categoryMere);
      if (!mereCat || mereCat.level !== "mere") {
        return {
          success: false,
          error: "Catégorie mère introuvable ou invalide.",
          status: 400,
        };
      }
      product.categoryMere = mereCat._id as mongoose.Types.ObjectId;
    }

    if (input.categorySous !== undefined) {
      if (input.categorySous === null || input.categorySous === "") {
        product.categorySous = null;
        product.categoryFinale = null;
      } else {
        if (!mongoose.isValidObjectId(input.categorySous)) {
          return {
            success: false,
            error: "Sous-catégorie invalide.",
            status: 400,
          };
        }
        const sousCat = await Category.findById(input.categorySous);
        if (!sousCat || sousCat.level !== "sous") {
          return {
            success: false,
            error: "Sous-catégorie introuvable ou invalide.",
            status: 400,
          };
        }
        if (sousCat.parent?.toString() !== newMereId) {
          return {
            success: false,
            error: "La sous-catégorie n'appartient pas à la catégorie mère.",
            status: 400,
          };
        }
        product.categorySous = sousCat._id as mongoose.Types.ObjectId;
      }
    }

    if (input.categoryFinale !== undefined) {
      if (input.categoryFinale === null || input.categoryFinale === "") {
        product.categoryFinale = null;
      } else {
        if (!mongoose.isValidObjectId(input.categoryFinale)) {
          return {
            success: false,
            error: "Catégorie finale invalide.",
            status: 400,
          };
        }
        const finaleCat = await Category.findById(input.categoryFinale);
        if (!finaleCat || finaleCat.level !== "finale") {
          return {
            success: false,
            error: "Catégorie finale introuvable ou invalide.",
            status: 400,
          };
        }
        const sousRef = product.categorySous?.toString();
        if (!sousRef || finaleCat.parent?.toString() !== sousRef) {
          return {
            success: false,
            error: "La catégorie finale n'appartient pas à la sous-catégorie.",
            status: 400,
          };
        }
        product.categoryFinale = finaleCat._id as mongoose.Types.ObjectId;
      }
    }

    await product.save();

    const populated = await Product.findById(product._id)
      .populate(POPULATE_CATS)
      .lean<LeanProduct>();
    return { success: true, data: leanToSafe(populated!) };
  } catch (err: unknown) {
    console.error("[updateProduct]", err);
    if (err instanceof Error && err.name === "ValidationError") {
      const mongoErr = err as mongoose.Error.ValidationError;
      const messages = Object.values(mongoErr.errors).map((e) => e.message);
      return { success: false, error: messages.join(" "), status: 400 };
    }
    if (
      err instanceof Error &&
      "code" in err &&
      (err as Record<string, unknown>).code === 11000
    ) {
      return { success: false, error: "Ce SKU est déjà utilisé.", status: 409 };
    }
    return {
      success: false,
      error: "Erreur lors de la modification.",
      status: 500,
    };
  }
}

/* ──────────────── Delete Product ──────────────── */

export async function deleteProduct(
  id: string,
): Promise<ServiceResult<{ deletedId: string }>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return { success: false, error: "Produit introuvable.", status: 404 };
    }

    return { success: true, data: { deletedId: id } };
  } catch (err: unknown) {
    console.error("[deleteProduct]", err);
    return {
      success: false,
      error: "Erreur lors de la suppression.",
      status: 500,
    };
  }
}

/* ──────────────── Get Stats ──────────────── */

export async function getProductStats(): Promise<
  ServiceResult<{
    total: number;
    active: number;
    draft: number;
    outofstock: number;
    lowStock: number;
  }>
> {
  try {
    await connectDB();

    const [total, active, draft, outofstock, lowStock] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "active" }),
      Product.countDocuments({ status: "draft" }),
      Product.countDocuments({ status: "outofstock" }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 5 } }),
    ]);

    return {
      success: true,
      data: { total, active, draft, outofstock, lowStock },
    };
  } catch (err: unknown) {
    console.error("[getProductStats]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}
