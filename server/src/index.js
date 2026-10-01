// VERY TOP of server/src/index.js
//require('dotenv').config();

const voiceServer = require("./voice_index");             //--for voice_index server file
const { banUser, checkBan } = require("./banManager");  //----puts ban id on server and auto cleans bans

const {
  banUserFromRoom,
  checkRoomBan,
  cleanExpiredRoomBans,
} = require("./roomBanManager");                      //---specifically for room

// server/src/index.js
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

// -------------------- Cloudflare TURN fetch helper --------------------
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));


// 🔹 ADD THIS:
const { AccessToken } = require('livekit-server-sdk');

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

const app = express();

// 🔹 ADD THIS:
app.use(express.json());

/* ===============================
CHECK video call BAN API
=============================== */

app.post("/api/check-ban", (req, res) => {
  const { wakieeID } = req.body;
  const result = checkBan(wakieeID);
  if (result) {
    res.json({
      banned: true,
      ...result
    });

  } else {

    res.json({
      banned: false
    });

  }

});
//-----------------------------------------------------------for cloudflare turn cred---------------
app.post("/api/turn", async (req, res) => {

  try {
    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${process.env.CF_TURN_TOKEN_ID}/credentials/generate-ice-servers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CF_TURN_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: 600 }) // 10 minutes
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Cloudflare TURN error:", err);
      return res.status(500).json({ error: "TURN generation failed" });
    }

   const data = await response.json();
res.setHeader("Cache-Control", "no-store"); //tells browser ,cdn,proxy,disk cache dont save,cache,reuse,write
res.json(data);  // { iceServers: [...] }
  } catch (e) {
    console.error("TURN endpoint failed:", e);
    res.status(500).json({ error: "TURN server error" });
  }
});
//------------------------------------------------------------------------------------------------
// ======================================================
// ONLINE COUNT API
// Homepage fetches this every 5 sec
// ======================================================

app.get("/api/online-count", (req, res) => {

  // Prevent browser caching
  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  res.json({
    online: cachedDisplayOnline,

    // useful for debugging
    realOnline: cachedRealOnline
  });

});
//======================================================================================================
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });
voiceServer(io); //-------------for voice_index server file

const waitingQueue = [];
const partners = {};
const userInfo = {};

// ======================================================
// ONLINE COUNT SYSTEM (HTTP POLLING + CACHE)    (remember cache is stores in server)
// ======================================================

// 🔹 Change this anytime
// Example:
// real users = 50
// onlineBoost = 100
// shown online = 150
let onlineBoost = 100;

// 🔹 Cache values (updated every 5 sec)
let cachedRealOnline = 0;
let cachedDisplayOnline = onlineBoost;
//==============================================================================

// ====================== ROOM LOGIC (LIVEKIT ROOMS) ======================

/*
 rooms = {
   '045': {
     roomCode: '045',
     creatorId: 'socketId',
     locked: false,
     participants: {
       socketId1: { name, avatar, joinedAt },
       socketId2: { name, avatar, joinedAt },
       ...
     }
   }
 }
*/

const rooms = {};

// ======================================================
// ROOM AUTO CLOSE TIMER
// If only 1 user stays in room for too long,
// room automatically closes.
//
// Change this anytime:
// 2 * 60 * 1000 = 2 min
// 5 * 60 * 1000 = 5 min
// 30 * 1000 = 30 sec
// ======================================================
const ROOM_ALONE_TIMEOUT = 10 * 60 * 1000;        // room auto close timer 10 minutes later change to 30 minutes

// Stores unique timer for every room
// Example:
// roomAloneTimers["123"]
// roomAloneTimers["456"]
const roomAloneTimers = {};
//=========================================================================================

function getRoom(roomCode) {
  return rooms[roomCode] || null;
}

function createRoom(roomCode, socketId, name, avatar, wakieeID) {
  rooms[roomCode] = {
    roomCode,
    roomName: "", 
    creatorId: socketId,
    locked: false,
    chat: [],            // 🗨️ in-memory chat (temporary, max 20 messages)  
   participants: {
  [socketId]: {
    name,
    avatar,
    wakieeID,
    joinedAt: Date.now(),
    adminMuted: false,
    selfMuted: false,
    screenLocked: false,   // 👈 ADD THIS
  },
},

  };
    // ======================================================
  // Creator joined room alone
  // Start inactivity timer immediately
  //
  // Example:
  // user creates room -> timer starts
  // ======================================================
  startRoomAloneTimer(roomCode);
  return rooms[roomCode];
}

