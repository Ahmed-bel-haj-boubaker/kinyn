import connectDB from "@/lib/mongodb";
import User, { type IAddress, type UserStatus } from "@/models/User";
import Order, { orderToSafe } from "@/models/Order";
import type { SafeOrder } from "@/models/Order";
import mongoose from "mongoose";

/* ================================================================
   Customer Service — KINYN
   ================================================================
   Server-side service layer for customer (user with role="user")
   operations. Aggregates data from User + Order collections.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface AdminCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: UserStatus;
  avatar: string;
  isEmailVerified: boolean;
  addresses: {
    id: string;
    label: string;
    country: string;
    city: string;
    address: string;
    postalCode: string;
    isDefault: boolean;
  }[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  lastLogin: string | null;
  createdAt: string;
}

export interface CustomerDetail extends AdminCustomer {
  orders: SafeOrder[];
}

export interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  withOrders: number;
  totalRevenue: number;
}

/* ──────────────── List Customers ──────────────── */

interface ListCustomersOptions {
  search?: string;
  status?: string;
  hasOrders?: string; // "yes" | "no" | undefined
  page?: number;
  limit?: number;
}

export async function listCustomers(
  opts: ListCustomersOptions = {},
): Promise<ServiceResult<{ customers: AdminCustomer[]; total: number }>> {
  try {
    await connectDB();

    const { search, status, hasOrders, page = 1, limit = 50 } = opts;
    const skip = (page - 1) * limit;

    /* Build user filter: only role=user */
    const filter: Record<string, unknown> = { role: "user" };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    /* Fetch users */
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    /* Aggregate order stats + latest shipping info per user */
    const userIds = users.map((u) => u._id);

    const orderAggs = await Order.aggregate([
      { $match: { user: { $in: userIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$user",
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "cancelled"] },
                    { $ne: ["$status", "returned"] },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
          lastOrderDate: { $max: "$createdAt" },
          /* Keep the shipping address from the most recent order */
          lastShippingAddress: { $first: "$shippingAddress" },
        },
      },
    ]);

    const orderStatsMap = new Map<
      string,
      {
        totalOrders: number;
        totalSpent: number;
        lastOrderDate: Date | null;
        lastShippingAddress: {
          phone?: string;
          country?: string;
          city?: string;
          address?: string;
          postalCode?: string;
        } | null;
      }
    >();
    for (const agg of orderAggs) {
      orderStatsMap.set(agg._id.toString(), {
        totalOrders: agg.totalOrders,
        totalSpent: agg.totalSpent,
        lastOrderDate: agg.lastOrderDate,
        lastShippingAddress: agg.lastShippingAddress ?? null,
      });
    }

    /* Enrich users with order stats, falling back to order shipping data
       for phone/address when the user profile fields are still empty. */
    let customers: AdminCustomer[] = users.map((u) => {
      const id = (u._id as mongoose.Types.ObjectId).toString();
      const stats = orderStatsMap.get(id);
      const shipping = stats?.lastShippingAddress ?? null;

      /* Phone: prefer profile, fall back to latest order shipping phone */
      const phone = u.phone || shipping?.phone || "";

      /* Addresses: prefer profile, fall back to shipping address as one entry */
      const profileAddresses = (
        (u.addresses ?? []) as (IAddress & { _id?: mongoose.Types.ObjectId })[]
      ).map((a) => ({
        id: a._id?.toString() ?? "",
        label: a.label,
        country: a.country,
        city: a.city,
        address: a.address,
        postalCode: a.postalCode,
        isDefault: a.isDefault,
      }));

      const addresses =
        profileAddresses.length > 0
          ? profileAddresses
          : shipping?.address
            ? [
                {
                  id: "",
                  label: "Livraison",
                  country: shipping.country ?? "",
                  city: shipping.city ?? "",
                  address: shipping.address ?? "",
                  postalCode: shipping.postalCode ?? "",
                  isDefault: true,
                },
              ]
            : [];

      return {
        id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone,
        status: u.status as UserStatus,
        avatar: u.avatar || "",
        isEmailVerified: u.isEmailVerified,
        addresses,
        totalOrders: stats?.totalOrders ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
        lastOrderDate: stats?.lastOrderDate?.toISOString() ?? null,
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : null,
        createdAt: new Date(u.createdAt).toISOString(),
      };
    });

    /* Post-filter by hasOrders */
    if (hasOrders === "yes") {
      customers = customers.filter((c) => c.totalOrders > 0);
    } else if (hasOrders === "no") {
      customers = customers.filter((c) => c.totalOrders === 0);
    }

    return {
      success: true,
      data: { customers, total },
    };
  } catch (err) {
    console.error("listCustomers error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération des clients.",
      status: 500,
    };
  }
}

/* ──────────────── Get Customer Detail ──────────────── */

