//video logic implemented

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { updateSEO } from "./updateSEO";
import io from "socket.io-client";
import "./Video.css";
import { useWakieeID } from "./WakieeID";
import { useReportSystem } from "./ban";

const socket = io();  // same origin connection

// ================= TURN CACHE start =================
let cachedTurn = null;
let turnFetchedAt = 0;
const TURN_TTL = 25 * 60 * 1000; // 25 minutes

async function getCloudflareTurnServers() {
  if (cachedTurn && Date.now() - turnFetchedAt < TURN_TTL) {
    return cachedTurn;
  }

  try {
    const res = await fetch("/api/turn", { method: "POST" });
    const data = await res.json();
    cachedTurn = data.iceServers || [];
    turnFetchedAt = Date.now();
    return cachedTurn;
  } catch (err) {
    console.error("TURN fetch failed", err);
    return [];
  }
}
// ================= TURN CACHE end =================

export default function Video({ onCallStart }) {
  const navigate = useNavigate();
useEffect(() => {
  updateSEO({
    title: "Random Video Chat | Free Video Chat with Strangers | Wakiee",

    description:
     "Enjoy free random video chat with strangers online on Wakiee. Meet real people through secure video calls with no signup, no downloads, AI moderation, Human reporting, and high-quality webcam chat.",

    keywords:
      "random video chat ,video chat,video chat with strangers, online video calls free,american random video call free, american random video call,online video call,webcam chat with strangers,no signup video chat,omegle online,talk to strangers video chat, webcam chat online, free video call strangers, omegle alternative video chat, random video call,free video chat,chat with strangers,video chat online,video chat with strangers",

   robots: "index, follow, max-image-preview:large",

    canonical: "https://wakiee.live/video",

    og: {
      title: "Random Video Chat – Wakiee",
      description:
        "Start live video chat with strangers and meet people worldwide instantly.",
      url: "https://wakiee.live/video",
      image: "https://wakiee.live/android-chrome-192x192.png",
    },

    twitter: {
      title: "Random Video Chat – Wakiee",
      description:
        "Talk to strangers through live webcam and random video chat.",
      image: "https://wakiee.live/android-chrome-192x192.png",
    },

    schema: {
      "@context": "https://schema.org",
      "@graph": [

        {
          "@type": "WebApplication",
          name: "Wakiee Video Chat",
          url: "https://wakiee.live/video",
          applicationCategory: "CommunicationApplication",
          operatingSystem: "All",
          description:
            "Wakiee is a random video chat platform that lets users talk to strangers through live webcam conversations.",

          isPartOf: {
            "@type": "WebSite",
            "@id": "https://wakiee.live/#website",
          },

          publisher: {
            "@type": "Organization",
            name: "Wakiee",
            url: "https://wakiee.live/",
            logo: {
              "@type": "ImageObject",
              url: "https://wakiee.live/android-chrome-192x192.png",
            },
          },
        },

        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Home",
              item: "https://wakiee.live/",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Video Chat",
              item: "https://wakiee.live/video",
            },
          ],
        },

        {
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Is Wakiee video chat free?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "Yes, Wakiee offers completely free random video chat without login or signup.",
              },
            },
            {
              "@type": "Question",
              name: "Do I need to create an account?",
              acceptedAnswer: {
                "@type": "Answer",
                text:
                  "No, you can start video chat instantly without creating an account.",
              },
            },
          ],
        },

      ],
    },
  });
}, []);


  
  const [name, setName] = useState("");
  const [gender, setGender] = useState(null);
  
const { wakieeID, banInfo, BanOverlay } = useWakieeID();

  
  const [error, setError] = useState("");
 /*= const [permissionGranted, setPermissionGranted] = useState(false); ===========not needed===*/
  const [callStarted, setCallStarted] = useState(false);
    /* ===============================
     LOCAL CAMERA PREVIEW STATES
  =============================== */

  const localVideoRef = useRef(null);
  // 🔹 Remote partner video
const remoteVideoRef = useRef(null);

// 🔹 WebRTC peer connection instance
const pcRef = useRef(null);

// 🔹 Stable reference to local media stream (for WebRTC)
const localStreamRef = useRef(null);
  const remoteContainerRef = useRef(null);

  // ICE retry protection , maximum 3 tries for connection , else stuck in loop.
const iceRetryRef = useRef(0);
const MAX_ICE_RETRIES = 3;

const [localPos, setLocalPos] = useState({ right: 20, top: 20 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
 const [facingMode, setFacingMode] = useState("user"); 
  /* ===============================
   VIDEO CALL STATE (WebRTC)
=============================== */

// Call lifecycle state
const [status, setStatus] = useState("init");
// init | searching | waiting | in-call

// Partner info
const [partnerId, setPartnerId] = useState(null);
const [partnerInfo, setPartnerInfo] = useState(null);

  const { openReport, ReportModal, CooldownModal } = useReportSystem(socket, wakieeID, partnerInfo);

// Mic & camera toggle states
const [micOn, setMicOn] = useState(true);
const [camOn, setCamOn] = useState(true);

// Remote video ready (used for spinner)
const [remoteReady, setRemoteReady] = useState(false);
  
//Messages
  const [messages, setMessages] = useState([]);
const [messageInput, setMessageInput] = useState("");
const [partnerTyping, setPartnerTyping] = useState(false);

const chatEndRef = useRef(null);

 
  
  // ================= ATTACH LOCAL PREVIEW AFTER RENDER =================
useEffect(() => {
  if (!callStarted) return;
  if (!localStreamRef.current) return;
  if (!localVideoRef.current) return;

  localVideoRef.current.srcObject = localStreamRef.current;
  localVideoRef.current.muted = true;

  localVideoRef.current.play().catch(() => {});
}, [callStarted]);

  //========================================preview start on start videocall end===========

  //=============================Auto scroll messages=========================
  useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, partnerTyping]);
  //-------------------------------Auto scroll messages=========================

 useEffect(() => {

  if (status !== "in-call") return;

  let lastStats = { bytesSent: 0, timestamp: 0 };
  let lastChange = 0;

  const interval = setInterval(async () => {

    if (!pcRef.current) return;

    const now = Date.now();
    if (now - lastChange < 8000) return;

    const stats = await pcRef.current.getStats();

    let outbound;

    stats.forEach(r => {
      if (r.type === "outbound-rtp" && r.kind === "video" && !r.isRemote)
        outbound = r;
    });

    if (!outbound) return;

    if (lastStats.timestamp) {

      const bytes = outbound.bytesSent - lastStats.bytesSent;
      const time = (outbound.timestamp - lastStats.timestamp) / 1000;

      const bitrate = (8 * bytes) / 1024 / time;

      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (!videoTrack) return;

      if (bitrate < 300) {

        await videoTrack.applyConstraints({
          width: { ideal: 640 },
          height: { ideal: 360 },
          frameRate: { ideal: 24 }
        });

      }

      else if (bitrate < 1200) {

        await videoTrack.applyConstraints({
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        });

      }

      else {

        await videoTrack.applyConstraints({
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        });

      }

      lastChange = now;
    }

    lastStats = {
      bytesSent: outbound.bytesSent,
      timestamp: outbound.timestamp
    };

  }, 3000);

  return () => clearInterval(interval);

}, [status]);
  
 
  
  /* =========================================
     Handle Media Errors Properly
  ========================================= */
  const handleMediaError = (err) => {
    console.log("Media error:", err);

    switch (err.name) {
      case "NotAllowedError":
        setError("Permission denied. Please allow camera and microphone access.");
        break;

      case "NotFoundError":
        setError("No camera or microphone device found.");
        break;

      case "NotReadableError":
        setError("Camera or microphone is already in use by another application.");
        break;

      case "OverconstrainedError":
        setError("Requested media settings are not supported by your device.");
        break;

      default:
        setError("Unable to access camera or microphone. Please check your device.");
    }

   /* ==========setPermissionGranted(false);=======not needed*/
  };

  // ================= START LOCAL STREAM =================