function joinRoom(roomCode, socketId, name, avatar, wakieeID) {
  const room = rooms[roomCode];
  if (!room) return null;

  room.participants[socketId] = {
    name,
    avatar,
    wakieeID,
    joinedAt: Date.now(),
    adminMuted: false,
    selfMuted: false,
    screenLocked: false,
  };

  // ======================================================
  // If someone joins room,
  // stop alone timer immediately
  //
  // Example:
  // 1 user -> timer running
  // 2nd user joins -> stop timer
  // ======================================================
  const participantCount =
    Object.keys(room.participants).length;

  if (participantCount >= 2) {
    stopRoomAloneTimer(roomCode);
  }

  return room;
}


function leaveRoom(roomCode, socketId) {
  const room = rooms[roomCode];
  if (!room) return;

  // Remove this participant from room
  delete room.participants[socketId];

  const remainingIds =
    Object.keys(room.participants);

  // ======================================================
  // If no one left → delete room normally
  // Also clear timer memory
  // ======================================================
  if (remainingIds.length === 0) {

    stopRoomAloneTimer(roomCode);

    delete rooms[roomCode];
    return;
  }

  // ======================================================
  // If only 1 person remains
  // start inactivity timer
  //
  // Example:
  // 2 users -> 1 leaves
  // remaining user alone -> timer starts
  // ======================================================
  if (remainingIds.length === 1) {
    startRoomAloneTimer(roomCode);
  }

  // ======================================================
  // If creator left,
  // assign oldest participant as new creator
  //
  // Creator change does NOT affect timer
  // ======================================================
  if (room.creatorId === socketId) {

    let newCreatorId =
      remainingIds[0];

    let earliestJoin =
      room.participants[newCreatorId]
        .joinedAt;

    for (const id of remainingIds) {
      const p =
        room.participants[id];

      if (
        p.joinedAt < earliestJoin
      ) {
        earliestJoin =
          p.joinedAt;

        newCreatorId = id;
      }
    }

    room.creatorId =
      newCreatorId;
  }
}
//==========================================================================================

function roomIsFull(room) {
  return Object.keys(room.participants).length >= 10;
}

function serializeRoom(room) {
  if (!room) return null;

  return {
    roomCode: room.roomCode,
    roomName: room.roomName || "",
    locked: room.locked,
    creatorId: room.creatorId,
    participants: Object.entries(room.participants).map(([socketId, p], index) => ({
  socketId,
  name: p.name,
  avatar: p.avatar,
  wakieeID: p.wakieeID,
  index,
  adminMuted: !!p.adminMuted,
  selfMuted: !!p.selfMuted,
  screenLocked: !!p.screenLocked,   // 👈 ADD THIS
})),

  };
}

// ======================================================
// ROOM ALONE TIMER HELPERS
// Starts timer when only 1 user remains
// Stops timer when someone joins
// ======================================================

// Start inactivity timer for a room
function startRoomAloneTimer(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;

  const participantIds = Object.keys(room.participants);

  // Safety check:
  // timer should run ONLY if exactly 1 user exists
  if (participantIds.length !== 1) return;

  // Prevent duplicate timer for same room
  stopRoomAloneTimer(roomCode);

  console.log(`⏳ Alone timer started for room ${roomCode}`);

  roomAloneTimers[roomCode] = setTimeout(() => {
    const latestRoom = getRoom(roomCode);

  // Room already deleted
// cleanup timer memory
if (!latestRoom) {
  delete roomAloneTimers[roomCode];
  return;
}

    const latestParticipants =
      Object.keys(latestRoom.participants);

    // If someone joined meanwhile → stop closing
    if (latestParticipants.length !== 1) {
      stopRoomAloneTimer(roomCode);
      return;
    }

    // Get remaining user socket id
    const remainingSocketId =
      latestParticipants[0];

    const targetSocket =
      roomsNsp.sockets.get(remainingSocketId);

    // Notify remaining user
    if (targetSocket) {
      targetSocket.emit(
        "room-inactive-close"
      );

      // Remove socket from socket.io room
      targetSocket.leave(roomCode);
    }

    // Remove user from room structure
    leaveRoom(
      roomCode,
      remainingSocketId
    );

    // Refresh room UI
    const updatedRoom =
      getRoom(roomCode);

    if (updatedRoom) {
      roomsNsp
        .to(roomCode)
        .emit(
          "room-update",
          serializeRoom(updatedRoom)
        );
    }

    // Update lobby room list
    broadcastRoomList();

    // Cleanup timer memory
    delete roomAloneTimers[roomCode];

    console.log(
      `🗑️ Room ${roomCode} closed due to inactivity`
    );

  }, ROOM_ALONE_TIMEOUT);
}


