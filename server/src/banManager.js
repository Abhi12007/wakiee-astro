// ==========================================
// Wakiee RAM Ban Manager
// bans stored using WakieeID
// ==========================================

const bans = new Map();

/*
bans = {
  "ABCDE12345": {
      reason: "nudity",
      bannedAt: 1700000000000,
      banMinutes: 30,
      until: 1700001800000
  }
}
*/


// ==========================================
// Ban duration by reason
// ==========================================

function getBanMinutes(reason) {

  switch (reason) {

    case "nudity":   //============change timings later
      return 10;

    case "harassment":
      return 8;

    case "spam":
      return 5;

    case "other":
      return 2;

    default:
      return 4;
  }

}


// ==========================================
// Ban user
// ==========================================

function banUser(wakieeID, reason) {

  const banMinutes = getBanMinutes(reason);

  const bannedAt = Date.now();
  const until = bannedAt + banMinutes * 60 * 1000;

  const banData = {
    wakieeID,
    reason,
    bannedAt,
    banMinutes,
    until
  };

  bans.set(wakieeID, banData);

  console.log("🚫 Ban stored:", wakieeID, reason, banMinutes + "min");

  return {
    reason,
    banMinutes
  };

}


// ==========================================
// Check if user is banned
// ==========================================

function checkBan(wakieeID) {

  if (!wakieeID) return null;

  const ban = bans.get(wakieeID);

  if (!ban) return null;

  const now = Date.now();

  // ban expired
  if (ban.until <= now) {

    bans.delete(wakieeID);

    console.log("✅ Ban expired:", wakieeID);

    return null;
  }

  const remainingSeconds = Math.ceil((ban.until - now) / 1000);

  return {
    reason: ban.reason,
    banMinutes: ban.banMinutes,
    remainingSeconds
  };

}


// ==========================================
// Auto cleanup expired bans (every 2 hours)
// ==========================================

setInterval(() => {

  const now = Date.now();

  for (const [wakieeID, ban] of bans.entries()) {

    if (ban.until <= now) {

      bans.delete(wakieeID);

      console.log("🧹 Auto-clean ban:", wakieeID);

    }

  }

}, 2 * 60 * 60 * 1000); // every 2 hours


// ==========================================

module.exports = {
  banUser,
  checkBan
};
