// hooks/useExamWebSocket.js
import { useEffect, useRef } from "react";

export const useExamWebSocket = (sessionId, onMessage, onConnected) => {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const attempts = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    const connect = () => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(
        `wss://exampro-api.avantlabstech.com/exam-socket?sessionId=${sessionId}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        attempts.current = 0;
        onConnected?.(true);
      };

      ws.onmessage = onMessage;

      ws.onclose = ws.onerror = () => {
        onConnected?.(false);
        if (attempts.current < 10) {
          attempts.current++;
          const delay = Math.min(1000 * 2 ** attempts.current, 30000);
          reconnectRef.current = setTimeout(connect, delay);
        }
      };
    };

    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
};