// Stop timer instantly when someone joins
function stopRoomAloneTimer(roomCode) {
  if (roomAloneTimers[roomCode]) {

    clearTimeout(
      roomAloneTimers[roomCode]
    );

    delete roomAloneTimers[roomCode];

    console.log(
      `✅ Alone timer stopped for room ${roomCode}`
    );
  }
}

// =============== ROOM JOIN / CREATE ENDPOINT (LIVEKIT TOKEN) ===============

app.post('/api/rooms/join', (req, res) => {
 const { name, roomCode, avatar, socketId, wakieeID } = req.body;

  // Name: 1–10 characters (non-empty)
  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 10) {
    return res.status(400).json({ error: 'Name must be 1–10 characters.' });
  }

  // Room code: exactly 3 digits "000"–"999"
  if (!roomCode || typeof roomCode !== 'string' || !/^\d{3}$/.test(roomCode)) {
    return res.status(400).json({ error: 'Room code must be 3 digits (000–999).' });
  }

  // We tie users to socket.io via socketId
  if (!socketId) {
    return res.status(400).json({ error: 'socketId is required.' });
  }

  const cleanName = name.trim();
  const code = roomCode;

  // ============================================================Room ban check==============
  // 🔒 ROOM BAN CHECK (ONLY FOR ROOMS)
const roomBan = checkRoomBan(wakieeID, roomCode);

if (roomBan) {
  const minutes = Math.ceil(roomBan.remainingSeconds / 60);

  return res.status(403).json({
    error: `You have been banned from this room for ${minutes} minute(s). Try other room`,
  });
}
  //=================================================================
 
  let room = getRoom(code);

  if (!room) {
    // No such room yet → create and make this user the creator
    room = createRoom(code, socketId, cleanName, avatar, wakieeID);
  } else {
    // Room exists → check locked + capacity
    if (room.locked) {
      return res.status(403).json({ error: 'Room is locked.' });
    }
    if (roomIsFull(room)) {
      return res.status(403).json({ error: 'Room is full.' });
    }
    joinRoom(code, socketId, cleanName, avatar, wakieeID);
    room = getRoom(code);
  }

  // Generate LiveKit token for this user & room
  try {
    const identity = `${code}-${socketId}`;
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      metadata: JSON.stringify({ name: cleanName, avatar, roomCode: code }),
    });


    const roomName = `wakiee-room-${code}`;

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = at.toJwt();

    return res.json({
      token,
      url: LIVEKIT_URL,
      roomName,
      identity,
      room: serializeRoom(room),
    });
  } catch (err) {
    console.error('Error generating LiveKit token', err);
    return res.status(500).json({ error: 'Could not generate room token' });
  }
});

//===================================================================================================================
function removeFromQueue(socketId) {
  const idx = waitingQueue.indexOf(socketId);
  if (idx !== -1) waitingQueue.splice(idx, 1);
}

