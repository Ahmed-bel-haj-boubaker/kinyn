"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, type Socket } from "socket.io-client";

/* ================================================================
   useSocket — Admin Socket.IO hook
   ================================================================
   Manages Socket.IO connection for real-time notifications.
   ================================================================ */

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-admin-room");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const onEvent = useCallback(
    (event: string, callback: (data: unknown) => void) => {
      socketRef.current?.on(event, callback);
      return () => {
        socketRef.current?.off(event, callback);
      };
    },
    [],
  );

  return { socket: socketRef, isConnected, onEvent };
}
