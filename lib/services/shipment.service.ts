import connectDB from "@/lib/mongodb";
import Shipment, {
  shipmentToSafe,
  type SafeShipment,
  type ShipmentStatus,
} from "@/models/Shipment";
import DeliveryCompany from "@/models/Delivery";
import Order from "@/models/Order";
import mongoose from "mongoose";

/* ================================================================
   Shipment Service — KINYN
   ================================================================
   Server-side service layer for shipment tracking operations.
   Manages assigning orders to delivery companies and tracking status.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────────── Admin Safe Shipment (enriched) ──────────────── */

export interface AdminSafeShipment extends SafeShipment {
  companyName: string;
  companyPhone: string;
  orderRef: string;
}

/* ──────────────── Create Shipment ──────────────── */

interface CreateShipmentInput {
  deliveryCompany: string;
  order: string;
  trackingNumber?: string;
  notes?: string;
}

export async function createShipment(
  input: CreateShipmentInput,
): Promise<ServiceResult<AdminSafeShipment>> {
  try {
    await connectDB();

    const { deliveryCompany, order, trackingNumber, notes } = input;

    if (!deliveryCompany) {
      return {
        success: false,
        error: "La société de livraison est requise.",
        status: 400,
      };
    }

    if (!order) {
      return {
        success: false,
        error: "La commande est requise.",
        status: 400,
      };
    }

    if (!mongoose.Types.ObjectId.isValid(deliveryCompany)) {
      return { success: false, error: "ID société invalide.", status: 400 };
    }

    if (!mongoose.Types.ObjectId.isValid(order)) {
      return { success: false, error: "ID commande invalide.", status: 400 };
    }

    const [companyDoc, orderDoc] = await Promise.all([
      DeliveryCompany.findById(deliveryCompany),
      Order.findById(order),
    ]);

    if (!companyDoc) {
      return {
        success: false,
        error: "Société de livraison introuvable.",
        status: 404,
      };
    }

    if (!orderDoc) {
      return { success: false, error: "Commande introuvable.", status: 404 };
    }

    const shipment = await Shipment.create({
      deliveryCompany: new mongoose.Types.ObjectId(deliveryCompany),
      order: new mongoose.Types.ObjectId(order),
      trackingNumber: trackingNumber?.trim() ?? "",
      notes: notes?.trim() ?? "",
    });

    const safe = shipmentToSafe(shipment);

    return {
      success: true,
      data: {
        ...safe,
        companyName: companyDoc.name,
        companyPhone: companyDoc.phone,
        orderRef: orderDoc.ref,
      },
    };
  } catch (err) {
    console.error("createShipment error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de la création de l'expédition.";
    return { success: false, error: message, status: 500 };
  }
}

/* ──────────────── List All Shipments (Admin) ──────────────── */

interface ListShipmentsOptions {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listShipments(
  opts: ListShipmentsOptions = {},
): Promise<ServiceResult<{ shipments: AdminSafeShipment[]; total: number }>> {
  try {
    await connectDB();

    const { search, status, page = 1, limit = 50 } = opts;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [{ trackingNumber: { $regex: search, $options: "i" } }];
    }

    const [shipments, total] = await Promise.all([
      Shipment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("deliveryCompany", "name phone")
        .populate("order", "ref")
        .lean(),
      Shipment.countDocuments(filter),
    ]);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const enriched: AdminSafeShipment[] = shipments.map((s: any) => {
      const populatedCompany =
        typeof s.deliveryCompany === "object" && s.deliveryCompany !== null
          ? s.deliveryCompany
          : null;
      const populatedOrder =
        typeof s.order === "object" && s.order !== null ? s.order : null;

      return {
        id: s._id.toString(),
        deliveryCompany:
          populatedCompany?._id?.toString() ??
          s.deliveryCompany?.toString() ??
          "",
        order: populatedOrder?._id?.toString() ?? s.order?.toString() ?? "",
        status: s.status,
        trackingNumber: s.trackingNumber ?? "",
        notes: s.notes ?? "",
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        companyName: populatedCompany?.name ?? "",
        companyPhone: populatedCompany?.phone ?? "",
        orderRef: populatedOrder?.ref ?? "",
      };
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    /* If search includes company/order ref, also search by populated fields */
    if (search) {
      const q = search.toLowerCase();
      const filtered = enriched.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(q) ||
          s.companyName.toLowerCase().includes(q) ||
          s.orderRef.toLowerCase().includes(q),
      );
      return {
        success: true,
        data: { shipments: filtered, total: filtered.length },
      };
    }

    return { success: true, data: { shipments: enriched, total } };
  } catch (err) {
    console.error("listShipments error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération des expéditions.",
      status: 500,
    };
  }
}

/* ──────────────── Get Single Shipment ──────────────── */

export async function getShipmentById(
  shipmentId: string,
): Promise<ServiceResult<AdminSafeShipment>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return { success: false, error: "ID expédition invalide.", status: 400 };
    }

    const shipment = await Shipment.findById(shipmentId)
      .populate("deliveryCompany", "name phone")
      .populate("order", "ref");

    if (!shipment) {
      return { success: false, error: "Expédition introuvable.", status: 404 };
    }

    const safe = shipmentToSafe(shipment);
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const populatedCompany =
      typeof (shipment as any).deliveryCompany === "object" &&
      (shipment as any).deliveryCompany !== null
        ? (shipment as any).deliveryCompany
        : null;
    const populatedOrder =
      typeof (shipment as any).order === "object" &&
      (shipment as any).order !== null
        ? (shipment as any).order
        : null;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      success: true,
      data: {
        ...safe,
        deliveryCompany:
          populatedCompany?._id?.toString() ?? safe.deliveryCompany,
        order: populatedOrder?._id?.toString() ?? safe.order,
        companyName: populatedCompany?.name ?? "",
        companyPhone: populatedCompany?.phone ?? "",
        orderRef: populatedOrder?.ref ?? "",
      },
    };
  } catch (err) {
    console.error("getShipmentById error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération de l'expédition.",
      status: 500,
    };
  }
}

