import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import type {
  SafeProduct,
  ProductStatus,
  IProductImage,
} from "@/models/Product";
import mongoose from "mongoose";

/* ================================================================
   Wishlist Service — KINYN
   ================================================================
   Server-side service layer for wishlist operations.
   Wishlist is an array of Product ObjectIds on the User document.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ── Lean product shape after populate ── */
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
  images: IProductImage[];
  sizes: string[];
  colors: string[];
  createdAt: Date;
  updatedAt: Date;
}

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

/* ──────────────── Get Wishlist ──────────────── */

export async function getWishlist(
  userId: string,
): Promise<ServiceResult<SafeProduct[]>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, error: "ID utilisateur invalide.", status: 400 };
    }

    const user = await User.findById(userId).select("wishlist").lean<{
      wishlist: mongoose.Types.ObjectId[];
    }>();

    if (!user) {
      return { success: false, error: "Utilisateur introuvable.", status: 404 };
    }

    if (!user.wishlist || user.wishlist.length === 0) {
      return { success: true, data: [] };
    }

    const products = await Product.find({ _id: { $in: user.wishlist } })
      .populate(POPULATE_CATS)
      .lean<LeanProduct[]>();

    return { success: true, data: products.map(leanToSafe) };
  } catch (err) {
    console.error("getWishlist error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération de la liste de souhaits.",
      status: 500,
    };
  }
}

/* ──────────────── Add to Wishlist ──────────────── */

export async function addToWishlist(
  userId: string,
  productId: string,
): Promise<ServiceResult<{ added: boolean }>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, error: "ID utilisateur invalide.", status: 400 };
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { success: false, error: "ID produit invalide.", status: 400 };
    }

    /* Verify product exists */
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return { success: false, error: "Produit introuvable.", status: 404 };
    }

    /* $addToSet ensures no duplicates */
    const result = await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: new mongoose.Types.ObjectId(productId) },
    });

    if (!result) {
      return { success: false, error: "Utilisateur introuvable.", status: 404 };
    }

    return { success: true, data: { added: true } };
  } catch (err) {
    console.error("addToWishlist error:", err);
    return {
      success: false,
      error: "Erreur lors de l'ajout à la liste de souhaits.",
      status: 500,
    };
  }
}

/* ──────────────── Remove from Wishlist ──────────────── */

export async function removeFromWishlist(
  userId: string,
  productId: string,
): Promise<ServiceResult<{ removed: boolean }>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, error: "ID utilisateur invalide.", status: 400 };
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { success: false, error: "ID produit invalide.", status: 400 };
    }

    const result = await User.findByIdAndUpdate(userId, {
      $pull: { wishlist: new mongoose.Types.ObjectId(productId) },
    });

    if (!result) {
      return { success: false, error: "Utilisateur introuvable.", status: 404 };
    }

    return { success: true, data: { removed: true } };
  } catch (err) {
    console.error("removeFromWishlist error:", err);
    return {
      success: false,
      error: "Erreur lors du retrait de la liste de souhaits.",
      status: 500,
    };
  }
}

/* ──────────────── Check if product is in wishlist ──────────────── */

export async function isInWishlist(
  userId: string,
  productId: string,
): Promise<ServiceResult<{ inWishlist: boolean }>> {
  try {
    await connectDB();

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return { success: true, data: { inWishlist: false } };
    }

    const user = await User.findOne({
      _id: userId,
      wishlist: new mongoose.Types.ObjectId(productId),
    })
      .select("_id")
      .lean();

    return { success: true, data: { inWishlist: !!user } };
  } catch (err) {
    console.error("isInWishlist error:", err);
    return { success: false, error: "Erreur interne.", status: 500 };
  }
}
