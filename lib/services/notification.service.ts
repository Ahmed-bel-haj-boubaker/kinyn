import connectDB from "@/lib/mongodb";
import Notification, {
  notificationToSafe,
  type SafeNotification,
  type NotificationType,
} from "@/models/Notification";
import User from "@/models/User";
import Product from "@/models/Product";
import { emitToAdmins } from "@/lib/socket";
import { sendNewOrderEmail } from "@/lib/services/email.service";
import type { SafeOrder } from "@/models/Order";

/* ================================================================
   Notification Service — KINYN
   ================================================================
   Creates, queries, and manages admin notifications.
   Emits real-time events via Socket.IO and sends email alerts.
   ================================================================ */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/* ──────────── Create Notification ──────────── */

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  orderId?: string;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<ServiceResult<SafeNotification>> {
  try {
    await connectDB();

    const notification = await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      orderId: input.orderId || undefined,
    });

    const safe = notificationToSafe(notification);

    /* Emit real-time event to all admins */
    emitToAdmins("new-notification", safe);

    return { success: true, data: safe };
  } catch (error) {
    console.error("[Notification Service] Create error:", error);
    return {
      success: false,
      error: "Erreur lors de la création de la notification.",
      status: 500,
    };
  }
}

/* ──────────── Notify All Admins of New Order ──────────── */

export async function notifyAdminsNewOrder(order: SafeOrder): Promise<void> {
  try {
    await connectDB();

    /* Find all admin/super_admin users */
    const admins = await User.find(
      { role: { $in: ["admin", "super_admin"] }, status: "active" },
      { _id: 1 },
    ).lean();

    if (admins.length === 0) {
      console.warn("[Notification Service] No active admins found.");
      return;
    }

    const customerName = order.shippingAddress
      ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
      : "Client";

    /* Create notification for each admin */
    const notifications = await Notification.insertMany(
      admins.map((admin) => ({
        userId: admin._id,
        type: "order" as const,
        title: "Nouvelle commande",
        message: `Commande #${order.ref} de ${customerName} — ${order.totalAmount.toFixed(3)} TND`,
        orderId: order.id,
      })),
    );

    /* Emit real-time notification to admin room */
    if (notifications.length > 0) {
      const first = notifications[0];
      const safeNotification: SafeNotification = {
        _id: first._id.toString(),
        userId: first.userId.toString(),
        type: first.type as SafeNotification["type"],
        title: first.title,
        message: first.message,
        orderId: first.orderId?.toString(),
        isRead: first.isRead,
        createdAt: new Date(first.createdAt).toISOString(),
        updatedAt: new Date(first.updatedAt).toISOString(),
      };

      emitToAdmins("new-notification", safeNotification);
      emitToAdmins("new-order", {
        notification: safeNotification,
        order: {
          id: order.id,
          ref: order.ref,
          totalAmount: order.totalAmount,
          customerName,
          status: order.status,
        },
      });
    }

    /* Send email to admin */
    await sendNewOrderEmail({
      orderId: order.id,
      orderRef: order.ref,
      customerName,
      totalAmount: order.totalAmount,
      itemCount: order.items?.length ?? 0,
      shippingMethod: order.shippingMethod,
      paymentMethod: order.paymentMethod,
    });
  } catch (error) {
    console.error("[Notification Service] notifyAdminsNewOrder error:", error);
  }
}

/* ──────────── Get Notifications ──────────── */

export async function getNotifications(
  userId: string,
  page = 1,
  limit = 20,
): Promise<
  ServiceResult<{
    notifications: SafeNotification[];
    total: number;
    unreadCount: number;
  }>
> {
  try {
    await connectDB();

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<INotificationLean[]>(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return {
      success: true,
      data: {
        notifications: notifications.map((n) => ({
          _id: n._id.toString(),
          userId: n.userId.toString(),
          type: n.type,
          title: n.title,
          message: n.message,
          orderId: n.orderId?.toString(),
          isRead: n.isRead,
          createdAt: new Date(n.createdAt).toISOString(),
          updatedAt: new Date(n.updatedAt).toISOString(),
        })),
        total,
        unreadCount,
      },
    };
  } catch (error) {
    console.error("[Notification Service] Get error:", error);
    return {
      success: false,
      error: "Erreur lors de la récupération des notifications.",
      status: 500,
    };
  }
}

/* ──────────── Get Unread Count ──────────── */

export async function getUnreadCount(
  userId: string,
): Promise<ServiceResult<number>> {
  try {
    await connectDB();
    const count = await Notification.countDocuments({ userId, isRead: false });
    return { success: true, data: count };
  } catch (error) {
    console.error("[Notification Service] Unread count error:", error);
    return { success: false, error: "Erreur.", status: 500 };
  }
}

/* ──────────── Mark as Read ──────────── */

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<ServiceResult<SafeNotification>> {
  try {
    await connectDB();

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return {
        success: false,
        error: "Notification introuvable.",
        status: 404,
      };
    }

    return { success: true, data: notificationToSafe(notification) };
  } catch (error) {
    console.error("[Notification Service] Mark read error:", error);
    return { success: false, error: "Erreur.", status: 500 };
  }
}

