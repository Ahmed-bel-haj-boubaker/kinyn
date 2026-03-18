import connectDB from "@/lib/mongodb";
import Newsletter, {
  type INewsletter,
  type SafeNewsletter,
  type NewsletterStatus,
  type NewsletterCustomer,
  newsletterToSafe,
} from "@/models/Newsletter";
import User from "@/models/User";

/* ================================================================
   Newsletter Service — KINYN
   ================================================================
   Server-side service layer for newsletter CRUD operations.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────────── Customer enrichment helper ──────────────── */

async function buildCustomerMap(
  emails: string[],
): Promise<Map<string, NewsletterCustomer>> {
  if (!emails.length) return new Map();
  const users = await User.find({ email: { $in: emails }, role: "user" })
    .select("_id firstName lastName email")
    .lean<
      {
        _id: { toString(): string };
        firstName: string;
        lastName: string;
        email: string;
      }[]
    >();
  const map = new Map<string, NewsletterCustomer>();
  for (const u of users) {
    map.set(u.email, {
      id: u._id.toString(),
      firstName: u.firstName,
      lastName: u.lastName,
    });
  }
  return map;
}

/* ──────────────── Subscribe (Public) ──────────────── */

export async function subscribe(
  email: string,
): Promise<ServiceResult<SafeNewsletter>> {
  try {
    await connectDB();

    const trimmed = email?.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      return { success: false, error: "Email invalide.", status: 400 };
    }

    const existing = await Newsletter.findOne({ email: trimmed });

    if (existing) {
      if (existing.status === "active") {
        return {
          success: false,
          error: "Cet email est déjà inscrit à la newsletter.",
          status: 409,
        };
      }
      // Re-subscribe
      existing.status = "active";
      existing.subscribedAt = new Date();
      existing.unsubscribedAt = null;
      await existing.save();
      return { success: true, data: newsletterToSafe(existing) };
    }

    const doc = await Newsletter.create({ email: trimmed });
    return { success: true, data: newsletterToSafe(doc) };
  } catch (err) {
    console.error("[subscribe]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Unsubscribe (Public) ──────────────── */

export async function unsubscribe(email: string): Promise<ServiceResult<null>> {
  try {
    await connectDB();

    const trimmed = email?.trim().toLowerCase();
    if (!trimmed) {
      return { success: false, error: "Email requis.", status: 400 };
    }

    const doc = await Newsletter.findOne({ email: trimmed });
    if (!doc) {
      return { success: false, error: "Email introuvable.", status: 404 };
    }

    if (doc.status === "unsubscribed") {
      return {
        success: false,
        error: "Cet email est déjà désinscrit.",
        status: 409,
      };
    }

    doc.status = "unsubscribed";
    doc.unsubscribedAt = new Date();
    await doc.save();
    return { success: true, data: null };
  } catch (err) {
    console.error("[unsubscribe]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── List Subscribers (Admin) ──────────────── */

interface ListSubscribersInput {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listSubscribers(
  input: ListSubscribersInput = {},
): Promise<ServiceResult<{ subscribers: SafeNewsletter[]; total: number }>> {
  try {
    await connectDB();

    const filter: Record<string, unknown> = {};
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));
    const skip = (page - 1) * limit;

    if (input.search?.trim()) {
      filter.email = { $regex: input.search.trim(), $options: "i" };
    }
    if (input.status && ["active", "unsubscribed"].includes(input.status)) {
      filter.status = input.status as NewsletterStatus;
    }

    const [docs, total] = await Promise.all([
      Newsletter.find(filter)
        .sort({ subscribedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<INewsletter[]>(),
      Newsletter.countDocuments(filter),
    ]);

    const customerMap = await buildCustomerMap(docs.map((d) => d.email));

    return {
      success: true,
      data: {
        subscribers: docs.map((d) =>
          newsletterToSafe(d, customerMap.get(d.email) ?? null),
        ),
        total,
      },
    };
  } catch (err) {
    console.error("[listSubscribers]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Get by ID (Admin) ──────────────── */

export async function getSubscriberById(
  id: string,
): Promise<ServiceResult<SafeNewsletter>> {
  try {
    await connectDB();
    const doc = await Newsletter.findById(id).lean<INewsletter>();
    if (!doc)
      return { success: false, error: "Abonné introuvable.", status: 404 };
    const customerMap = await buildCustomerMap([doc.email]);
    return {
      success: true,
      data: newsletterToSafe(doc, customerMap.get(doc.email) ?? null),
    };
  } catch {
    return { success: false, error: "ID invalide.", status: 400 };
  }
}

/* ──────────────── Delete Subscriber (Admin) ──────────────── */

export async function deleteSubscriber(
  id: string,
): Promise<ServiceResult<null>> {
  try {
    await connectDB();
    const doc = await Newsletter.findByIdAndDelete(id);
    if (!doc)
      return { success: false, error: "Abonné introuvable.", status: 404 };
    return { success: true, data: null };
  } catch {
    return { success: false, error: "ID invalide.", status: 400 };
  }
}

/* ──────────────── Toggle Status (Admin) ──────────────── */

export async function toggleSubscriberStatus(
  id: string,
): Promise<ServiceResult<SafeNewsletter>> {
  try {
    await connectDB();
    const doc = await Newsletter.findById(id);
    if (!doc)
      return { success: false, error: "Abonné introuvable.", status: 404 };

    doc.status = doc.status === "active" ? "unsubscribed" : "active";
    if (doc.status === "unsubscribed") {
      doc.unsubscribedAt = new Date();
    } else {
      doc.unsubscribedAt = null;
      doc.subscribedAt = new Date();
    }
    await doc.save();

    return { success: true, data: newsletterToSafe(doc) };
  } catch {
    return { success: false, error: "ID invalide.", status: 400 };
  }
}

/* ──────────────── Stats (Admin) ──────────────── */

export async function getNewsletterStats(): Promise<
  ServiceResult<{ total: number; active: number; unsubscribed: number }>
> {
  try {
    await connectDB();

    const [total, active, unsubscribed] = await Promise.all([
      Newsletter.countDocuments(),
      Newsletter.countDocuments({ status: "active" }),
      Newsletter.countDocuments({ status: "unsubscribed" }),
    ]);

    return { success: true, data: { total, active, unsubscribed } };
  } catch (err) {
    console.error("[getNewsletterStats]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── Export Emails (Admin) ──────────────── */

export async function exportActiveEmails(): Promise<ServiceResult<string[]>> {
  try {
    await connectDB();
    const docs = await Newsletter.find({ status: "active" })
      .select("email")
      .lean<Pick<INewsletter, "email">[]>();
    return { success: true, data: docs.map((d) => d.email) };
  } catch (err) {
    console.error("[exportActiveEmails]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}

/* ──────────────── List All Customers + Newsletter Status (Admin) ──────────────── */

export interface CustomerNewsletterEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isRegistered: boolean;
  newsletterStatus: "active" | "unsubscribed" | "not_subscribed";
  subscribedAt: string | null;
}

interface ListCustomersNewsletterInput {
  search?: string;
  newsletterFilter?: string; // "active" | "unsubscribed" | "not_subscribed" | ""
  page?: number;
  limit?: number;
}

export async function listCustomersNewsletter(
  input: ListCustomersNewsletterInput = {},
): Promise<
  ServiceResult<{ entries: CustomerNewsletterEntry[]; total: number }>
> {
  try {
    await connectDB();

    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));

    // 1. Get ALL registered users (role "user") with their emails
    const users = await User.find({ role: "user" })
      .select("_id firstName lastName email")
      .lean<
        {
          _id: { toString(): string };
          firstName: string;
          lastName: string;
          email: string;
        }[]
      >();

    // 2. Get ALL newsletter docs
    const newsletters = await Newsletter.find().lean<INewsletter[]>();

    // 3. Build a map: email → newsletter doc
    const nlMap = new Map<string, INewsletter>();
    for (const nl of newsletters) {
      nlMap.set(nl.email, nl);
    }

    // 4. Build unified list — start with registered users
    const seenEmails = new Set<string>();
    const merged: CustomerNewsletterEntry[] = [];

    for (const u of users) {
      const emailLower = u.email.toLowerCase();
      seenEmails.add(emailLower);
      const nl = nlMap.get(emailLower);
      merged.push({
        id: nl ? nl._id.toString() : u._id.toString(),
        firstName: u.firstName,
        lastName: u.lastName,
        email: emailLower,
        isRegistered: true,
        newsletterStatus: nl ? nl.status : "not_subscribed",
        subscribedAt: nl?.subscribedAt ? nl.subscribedAt.toISOString() : null,
      });
    }

    // 5. Add newsletter-only entries (emails not in User collection)
    for (const nl of newsletters) {
      if (!seenEmails.has(nl.email)) {
        merged.push({
          id: nl._id.toString(),
          firstName: "",
          lastName: "",
          email: nl.email,
          isRegistered: false,
          newsletterStatus: nl.status,
          subscribedAt: nl.subscribedAt ? nl.subscribedAt.toISOString() : null,
        });
      }
    }

    // 6. Apply filters
    let filtered = merged;

    if (input.search?.trim()) {
      const q = input.search.trim().toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.email.includes(q) ||
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q),
      );
    }

    if (
      input.newsletterFilter &&
      ["active", "unsubscribed", "not_subscribed"].includes(
        input.newsletterFilter,
      )
    ) {
      filtered = filtered.filter(
        (e) => e.newsletterStatus === input.newsletterFilter,
      );
    }

    // 7. Sort: subscribed first (active → unsubscribed → not_subscribed), then alphabetical
    const statusOrder: Record<string, number> = {
      active: 0,
      unsubscribed: 1,
      not_subscribed: 2,
    };
    filtered.sort(
      (a, b) =>
        statusOrder[a.newsletterStatus] - statusOrder[b.newsletterStatus] ||
        a.email.localeCompare(b.email),
    );

    const total = filtered.length;
    const skip = (page - 1) * limit;
    const entries = filtered.slice(skip, skip + limit);

    return { success: true, data: { entries, total } };
  } catch (err) {
    console.error("[listCustomersNewsletter]", err);
    return { success: false, error: "Erreur serveur.", status: 500 };
  }
}
