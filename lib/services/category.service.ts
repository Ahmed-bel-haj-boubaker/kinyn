import connectDB from "@/lib/mongodb";
import Category, {
  type ICategory,
  type SafeCategory,
  type CategoryLevel,
  type CategoryStatus,
} from "@/models/Category";
import mongoose from "mongoose";

/* ================================================================
   Category Service — KINYN
   ================================================================
   Server-side service layer for category CRUD operations.
   All functions connect to DB, validate, and return structured results.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────────── Helper: populate & convert to safe ──────────────── */

async function toSafe(cat: ICategory): Promise<SafeCategory> {
  if (cat.parent && !cat.populated("parent")) {
    await cat.populate("parent");
  }
  const parentDoc = cat.parent as unknown as ICategory | null;

  return {
    id: cat._id.toString(),
    name: cat.name,
    slug: cat.slug,
    level: cat.level,
    parent: cat.parent
      ? ((cat.parent as unknown as mongoose.Types.ObjectId).toString?.() ??
        cat.parent.toString())
      : null,
    parentName: parentDoc?.name ?? "",
    status: cat.status,
    order: cat.order,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  };
}

/* ── Lean document shape after populate ── */

interface LeanCategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  level: CategoryLevel;
  parent:
    | { _id: mongoose.Types.ObjectId; name: string }
    | mongoose.Types.ObjectId
    | null;
  status: CategoryStatus;
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}

/* ──────────────── List All Categories ──────────────── */

interface ListCategoriesInput {
  search?: string;
  level?: string;
  status?: string;
}

export async function listCategories(
  input: ListCategoriesInput = {},
): Promise<ServiceResult<{ categories: SafeCategory[]; total: number }>> {
  try {
    await connectDB();

    const filter: Record<string, unknown> = {};

    if (input.search?.trim()) {
      filter.name = { $regex: input.search.trim(), $options: "i" };
    }
    if (input.level && ["mere", "sous", "finale"].includes(input.level)) {
      filter.level = input.level;
    }
    if (input.status && ["active", "hidden"].includes(input.status)) {
      filter.status = input.status;
    }

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate("parent", "name")
        .sort({ order: 1, createdAt: 1 })
        .lean<LeanCategory[]>(),
      Category.countDocuments(filter),
    ]);

    // Convert lean documents to safe objects
    const safe: SafeCategory[] = categories.map((cat) => {
      const hasPopulatedParent =
        cat.parent && typeof cat.parent === "object" && "_id" in cat.parent;
      return {
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        level: cat.level,
        parent: cat.parent
          ? hasPopulatedParent
            ? (cat.parent as { _id: mongoose.Types.ObjectId })._id.toString()
            : String(cat.parent)
          : null,
        parentName: hasPopulatedParent
          ? (cat.parent as { name: string }).name
          : "",
        status: cat.status,
        order: cat.order ?? 0,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });

    return { success: true, data: { categories: safe, total } };
  } catch (err: unknown) {
    console.error("[listCategories]", err);
    return {
      success: false,
      error: "Erreur lors du chargement des catégories.",
      status: 500,
    };
  }
}

/* ──────────────── Get Single Category ──────────────── */

