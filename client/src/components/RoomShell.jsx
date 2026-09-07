import React, { useEffect } from "react";
import {
  BrowserRouter,
  useLocation,
} from "react-router-dom";

import RoomsPage from "../RoomsPage.jsx";

function NavigationBridge() {
  const location = useLocation();

  useEffect(() => {
    // RoomsPage uses React Router's navigate("/")
    // but Astro needs a real browser navigation.
    if (
      location.pathname === "/" &&
      window.location.pathname === "/rooms"
    ) {
      window.location.assign("/");
    }
  }, [location.pathname]);

  return null;
}

export default function RoomShell() {
  return (
    <BrowserRouter>
      <NavigationBridge />
      <RoomsPage />
    </BrowserRouter>
  );
}
