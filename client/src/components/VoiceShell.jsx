import React, { useEffect } from "react";
import {
  BrowserRouter,
  useLocation,
} from "react-router-dom";

import Voice from "../Voice.js";

function NavigationBridge() {
  const location = useLocation();

  useEffect(() => {
    // Voice.js uses React Router's navigate("/")
    // but Astro needs a real browser navigation.
    if (
      location.pathname === "/" &&
      window.location.pathname === "/voice"
    ) {
      window.location.assign("/");
    }
  }, [location.pathname]);

  return null;
}

export default function VoiceShell() {
  return (
    <BrowserRouter>
      <NavigationBridge />
      <Voice />
    </BrowserRouter>
  );
}