export async function getCategoryById(
  id: string,
): Promise<ServiceResult<SafeCategory>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const cat = await Category.findById(id).populate("parent", "name");
    if (!cat) {
      return { success: false, error: "Catégorie introuvable.", status: 404 };
    }

    return { success: true, data: await toSafe(cat) };
  } catch (err: unknown) {
    console.error("[getCategoryById]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Create Category ──────────────── */

interface CreateCategoryInput {
  name: string;
  level: CategoryLevel;
  parent?: string;
  status?: CategoryStatus;
  order?: number;
}

export async function createCategory(
  input: CreateCategoryInput,
): Promise<ServiceResult<SafeCategory>> {
  try {
    await connectDB();

    const { name, level, parent, status, order } = input;

    /* Validation */
    if (!name?.trim()) {
      return { success: false, error: "Le nom est requis.", status: 400 };
    }
    if (!level || !["mere", "sous", "finale"].includes(level)) {
      return { success: false, error: "Niveau invalide.", status: 400 };
    }

    /* Parent validation */
    let parentId: mongoose.Types.ObjectId | null = null;

    if (level === "mere") {
      if (parent) {
        return {
          success: false,
          error: "Une catégorie mère ne peut pas avoir de parent.",
          status: 400,
        };
      }
    } else {
      if (!parent) {
        return {
          success: false,
          error: "Un parent est requis pour ce niveau.",
          status: 400,
        };
      }
      if (!mongoose.isValidObjectId(parent)) {
        return { success: false, error: "ID parent invalide.", status: 400 };
      }
      const parentCat = await Category.findById(parent);
      if (!parentCat) {
        return { success: false, error: "Parent introuvable.", status: 404 };
      }
      // sous → parent must be mere, finale → parent must be sous
      if (level === "sous" && parentCat.level !== "mere") {
        return {
          success: false,
          error:
            "Une sous-catégorie doit avoir une catégorie mère comme parent.",
          status: 400,
        };
      }
      if (level === "finale" && parentCat.level !== "sous") {
        return {
          success: false,
          error:
            "Une catégorie finale doit avoir une sous-catégorie comme parent.",
          status: 400,
        };
      }
      parentId = parentCat._id as mongoose.Types.ObjectId;
    }

    const cat = await Category.create({
      name: name.trim(),
      level,
      parent: parentId,
      status: status ?? "active",
      order: order ?? 0,
    });

    await cat.populate("parent", "name");
    return { success: true, data: await toSafe(cat) };
  } catch (err: unknown) {
    console.error("[createCategory]", err);

    if (err instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(err.errors).map((e) => e.message);
      return { success: false, error: messages.join(" "), status: 400 };
    }
    return {
      success: false,
      error: "Erreur lors de la création.",
      status: 500,
    };
  }
}

/* ──────────────── Update Category ──────────────── */

interface UpdateCategoryInput {
  name?: string;
  level?: CategoryLevel;
  parent?: string | null;
  status?: CategoryStatus;
  order?: number;
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryInput,
): Promise<ServiceResult<SafeCategory>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const cat = await Category.findById(id);
    if (!cat) {
      return { success: false, error: "Catégorie introuvable.", status: 404 };
    }

    /* Apply fields */
    if (input.name !== undefined) cat.name = input.name.trim();
    if (input.status !== undefined) cat.status = input.status;
    if (input.order !== undefined) cat.order = input.order;

    /* Level + parent changes */
    const newLevel = input.level ?? cat.level;
    if (input.level !== undefined) cat.level = input.level;

    if (newLevel === "mere") {
      cat.parent = null;
    } else if (input.parent !== undefined) {
      if (!input.parent) {
        return {
          success: false,
          error: "Un parent est requis pour ce niveau.",
          status: 400,
        };
      }
      if (!mongoose.isValidObjectId(input.parent)) {
        return { success: false, error: "ID parent invalide.", status: 400 };
      }
      const parentCat = await Category.findById(input.parent);
      if (!parentCat) {
        return { success: false, error: "Parent introuvable.", status: 404 };
      }
      if (newLevel === "sous" && parentCat.level !== "mere") {
        return {
          success: false,
          error:
            "Une sous-catégorie doit avoir une catégorie mère comme parent.",
          status: 400,
        };
      }
      if (newLevel === "finale" && parentCat.level !== "sous") {
        return {
          success: false,
          error:
            "Une catégorie finale doit avoir une sous-catégorie comme parent.",
          status: 400,
        };
      }
      // Prevent self-reference
      if (input.parent === id) {
        return {
          success: false,
          error: "Une catégorie ne peut pas être son propre parent.",
          status: 400,
        };
      }
      cat.parent = parentCat._id as mongoose.Types.ObjectId;
    }

    await cat.save();
    await cat.populate("parent", "name");
    return { success: true, data: await toSafe(cat) };
  } catch (err: unknown) {
    console.error("[updateCategory]", err);

    if (err instanceof mongoose.Error.ValidationError) {
      const messages = Object.values(err.errors).map((e) => e.message);
      return { success: false, error: messages.join(" "), status: 400 };
    }
    return {
      success: false,
      error: "Erreur lors de la modification.",
      status: 500,
    };
  }
}

/* ──────────────── Delete Category ──────────────── */

export async function deleteCategory(
  id: string,
): Promise<ServiceResult<{ deletedId: string; childrenDeleted: number }>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const cat = await Category.findById(id);
    if (!cat) {
      return { success: false, error: "Catégorie introuvable.", status: 404 };
    }

    // Cascade delete: remove all children recursively
    let childrenDeleted = 0;

    if (cat.level === "mere") {
      // Delete sous-catégories and their finales
      const subs = await Category.find({ parent: cat._id, level: "sous" });
      for (const sub of subs) {
        const finalesResult = await Category.deleteMany({
          parent: sub._id,
          level: "finale",
        });
        childrenDeleted += finalesResult.deletedCount;
      }
      const subsResult = await Category.deleteMany({
        parent: cat._id,
        level: "sous",
      });
      childrenDeleted += subsResult.deletedCount;
    } else if (cat.level === "sous") {
      // Delete finales under this sous-catégorie
      const finalesResult = await Category.deleteMany({
        parent: cat._id,
        level: "finale",
      });
      childrenDeleted += finalesResult.deletedCount;
    }

    await Category.findByIdAndDelete(id);

    return {
      success: true,
      data: { deletedId: id, childrenDeleted },
    };
  } catch (err: unknown) {
    console.error("[deleteCategory]", err);
    return {
      success: false,
      error: "Erreur lors de la suppression.",
      status: 500,
    };
  }
}

/* ──────────────── Get Stats ──────────────── */

export async function getCategoryStats(): Promise<
  ServiceResult<{
    total: number;
    active: number;
    mereCount: number;
    sousCount: number;
    finaleCount: number;
  }>
> {
  try {
    await connectDB();

    const [total, active, mereCount, sousCount, finaleCount] =
      await Promise.all([
        Category.countDocuments(),
        Category.countDocuments({ status: "active" }),
        Category.countDocuments({ level: "mere" }),
        Category.countDocuments({ level: "sous" }),
        Category.countDocuments({ level: "finale" }),
      ]);

    return {
      success: true,
      data: { total, active, mereCount, sousCount, finaleCount },
    };
  } catch (err: unknown) {
    console.error("[getCategoryStats]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}