async function startLocalStream() {

  if (localStreamRef.current) return localStreamRef.current;

const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 }
  },
  audio: {
    channelCount: 2,
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});

  const videoTrack = stream.getVideoTracks()[0];

if (videoTrack && "contentHint" in videoTrack) {
  videoTrack.contentHint = "motion";
}
  
  // Apply mic/cam state
  stream.getAudioTracks().forEach(t => t.enabled = micOn);
  stream.getVideoTracks().forEach(t => t.enabled = camOn);

  localStreamRef.current = stream;

  // Show local preview
  if (localVideoRef.current && camOn) {
    localVideoRef.current.srcObject = stream;
    localVideoRef.current.muted = true;
  }

  return stream;
}
  //==========================START LOCAL STREAM =================
  // ================= CREATE PEER =================
async function createPeerConnection(partnerSocketId, initiator, remoteOffer = null) {

  if (pcRef.current) {
    pcRef.current.close();
    pcRef.current = null;
  }

  const turnServers = await getCloudflareTurnServers();
  //===========================================================================Try removing cloud flare stun then check connection==============================================
  const pc = new RTCPeerConnection({

  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    
    ...turnServers,
     
  ],

  iceCandidatePoolSize: 10,

  bundlePolicy: "max-bundle", 
  rtcpMuxPolicy: "require"  , 
   //old success rate 94-96 with these two lines 99.5-99.7% works in open nat,restricted nat, symmetric nat via turn 
  //bundlePolicy: "max-bundle"--Instead of:1 transport for audio 1 transport for video,It uses: 1 transport for everything,Benefits: faster connection,fewer NAT issues,lower CPU
  //rtcpMuxPolicy: "require" ,Old WebRTC needed:RTP port,RTCP port Modern WebRTC uses one port.This reduces:NAT failures,firewall blocking

});

  // ICE restart safety checking means: browser testing STUN/TURN candidatestrying to find a working path*...............Problem: ICE can get stuck in checking.....state=checking checking

  // What restartIce() does restartIce() tells the browser:Forget all previous ICE candidates 
 // ↓
//Collect new candidates
//↓
//Retry STUN/TURN negotiation
//So instead of:
//checking forever
//it becomes:
//checking
//↓
//restart ICE
//↓
//checking again
//↓
//connected
setTimeout(() => {
  if (pcRef.current?.iceConnectionState === "checking") {
    console.log("ICE stuck in checking — restarting ICE");
    pcRef.current.restartIce();
  }
}, 7000);
  
  
  // 👇 ADD THIS BLOCK HERE
pc.oniceconnectionstatechange = () => {

  const state = pc.iceConnectionState;
  console.log("ICE state:", state);

  if (state === "connected" || state === "completed") {
    iceRetryRef.current = 0; // reset when success
    return;
  }

  if (state === "failed" || state === "disconnected") {

    iceRetryRef.current += 1;

    console.log("Retry attempt:", iceRetryRef.current);

    socket.emit("leave");
    cleanupCall(false);

    // ======================try reconnect to SAME partner max 3 tries============================================================
    if (iceRetryRef.current < MAX_ICE_RETRIES) {

      setStatus("waiting");

      setTimeout(() => {
        socket.emit("join", { name, gender, wakieeID });
        setStatus("searching");
      }, 1500);

      return;
    }

    //====================== after 3 failures → send both users back to queue=====================================
    console.warn("Max ICE retries reached, returning to queue");

    iceRetryRef.current = 0;

    setStatus("searching");

    setTimeout(() => {
      socket.emit("join", { name, gender, wakieeID });
    }, 1000);
  }

};
  pcRef.current = pc;

  // When remote stream arrives
  pc.ontrack = (e) => {
    remoteVideoRef.current.srcObject = e.streams[0];
    setRemoteReady(true);
    setStatus("in-call");
  };

  // Send ICE candidates to partner
  pc.onicecandidate = (e) => {
    if (e.candidate) {
      socket.emit("ice-candidate", { to: partnerSocketId, candidate: e.candidate });
    }
  };

  const stream = await startLocalStream();
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
  
  pc.getSenders().forEach(sender => {

  if (sender.track && sender.track.kind === "audio") {

    const params = sender.getParameters();

    if (!params.encodings)
      params.encodings = [{}];

    params.encodings[0].maxBitrate = 128000;

    sender.setParameters(params).catch(() => {});

  }

});

 
  
  if (initiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit("offer", { to: partnerSocketId, sdp: offer });
  } else if (remoteOffer) {
    await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", { to: partnerSocketId, sdp: answer });
  }
}
  //====== CREATE PEER ==========================================
  // ================= CLEANUP =================
function cleanupCall(stopCamera = false) {

  setRemoteReady(false);

  if (pcRef.current) {
    pcRef.current.close();
    pcRef.current = null;
  }

  if (remoteVideoRef.current)
    remoteVideoRef.current.srcObject = null;

  if (stopCamera && localStreamRef.current) {
    localStreamRef.current.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    if (localVideoRef.current)
      localVideoRef.current.srcObject = null;
  }
}
  // ================= CLEANUP =================
  
  //===========================Matching function===================
 function startMatching() {
  if (status !== "ready") return; //prevents double join

 socket.emit("join", { name, gender, wakieeID });
  setStatus("searching");
}
   //===========================Matching function===================
  ////////////////////////////////////////////////////////////////////////==buttons===///////////////////////////////////////
  //=========================================================================================Send message function========================
  function sendMessage() {

  const text = messageInput.trim();   // remove spaces

  if (!text) return;                  // prevent empty message
  if (!partnerId) return;             // prevent sending without partner

  // send message to partner
 socket.emit("chat-message", {
  to: partnerId,
  message: text
});

  // add message to local chat
  setMessages(prev => [
    ...prev,
    { sender: "self", text }
  ]);

  // clear input field
  setMessageInput("");

  // stop typing indicator
  setPartnerTyping(false);
}
  //===================================================send message=================================================================

