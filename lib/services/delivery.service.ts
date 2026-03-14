import connectDB from "@/lib/mongodb";
import DeliveryCompany, {
  deliveryCompanyToSafe,
  type SafeDeliveryCompany,
  type DeliveryCompanyStatus,
} from "@/models/Delivery";
import Shipment from "@/models/Shipment";
import mongoose from "mongoose";

/* ================================================================
   Delivery Company Service — KINYN
   ================================================================
   Server-side service layer for delivery company catalog operations.
   All functions connect to DB, validate, and return structured results.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────────── Create Delivery Company ──────────────── */

interface CreateCompanyInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  price: number;
  notes?: string;
}

export async function createDeliveryCompany(
  input: CreateCompanyInput,
): Promise<ServiceResult<SafeDeliveryCompany>> {
  try {
    await connectDB();

    const { name, phone, email, address, price, notes } = input;

    if (!name?.trim()) {
      return {
        success: false,
        error: "Le nom de la société est requis.",
        status: 400,
      };
    }

    if (price === undefined || price === null || price < 0) {
      return {
        success: false,
        error: "Le prix doit être un nombre positif.",
        status: 400,
      };
    }

    const company = await DeliveryCompany.create({
      name: name.trim(),
      phone: phone?.trim() ?? "",
      email: email?.trim() ?? "",
      address: address?.trim() ?? "",
      price,
      notes: notes?.trim() ?? "",
    });

    return { success: true, data: deliveryCompanyToSafe(company) };
  } catch (err) {
    console.error("createDeliveryCompany error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de la création de la société.";
    return { success: false, error: message, status: 500 };
  }
}

/* ──────────────── List All Delivery Companies (Admin) ──────────────── */

interface ListCompaniesOptions {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listDeliveryCompanies(
  opts: ListCompaniesOptions = {},
): Promise<ServiceResult<{ companies: SafeDeliveryCompany[]; total: number }>> {
  try {
    await connectDB();

    const { search, status, page = 1, limit = 50 } = opts;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const [companies, total] = await Promise.all([
      DeliveryCompany.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryCompany.countDocuments(filter),
    ]);

    const safe: SafeDeliveryCompany[] = companies.map((c) =>
      deliveryCompanyToSafe(c as ReturnType<typeof DeliveryCompany.hydrate>),
    );

    return { success: true, data: { companies: safe, total } };
  } catch (err) {
    console.error("listDeliveryCompanies error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération des sociétés.",
      status: 500,
    };
  }
}

/* ──────────────── Get Single Delivery Company ──────────────── */

export async function getDeliveryCompanyById(
  companyId: string,
): Promise<ServiceResult<SafeDeliveryCompany>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return { success: false, error: "ID société invalide.", status: 400 };
    }

    const company = await DeliveryCompany.findById(companyId);
    if (!company) {
      return { success: false, error: "Société introuvable.", status: 404 };
    }

    return { success: true, data: deliveryCompanyToSafe(company) };
  } catch (err) {
    console.error("getDeliveryCompanyById error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération de la société.",
      status: 500,
    };
  }
}

/* ──────────────── Update Delivery Company ──────────────── */

interface UpdateCompanyInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  price?: number;
  status?: DeliveryCompanyStatus;
  notes?: string;
}

export async function updateDeliveryCompany(
  companyId: string,
  input: UpdateCompanyInput,
): Promise<ServiceResult<SafeDeliveryCompany>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return { success: false, error: "ID société invalide.", status: 400 };
    }

    const company = await DeliveryCompany.findById(companyId);
    if (!company) {
      return { success: false, error: "Société introuvable.", status: 404 };
    }

    const validStatuses: DeliveryCompanyStatus[] = ["active", "inactive"];
    if (input.status && !validStatuses.includes(input.status)) {
      return { success: false, error: "Statut invalide.", status: 400 };
    }

    if (input.name !== undefined) company.name = input.name.trim();
    if (input.phone !== undefined) company.phone = input.phone.trim();
    if (input.email !== undefined) company.email = input.email.trim();
    if (input.address !== undefined) company.address = input.address.trim();
    if (input.price !== undefined) company.price = input.price;
    if (input.status !== undefined) company.status = input.status;
    if (input.notes !== undefined) company.notes = input.notes.trim();

    await company.save();

    return { success: true, data: deliveryCompanyToSafe(company) };
  } catch (err) {
    console.error("updateDeliveryCompany error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de la mise à jour.";
    return { success: false, error: message, status: 500 };
  }
}

/* ──────────────── Delete Delivery Company ──────────────── */

export async function deleteDeliveryCompany(
  companyId: string,
): Promise<ServiceResult<null>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return { success: false, error: "Identifiant invalide.", status: 400 };
    }

    const company = await DeliveryCompany.findById(companyId);
    if (!company) {
      return { success: false, error: "Société introuvable.", status: 404 };
    }

    /* Check if company has active shipments */
    const activeShipments = await Shipment.countDocuments({
      deliveryCompany: companyId,
      status: { $nin: ["delivered", "failed"] },
    });
    if (activeShipments > 0) {
      return {
        success: false,
        error:
          "Impossible de supprimer : cette société a des expéditions en cours.",
        status: 400,
      };
    }

    await DeliveryCompany.findByIdAndDelete(companyId);

    return { success: true, data: null };
  } catch (err) {
    console.error("deleteDeliveryCompany error:", err);
    return {
      success: false,
      error: "Erreur lors de la suppression.",
      status: 500,
    };
  }
}

/* ──────────────── Delivery Company Stats (Admin Dashboard) ──────────────── */

interface CompanyStats {
  total: number;
  active: number;
  inactive: number;
}

export async function getDeliveryCompanyStats(): Promise<
  ServiceResult<CompanyStats>
> {
  try {
    await connectDB();

    const [total, active, inactive] = await Promise.all([
      DeliveryCompany.countDocuments(),
      DeliveryCompany.countDocuments({ status: "active" }),
      DeliveryCompany.countDocuments({ status: "inactive" }),
    ]);

    return { success: true, data: { total, active, inactive } };
  } catch (err) {
    console.error("getDeliveryCompanyStats error:", err);
    return {
      success: false,
      error: "Erreur lors du calcul des statistiques.",
      status: 500,
    };
  }
}