io.on('connection', (socket) => {           // video call logic
  console.log('User connected:', socket.id);

 
  // Join event (video matchmaking)
 socket.on('join', (data) => {
const wakieeID = data?.wakieeID;
// 🔒 CHECK GLOBAL BAN
const ban = checkBan(wakieeID);
if (ban) {
  console.log("🚫 Video blocked (banned):", wakieeID);
  socket.emit("banned-video", {
    reason: ban.reason,
    banMinutes: ban.banMinutes
  });
  return;
}
// normal join flow
userInfo[socket.id] = {
  name: data?.name || "",
  gender: data?.gender || "other",
  wakieeID: wakieeID || null
};

   
if (partners[socket.id]) return;

removeFromQueue(socket.id);

// 🕓 1. If no one waiting, add to queue
if (waitingQueue.length === 0) {
  waitingQueue.push(socket.id);
  socket.emit('waiting');
  return;
}

                                                         // 🎲 2. Randomize available peers (prevent same re-pairing)
const availablePeers = waitingQueue.filter(
  (id) => id !== socket.id && io.sockets.sockets.get(id)
);

if (availablePeers.length === 0) {
  waitingQueue.push(socket.id);
  socket.emit('waiting');
  return;
}

// Pick random peer instead of first one
const peerId = availablePeers[Math.floor(Math.random() * availablePeers.length)];

// Remove that peer from queue
removeFromQueue(peerId);

// 🫱 3. Pair them
partners[peerId] = socket.id;
partners[socket.id] = peerId;

io.to(peerId).emit('paired', {
  partnerId: socket.id,
  initiator: true,
  partnerInfo: userInfo[socket.id],
});
io.to(socket.id).emit('paired', {
  partnerId: peerId,
  initiator: false,
  partnerInfo: userInfo[peerId],
});
});


  // signaling
  socket.on('offer', ({ to, sdp }) => { if (to) io.to(to).emit('offer', { from: socket.id, sdp }); });
  socket.on('answer', ({ to, sdp }) => { if (to) io.to(to).emit('answer', { from: socket.id, sdp }); });
  socket.on('ice-candidate', ({ to, candidate }) => { if (to) io.to(to).emit('ice-candidate', { from: socket.id, candidate }); });

  // chat
  socket.on('chat-message', ({ to, message }) => {
    if (!to) return;
    const info = userInfo[socket.id] || { name: 'Stranger', gender: 'other' };
    io.to(to).emit('chat-message', { from: socket.id, fromName: info.name, message });
  });

  // typing indicator
  socket.on('typing', ({ to, fromName }) => {
    if (to) {
      io.to(to).emit('typing', { from: socket.id, fromName });
    }
  });

    
//====================Report user=======
socket.on("report-user", ({ reportedID, reason }) => {

  console.log("📢 Report received:", reportedID, reason);

  // 1️⃣ Ban the reported WakieeID
  const banInfo = banUser(reportedID, reason);

  let targetSocketId = null;

  // 2️⃣ Find the socket that owns this WakieeID
  for (const id in userInfo) {
    if (userInfo[id].wakieeID === reportedID) {
      targetSocketId = id;
      break;
    }
  }

  if (!targetSocketId) {
    console.log("⚠️ Reported user not found online");
    return;
  }

  // 3️⃣ Notify banned user
  io.to(targetSocketId).emit("banned-video", {
    reason,
    banMinutes: banInfo.banMinutes
  });

  // 4️⃣ Disconnect partner if paired
  const partnerSocketId = partners[targetSocketId];

  if (partnerSocketId) {

    io.to(partnerSocketId).emit("partner-left");

    delete partners[partnerSocketId];
    delete partners[targetSocketId];

  }

  // 5️⃣ Remove banned user from waiting queue
removeFromQueue(targetSocketId);

// 6️⃣ Force disconnect banned user
const targetSocket = io.sockets.sockets.get(targetSocketId);

if (targetSocket) {
  targetSocket.disconnect(true);
}

// 7️⃣ Clean server memory
delete userInfo[targetSocketId];

  console.log("🚫 User banned:", reportedID);

});
  //============================================

  


  // leave
  socket.on('leave', () => {
    const partner = partners[socket.id];
    if (partner) {
      io.to(partner).emit('partner-left');
      removeFromQueue(partner);
      waitingQueue.push(partner); // partner requeued
      delete partners[partner];
      delete partners[socket.id];
    } else {
      removeFromQueue(socket.id);
    }
    delete userInfo[socket.id];
   
  });

 socket.on("disconnect", () => {
  console.log("💀 Disconnected:", socket.id);

  // ===== VIDEO CLEANUP =====
  const videoPartner = partners[socket.id];
  if (videoPartner) {
    io.to(videoPartner).emit("partner-left");
    removeFromQueue(videoPartner);
    waitingQueue.push(videoPartner);
    delete partners[videoPartner];
    delete partners[socket.id];
  } else {
    removeFromQueue(socket.id);
  }


  // ===== USER INFO + COUNTS =====
  delete userInfo[socket.id];
 
});


 
}); // ✅ closes io.on('connection', socket => { ... })