/* ──────────── Mark All as Read ──────────── */

export async function markAllAsRead(
  userId: string,
): Promise<ServiceResult<{ modifiedCount: number }>> {
  try {
    await connectDB();

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true },
    );

    return { success: true, data: { modifiedCount: result.modifiedCount } };
  } catch (error) {
    console.error("[Notification Service] Mark all read error:", error);
    return { success: false, error: "Erreur.", status: 500 };
  }
}

/* ──────────── Delete Notification ──────────── */

export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<ServiceResult> {
  try {
    await connectDB();

    const result = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!result) {
      return {
        success: false,
        error: "Notification introuvable.",
        status: 404,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Notification Service] Delete error:", error);
    return { success: false, error: "Erreur.", status: 500 };
  }
}

/* ──────────── Notify All Admins of New User Registration ──────────── */

export async function notifyAdminsNewUser(user: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<void> {
  try {
    await connectDB();

    const admins = await User.find(
      { role: { $in: ["admin", "super_admin"] }, status: "active" },
      { _id: 1 },
    ).lean();

    if (admins.length === 0) return;

    const fullName = `${user.firstName} ${user.lastName}`;

    const notifications = await Notification.insertMany(
      admins.map((admin) => ({
        userId: admin._id,
        type: "user" as const,
        title: "Nouveau client inscrit",
        message: `${fullName} (${user.email}) vient de créer un compte.`,
      })),
    );

    if (notifications.length > 0) {
      const first = notifications[0];
      const safeNotification: SafeNotification = {
        _id: first._id.toString(),
        userId: first.userId.toString(),
        type: first.type as SafeNotification["type"],
        title: first.title,
        message: first.message,
        orderId: undefined,
        isRead: first.isRead,
        createdAt: new Date(first.createdAt).toISOString(),
        updatedAt: new Date(first.updatedAt).toISOString(),
      };

      emitToAdmins("new-notification", safeNotification);
    }
  } catch (error) {
    console.error("[Notification Service] notifyAdminsNewUser error:", error);
  }
}

/* ──────────── Check & Notify Low Stock After Order ──────────── */

const LOW_STOCK_THRESHOLD = 5;

export async function checkAndNotifyLowStock(
  productIds: string[],
): Promise<void> {
  try {
    await connectDB();

    const uniqueIds = [...new Set(productIds)];

    const products = await Product.find(
      { _id: { $in: uniqueIds } },
      { name: 1, sizeStock: 1 },
    ).lean<
      {
        _id: { toString(): string };
        name: string;
        sizeStock: { size: string; stock: number }[];
      }[]
    >();

    const lowStockProducts: { name: string; totalStock: number }[] = [];

    for (const product of products) {
      const totalStock = (product.sizeStock ?? []).reduce(
        (sum, s) => sum + s.stock,
        0,
      );
      if (totalStock <= LOW_STOCK_THRESHOLD && totalStock >= 0) {
        lowStockProducts.push({ name: product.name, totalStock });
      }
    }

    if (lowStockProducts.length === 0) return;

    const admins = await User.find(
      { role: { $in: ["admin", "super_admin"] }, status: "active" },
      { _id: 1 },
    ).lean();

    if (admins.length === 0) return;

    for (const lsp of lowStockProducts) {
      const title = lsp.totalStock === 0 ? "Rupture de stock" : "Stock faible";
      const message =
        lsp.totalStock === 0
          ? `"${lsp.name}" est en rupture de stock.`
          : `"${lsp.name}" n'a plus que ${lsp.totalStock} unité${lsp.totalStock > 1 ? "s" : ""} en stock.`;

      const notifications = await Notification.insertMany(
        admins.map((admin) => ({
          userId: admin._id,
          type: "stock" as const,
          title,
          message,
        })),
      );

      if (notifications.length > 0) {
        const first = notifications[0];
        const safeNotification: SafeNotification = {
          _id: first._id.toString(),
          userId: first.userId.toString(),
          type: first.type as SafeNotification["type"],
          title: first.title,
          message: first.message,
          orderId: undefined,
          isRead: first.isRead,
          createdAt: new Date(first.createdAt).toISOString(),
          updatedAt: new Date(first.updatedAt).toISOString(),
        };

        emitToAdmins("new-notification", safeNotification);
      }
    }
  } catch (error) {
    console.error(
      "[Notification Service] checkAndNotifyLowStock error:",
      error,
    );
  }
}

/* ──────────── Internal lean type ──────────── */

interface INotificationLean {
  _id: { toString(): string };
  userId: { toString(): string };
  type: "order" | "system" | "delivery" | "stock" | "user";
  title: string;
  message: string;
  orderId?: { toString(): string };
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
