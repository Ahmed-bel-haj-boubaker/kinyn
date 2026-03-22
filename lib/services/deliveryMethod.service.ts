import connectDB from "@/lib/mongodb";
import DeliveryMethod, {
  deliveryMethodToSafe,
  type SafeDeliveryMethod,
  type DeliveryMethodStatus,
  type IDeliveryMethod,
} from "@/models/DeliveryMethod";
import mongoose from "mongoose";

/* ================================================================
   Delivery Method Service — KINYN
   ================================================================
   Server-side service layer for delivery method CRUD operations.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────────── Create ──────────────── */

interface CreateMethodInput {
  name: string;
  description?: string;
  price: number;
  estimatedDays?: string;
}

export async function createDeliveryMethod(
  input: CreateMethodInput,
): Promise<ServiceResult<SafeDeliveryMethod>> {
  try {
    await connectDB();

    if (!input.name?.trim()) {
      return { success: false, error: "Le nom est requis.", status: 400 };
    }
    if (input.price == null || input.price < 0) {
      return {
        success: false,
        error: "Le prix est requis et doit être positif.",
        status: 400,
      };
    }

    const doc = await DeliveryMethod.create({
      name: input.name.trim(),
      description: input.description?.trim() || "",
      price: input.price,
      estimatedDays: input.estimatedDays?.trim() || "",
    });

    return { success: true, data: deliveryMethodToSafe(doc) };
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      const first = Object.values(err.errors)[0];
      return {
        success: false,
        error: first?.message ?? "Validation échouée.",
        status: 400,
      };
    }
    console.error("[createDeliveryMethod]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── List ──────────────── */

interface ListMethodsInput {
  status?: string;
  page?: number;
  limit?: number;
}

export async function listDeliveryMethods(
  input: ListMethodsInput = {},
): Promise<ServiceResult<{ methods: SafeDeliveryMethod[]; total: number }>> {
  try {
    await connectDB();

    const filter: Record<string, unknown> = {};
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));
    const skip = (page - 1) * limit;

    if (input.status && ["active", "inactive"].includes(input.status)) {
      filter.status = input.status;
    }

    const [docs, total] = await Promise.all([
      DeliveryMethod.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<IDeliveryMethod[]>(),
      DeliveryMethod.countDocuments(filter),
    ]);

    return {
      success: true,
      data: { methods: docs.map(deliveryMethodToSafe), total },
    };
  } catch (err) {
    console.error("[listDeliveryMethods]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Get by ID ──────────────── */

export async function getDeliveryMethodById(
  id: string,
): Promise<ServiceResult<SafeDeliveryMethod>> {
  try {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }
    const doc = await DeliveryMethod.findById(id).lean<IDeliveryMethod>();
    if (!doc)
      return { success: false, error: "Méthode introuvable.", status: 404 };
    return { success: true, data: deliveryMethodToSafe(doc) };
  } catch {
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Update ──────────────── */

interface UpdateMethodInput {
  name?: string;
  description?: string;
  price?: number;
  estimatedDays?: string;
  status?: DeliveryMethodStatus;
}

export async function updateDeliveryMethod(
  id: string,
  input: UpdateMethodInput,
): Promise<ServiceResult<SafeDeliveryMethod>> {
  try {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }

    const doc = await DeliveryMethod.findById(id);
    if (!doc)
      return { success: false, error: "Méthode introuvable.", status: 404 };

    if (input.name !== undefined) doc.name = input.name.trim();
    if (input.description !== undefined)
      doc.description = input.description.trim();
    if (input.price !== undefined) doc.price = input.price;
    if (input.estimatedDays !== undefined)
      doc.estimatedDays = input.estimatedDays.trim();
    if (input.status !== undefined) doc.status = input.status;

    await doc.save();
    return { success: true, data: deliveryMethodToSafe(doc) };
  } catch (err: unknown) {
    if (err instanceof mongoose.Error.ValidationError) {
      const first = Object.values(err.errors)[0];
      return {
        success: false,
        error: first?.message ?? "Validation échouée.",
        status: 400,
      };
    }
    console.error("[updateDeliveryMethod]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Delete ──────────────── */

export async function deleteDeliveryMethod(
  id: string,
): Promise<ServiceResult<null>> {
  try {
    await connectDB();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "ID invalide.", status: 400 };
    }
    const doc = await DeliveryMethod.findByIdAndDelete(id);
    if (!doc)
      return { success: false, error: "Méthode introuvable.", status: 404 };
    return { success: true, data: null };
  } catch {
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Stats ──────────────── */

export async function getDeliveryMethodStats(): Promise<
  ServiceResult<{ total: number; active: number; inactive: number }>
> {
  try {
    await connectDB();
    const [total, active, inactive] = await Promise.all([
      DeliveryMethod.countDocuments(),
      DeliveryMethod.countDocuments({ status: "active" }),
      DeliveryMethod.countDocuments({ status: "inactive" }),
    ]);
    return { success: true, data: { total, active, inactive } };
  } catch (err) {
    console.error("[getDeliveryMethodStats]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── List active (public) ──────────────── */

export async function listActiveDeliveryMethods(): Promise<
  ServiceResult<SafeDeliveryMethod[]>
> {
  try {
    await connectDB();
    const docs = await DeliveryMethod.find({ status: "active" })
      .sort({ price: 1 })
      .lean<IDeliveryMethod[]>();
    return { success: true, data: docs.map(deliveryMethodToSafe) };
  } catch (err) {
    console.error("[listActiveDeliveryMethods]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}
