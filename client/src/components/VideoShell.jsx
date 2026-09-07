import React, { useEffect } from "react";
import {
  BrowserRouter,
  useLocation,
} from "react-router-dom";

import Video from "../Video.jsx";

/*
 * Video.jsx was originally written for React Router.
 *
 * We keep BrowserRouter here so its existing useNavigate()
 * continues to work without modifying Video.jsx.
 */
function NavigationBridge() {
  const location = useLocation();

  useEffect(() => {
    /*
     * Video.jsx uses:
     *
     * navigate("/");
     *
     * Astro owns the "/" page, not React Router.
     *
     * Therefore, when Video.jsx navigates to "/", perform
     * a real browser navigation so Astro loads the homepage.
     */
    if (
      location.pathname === "/" &&
      window.location.pathname === "/video"
    ) {
      window.location.assign("/");
    }
  }, [location.pathname]);

  return null;
}

/*
 * Bridges Video.jsx's existing onCallStart callback
 * to the Astro Navbar.
 *
 * Video.jsx itself remains completely untouched.
 */
function VideoCallEventBridge({ onCallStart }) {
  const handleCallStart = (active) => {
    /*
     * Keep the callback behavior expected by Video.jsx.
     */
    if (typeof onCallStart === "function") {
      onCallStart(active);
    }

    /*
     * Tell Navbar.astro whether a video call is active.
     *
     * Navbar.astro can listen for:
     * "wakiee-video-call"
     */
    window.dispatchEvent(
      new CustomEvent("wakiee-video-call", {
        detail: {
          active: active === true,
        },
      })
    );
  };

  return <Video onCallStart={handleCallStart} />;
}

export default function VideoShell({ onCallStart }) {
  return (
    <BrowserRouter>
      <NavigationBridge />

      <VideoCallEventBridge
        onCallStart={onCallStart}
      />
    </BrowserRouter>
  );
}


