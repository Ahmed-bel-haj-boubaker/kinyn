import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import { getOrderStats } from "@/lib/services/order.service";
import { getProductStats } from "@/lib/services/product.service";
import { getCustomerStats } from "@/lib/services/customer.service";
import { listOrders } from "@/lib/services/order.service";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function GET(req: NextRequest) {
  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  try {
    await connectDB();

    const [
      orderStats,
      productStats,
      customerStats,
      recentOrders,
      monthlyRevenue,
      topProducts,
    ] = await Promise.all([
      getOrderStats(),
      getProductStats(),
      getCustomerStats(),
      listOrders({ limit: 8, page: 1 }),
      getMonthlyRevenue(),
      getTopProducts(),
    ]);

    if (
      !orderStats.success ||
      !productStats.success ||
      !customerStats.success ||
      !recentOrders.success
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de charger les données du tableau de bord.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        orderStats: orderStats.data,
        productStats: productStats.data,
        customerStats: customerStats.data,
        recentOrders: recentOrders.data?.orders ?? [],
        monthlyRevenue,
        topProducts,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur." },
      { status: 500 },
    );
  }
}

/* ── Monthly revenue for last 6 months ── */

async function getMonthlyRevenue() {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const agg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $nin: ["cancelled", "returned"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Jun",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];

    /* Fill in all 6 months even if they have 0 data */
    const result: { label: string; revenue: number; orders: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = agg.find(
        (a) => a._id.year === year && a._id.month === month,
      );
      result.push({
        label: months[month - 1],
        revenue: found?.revenue ?? 0,
        orders: found?.orders ?? 0,
      });
    }

    return result;
  } catch (err) {
    console.error("getMonthlyRevenue error:", err);
    return [];
  }
}

/* ── Top 5 best-selling products ── */

async function getTopProducts() {
  try {
    const agg = await Order.aggregate([
      { $match: { status: { $nin: ["cancelled", "returned"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    /* Enrich with current stock & image */
    const ids = agg.map((a) => a._id);
    const products = await Product.find({ _id: { $in: ids } })
      .select("name sizeStock images")
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    return agg.map((a) => {
      const prod = productMap.get(a._id.toString());
      return {
        id: a._id.toString(),
        name: prod?.name ?? a.name,
        totalSold: a.totalSold,
        totalRevenue: a.totalRevenue,
        stock:
          prod?.sizeStock?.reduce((sum, s) => sum + (s.stock ?? 0), 0) ?? 0,
        image: prod?.images?.[0]?.url ?? "",
      };
    });
  } catch (err) {
    console.error("getTopProducts error:", err);
    return [];
  }
}
