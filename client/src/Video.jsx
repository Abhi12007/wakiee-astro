//video logic implemented

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