// ================= NEXT =================
function handleNext() {
  {/*disable if not in call double safety       if (status !== "in-call") return;  */}
  if (partnerId)
    socket.emit("leave");

  cleanupCall(false);
  setPartnerId(null);
   setMessages([]);   // ✅ clear chat when switching partner

  // 👇 NEW STATE
  setStatus("cooldown");
  setTimeout(() => {
    socket.emit("join", { name, gender, wakieeID });
    setStatus("searching");
  }, 6000); // 6 second delay
}

// ================= STOP =================
function handleStop() {

  // Remove from queue / room
  socket.emit("leave");

  // Close peer connection only
  cleanupCall(false);   // 🔥 false = do NOT stop camera

  setPartnerId(null);
  setPartnerInfo(null);
 setMessages([]);   // ✅ clear chat
  // Back to ready state
  setStatus("ready");
}

// ================= MIC TOGGLE =================
function toggleMic() {

  if (!localStreamRef.current) return;

  const track = localStreamRef.current.getAudioTracks()[0];
  track.enabled = !track.enabled;

  setMicOn(track.enabled);
}

// ================= CAMERA TOGGLE =================
function toggleCam() {

  if (!localStreamRef.current) return;

  const videoTrack = localStreamRef.current.getVideoTracks()[0];
  if (!videoTrack) return;

  // Toggle camera track
  videoTrack.enabled = !videoTrack.enabled;

  //===========camera light is still on because camera is still working when camera is off it is not sending frames , this is fast , dont change code to stop camera ,it will close camera light but delay sending video and not required right now=============

  setCamOn(videoTrack.enabled);

  if (!videoTrack.enabled) {
    // Remove preview
    if (localVideoRef.current)
      localVideoRef.current.srcObject = null;
  } else {
    // Restore preview
    if (localVideoRef.current)
      localVideoRef.current.srcObject = localStreamRef.current;
  }
}

// ================= RELOAD CAMERA =================
async function reloadCamera() {

  if (!localStreamRef.current) return;

  const currentTrack = localStreamRef.current.getVideoTracks()[0];
  if (!currentTrack) return;

  const currentFacing = currentTrack.getSettings().facingMode || "user";
const newFacing = currentFacing === "environment" ? "user" : "environment";

  const newStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: newFacing },
    audio: false, //==========================earlier it was true but problem that can arise  echo ,audio glitch,permission popup, now we only restart camera steam not mic=========================================
  });

  const newVideoTrack = newStream.getVideoTracks()[0];

  // Replace track inside peer connection
  const sender = pcRef.current?.getSenders().find(
    s => s.track?.kind === "video"
  );

  if (sender) {
    await sender.replaceTrack(newVideoTrack);
  }

  // Stop old video track
  currentTrack.stop();

  // Replace inside local stream
  localStreamRef.current.removeTrack(currentTrack);
  localStreamRef.current.addTrack(newVideoTrack);

  // Update preview
  if (camOn && localVideoRef.current) {
    localVideoRef.current.srcObject = localStreamRef.current;
  }
}
  //==========================================================================buttons======////////////////////////////////////////////////
  /* =========================================
     Start Video Call (Same URL)
  ========================================= */
const handleStart = async () => {
  if (!gender) {
    setError("Please select your gender.");
    return;
  }

  try {
   const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    facingMode: "user",
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 }
  },
  audio: {
    channelCount: 2,
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});

    localStreamRef.current = stream;

    setMicOn(true);
    setCamOn(true);

  } catch (err) {
    handleMediaError(err);
    return;
  }

  sessionStorage.setItem("wakiee_name", name.trim());
  sessionStorage.setItem("wakiee_gender", gender);

  setError("");
  setCallStarted(true);
  setStatus("ready");
  onCallStart(true);
};
 
  /* ===============================
   EXIT CALL FUNCTION
=============================== */
const handleExit = () => {

  socket.emit("leave");
  cleanupCall(true);

  setCallStarted(false);
  setStatus("init");
  setPartnerId(null);
  setPartnerInfo(null);

  sessionStorage.removeItem("wakiee_name");
  sessionStorage.removeItem("wakiee_gender");

  onCallStart(false);
  navigate("/");
};
  /*=============local camera drag============ */
 const handlePointerDown = (e) => {
  const container = remoteContainerRef.current;
  if (!container) return;

  const rect = container.getBoundingClientRect();

  const previewWidth = 120;

  const currentLeft =
    rect.width - localPos.right - previewWidth;

  setDragging(true);
  setOffset({
    x: e.clientX - currentLeft,
    y: e.clientY - localPos.top,
  });
};

