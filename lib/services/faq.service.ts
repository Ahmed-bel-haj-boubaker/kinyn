import connectDB from "@/lib/mongodb";
import FAQ, {
  type IFAQ,
  type SafeFAQ,
  type FAQStatus,
  faqToSafe,
} from "@/models/FAQ";

/* ================================================================
   FAQ Service — KINYN
   ================================================================
   Server-side service layer for FAQ CRUD operations.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────────── List FAQs ──────────────── */

interface ListFAQsInput {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listFAQs(
  input: ListFAQsInput = {},
): Promise<ServiceResult<{ faqs: SafeFAQ[]; total: number }>> {
  try {
    await connectDB();

    const filter: Record<string, unknown> = {};
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));
    const skip = (page - 1) * limit;

    if (input.search?.trim()) {
      const re = { $regex: input.search.trim(), $options: "i" };
      filter.$or = [{ question: re }, { answer: re }, { category: re }];
    }
    if (input.category?.trim()) {
      filter.category = input.category.trim();
    }
    if (input.status && ["published", "draft"].includes(input.status)) {
      filter.status = input.status;
    }

    const [docs, total] = await Promise.all([
      FAQ.find(filter)
        .sort({ order: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean<IFAQ[]>(),
      FAQ.countDocuments(filter),
    ]);

    return {
      success: true,
      data: { faqs: docs.map(faqToSafe), total },
    };
  } catch (err) {
    console.error("[listFAQs]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Get FAQ by ID ──────────────── */

export async function getFAQById(id: string): Promise<ServiceResult<SafeFAQ>> {
  try {
    await connectDB();
    const doc = await FAQ.findById(id).lean<IFAQ>();
    if (!doc) return { success: false, error: "FAQ introuvable.", status: 404 };
    return { success: true, data: faqToSafe(doc) };
  } catch {
    return { success: false, error: "ID invalide.", status: 400 };
  }
}

/* ──────────────── Create FAQ ──────────────── */

interface CreateFAQInput {
  question: string;
  answer: string;
  category?: string;
  status?: FAQStatus;
  order?: number;
}

export async function createFAQ(
  input: CreateFAQInput,
): Promise<ServiceResult<SafeFAQ>> {
  try {
    await connectDB();

    if (!input.question?.trim()) {
      return { success: false, error: "La question est requise.", status: 400 };
    }
    if (!input.answer?.trim()) {
      return { success: false, error: "La réponse est requise.", status: 400 };
    }

    const doc = await FAQ.create({
      question: input.question.trim(),
      answer: input.answer.trim(),
      category: input.category?.trim() || "Général",
      status: input.status ?? "draft",
      order: input.order ?? 0,
    });

    return { success: true, data: faqToSafe(doc) };
  } catch (err) {
    console.error("[createFAQ]", err);
    return {
      success: false,
      error: "Erreur lors de la création.",
      status: 500,
    };
  }
}

/* ──────────────── Update FAQ ──────────────── */

interface UpdateFAQInput {
  question?: string;
  answer?: string;
  category?: string;
  status?: FAQStatus;
  order?: number;
}

export async function updateFAQ(
  id: string,
  input: UpdateFAQInput,
): Promise<ServiceResult<SafeFAQ>> {
  try {
    await connectDB();

    const update: Record<string, unknown> = {};
    if (input.question !== undefined) update.question = input.question.trim();
    if (input.answer !== undefined) update.answer = input.answer.trim();
    if (input.category !== undefined)
      update.category = input.category.trim() || "Général";
    if (input.status !== undefined) update.status = input.status;
    if (input.order !== undefined) update.order = input.order;

    const doc = await FAQ.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true },
    ).lean<IFAQ>();
    if (!doc) return { success: false, error: "FAQ introuvable.", status: 404 };

    return { success: true, data: faqToSafe(doc) };
  } catch (err) {
    console.error("[updateFAQ]", err);
    return {
      success: false,
      error: "Erreur lors de la mise à jour.",
      status: 500,
    };
  }
}

/* ──────────────── Delete FAQ ──────────────── */

export async function deleteFAQ(id: string): Promise<ServiceResult<null>> {
  try {
    await connectDB();
    const doc = await FAQ.findByIdAndDelete(id);
    if (!doc) return { success: false, error: "FAQ introuvable.", status: 404 };
    return { success: true, data: null };
  } catch {
    return { success: false, error: "ID invalide.", status: 400 };
  }
}

/* ──────────────── List unique categories ──────────────── */

export async function listFAQCategories(): Promise<ServiceResult<string[]>> {
  try {
    await connectDB();
    const categories = await FAQ.distinct("category");
    return { success: true, data: categories.sort() };
  } catch (err) {
    console.error("[listFAQCategories]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Get published FAQs (public) ──────────────── */

export async function getPublishedFAQs(): Promise<ServiceResult<SafeFAQ[]>> {
  try {
    await connectDB();
    const docs = await FAQ.find({ status: "published" })
      .sort({ order: 1, createdAt: 1 })
      .lean<IFAQ[]>();
    return { success: true, data: docs.map(faqToSafe) };
  } catch (err) {
    console.error("[getPublishedFAQs]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}
