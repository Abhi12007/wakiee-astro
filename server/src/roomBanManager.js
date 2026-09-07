// ===============================
// ROOM BAN MANAGER (SEPARATE SYSTEM)
// ===============================

// Structure:
// {
//   wakieeID: {
//     roomCode: expiryTimestamp
//   }
// }

const roomBans = {};

// 🔹 Ban user for a specific room
function banUserFromRoom(wakieeID, roomCode, durationMs = 5 * 60 * 1000) {
  if (!wakieeID || !roomCode) return;

  if (!roomBans[wakieeID]) {
    roomBans[wakieeID] = {};
  }

  const expiresAt = Date.now() + durationMs;

  roomBans[wakieeID][roomCode] = expiresAt;

  console.log("🚫 ROOM BAN:", wakieeID, "Room:", roomCode);

  return {
    expiresAt,
    remainingSeconds: Math.floor(durationMs / 1000),
  };
}

// 🔹 Check if banned from specific room
function checkRoomBan(wakieeID, roomCode) {
  if (!wakieeID || !roomCode) return null;

  const userBans = roomBans[wakieeID];
  if (!userBans) return null;

  const expiresAt = userBans[roomCode];
  if (!expiresAt) return null;

  const now = Date.now();

  // 🔹 Auto clean expired ban
  if (now >= expiresAt) {
    delete userBans[roomCode];

    if (Object.keys(userBans).length === 0) {
      delete roomBans[wakieeID];
    }

    return null;
  }

  return {
    remainingSeconds: Math.floor((expiresAt - now) / 1000),
  };
}

// 🔹 Cleanup every 2 hours
function cleanExpiredRoomBans() {
  const now = Date.now();

  for (const wakieeID in roomBans) {
    for (const roomCode in roomBans[wakieeID]) {
      if (now >= roomBans[wakieeID][roomCode]) {
        delete roomBans[wakieeID][roomCode];
      }
    }

    if (Object.keys(roomBans[wakieeID]).length === 0) {
      delete roomBans[wakieeID];
    }
  }

}

module.exports = {
  banUserFromRoom,
  checkRoomBan,
  cleanExpiredRoomBans,
};
