"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./useSocket";

/* ================================================================
   useNotifications — Admin notification state hook
   ================================================================ */

export interface Notification {
  _id: string;
  userId: string;
  type: "order" | "system" | "delivery" | "stock" | "user";
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { onEvent, isConnected } = useSocket();

  /* Fetch notifications from API */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=30");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Fetch unread count */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  /* Mark single as read */
  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  }, []);

  /* Mark all as read */
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }, []);

  /* Delete notification */
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotifications((prev) => {
          const removed = prev.find((n) => n._id === id);
          if (removed && !removed.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n._id !== id);
        });
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  }, []);

  /* Initial fetch */
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* Real-time listener */
  useEffect(() => {
    const cleanup = onEvent("new-notification", (data: unknown) => {
      const notification = data as Notification;
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });
    return cleanup;
  }, [onEvent]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
    fetchUnreadCount,
  };
}