export async function getCustomerById(
  customerId: string,
): Promise<ServiceResult<CustomerDetail>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return { success: false, error: "ID client invalide.", status: 400 };
    }

    const user = await User.findOne({ _id: customerId, role: "user" }).lean();
    if (!user) {
      return { success: false, error: "Client introuvable.", status: 404 };
    }

    /* Fetch orders from Order collection */
    const orders = await Order.find({ user: customerId })
      .sort({ createdAt: -1 })
      .lean();

    const safeOrders = orders.map((o) =>
      orderToSafe(o as unknown as import("@/models/Order").IOrder),
    );

    const totalSpent = safeOrders
      .filter((o) => !["cancelled", "returned"].includes(o.status))
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const lastOrderDate =
      safeOrders.length > 0
        ? new Date(safeOrders[0].createdAt).toISOString()
        : null;

    /* Fallback phone/address from latest order shipping data */
    const latestShipping =
      orders.length > 0
        ? (
            orders[0] as unknown as {
              shippingAddress: {
                phone?: string;
                country?: string;
                city?: string;
                address?: string;
                postalCode?: string;
              };
            }
          ).shippingAddress
        : null;

    const phone = user.phone || latestShipping?.phone || "";

    const profileAddresses = (
      (user.addresses ?? []) as (IAddress & { _id?: mongoose.Types.ObjectId })[]
    ).map((a) => ({
      id: a._id?.toString() ?? "",
      label: a.label,
      country: a.country,
      city: a.city,
      address: a.address,
      postalCode: a.postalCode,
      isDefault: a.isDefault,
    }));

    const addresses =
      profileAddresses.length > 0
        ? profileAddresses
        : latestShipping?.address
          ? [
              {
                id: "",
                label: "Livraison",
                country: latestShipping.country ?? "",
                city: latestShipping.city ?? "",
                address: latestShipping.address ?? "",
                postalCode: latestShipping.postalCode ?? "",
                isDefault: true,
              },
            ]
          : [];

    const id = (user._id as mongoose.Types.ObjectId).toString();

    return {
      success: true,
      data: {
        id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone,
        status: user.status as UserStatus,
        avatar: user.avatar || "",
        isEmailVerified: user.isEmailVerified,
        addresses,
        totalOrders: safeOrders.length,
        totalSpent,
        lastOrderDate,
        lastLogin: user.lastLogin
          ? new Date(user.lastLogin).toISOString()
          : null,
        createdAt: new Date(user.createdAt).toISOString(),
        orders: safeOrders,
      },
    };
  } catch (err) {
    console.error("getCustomerById error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération du client.",
      status: 500,
    };
  }
}

/* ──────────────── Update Customer Status ──────────────── */

export async function updateCustomerStatus(
  customerId: string,
  newStatus: UserStatus,
): Promise<ServiceResult<AdminCustomer>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return { success: false, error: "ID client invalide.", status: 400 };
    }

    const validStatuses: UserStatus[] = ["active", "inactive", "suspended"];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "Statut invalide.", status: 400 };
    }

    const user = await User.findOneAndUpdate(
      { _id: customerId, role: "user" },
      { status: newStatus },
      { new: true },
    ).lean();

    if (!user) {
      return { success: false, error: "Client introuvable.", status: 404 };
    }

    /* Get order stats */
    const orderAggs = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(customerId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "cancelled"] },
                    { $ne: ["$status", "returned"] },
                  ],
                },
                "$totalAmount",
                0,
              ],
            },
          },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
    ]);

    const stats = orderAggs[0];
    const id = (user._id as mongoose.Types.ObjectId).toString();

    return {
      success: true,
      data: {
        id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        status: user.status as UserStatus,
        avatar: user.avatar || "",
        isEmailVerified: user.isEmailVerified,
        addresses: (
          (user.addresses ?? []) as (IAddress & {
            _id?: mongoose.Types.ObjectId;
          })[]
        ).map((a) => ({
          id: a._id?.toString() ?? "",
          label: a.label,
          country: a.country,
          city: a.city,
          address: a.address,
          postalCode: a.postalCode,
          isDefault: a.isDefault,
        })),
        totalOrders: stats?.totalOrders ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
        lastOrderDate: stats?.lastOrderDate?.toISOString() ?? null,
        lastLogin: user.lastLogin
          ? new Date(user.lastLogin).toISOString()
          : null,
        createdAt: new Date(user.createdAt).toISOString(),
      },
    };
  } catch (err) {
    console.error("updateCustomerStatus error:", err);
    return {
      success: false,
      error: "Erreur lors de la mise à jour.",
      status: 500,
    };
  }
}

/* ──────────────── Delete Customer ──────────────── */

export async function deleteCustomer(
  customerId: string,
): Promise<ServiceResult<{ deletedId: string }>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return { success: false, error: "ID client invalide.", status: 400 };
    }

    const user = await User.findOne({ _id: customerId, role: "user" });
    if (!user) {
      return { success: false, error: "Client introuvable.", status: 404 };
    }

    /* Check if user has active (non-cancelled/returned) orders */
    const activeOrders = await Order.countDocuments({
      user: customerId,
      status: { $nin: ["cancelled", "returned", "delivered"] },
    });

    if (activeOrders > 0) {
      return {
        success: false,
        error: `Le client a ${activeOrders} commande(s) en cours. Impossible de le supprimer.`,
        status: 400,
      };
    }

    await User.deleteOne({ _id: customerId });

    return { success: true, data: { deletedId: customerId } };
  } catch (err) {
    console.error("deleteCustomer error:", err);
    return {
      success: false,
      error: "Erreur lors de la suppression.",
      status: 500,
    };
  }
}

/* ──────────────── Customer Stats ──────────────── */

export async function getCustomerStats(): Promise<
  ServiceResult<CustomerStats>
> {
  try {
    await connectDB();

    const [total, active, inactive, suspended] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", status: "active" }),
      User.countDocuments({ role: "user", status: "inactive" }),
      User.countDocuments({ role: "user", status: "suspended" }),
    ]);

    /* Count users with at least one order + total revenue */
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $nin: ["cancelled", "returned"] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          usersWithOrders: { $addToSet: "$user" },
        },
      },
    ]);

    const withOrders = revenueAgg[0]?.usersWithOrders?.length ?? 0;
    const totalRevenue = revenueAgg[0]?.totalRevenue ?? 0;

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
        suspended,
        withOrders,
        totalRevenue,
      },
    };
  } catch (err) {
    console.error("getCustomerStats error:", err);
    return {
      success: false,
      error: "Erreur lors du calcul des stats.",
      status: 500,
    };
  }
}
