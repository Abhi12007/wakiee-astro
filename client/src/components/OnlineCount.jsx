import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";

export default function OnlineCount() {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    // Presence connection: makes this tab count as "online" on the server.
    // Same-origin connection to the main "/" namespace, same as Video.jsx used.
    const presenceSocket = io();

    const fetchOnlineCount = async () => {
      try {
        const res = await fetch("/api/online-count");
        const data = await res.json();
        if (isMounted) setOnlineCount(data.online);
      } catch (err) {
        // keep showing the previous value
      }
    };

    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      presenceSocket.disconnect();
    };
  }, []);

  return <div className="sub">🟢Online: {onlineCount}</div>;
}