// ====================== ROOMS NAMESPACE (LIVEKIT ROOMS) =========================================================================

// This uses a separate namespace so it does not interfere with
// your existing video and voice events on the main `io` connection.
const roomsNsp = io.of('/rooms');

function getRoomsList() {
  return Object.values(rooms).map((room) => ({
    roomCode: room.roomCode,
    roomName: room.roomName || "",
    count: Object.keys(room.participants).length,
    locked: room.locked,
  }));
}

function broadcastRoomList() {
  roomsNsp.emit('rooms-list', getRoomsList());
}
let lastChatTime = {};


roomsNsp.on('connection', (socket) => {
  console.log('Rooms namespace connected:', socket.id);

   // Send current rooms snapshot to this client
  socket.emit('rooms-list', getRoomsList());

 
  let currentRoomCode = null;

  // Frontend will call this after /api/rooms/join succeeds
  socket.on('join-room', ({ roomCode }) => {
    if (!roomCode || !/^\d{3}$/.test(roomCode)) return;
    
  // ==================================================
 

    // Leave previous room if any
    if (currentRoomCode) {
      socket.leave(currentRoomCode);
    }

    currentRoomCode = roomCode;
    socket.join(roomCode);

    const room = getRoom(roomCode);
            // send existing chat only to this user
            socket.emit("chat-update", room?.chat || []);    // ? for If somehow frontend calls join-room before backend created room,room becomes null, and server crashes:

    
    roomsNsp.to(roomCode).emit('room-update', serializeRoom(room));
   broadcastRoomList();
  });

  // Only the creator can lock/unlock the room
  socket.on('toggle-lock', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    if (room.creatorId !== socket.id) return;

    room.locked = !room.locked;
    roomsNsp.to(roomCode).emit('room-update', serializeRoom(room));
   broadcastRoomList();
  });

  //----------------room name----------------
  // 🔒 Admin-only: rename room
socket.on("update-room-name", ({ roomCode, roomName }) => {
  if (!roomCode || !/^\d{3}$/.test(roomCode)) return;  //validate room code

  const room = getRoom(roomCode);
  if (!room) return;

  // ✅ Only admin can rename
  if (room.creatorId !== socket.id) return;

  // Sanitize
  const cleanName = (roomName || "")
    .trim()
    .slice(0, 20)
    .replace(/[<>]/g, "");  // no script input

  room.roomName = cleanName;

  // 🔄 Update room + lobby
  roomsNsp.to(roomCode).emit("room-update", serializeRoom(room));
  broadcastRoomList();
});

  //----------------------------------------
  socket.on("leave-room", ({ roomCode }) => {
  if (!roomCode) return;

  socket.leave(roomCode);
  leaveRoom(roomCode, socket.id);

  const room = getRoom(roomCode);

  // room may already be deleted by leaveRoom()
  if (room) {
    // clear chat if room is now empty
    if (Object.keys(room.participants).length === 0) {
      room.chat = [];
    }

    roomsNsp.to(roomCode).emit("room-update", serializeRoom(room));
  }

  broadcastRoomList();
});


// ...............................GD topic Broadcast Handler...................//
   // Room activity events (GD topic, etc.) — ONLY creator (admin) allowed
  socket.on('room-activity', ({ roomCode, type, topicIndex }) => {
    if (!roomCode || !/^\d{3}$/.test(roomCode)) return;

    const room = getRoom(roomCode);
    if (!room) return;

    // Only room creator (admin) can control activity
    if (room.creatorId !== socket.id) {
      return;
    }

    // Set GD topic for everyone
    if (type === 'gd-set') {
      roomsNsp.to(roomCode).emit('room-activity', {
        type: 'gd-set',
        topicIndex,
      });
    }

    // Clear GD topic for everyone
    if (type === 'gd-clear') {
      roomsNsp.to(roomCode).emit('room-activity', {
        type: 'gd-clear',
      });
    }

    // Later: add type === 'spy-set', 'spy-clear', etc.
  });
//...................................................................//

 //..................................................kick-user handler.............................//

   // Admin-only: kick a user from the room
  socket.on('kick-user', ({ roomCode, targetId, targetName }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    // Only the creator/admin can kick
    if (room.creatorId !== socket.id) return;

    // User must be in this room
    if (!room.participants[targetId]) return;

    // Capture name before removing
    const kickedName =
      room.participants[targetId]?.name || targetName || 'User';

    // Get target socket in rooms namespace
    const targetSocket = roomsNsp.sockets.get(targetId);

    if (targetSocket) {
      // Remove target from this socket.io room
      targetSocket.leave(roomCode);

      // Notify the kicked user only
      targetSocket.emit('kicked', { roomCode });
    }

    // Update room structure / delete if empty
    leaveRoom(roomCode, targetId);

    const updated = getRoom(roomCode);

    // Broadcast updated room state if room still exists
    if (updated) {
      roomsNsp.to(roomCode).emit('room-update', serializeRoom(updated));
    }

    // Notify remaining users in that room
   roomsNsp.to(roomCode).emit('kick-notice', {
  roomCode,
  targetId,
  targetName: `${kickedName} kicked by ${room.participants[socket.id]?.name || "Admin"}`,
});


    // Refresh lobby room list
    broadcastRoomList();
  });


 //..................................................kick-user handler END.............................//
  //====================================Room Ban Event ==================
 // ================= ROOM BAN EVENT =================
socket.on("room-ban-user", ({ roomCode, targetSocketId, targetName, targetWakieeID }) => {
  const room = getRoom(roomCode);
  if (!room) return;

  // Only admin
  if (room.creatorId !== socket.id) return;

  if (!targetWakieeID) return;

  // 🔴 Validation (VERY IMPORTANT)
  if (!targetSocketId) return;
  if (!room.participants[targetSocketId]) return;

  // 🔹 Ban user
  const banInfo = banUserFromRoom(targetWakieeID, roomCode);

  // 🔹 Find target socket
  const targetSocket = roomsNsp.sockets.get(targetSocketId);

  // ================= 🔥 FIXED ORDER START =================

  // 1️⃣ Remove user from room FIRST
  leaveRoom(roomCode, targetSocketId);

  const updated = getRoom(roomCode);

  // 2️⃣ Update room for remaining users
  if (updated) {
    roomsNsp.to(roomCode).emit("room-update", serializeRoom(updated));
  }

  // 3️⃣ 🔥 Broadcast updated room list (FIXES ROOM COUNT)
  broadcastRoomList();

  // 4️⃣ Notify others in room
  roomsNsp.to(roomCode).emit("kick-notice", {
    targetName: `${targetName} banned by ${room.participants[socket.id]?.name || "Admin"}`,
  });

  // 5️⃣ Finally notify + disconnect banned user
  if (targetSocket) {
    targetSocket.emit("banned-room", {
      roomCode,
      remainingSeconds: banInfo.remainingSeconds,
    });

    // 🔥 Force full disconnect AFTER updates
   // targetSocket.disconnect(true);                 no need it is stopping live updates
  }

  // ================= 🔥 FIXED ORDER END =================
});

 //..............................................Mute user By ADMIN ..................................//

   // Admin-only: mute a user in the room
   socket.on('mute-user', ({ roomCode, targetId, targetName }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    if (room.creatorId !== socket.id) return;

    const participant = room.participants[targetId];
    if (!participant) return;

    // 🔹 Admin mute = mark both flags
    participant.adminMuted = true;
    participant.selfMuted = true;

    const mutedName = participant.name || targetName || 'User';

    const targetSocket = roomsNsp.sockets.get(targetId);
    if (targetSocket) {
      targetSocket.emit('muted-by-admin', {
        roomCode,
        targetId,
        targetName: mutedName,
      });
    }
                       //BROADCAST so that everyone could see
    roomsNsp.to(roomCode).emit('room-update', serializeRoom(room));
  });

 //..............................................Mute user By ADMIN END..................................//

 //..................................................Self MUTED........................//

   // User toggles their own mute → sync to everyone
  socket.on('self-mute-changed', ({ roomCode, isMuted }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    const p = room.participants[socket.id];
    if (!p) return;

    p.selfMuted = !!isMuted;

    // If user unmutes themselves, also clear adminMuted so overlay disappears
    if (!isMuted) {
      p.adminMuted = false;
    }

    roomsNsp.to(roomCode).emit('room-update', serializeRoom(room));
  });

 //............................................SELF MUTED END ...........................//
  // ---------------- SCREEN LOCK STATUS ---------------- //
socket.on("screen-locked-changed", ({ roomCode, locked }) => {
  if (!roomCode) return;

  const room = getRoom(roomCode);
  if (!room) return;

  const participant = room.participants[socket.id];
  if (!participant) return;

  participant.screenLocked = !!locked;

  roomsNsp.to(roomCode).emit(
    "room-update",
    serializeRoom(room)
  );
});

// ---------------------------------------------------- //

 //-------------------------------chat window-------------------------------------------//
 socket.on("room-chat-message", ({ roomCode, text }) => {
  const room = getRoom(roomCode);
  if (!room) return;

  const participant = room.participants[socket.id];
  const name = participant?.name || "User";

  const now = Date.now();
  if (lastChatTime[socket.id] && now - lastChatTime[socket.id] < 900) return;
  lastChatTime[socket.id] = now;

  text = (text || "").slice(0, 200).replace(/[<>]/g, "");
  if (!text.trim()) return;

  const msg = {
    id: Date.now() + "-" + Math.random(),
    name,
    text,
    time: now,
  };

  room.chat.push(msg);
  if (room.chat.length > 20) room.chat.shift();

  roomsNsp.to(roomCode).emit("chat-update", room.chat);
});

  //-------------------------------------------------------------------------------------------------
    socket.on('disconnect', () => {
    console.log('Rooms namespace disconnected:', socket.id);
    delete lastChatTime[socket.id];

      
    // Strict cleanup: remove this socket from ANY room it might be in
    const roomCodes = Object.keys(rooms);
    roomCodes.forEach((code) => {
      const room = rooms[code];
      if (!room) return;
      if (room.participants[socket.id]) {
        leaveRoom(code, socket.id);
        
        const updatedRoom = getRoom(code);

if (updatedRoom) {
  roomsNsp.to(code).emit(
    'room-update',
    serializeRoom(updatedRoom)
  );
}  
        
      }
    });

    // After cleanup, refresh lobby view for everyone
    broadcastRoomList();
  });

  });
