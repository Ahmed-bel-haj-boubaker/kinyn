import connectDB from "@/lib/mongodb";
import Order, {
  orderToSafe,
  type SafeOrder,
  type OrderStatus,
  type PaymentMethod,
  type ShippingMethod,
  type IOrderItem,
} from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import mongoose from "mongoose";

/* ================================================================
   Order Service — KINYN
   ================================================================
   Server-side service layer for order operations.
   All functions connect to DB, validate, and return structured results.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────────── Create Order ──────────────── */

interface OrderItemInput {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface CreateOrderInput {
  userId: string;
  items: OrderItemInput[];
  shippingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    postalCode: string;
  };
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  notes?: string;
}

const SHIPPING_COSTS: Record<ShippingMethod, number> = {
  standard: 8,
  express: 20,
};

export async function createOrder(
  input: CreateOrderInput,
): Promise<ServiceResult<SafeOrder>> {
  try {
    await connectDB();

    /* Validate user exists */
    const user = await User.findById(input.userId);
    if (!user) {
      return { success: false, error: "Utilisateur introuvable.", status: 404 };
    }

    /* Validate items */
    if (!input.items || input.items.length === 0) {
      return {
        success: false,
        error: "La commande doit contenir au moins un article.",
        status: 400,
      };
    }

    /* Validate each product exists and has stock */
    const orderItems: IOrderItem[] = [];
    let subtotal = 0;

    for (const item of input.items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return {
          success: false,
          error: `ID produit invalide : ${item.productId}`,
          status: 400,
        };
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return {
          success: false,
          error: `Produit introuvable : ${item.name}`,
          status: 404,
        };
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `Stock insuffisant pour "${product.name}". Disponible : ${product.stock}`,
          status: 400,
        };
      }

      const unitPrice = product.promoPrice ?? product.price;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      orderItems.push({
        product: product._id as mongoose.Types.ObjectId,
        name: product.name,
        image: item.image || product.images[0]?.url || "",
        price: unitPrice,
        quantity: item.quantity,
        size: item.size || "",
        color: item.color || "",
      });
    }

    const shippingCost =
      SHIPPING_COSTS[input.shippingMethod] ?? SHIPPING_COSTS.standard;
    const totalAmount = subtotal + shippingCost;

    /* Create the order */
    const order = await Order.create({
      user: new mongoose.Types.ObjectId(input.userId),
      items: orderItems,
      subtotal,
      shippingCost,
      totalAmount,
      shippingAddress: input.shippingAddress,
      shippingMethod: input.shippingMethod,
      paymentMethod: input.paymentMethod,
      notes: input.notes ?? "",
    });

    /* Decrement stock for each product */
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    /* ── Sync phone & address back to user profile ── */
    const profileUpdate: Record<string, unknown> = {};

    // Save phone if the user doesn't have one yet
    if (!user.phone && input.shippingAddress.phone) {
      profileUpdate.phone = input.shippingAddress.phone;
    }

    // Add shipping address to user's addresses if they have none
    const addr = input.shippingAddress;
    const alreadyHasAddress = (user.addresses ?? []).some(
      (a) =>
        a.address === addr.address &&
        a.city === addr.city &&
        a.postalCode === addr.postalCode &&
        a.country === addr.country,
    );

    if (!alreadyHasAddress) {
      const isFirst = (user.addresses ?? []).length === 0;
      const newAddr = {
        label: isFirst ? "Maison" : "Adresse",
        country: addr.country,
        city: addr.city,
        address: addr.address,
        postalCode: addr.postalCode,
        isDefault: isFirst,
      };
      if (Object.keys(profileUpdate).length > 0) {
        await User.findByIdAndUpdate(input.userId, {
          ...profileUpdate,
          $push: { addresses: newAddr },
        });
      } else {
        await User.findByIdAndUpdate(input.userId, {
          $push: { addresses: newAddr },
        });
      }
    } else if (Object.keys(profileUpdate).length > 0) {
      await User.findByIdAndUpdate(input.userId, profileUpdate);
    }

    return { success: true, data: orderToSafe(order) };
  } catch (err) {
    console.error("createOrder error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de la création de la commande.";
    return { success: false, error: message, status: 500 };
  }
}

/* ──────────────── Find or Create Guest User ──────────────── */

interface GuestUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/**
 * Find an existing user by email, or create a new guest account.
 * Returns the userId string.
 */
export async function findOrCreateGuestUser(
  input: GuestUserInput,
): Promise<ServiceResult<string>> {
  try {
    await connectDB();

    const { firstName, lastName, email, phone } = input;

    /* Check if a user with this email already exists */
    const existing = await User.findOne({ email });
    if (existing) {
      return { success: true, data: existing._id.toString() };
    }

    /* Create a new user with a random secure password */
    const crypto = await import("crypto");
    const randomPassword =
      crypto.randomBytes(16).toString("base64url") + "Aa1!";

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      phone: phone || "",
      password: randomPassword,
      role: "user",
      status: "active",
    });

    return { success: true, data: newUser._id.toString() };
  } catch (err) {
    console.error("findOrCreateGuestUser error:", err);

    /* Handle duplicate key race condition */
    if (
      err instanceof Error &&
      "code" in err &&
      (err as unknown as { code: number }).code === 11000
    ) {
      /* Another request just created this user — find and return */
      const existing = await User.findOne({ email: input.email });
      if (existing) {
        return { success: true, data: existing._id.toString() };
      }
    }

    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de la création du compte.";
    return { success: false, error: message, status: 500 };
  }
}

