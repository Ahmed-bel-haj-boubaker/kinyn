import connectDB from "@/lib/mongodb";
import Collection, {
  type ICollection,
  type SafeCollection,
  type CollectionStatus,
} from "@/models/Collection";
import mongoose from "mongoose";

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

function toSafe(col: ICollection): SafeCollection {
  return {
    id: col._id.toString(),
    name: col.name,
    slug: col.slug,
    description: col.description,
    image: col.image,
    products: col.products.map((p) => p.toString()),
    productCount: col.products.length,
    status: col.status,
    order: col.order,
    createdAt: col.createdAt,
    updatedAt: col.updatedAt,
  };
}

interface LeanCollection {
  _id: mongoose.Types.ObjectId;
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

interface ListCollectionsInput {
  search?: string;
  status?: string;
}

export async function listCollections(
  input: ListCollectionsInput = {},
): Promise<ServiceResult<{ collections: SafeCollection[]; total: number }>> {
  try {
    await connectDB();

    const filter: Record<string, unknown> = {};

    if (input.search?.trim()) {
      filter.name = { $regex: input.search.trim(), $options: "i" };
    }
    if (input.status && ["active", "hidden"].includes(input.status)) {
      filter.status = input.status;
    }

    const [collections, total] = await Promise.all([
      Collection.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .lean<LeanCollection[]>(),
      Collection.countDocuments(filter),
    ]);

    const safe: SafeCollection[] = collections.map((col) => ({
      id: col._id.toString(),
      name: col.name,
      slug: col.slug,
      description: col.description,
      image: col.image,
      products: col.products.map((p) => p.toString()),
      productCount: col.products.length,
      status: col.status,
      order: col.order ?? 0,
      createdAt: col.createdAt,
      updatedAt: col.updatedAt,
    }));

    return { success: true, data: { collections: safe, total } };
  } catch (err: unknown) {
    console.error("[listCollections]", err);
    return {
      success: false,
      error: "Erreur lors du chargement des collections.",
      status: 500,
    };
  }
}

export async function getCollectionById(
  id: string,
): Promise<ServiceResult<SafeCollection>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const col = await Collection.findById(id);
    if (!col) {
      return { success: false, error: "Collection introuvable.", status: 404 };
    }

    return { success: true, data: toSafe(col) };
  } catch (err: unknown) {
    console.error("[getCollectionById]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

interface CreateCollectionInput {
  name: string;
  description?: string;
  image?: string;
  products?: string[];
  status?: CollectionStatus;
  order?: number;
}

export async function createCollection(
  input: CreateCollectionInput,
): Promise<ServiceResult<SafeCollection>> {
  try {
    await connectDB();

    const { name, description, image, products, status, order } = input;

    if (!name?.trim()) {
      return { success: false, error: "Le nom est requis.", status: 400 };
    }

    // Validate product IDs
    const productIds: mongoose.Types.ObjectId[] = [];
    if (products && products.length > 0) {
      for (const pid of products) {
        if (!mongoose.isValidObjectId(pid)) {
          return {
            success: false,
            error: `ID produit invalide : ${pid}`,
            status: 400,
          };
        }
        productIds.push(new mongoose.Types.ObjectId(pid));
      }
    }

    const col = await Collection.create({
      name: name.trim(),
      description: description?.trim() ?? "",
      image: image?.trim() ?? "",
      products: productIds,
      status: status ?? "active",
      order: order ?? 0,
    });

    return { success: true, data: toSafe(col) };
  } catch (err: unknown) {
    console.error("[createCollection]", err);

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

interface UpdateCollectionInput {
  name?: string;
  description?: string;
  image?: string;
  products?: string[];
  status?: CollectionStatus;
  order?: number;
}

export async function updateCollection(
  id: string,
  input: UpdateCollectionInput,
): Promise<ServiceResult<SafeCollection>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const col = await Collection.findById(id);
    if (!col) {
      return { success: false, error: "Collection introuvable.", status: 404 };
    }

    if (input.name !== undefined) col.name = input.name.trim();
    if (input.description !== undefined)
      col.description = input.description.trim();
    if (input.image !== undefined) col.image = input.image.trim();
    if (input.status !== undefined) col.status = input.status;
    if (input.order !== undefined) col.order = input.order;

    if (input.products !== undefined) {
      const productIds: mongoose.Types.ObjectId[] = [];
      for (const pid of input.products) {
        if (!mongoose.isValidObjectId(pid)) {
          return {
            success: false,
            error: `ID produit invalide : ${pid}`,
            status: 400,
          };
        }
        productIds.push(new mongoose.Types.ObjectId(pid));
      }
      col.products = productIds;
    }

    await col.save();
    return { success: true, data: toSafe(col) };
  } catch (err: unknown) {
    console.error("[updateCollection]", err);

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

export async function deleteCollection(
  id: string,
): Promise<ServiceResult<{ deletedId: string }>> {
  try {
    await connectDB();

    if (!mongoose.isValidObjectId(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const col = await Collection.findById(id);
    if (!col) {
      return { success: false, error: "Collection introuvable.", status: 404 };
    }

    await Collection.findByIdAndDelete(id);

    return { success: true, data: { deletedId: id } };
  } catch (err: unknown) {
    console.error("[deleteCollection]", err);
    return {
      success: false,
      error: "Erreur lors de la suppression.",
      status: 500,
    };
  }
}

export async function getCollectionStats(): Promise<
  ServiceResult<{ total: number; active: number; hidden: number }>
> {
  try {
    await connectDB();

    const [total, active, hidden] = await Promise.all([
      Collection.countDocuments(),
      Collection.countDocuments({ status: "active" }),
      Collection.countDocuments({ status: "hidden" }),
    ]);

    return { success: true, data: { total, active, hidden } };
  } catch (err: unknown) {
    console.error("[getCollectionStats]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}
