// ============================================================
// VOICE SERVER (voice_index.js)
// Handles ONLY the /voice page logic
// Completely separate from video and rooms
// ============================================================

module.exports = function (io) {
  
 const { banUser, checkBan } = require("./banManager");

  // ==========================================================
  // /voice namespace
  // Users from Voice.jsx connect here
  // ==========================================================
  const voiceNsp = io.of("/voice");


  // ==========================================================
  // Voice matchmaking data
  // Similar to video logic but completely separate
  // ==========================================================

  const voiceWaitingQueue = [];  // users waiting for partner
  const voicePartners = {};      // paired users mapping

// store info about connected voice users
const voiceUserInfo = {};
  // ==========================================================
  // Remove user from queue
  // ==========================================================
  function removeFromQueueVoice(socketId) {

    const idx = voiceWaitingQueue.indexOf(socketId);

    if (idx !== -1) {
      voiceWaitingQueue.splice(idx, 1);
    }

  }


  // ==========================================================
  // Start voice matchmaking
  // Same algorithm style as video matching
  // ==========================================================
  function startCallVoice(socket) {

    // already paired → ignore
    if (voicePartners[socket.id]) return;

    // remove from queue first (avoid duplicates)
    removeFromQueueVoice(socket.id);


    // =====================================
    // If queue empty → wait
    // =====================================
    if (voiceWaitingQueue.length === 0) {

      voiceWaitingQueue.push(socket.id);
      socket.emit("voice:waiting");

      return;
    }


    // =====================================
    // Random partner selection (same style as video)
    // =====================================
  const availablePeers = voiceWaitingQueue.filter((id) => {

  const peerSocket = voiceNsp.sockets.get(id);

  if (!peerSocket) {
    removeFromQueueVoice(id);
    return false;
  }

  return id !== socket.id;

});

    if (availablePeers.length === 0) {

      voiceWaitingQueue.push(socket.id);
      socket.emit("voice:waiting");

      return;
    }

    const peerId =
      availablePeers[Math.floor(Math.random() * availablePeers.length)];


    // remove peer from queue
    removeFromQueueVoice(peerId);


    // =====================================
    // Pair users
    // =====================================
    voicePartners[socket.id] = peerId;
    voicePartners[peerId] = socket.id;


    // send paired event
   voiceNsp.to(peerId).emit("voice:paired", {
  partnerId: socket.id,
  initiator: true,
  partnerInfo: voiceUserInfo[socket.id]
});

socket.emit("voice:paired", {
  partnerId: peerId,
  initiator: false,
  partnerInfo: voiceUserInfo[peerId]
});
    
  }


  // ==========================================================
  // Disconnect logic (used by stop / disconnect)
  // ==========================================================
function disconnectVoice(socket) {

  removeFromQueueVoice(socket.id);

  const partner = voicePartners[socket.id];

  if (partner) {

    voiceNsp.to(partner).emit("voice:partner-left");

    delete voicePartners[partner];
    delete voicePartners[socket.id];

  }

  delete voiceUserInfo[socket.id];

}


  // ==========================================================
  // Skip (Next button)
  // ==========================================================
  function skipVoice(socket) {
       removeFromQueueVoice(socket.id);
    const partner = voicePartners[socket.id];

    if (partner) {

      // notify partner
      voiceNsp.to(partner).emit("voice:partner-left");

      delete voicePartners[partner];
      delete voicePartners[socket.id];

    }

    // slight delay before requeue
    setTimeout(() => {

const stillConnected = voiceNsp.sockets.get(socket.id);

if(!stillConnected) return;

startCallVoice(stillConnected);

},7000);

  }


  // ==========================================================
  // Stop call
  // ==========================================================
  function stopCallVoice(socket) {

    disconnectVoice(socket);

  }


  // ==========================================================
  // Main socket connection
  // ==========================================================
  voiceNsp.on("connection", (socket) => {

    console.log("🎧 Voice connected:", socket.id);


    // ======================================================
    // User pressed Start
    // ======================================================
socket.on("voice:start", ({ wakieeID }) => {

  console.log("🎧 Voice start:", socket.id, wakieeID);

  // 🔒 Check ban first
  const ban = checkBan(wakieeID);

  if (ban) {

    console.log("🚫 Voice blocked (banned):", wakieeID);

    socket.emit("banned-video", {
      reason: ban.reason,
      banMinutes: ban.banMinutes
    });

    return;
  }

  // store user info
  voiceUserInfo[socket.id] = {
    wakieeID
  };

  startCallVoice(socket);

});


    // ======================================================
    // Next button pressed
    // ======================================================
    socket.on("voice:next", () => {

      skipVoice(socket);

    });


    // ======================================================
    // Stop button pressed
    // ======================================================
    socket.on("voice:stop", () => {

      stopCallVoice(socket);

    });


    // ======================================================
    // Mic mute/unmute
    // ======================================================
    socket.on("voice:mute", ({ muted }) => {

      const partner = voicePartners[socket.id];

      if (partner) {

        voiceNsp.to(partner).emit("voice:partner-muted", {
          muted
        });

      }

    });

// ========================= CHAT MESSAGE =========================
socket.on("voice:message",({to,text})=>{

const partner = voicePartners[socket.id];

if(!partner || partner !== to) return;

if(!text || typeof text !== "string") return;

text = text.trim().slice(0,200); // limit message length

if(!text) return;

voiceNsp.to(partner).emit("voice:message",{
text
});

});

// ========================= TYPING INDICATOR =========================
socket.on("voice:typing",({to})=>{

const partner = voicePartners[socket.id];

if(!partner || partner !== to) return;

voiceNsp.to(partner).emit("voice:typing");

});
    // ======================================================
    // WebRTC signaling (offer)
    // ======================================================
  socket.on("voice:offer", ({ to, sdp }) => {

  if (!to) return;

  voiceNsp.to(to).emit("voice:offer", {
    from: socket.id,
    sdp
  });

});

// ================= REPORT USER =================
socket.on("report-user", ({ reportedID, reason }) => {

  console.log("⚠️ Voice report:", reportedID, reason);

  

  const banInfo = banUser(reportedID, reason);

  let targetSocketId = null;

  // find socket with that WakieeID
  for (const id in voiceUserInfo) {
    if (voiceUserInfo[id].wakieeID === reportedID) {
      targetSocketId = id;
      break;
    }
  }

  if (!targetSocketId) {
    console.log("Reported user not found in voice");
    return;
  }

  console.log("🚫 Voice banned:", reportedID);

  const partnerSocket = voicePartners[targetSocketId];

  if (partnerSocket) {

    voiceNsp.to(partnerSocket).emit("voice:partner-left");

    delete voicePartners[partnerSocket];
    delete voicePartners[targetSocketId];
if (!voiceWaitingQueue.includes(partnerSocket)) {
  voiceWaitingQueue.push(partnerSocket);
}
  }

  removeFromQueueVoice(targetSocketId);

  const targetSocket = voiceNsp.sockets.get(targetSocketId);

  if (targetSocket) {

    targetSocket.emit("banned-video", {
      reason,
      banMinutes: banInfo.banMinutes
    });

    targetSocket.disconnect(true);

  }

  delete voiceUserInfo[targetSocketId];

});
    // ======================================================
    // WebRTC signaling (answer)
    // ======================================================
    socket.on("voice:answer", ({ to, sdp }) => {

      voiceNsp.to(to).emit("voice:answer", {
        from: socket.id,
        sdp
      });

    });


    // ======================================================
    // ICE candidate exchange
    // ======================================================
    socket.on("voice:ice", ({ to, candidate }) => {

      voiceNsp.to(to).emit("voice:ice", {
        candidate
      });

    });


    // ======================================================
    // User disconnected
    // ======================================================
 socket.on("disconnect", () => {

  console.log("🎧 Voice disconnected:", socket.id);

  disconnectVoice(socket);

  delete voiceUserInfo[socket.id];

});

  });

};