const handlePointerMove = (e) => {
  if (!dragging) return;

  const container = remoteContainerRef.current;
  if (!container) return;

  const rect = container.getBoundingClientRect();
  const previewWidth = 120;
  const previewHeight = 90;

  let newLeft = e.clientX - offset.x;
  let newTop = e.clientY - offset.y;

  // Keep inside bounds
  newLeft = Math.max(0, Math.min(newLeft, rect.width - previewWidth));
  newTop = Math.max(0, Math.min(newTop, rect.height - previewHeight));

  // Convert LEFT to RIGHT
  const newRight = rect.width - newLeft - previewWidth;

  setLocalPos({
    right: newRight,
    top: newTop,
  });
};
  const handlePointerUp = () => {
  setDragging(false);
};

  //===========================================socket event ========= 
  useEffect(() => {

  socket.on("waiting", () => {
    setStatus("waiting");
  });

 socket.on("paired", async ({ partnerId, initiator, partnerInfo }) => {
  iceRetryRef.current = 0;   // reset retry counter when a new partner connects
  setPartnerId(partnerId);
  setPartnerInfo(partnerInfo);
  await createPeerConnection(partnerId, initiator);
});

  socket.on("offer", async ({ from, sdp }) => {
    await createPeerConnection(from, false, sdp);
  });

  socket.on("answer", async ({ sdp }) => {
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on("ice-candidate", async ({ candidate }) => {
    if (pcRef.current)
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
  });

   socket.on("chat-message", ({ message }) => {
  setMessages(prev => [
    ...prev,
    { sender: "partner", text: message }
  ]);
});

socket.on("typing", () => {
  setPartnerTyping(true);

  setTimeout(() => {
    setPartnerTyping(false);
  }, 1500);
});
   
    /* 🚫 USER BANNED */
socket.on("banned-video", ({ reason, banMinutes }) => {

  console.log("🚫 banned:", reason);

  cleanupCall(true);

  setCallStarted(false);
  setStatus("init");

  navigate("/");

  setTimeout(() => {
    alert(`You have been banned for ${banMinutes} minutes`);
  }, 400);

});

    
  socket.on("partner-left", () => {
    cleanupCall(false);
    setPartnerId(null);
     setMessages([]);
    setPartnerTyping(false);
    setStatus("waiting");

    setTimeout(() => {
socket.emit("join", { name, gender, wakieeID });
    }, 2000);
  });

//=====  return () => socket.removeAllListeners();    This removes EVERY socket event globally, including events used by: voice page,rooms page,future features    
return () => {
  socket.off("waiting");
  socket.off("paired");
  socket.off("offer");
  socket.off("answer");
  socket.off("ice-candidate");
  socket.off("chat-message");
  socket.off("typing");
  socket.off("partner-left");
  socket.off("banned-video");
};
}, [name, gender, wakieeID]);
  //=======================socket event========================================
   /* ===============================
     RENDER
  =============================== */
  return (
    <div className={callStarted ? "video-page active-call" : "video-page"}>

     {!callStarted ? (
  <div className="precall-wrapper">
       
        <div className="video-card">
          <h2 className="video-heading">I am</h2>

        <input
  type="text"
  className="video-input"
  placeholder="Enter Your Name (Optional)"
  value={name}
  maxLength={15}
  onChange={(e) => {
    const value = e.target.value;

    // Allow only letters and numbers
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "");

    // Limit to 15 characters
    setName(cleaned.slice(0, 15));
  }}
/>

          {error && <p className="video-error">{error}</p>}

          <div className="gender-row">
            <div
              className={`gender-box ${gender === "male" ? "active" : ""}`}
              onClick={() => setGender("male")}
            >
              ♂️ Male
            </div>

            <div
              className={`gender-box ${gender === "female" ? "active" : ""}`}
              onClick={() => setGender("female")}
            >
              ♀️ Female
            </div>

            <div
              className={`gender-box ${gender === "other" ? "active" : ""}`}
              onClick={() => setGender("other")}
            >
              ⚧️ Other
            </div>
          </div>

         <button
className="start-button"
onClick={handleStart}
disabled={banInfo}
>
Start Video Call
</button> 
        </div>


      <section className="video-seo-video">


        <h1>Random Video Chat – Talk to Strangers Online for Free</h1>
        <p> Random <strong>video chat</strong> has changed the way people meet online. 
          Instead of spending hours scrolling through social media or waiting for someone to reply to a message, 
          you can start a real face-to-face conversation within seconds. Whether you're looking to make new friends, 
          improve your communication skills, practice another language, or simply enjoy talking with someone new after a busy day, 
          <strong> random video chat</strong> offers a simple and exciting way to connect with people from around the world. Best of all,
          Wakiee lets you enjoy <strong> free video chat</strong> with <strong>no signup</strong>, <strong>no downloads</strong>, and no complicated registration process. 
        </p> 
        <p> Many people search for an <strong><a href="https://wakiee.live">American random video call free</a></strong> experience because they hope to meet people from the United States, 
          practice English with native speakers, or learn more about American culture. 
          Others simply enjoy meeting people from different countries and discovering how similar everyday life can be around the world. 
          Since every conversation is completely random,
          you never know whether your next <strong>video chat with strangers</strong> will introduce you to a college student in Texas, 
          a traveler in California, someone relaxing after work in New York, or a friendly person from another part of the world. Every click could start a new conversation, a new friendship, or an unforgettable story.
        </p> 
       
        <p> Whether you're looking for <strong>online video calls free</strong>, a reliable <strong>webcam chat with strangers</strong>, a modern <strong>Omegle alternative</strong>, 
          or an easy way to <strong>meet new people online</strong>, Wakiee gives you multiple ways to connect. 
            Start a <strong>random webcam chat</strong>, enjoy high-quality video calls, switch to <a href="https://wakiee.live/voice">voice chat </a>whenever you prefer, or continue the conversation in one of our public Rooms. 
          Every conversation is different, every person has a unique story, and sometimes a simple "Hello" becomes the beginning of a memorable friendship. </p>


  
<h2>Why Do People Use Random Video Chat?</h2>
<p>
Have you ever wondered why millions of people choose <strong>random video chat</strong> instead of simply sending text messages or scrolling through social media? The answer is simple—video conversations feel real. Seeing someone's smile, hearing their voice, and sharing a genuine reaction creates a connection that text alone often can't match. Whether you're looking to make friends, improve your confidence, or simply enjoy a conversation with someone outside your everyday routine, <strong>video chat with strangers</strong> offers a refreshing way to connect with real people from around the world.
</p>
<p>
People use <strong><a href="https://wakiee.live/video">free video chat</a></strong> for many different reasons. Some join after finishing work because they want a break from social media. Others enjoy meeting people from different countries, practicing English, or learning about cultures they may never experience in person. For example, one conversation might be with a university student preparing for exams, while the next could be with someone planning their first trip abroad. Those unexpected moments are what make every conversation unique.
</p>
<p>
Many users also find that face-to-face conversations help reduce social anxiety. If introducing yourself to new people feels difficult, having short online conversations can gradually build confidence. Over time, saying "Hello" becomes easier, conversations become more natural, and meeting new people feels less intimidating. A simple five-minute conversation can sometimes teach you more about another culture than reading dozens of articles online.
</p>
<p>
Another reason people enjoy <strong>online video calls free</strong> is the sense of spontaneity. There are no long profiles to browse or complicated matching systems to wait for. You simply click Start and begin talking. Every connection is different, and every conversation has the potential to surprise you. You might discover a shared hobby, exchange travel recommendations, discuss your favorite movies, or simply enjoy a laugh with someone you've never met before.
</p>
<p>
At Wakiee, every <strong>random webcam chat</strong> is designed to be quick, simple, and welcoming. With <strong>no signup</strong>, <strong>no downloads</strong>, AI-assisted moderation, and human reporting, you can spend less time setting things up and more time enjoying meaningful conversations with people from around the world.
</p>

        
<h2>Benefits of Video Chat With Strangers</h2>
<p>
The biggest benefit of <strong>video chat with strangers</strong> is that every conversation gives you a chance to experience something new. Sometimes you'll learn about another country's traditions, discover a new recipe, hear travel stories, or even receive advice from someone with a completely different perspective. These small moments often become the most memorable part of the experience because they're genuine, unscripted, and completely unexpected.
</p>
<p>
Many people are surprised by how much they improve their communication skills through regular conversations. Speaking with new people encourages you to listen carefully, ask thoughtful questions, and express yourself more confidently. Whether you're preparing for a job interview, practicing another language, or simply becoming more comfortable talking to new people, <strong>random video chat</strong> can be a fun and practical way to build those skills naturally.
</p>
<p>
Another advantage is the opportunity to meet people you would probably never encounter in everyday life. Imagine finishing dinner and, within seconds, chatting with someone who lives thousands of miles away. They might recommend places to visit in their city, introduce you to local traditions, or share stories about everyday life that you'd never find in a guidebook. These conversations remind us how connected the world has become.
</p>
<p>
Many long-term users also say that <strong>video chat</strong> helps reduce feelings of loneliness. Even a short conversation with someone friendly can brighten your mood after a stressful day. While not every chat becomes a lasting friendship, each conversation offers a chance to smile, learn something new, and appreciate different viewpoints. Sometimes the best conversations happen when you least expect them.
</p>
<p>
Whether you're searching for an <strong><a href="https://wakiee.live">American random video call</a></strong>, looking to <strong>make friends online</strong>, exploring a modern <strong>Omegle alternative</strong>, or simply hoping to enjoy a high-quality <strong>webcam chat with strangers</strong>, the real value isn't just the technology—it's the people you meet along the way. Every conversation is another opportunity to build confidence, discover something interesting, and create memories that stay with you long after the call ends.
</p>


        
<h2>Who Uses Random Video Chat Platforms?</h2>
<p>
One of the most interesting things about <strong>random video chat</strong> is that there isn't a "typical" user. People from different countries, age groups, professions, and backgrounds join every day for their own reasons. Some simply want a friendly conversation after work, while others hope to <strong>make friends online</strong>, practice another language, learn about different cultures, or meet people they would never normally encounter in everyday life.
</p>
<p>
For example, imagine a university student preparing for an exchange program who wants to improve their English before moving abroad. In the next conversation, you might meet someone who has just finished work and is looking to relax with a casual chat. A traveler might join to ask about local attractions, while another person simply wants to hear different opinions about movies, music, technology, or sports. Every <strong>video chat with strangers</strong> becomes a chance to discover something new.
</p>
<p>
Many users also enjoy meeting people from specific regions. Some search for an <strong>American random video call free</strong> experience because they're interested in American culture, while others are simply excited to meet people from anywhere in the world. Since every match is random, each conversation feels like opening a door to a completely different story. That's one of the reasons why <strong><a href="https://wakiee.live">online video calls free</a></strong> continue to grow in popularity around the world.
</p>
<p>
No matter why someone joins, the goal is usually the same—to enjoy genuine conversations with real people. Some chats last only a few minutes, while others lead to lasting friendships or regular conversations. That's what makes <strong>free video chat</strong> different from traditional social media. Instead of collecting followers, you're creating real moments with real people.
</p>


        
<h2>How Random Video Chat Works</h2>
<p>
If you've never tried <strong>random video chat</strong> before, the process is surprisingly simple. Open the platform, allow your camera and microphone if you want to use video, and press the Start button. Within seconds, you'll be connected with another person who is also ready to chat. There's no long registration process, no complicated profile setup, and no waiting for friend requests to be accepted.
</p>
<p>
Every new connection begins with a blank page. You don't know who you'll meet, where they're from, or what you'll talk about—and that's exactly what makes the experience exciting. One conversation might revolve around travel, another around favorite TV shows, and the next could become a discussion about careers, hobbies, or everyday life. The unpredictability keeps every <strong>video chat</strong> fresh and interesting.
</p>
<p>
If you prefer face-to-face conversations, you can continue using video throughout the chat. If you'd rather focus on the conversation itself, you can switch to voice chat whenever it's available. Wakiee also allows users to skip to the next conversation whenever they want, making it easy to find someone who shares similar interests. This flexibility helps create a comfortable experience for both new and experienced users.
</p>
<p>
Unlike older chat websites, Wakiee is designed to keep things simple. With <strong>no signup</strong>, <strong>no downloads</strong>, AI-assisted moderation, and human reporting, you can focus on meeting people instead of worrying about complicated setup or unnecessary distractions. Whether you're looking for a <strong>random webcam chat</strong>, a quick conversation during your lunch break, or a longer discussion with someone across the world, getting started only takes a few seconds.
</p>


        
<h3>What Makes Every Video Chat Different?</h3>
<p>
The best part about <strong>video chat with strangers</strong> is that no two conversations are ever the same. One day you might receive restaurant recommendations from someone living in New York. Another day you could learn a few phrases in Spanish, hear about life in another country, or exchange ideas with someone who shares your favorite hobby. These unexpected experiences are what keep people coming back. Every conversation offers an opportunity to learn something new, broaden your perspective, and enjoy a genuine human connection that simply isn't possible through endless scrolling on social media.
</p>



        
<h2>How to Start Your First Video Call</h2>
<p>
Trying <strong>random video chat</strong> for the first time can feel exciting, especially if you've never spoken to someone you've just met online. Many people wonder what to say, whether they'll have anything in common with the other person, or if the conversation will feel awkward. The truth is that almost everyone feels that way at first. Fortunately, starting a great <strong>video chat</strong> is much easier than most people expect.
</p>
<p>
Begin by choosing a quiet place where you feel comfortable. Make sure your camera, microphone, and internet connection are working properly so your conversation is clear from the beginning. If you're chatting from a public place, using headphones can improve audio quality while giving you a little more privacy. These small steps help both people enjoy a smoother conversation.
</p>
<p>
When the call begins, don't worry about finding the perfect opening line. A friendly smile and a simple "Hi, how's your day going?" are often enough. You could ask where the other person is from, what hobbies they enjoy, or whether they have any travel recommendations. Small questions often lead to surprisingly interesting conversations. One person might tell you about hiking trails near their home, while another could recommend a movie you end up loving. That's the beauty of <strong>video chat with strangers</strong>—every conversation has the potential to surprise you.
</p>
<p>
If the conversation doesn't flow naturally, don't feel discouraged. Not every match will become a memorable one, and that's completely normal. One of the advantages of <strong>free video chat</strong> is that you can simply move on to another conversation and meet someone new. Every click is another opportunity to connect with a different person, hear another story, or discover a shared interest.
</p>

        
<h3>Quick Steps Before You Press Start</h3>
<ul>
<li>Choose whether you want video chat or voice chat.</li>
<li>Check that your camera, microphone, and internet connection are working properly.</li>
<li>Find a quiet place where you feel comfortable talking.</li>
<li>Smile, relax, and start with a simple greeting.</li>
<li>Be respectful, avoid sharing personal information, and enjoy the conversation.</li>
</ul>

<h2>Why Choose Wakiee for Random Video Chat?</h2>
<p>
There are many websites offering <strong>random video chat</strong>, but a great experience depends on much more than simply connecting two people. Wakiee was designed to make online conversations easy, enjoyable, and welcoming from the moment you arrive. Instead of filling out long registration forms or downloading another app, you can start chatting within seconds and focus on what really matters—meeting real people.
</p>
<p>
One feature many users appreciate is the flexibility. Some days you may want a quick five-minute conversation during a break, while other days you might spend an hour talking with someone who shares your interests. Whether you're looking for a casual <strong>video chat with strangers</strong>, hoping to <strong>make friends online</strong>, or searching for an <strong>American random video call</strong> to learn more about life in the United States, every conversation begins instantly with no unnecessary setup.
</p>
<p>
Safety is another important reason people choose Wakiee. The platform combines <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and clear community guidelines to encourage respectful conversations. While no online platform can guarantee that every interaction will be perfect, these features help reduce inappropriate behavior and give users greater confidence when meeting someone new.
</p>
<p>
Wakiee also works directly in your browser with <strong>no signup</strong> and <strong>no downloads</strong>, making it easy to enjoy <strong>online video calls free</strong> on desktop, tablet, or mobile. If you want to continue meeting new people after a video conversation, you can switch to voice chat or join <a href="https://wakiee.live/rooms">public Rooms</a> where multiple users share ideas, stories, and experiences together.
</p>

        
<h3>Why People Keep Coming Back</h3>
<p>
Ask regular users why they enjoy Wakiee, and you'll often hear the same answer: every conversation feels different. One evening you might laugh with someone who shares your taste in music, and the next day you could learn about another country's traditions from someone living thousands of miles away. Those unexpected moments make every <strong>random webcam chat</strong> feel fresh, personal, and worth trying again.
</p>



<h2>Tips for Better Video Conversations</h2>
<p>
The best <strong>random video chat</strong> conversations don't happen because someone has the perfect opening line—they happen because both people feel comfortable enough to be themselves. If you're new to <strong>video chat with strangers</strong>, don't worry about making a great first impression. Instead, focus on being friendly, curious, and respectful. A genuine conversation is always more enjoyable than trying to impress someone.
</p>
<p>
One simple tip is to smile before saying hello. It sounds small, but a friendly smile immediately makes a conversation feel more relaxed. Ask open-ended questions instead of questions that can only be answered with "yes" or "no." For example, instead of asking "Do you like movies?" try asking "What's the best movie you've watched recently?" Questions like these naturally keep the conversation moving.
</p>
<p>
Good lighting and clear audio also make a big difference. If you're using <strong>free video chat</strong> on your phone or computer, sit in a well-lit place so the other person can see you clearly. Make sure your microphone isn't blocked, and consider using headphones if you're chatting in a shared environment. Small improvements like these often make conversations feel smoother and more enjoyable for both people.
</p>
<p>
Remember that every conversation is different. Some people love discussing travel, others enjoy talking about music, gaming, books, sports, or food. If one topic doesn't create much interest, simply change the subject. One of the best parts of <strong>online video calls free</strong> is discovering unexpected connections through everyday conversations.
</p>


        
<h3>Simple Conversation Starters</h3>
<ul>
<li>What inspired you to try random video chat today?</li>
<li>What's something interesting about the city or country where you live?</li>
<li>If you could travel anywhere tomorrow, where would you go?</li>
<li>What's your favorite hobby outside work or school?</li>
<li>Have you met anyone interesting through online video chats before?</li>
</ul>

        
<h2>Common Mistakes During Video Chats</h2>
<p>
Even experienced users occasionally have conversations that don't go as planned, and that's completely normal. One common mistake is trying too hard to impress the other person. People usually enjoy honest conversations much more than exaggerated stories or rehearsed jokes. Being yourself is almost always the best approach.
</p>
<p>
Another mistake is asking personal questions too quickly. Although <strong>video chat</strong> is designed for meeting new people, trust develops over time. Avoid asking for someone's address, passwords, banking information, or private social media accounts during your first conversation. Respecting personal boundaries helps both people feel more comfortable.
</p>
<p>
Some users also forget that listening is just as important as talking. Great conversations are balanced. Give the other person time to share their experiences, ask follow-up questions, and show genuine interest in what they're saying. Whether you're enjoying a <strong>random webcam chat</strong> or a longer conversation, people appreciate feeling heard.
</p>
<p>
Finally, don't be discouraged if every conversation isn't amazing. That's part of the experience. One chat may last only a minute, while the next could become one of the most memorable conversations you've had all week. Every click introduces you to someone completely new, and that's what keeps <strong>video chat with strangers</strong> exciting.
</p>

        
<h2>Is Random Video Chat Safe?</h2>
<p>
One of the most common questions people ask is whether <strong>random video chat</strong> is safe. The answer depends on both the platform you choose and the way you use it. Just like meeting someone new in everyday life, it's important to use common sense, protect your privacy, and choose platforms that actively work to create a respectful community.
</p>
<p>
Wakiee combines <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and community guidelines to help reduce inappropriate behavior and improve the overall experience. While technology helps identify harmful activity, users also play an important role by reporting behavior that violates the community rules. Working together creates a friendlier and safer environment for everyone.
</p>
<p>
A few simple habits can make every <strong>video chat with strangers</strong> much safer. Never share personal information such as your home address, passwords, financial details, or identification documents. If a conversation makes you uncomfortable for any reason, end the chat immediately and report the user. Your comfort and safety should always come first.
</p>
<p>
Most people use <strong>free video chat</strong> simply to meet new friends, learn about different cultures, or enjoy interesting conversations after work or school. By staying respectful, protecting your privacy, and following basic online safety practices, you can confidently enjoy meeting people from around the world while creating positive experiences that you'll remember long after the conversation ends.
</p>

        
<h3>Quick Safety Checklist Before Every Video Call</h3>
<ul>
<li>Use a trusted platform with AI moderation and reporting tools.</li>
<li>Never share your home address, passwords, or financial information.</li>
<li>Keep your background free from private information.</li>
<li>Use headphones if you're chatting in a public place.</li>
<li>Leave and report any conversation that makes you uncomfortable.</li>
<li>Be respectful, patient, and enjoy meeting new people.</li>
</ul>


<h2>Camera and Microphone Permissions Explained</h2>
<p>
If you're using <strong>random video chat</strong> for the first time, your browser will ask for permission to access your camera and microphone. This often surprises new users, but it's completely normal. These permissions are only required so you can see, hear, and speak with the person you're matched with during a live conversation. Modern browsers never allow websites to use your camera or microphone without asking for your permission first, giving you complete control over your privacy.
</p>
<p>
Many people hesitate before their first <strong>video chat with strangers</strong> because they're unsure why these permissions are necessary. Think of it like answering a video call from a friend—you need a camera to share your video and a microphone to talk. The same applies to <strong>online video calls free</strong>. Without access to these devices, live face-to-face conversations simply wouldn't be possible.
</p>
<p>
Before starting your first conversation, it's worth taking a few seconds to prepare. Sit somewhere with good lighting, make sure your internet connection is stable, and check that your camera lens is clean. If you're chatting from a café, library, or another public place, using headphones can improve sound quality while helping protect your privacy. These small steps create a much better experience for both you and the person you're talking with.
</p>
<p>
Not everyone wants to appear on camera immediately, and that's perfectly okay. Some people begin with voice conversations to build confidence before switching to video later. The important thing is that you stay comfortable and enjoy the experience in the way that suits you best. Whether you're trying your first <strong>random webcam chat</strong> or you're already experienced with <strong>video chat</strong>, you're always in control of your camera and microphone permissions.
</p>

        
<h2>Why AI Moderation Makes Video Chat Better</h2>
<p>
A great conversation starts with a respectful community. That's why modern <strong>random video chat</strong> platforms use more than simple matching systems. Wakiee combines <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and clear community guidelines to help reduce inappropriate behavior while encouraging friendly conversations between real people.
</p>
<p>
Imagine joining a conversation hoping to meet someone new, only to be greeted by spam or inappropriate behavior. Nobody enjoys that experience. AI moderation works quietly in the background to identify activity that may violate community rules, while human reports help improve the platform over time. Together, these systems create a safer environment where users can focus on enjoying meaningful conversations instead of worrying about disruptive behavior.
</p>
<p>
Technology is only part of the solution. Every user also plays an important role in creating a positive community. Being respectful, listening to others, avoiding offensive language, and reporting inappropriate behavior all help improve the experience for everyone. A welcoming community is built not only by good technology but also by people treating one another with kindness.
</p>
<p>
Whether you're using <strong>free video chat</strong>, looking for an <strong>American random video call</strong>, or simply hoping to <strong>meet new people online</strong>, a respectful environment makes every conversation more enjoyable. Good moderation allows users to focus on what they came for—meeting interesting people, learning something new, and having genuine conversations.
</p>

        
<h2>Looking for an Omegle Alternative?</h2>
<p>
When Omegle closed, millions of people began searching for a reliable <strong><a href="https://wakiee.live">Omegle alternative</a></strong> that offered the same excitement of meeting strangers while providing a safer and more modern experience. People still wanted spontaneous conversations, but they also expected better privacy, improved moderation, and smoother performance across phones, tablets, and computers.
</p>
<p>
Wakiee was built with those expectations in mind. Instead of creating lengthy profiles or downloading another application, you can start a <strong>random video chat</strong> within seconds. With <strong>no signup</strong>, <strong>no downloads</strong>, and high-quality webcam support, it's easy to enjoy face-to-face conversations whenever you have a few free minutes.
</p>
<p>
One of the best things about using a modern <strong>video chat with strangers</strong> platform is the variety of people you'll meet. One conversation could be with someone sharing travel tips from another country, while the next might be with a student practicing English or someone discussing their favorite hobbies. Every match brings a different personality, a different story, and a different perspective.
</p>
<p>
Some users specifically search for an <strong>American random video call free</strong> experience, while others simply enjoy talking with people from anywhere in the world. Whatever your reason for joining, Wakiee provides a welcoming place where conversations happen naturally. Instead of endless scrolling and waiting for replies, you can begin talking to someone new almost instantly and discover where the conversation takes you.
</p>




<h2>Frequently Asked Questions About Random Video Chat</h2>
<p>
If you're new to <strong>random video chat</strong>, it's completely normal to have questions before starting your first conversation. Below are answers to some of the questions users ask most often about <strong>video chat with strangers</strong>, online safety, privacy, and how Wakiee works.
</p>
<h3>Is random video chat free?</h3>
<p>
Yes. Wakiee lets you enjoy <strong>free video chat</strong> without paying to get started. There are no lengthy registration forms, no downloads, and no hidden setup process. Simply open the website, allow your camera and microphone if you want to use video, and begin talking with real people from around the world.
</p>    
<h3>Do I need to create an account?</h3>
<p>
No. One of the biggest advantages of Wakiee is that you can start chatting with <strong>no signup</strong>. Instead of creating profiles or filling in personal information, you can begin a <strong>random video chat</strong> within seconds and focus on enjoying the conversation.
</p>
<h3>Can I meet people from the United States?</h3>
<p>
Yes. Many visitors search for an <strong>American random video call</strong> or an <strong>American random video call free</strong> experience because they want to practice English, learn about American culture, or simply meet people living in the United States. Since every connection is random, you may meet someone from America or from almost anywhere else in the world.
</p>
<h3>Is random video chat safe?</h3>
<p>
Using a trusted platform and following basic online safety habits makes a big difference. Wakiee combines <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and community guidelines to encourage respectful conversations. Never share personal information such as passwords, banking details, or your home address, and leave any conversation that makes you uncomfortable.
</p>
<h3>Why does Wakiee need camera and microphone permissions?</h3>
<p>
Camera and microphone access is only required so you can participate in live video conversations. Modern browsers always ask for your permission before allowing access, which means you remain in control of your privacy at all times.
</p>
<h3>Can I use Wakiee on my phone?</h3>
<p>
Yes. Wakiee works on smartphones, tablets, laptops, and desktop computers. Whether you're relaxing at home or taking a break during the day, you can enjoy <strong>online video calls free</strong> directly from your browser without installing additional software.
</p>
<h3>Can I skip to another person?</h3>
<p>
Yes. If a conversation isn't the right match, you can simply move on and meet someone else. Every new connection gives you another opportunity to discover different cultures, hear new stories, and enjoy meaningful conversations with people from around the world.
</p>
<h3>Can I use voice chat instead of video?</h3>
<p>
Absolutely. Some users prefer to begin with voice conversations before turning on their camera, while others enjoy face-to-face communication from the start. Wakiee offers both options, allowing you to choose the style of conversation that feels most comfortable.
</p>
<h3>How do I report inappropriate behavior?</h3>
<p>
If someone behaves inappropriately or violates the community guidelines, you can report the user directly through the platform. Human reports work together with AI moderation to improve the community and help create a safer experience for everyone.
</p>
<h3>What makes Wakiee different from other video chat websites?</h3>
<p>
Wakiee focuses on making conversations simple, welcoming, and easy to start. With <strong>no signup</strong>, <strong>no downloads</strong>, AI moderation, human reporting, high-quality webcam support, voice chat, and public Rooms, the platform is designed to help people enjoy genuine conversations instead of spending time creating profiles or waiting for friend requests.
</p>


        
<h2>Start Your Random Video Chat Journey Today</h2>
<p>
Every conversation begins with a single click. Sometimes it's a short chat that makes you smile after a busy day. Sometimes it's an interesting discussion about another country's culture. And occasionally, it's the beginning of a friendship you never expected. That's what makes <strong>random video chat</strong> different—every person you meet brings a new story, a different perspective, and an opportunity to learn something new.
</p>
<p>
Whether you're searching for <strong>video chat with strangers</strong>, hoping to <strong>make friends online</strong>, exploring an <strong>Omegle alternative</strong>, or simply looking for <strong>online video calls free</strong>, Wakiee makes it easy to start talking within seconds. There are no complicated registration forms, no downloads, and no waiting. Just open the platform, say hello, and enjoy meeting real people from around the world.
</p>
<p>
Some of the best conversations happen with people you never expected to meet. Sometimes they begin with someone you've never met before. If you're ready to experience high-quality <strong>free video chat</strong>, discover new cultures, share your own experiences, and enjoy genuine face-to-face conversations, your next connection could be just one click away.
</p>


        
     


        
      </section>
      
    </div>
      ) : (
        /* ===============================
           CALL INTERFACE (SPA SWITCH)
        =============================== */
      <div className="call-interface">

  {/* VIDEO CONTAINER */}
  <div 
    className="video-container"
    ref={remoteContainerRef}
    onPointerMove={handlePointerMove}
    onPointerUp={handlePointerUp}
    onPointerLeave={handlePointerUp}
  >

    {/* REMOTE VIDEO   , i only changes the jsx one line and no css changes and it works superb , earlier video element was inside remote-video, but now remote-video is inside video , also .video is object-fit: contain it auto matically adjusts 3:4 and 16:9 */}

    <video ref={remoteVideoRef} className="remote-video" autoPlay playsInline disablePictureInPicture />
    

{(status === "searching" || status === "waiting" ||  status === "cooldown") && (
  <div className="spinner-box">
    <div className="spinner"></div>
    <p>
      {status === "cooldown"
        ? "Finding a new partner"
        : "Connecting..."}
    </p>
  </div>
)}
       {partnerInfo && status === "in-call" && (
  <div className="partner-badge">
    
    {partnerInfo.name && (
      <span className="partner-name">
        {partnerInfo.name}
      </span>
    )}

    <span className="partner-gender">
      {partnerInfo.gender === "male" && "♂"}
      {partnerInfo.gender === "female" && "♀"}
      {partnerInfo.gender === "other" && "⚧"}
    </span>

  </div>
)}
      {/*start and exit button only visible when video call not started*/}

{status === "ready" && (
  <div className="video-start-card">

    <div className="video-start-content">
      <h2>Ready to Meet Someone?</h2>

      <p>
        Click Start to begin a random video chat
        and connect with people around the world.
      </p>
    </div>

    <div className="video-action-buttons">
      <button
        className="video-btn start-btn"
        onClick={startMatching}
      >
        START
      </button>

      <button
        className="video-btn exit-btn-video"
        onClick={handleExit}
      >
        EXIT
      </button>
    </div>

  </div>
)}
    

    
      <div className="wakiee-watermark">
        wakiee.live
      </div>
    

    {/* LOCAL PREVIEW */}
    <div
      className="local-preview-wrapper"
      style={{
  right: `${localPos.right}px`,
  top: `${localPos.top}px`,
}}
    >
      <video
        ref={localVideoRef}
        className="local-video-floating"
        autoPlay
        muted
        playsInline
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "12px",
          cursor: "grab",
        }}
      />

     <button
  className="switch-camera-btn"
  onClick={reloadCamera}
  title="Switch Camera"
>
  ↺
</button>
      
    </div>

    {/* CONTROL BAR */}
    <div className="control-bar">

      
      
     <button 
  className={`control-btn-modern ${!micOn ? "slash" : ""}`}
  onClick={toggleMic}
>
        <svg viewBox="0 0 24 24">
          <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z"/>
          <path d="M19 11a7 7 0 01-14 0"/>
          <line x1="12" y1="18" x2="12" y2="22"/>
        </svg>
        <span>Mic</span>
      </button>

     <button 
  className={`control-btn-modern ${!camOn ? "slash" : ""}`}
  onClick={toggleCam}
>
        <svg viewBox="0 0 24 24">
          <rect x="3" y="6" width="12" height="12" rx="2"/>
          <path d="M15 10l4.5-2.5v9l-4.5-2.5z"/>
        </svg>
        <span>Camera</span>
      </button>
                                                                           {/* disable , only enable when in-call */}
     <button 
  className="control-btn-modern next-btn"
  onClick={handleNext}disabled={status !== "in-call"}
>
        <svg viewBox="0 0 24 24" className="next-icon">
          <polygon points="8,5 19,12 8,19" />
        </svg>
        <span>Next</span>
      </button>

     <button 
  className="control-btn-modern stop-btn"
  onClick={handleStop}
>
        <div className="stop-icon"></div>
        <span>Stop</span>
      </button>

<button
className="control-btn-modern report-btn-modern"
disabled={status !== "in-call"}
onClick={openReport}
>
       {/* disable , only enable when in-call */}
        <div className="emoji-icon">⚠️</div>
        <span>Report</span>
      </button>
    </div>

  </div>

        
  {/* CHAT CARD */}
  <div className="chat-card">
    
   <div className="chat-area">
  {messages.map((msg, index) => (
    <div
      key={index}
      className={`chat-message ${msg.sender}`}
    >
      {msg.text}
    </div>
  ))}

  {partnerTyping && (
    <div className="chat-message partner typing">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  )}

  <div ref={chatEndRef}></div>
</div>

    <div className="chat-input-area">

<input
  type="text"
  placeholder="Type your message here"
  className="chat-input"
  value={messageInput}
  disabled={status !== "in-call"}              // no input when not in call
  maxLength={200}
  onChange={(e) => {
    const value = e.target.value;

    const cleaned = value.replace(/[^\w\s.,!?'"()-]/g, "");
    setMessageInput(cleaned.slice(0, 200));

   if (status === "in-call" && partnerId) {
  socket.emit("typing", { to: partnerId });
}
    
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }}
/>

<button
  className="send-btn"
  onClick={sendMessage}
>
Send
</button>
</div>
    
  </div>

        
</div>



          
        
      )}
      
      <ReportModal />
      <CooldownModal />
      <BanOverlay />

    </div>
  );
}
