import React, { useEffect, useState } from "react";

export default function OnlineCount() {
const [onlineCount, setOnlineCount] = useState(0);

useEffect(() => {
let isMounted = true;

const fetchOnlineCount = async () => {
  try {
    const res = await fetch("/api/online-count");
    const data = await res.json();

    if (isMounted) {
      setOnlineCount(data.online);
    }
  } catch (err) {
    // Silent fail — keep the existing displayed value
  }
};

// First fetch immediately
fetchOnlineCount();

// Refresh every 5 seconds
const interval = setInterval(
  fetchOnlineCount,
  5000
);

// Cleanup when component is removed
return () => {
  isMounted = false;
  clearInterval(interval);
};


}, []);

return ( <div className="sub">
🟢Online: {onlineCount} </div>
);
}