// ======================================================
// UPDATE ONLINE COUNT CACHE
// ======================================================

function updateOnlineCache() {

  // Count ONLY main namespace "/"
  // Ignores /rooms, future namespaces
  cachedRealOnline =
    io.of("/").sockets.size;

  // Final shown count
  cachedDisplayOnline =
    cachedRealOnline +
    onlineBoost;
}

// Run instantly on server start
updateOnlineCache();

// Then refresh every 5 sec
setInterval(
  updateOnlineCache,
  5000
);
//==============================================================================================================
/*                astro does not need this

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
  app.get('*', (req, res) =>
    res.sendFile(path.join(__dirname, '../../client/build', 'index.html'))
  );
}

*/

setInterval(() => {
  cleanExpiredRoomBans();
}, 2 * 60 * 60 * 1000); // expired room ban auto clean every 2 hours

// ======================================================
// SERVE ASTRO FRONTEND
// ======================================================

const clientDist = path.join(__dirname, "../../client/dist");

// ======================================================
// BLOG ROUTES
// Astro generates:
// client/dist/blog.html
//
// Keep the public URL:
// /blog
//
// Redirect /blog/ -> /blog
// ======================================================

app.get("/blog/", (req, res) => {
  return res.redirect(301, "/blog");
});

app.get("/blog", (req, res) => {
  return res.sendFile(path.join(clientDist, "blog.html"));
});

// ======================================================
// SERVE ASTRO STATIC FILES
// ======================================================

app.use(express.static(clientDist));

// ======================================================
// SERVE OTHER ASTRO EXTENSIONLESS ROUTES
// ======================================================

app.get("*", (req, res, next) => {
  // Never interfere with API or Socket.IO requests
  if (
    req.path.startsWith("/api/") ||
    req.path.startsWith("/socket.io/")
  ) {
    return next();
  }

  // Homepage
  if (req.path === "/") {
    return res.sendFile(path.join(clientDist, "index.html"));
  }

  // Convert:
  // /about -> about.html
  // /video -> video.html
  // /voice -> voice.html
  // /rooms -> rooms.html
  // etc.
  const requestedFile = path.join(
    clientDist,
    `${req.path.replace(/^\/+/, "")}.html`
  );

  res.sendFile(requestedFile, (err) => {
    if (err) {
      next();
    }
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