/* ──────────────── Get Orders for User ──────────────── */

export async function getUserOrders(
  userId: string,
  page = 1,
  limit = 20,
): Promise<ServiceResult<{ orders: SafeOrder[]; total: number }>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return { success: false, error: "ID utilisateur invalide.", status: 400 };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<(mongoose.Document & import("@/models/Order").IOrder)[]>(),
      Order.countDocuments({ user: userId }),
    ]);

    return {
      success: true,
      data: {
        orders: orders.map((o) =>
          orderToSafe(o as unknown as import("@/models/Order").IOrder),
        ),
        total,
      },
    };
  } catch (err) {
    console.error("getUserOrders error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération des commandes.",
      status: 500,
    };
  }
}

/* ──────────────── Get Single Order ──────────────── */

export async function getOrderById(
  orderId: string,
  userId?: string,
): Promise<ServiceResult<SafeOrder>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return { success: false, error: "ID commande invalide.", status: 400 };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: "Commande introuvable.", status: 404 };
    }

    /* If userId provided, verify ownership */
    if (userId && order.user.toString() !== userId) {
      return { success: false, error: "Accès refusé.", status: 403 };
    }

    return { success: true, data: orderToSafe(order) };
  } catch (err) {
    console.error("getOrderById error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération de la commande.",
      status: 500,
    };
  }
}

/* ──────────────── List All Orders (Admin) ──────────────── */

export interface AdminSafeOrder extends SafeOrder {
  userName: string;
  userEmail: string;
}

interface ListOrdersOptions {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listOrders(
  opts: ListOrdersOptions = {},
): Promise<ServiceResult<{ orders: AdminSafeOrder[]; total: number }>> {
  try {
    await connectDB();

    const { search, status, page = 1, limit = 50 } = opts;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search) {
      filter.$or = [{ ref: { $regex: search, $options: "i" } }];
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "firstName lastName email")
        .lean(),
      Order.countDocuments(filter),
    ]);

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const enrichedOrders: AdminSafeOrder[] = orders.map((o: any) => {
      const safe = orderToSafe(o as unknown as import("@/models/Order").IOrder);
      const populatedUser =
        typeof o.user === "object" && o.user !== null ? o.user : null;
      return {
        ...safe,
        user: populatedUser?._id?.toString() ?? safe.user,
        userName: populatedUser
          ? `${populatedUser.firstName || ""} ${populatedUser.lastName || ""}`.trim()
          : "",
        userEmail: populatedUser?.email ?? "",
      };
    });
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      success: true,
      data: {
        orders: enrichedOrders,
        total,
      },
    };
  } catch (err) {
    console.error("listOrders error:", err);
    return {
      success: false,
      error: "Erreur lors de la récupération des commandes.",
      status: 500,
    };
  }
}

/* ──────────────── Update Order Status (Admin) ──────────────── */

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
): Promise<ServiceResult<SafeOrder>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return { success: false, error: "ID commande invalide.", status: 400 };
    }

    const validStatuses: OrderStatus[] = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "returned",
    ];

    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "Statut invalide.", status: 400 };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: "Commande introuvable.", status: 404 };
    }

    /* Restore stock if cancelling */
    if (
      newStatus === "cancelled" &&
      order.status !== "cancelled" &&
      order.status !== "returned"
    ) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    order.status = newStatus;
    await order.save();

    return { success: true, data: orderToSafe(order) };
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return {
      success: false,
      error: "Erreur lors de la mise à jour.",
      status: 500,
    };
  }
}

/* ──────────────── Cancel Order (User) ──────────────── */

export async function cancelOrder(
  orderId: string,
  userId: string,
): Promise<ServiceResult<SafeOrder>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return { success: false, error: "ID commande invalide.", status: 400 };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, error: "Commande introuvable.", status: 404 };
    }

    if (order.user.toString() !== userId) {
      return { success: false, error: "Accès refusé.", status: 403 };
    }

    /* Only pending/confirmed orders can be cancelled by user */
    if (!["pending", "confirmed"].includes(order.status)) {
      return {
        success: false,
        error: "Cette commande ne peut plus être annulée.",
        status: 400,
      };
    }

    /* Restore stock */
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    order.status = "cancelled";
    await order.save();

    return { success: true, data: orderToSafe(order) };
  } catch (err) {
    console.error("cancelOrder error:", err);
    return {
      success: false,
      error: "Erreur lors de l'annulation.",
      status: 500,
    };
  }
}

/* ──────────────── Order Stats (Admin Dashboard) ──────────────── */

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  revenue: number;
}

export async function getOrderStats(): Promise<ServiceResult<OrderStats>> {
  try {
    await connectDB();

    const [
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      returned,
      revenueAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "processing" }),
      Order.countDocuments({ status: "shipped" }),
      Order.countDocuments({ status: "delivered" }),
      Order.countDocuments({ status: "cancelled" }),
      Order.countDocuments({ status: "returned" }),
      Order.aggregate([
        { $match: { status: { $nin: ["cancelled", "returned"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const revenue = revenueAgg[0]?.total ?? 0;

    return {
      success: true,
      data: {
        total,
        pending,
        confirmed,
        processing,
        shipped,
        delivered,
        cancelled,
        returned,
        revenue,
      },
    };
  } catch (err) {
    console.error("getOrderStats error:", err);
    return {
      success: false,
      error: "Erreur lors du calcul des stats.",
      status: 500,
    };
  }
}