/* ──────────────── Update Shipment ──────────────── */

interface UpdateShipmentInput {
  deliveryCompany?: string;
  order?: string;
  status?: ShipmentStatus;
  trackingNumber?: string;
  notes?: string;
}

export async function updateShipment(
  shipmentId: string,
  input: UpdateShipmentInput,
): Promise<ServiceResult<AdminSafeShipment>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return { success: false, error: "ID expédition invalide.", status: 400 };
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return { success: false, error: "Expédition introuvable.", status: 404 };
    }

    const validStatuses: ShipmentStatus[] = [
      "pending",
      "picked_up",
      "in_transit",
      "delivered",
      "failed",
    ];

    if (input.status && !validStatuses.includes(input.status)) {
      return { success: false, error: "Statut invalide.", status: 400 };
    }

    if (input.deliveryCompany) {
      if (!mongoose.Types.ObjectId.isValid(input.deliveryCompany)) {
        return { success: false, error: "ID société invalide.", status: 400 };
      }
      const companyDoc = await DeliveryCompany.findById(input.deliveryCompany);
      if (!companyDoc) {
        return { success: false, error: "Société introuvable.", status: 404 };
      }
      shipment.deliveryCompany = new mongoose.Types.ObjectId(
        input.deliveryCompany,
      );
    }

    if (input.order) {
      if (!mongoose.Types.ObjectId.isValid(input.order)) {
        return { success: false, error: "ID commande invalide.", status: 400 };
      }
      const orderDoc = await Order.findById(input.order);
      if (!orderDoc) {
        return { success: false, error: "Commande introuvable.", status: 404 };
      }
      shipment.order = new mongoose.Types.ObjectId(input.order);
    }

    if (input.status !== undefined) shipment.status = input.status;
    if (input.trackingNumber !== undefined)
      shipment.trackingNumber = input.trackingNumber.trim();
    if (input.notes !== undefined) shipment.notes = input.notes.trim();

    await shipment.save();

    /* Re-fetch with populated fields */
    return getShipmentById(shipmentId);
  } catch (err) {
    console.error("updateShipment error:", err);
    const message =
      err instanceof Error ? err.message : "Erreur lors de la mise à jour.";
    return { success: false, error: message, status: 500 };
  }
}

/* ──────────────── Delete Shipment ──────────────── */

export async function deleteShipment(
  shipmentId: string,
): Promise<ServiceResult<null>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return { success: false, error: "Identifiant invalide.", status: 400 };
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return { success: false, error: "Expédition introuvable.", status: 404 };
    }

    await Shipment.findByIdAndDelete(shipmentId);

    return { success: true, data: null };
  } catch (err) {
    console.error("deleteShipment error:", err);
    return {
      success: false,
      error: "Erreur lors de la suppression.",
      status: 500,
    };
  }
}

/* ──────────────── Shipment Stats (Admin Dashboard) ──────────────── */

interface ShipmentStats {
  total: number;
  pending: number;
  picked_up: number;
  in_transit: number;
  delivered: number;
  failed: number;
}

export async function getShipmentStats(): Promise<
  ServiceResult<ShipmentStats>
> {
  try {
    await connectDB();

    const [total, pending, picked_up, in_transit, delivered, failed] =
      await Promise.all([
        Shipment.countDocuments(),
        Shipment.countDocuments({ status: "pending" }),
        Shipment.countDocuments({ status: "picked_up" }),
        Shipment.countDocuments({ status: "in_transit" }),
        Shipment.countDocuments({ status: "delivered" }),
        Shipment.countDocuments({ status: "failed" }),
      ]);

    return {
      success: true,
      data: { total, pending, picked_up, in_transit, delivered, failed },
    };
  } catch (err) {
    console.error("getShipmentStats error:", err);
    return {
      success: false,
      error: "Erreur lors du calcul des statistiques.",
      status: 500,
    };
  }
}
