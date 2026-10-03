//  client/src/RoomsPage.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useWakieeID } from "./WakieeID";
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

import {
  LiveKitRoom,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';
import '@livekit/components-styles';
import './room.css';


// 10 avatars (mix of male/female vibes)
const AVATARS = ['👦', '👧', '👨', '👩', '🧔', '👱‍♂️', '👱‍♀️', '🧕', '🐶', '🐱', '🐭', '🐹', '🐰',
  '🦊', '🐻', '🐼', '🐨', '🐯',
  '🦁', '🐮', '🐷', '🐸', '🐵',
  '🐔', '🐧', '🐦', '🐤', '🦉',
  '🦜', '🐴', '🦄', '🐝', '🐛',
  '🦋', '🐌', '🐞', '🐢', '🐙'];


const GD_TOPICS = [
  "Is AI a threat to human jobs?",
  "Should social media influencers be regulated?",
  "Is school education more important than home education?",
  "Can money really buy happiness?",
  "Should mobile phones be allowed in schools?",
  "Is entrepreneurship better than a corporate job?",
  "Are electric vehicles truly eco-friendly?",
  "Should voting be made compulsory?",
  "Is the education system killing creativity?",
  "Is India ready for a cashless economy?",
  "Should junk food advertisements be banned?",
  "Is online privacy a myth?",
  "Are exams necessary to measure knowledge?",
  "Will robots replace teachers in the future?",
  "Should public transport be free?",
  "Is technology making children smarter?",
  "Is climate change the biggest threat to humanity?",
  "Should celebrities be role models?",
  "Is space exploration a waste of money?",
  "Should zoos be banned?",
  "Is mental health more important than physical health?",
  "Is globalization good or bad?",
  "Are humans too dependent on technology?",
  "Should sports be mandatory in schools?",
  "Do we need censorship on the Internet?",
  "Is remote work the future of employment?",
  "Is online shopping better than offline shopping?",
  "Should animals be used for scientific testing?",
  "Is tourism harming nature?",
  "Should students wear school uniforms?",
  "Is democracy the best form of government?",
  "Is digital learning the future of education?",
  "Should physical books be replaced by e-books?",
  "Is nuclear energy good for the future?",
  "Do grades define a student?",
  "Should fast-food chains be taxed more?",
  "Is technology making humans less social?",
  "Is fame worth the price?",
  "Should plastic be banned completely?",
  "Is live-in relationship better than marriage?",
  "Is India prepared for population growth?",
  "Should gambling be legalized?",
  "Are electric scooters safe for cities?",
  "Is universal basic income a good idea?",
  "Should social media content be monitored strictly?",
  "Is work-life balance a myth?",
  "Is renewable energy the only future?",
  "Should military service be mandatory?",
  "Are video games harmful or helpful?",
  "Are elections in India truly fair?",
  "Is freedom of speech absolute?",
  "Should school days start later?",
  "Is national security more important than privacy?",
  "Is the OTT platform replacing cinema?",
  "Does money matter more than passion in a career?",
  "Should student politics be encouraged?",
  "Is online dating safe?",
  "Can corruption ever be removed?",
  "Is India becoming a superpower?",
  "Should children learn coding from an early age?",
  "Are emojis ruining English language?",
  "Is artificial intelligence smarter than humans?",
  "Should sports persons be paid more than actors?",
  "Are hostels better than day-schools?",
  "Should pornography be banned?",
  "Is it ethical to edit human genes?",
  "Are beauty pageants degrading women?",
  "Is cryptocurrency the future of money?",
  "Should animal rights be prioritized over human needs?",
  "Is capitalism better than socialism?",
  "Are humans responsible for natural disasters?",
  "Should the Internet be free for all?",
  "Is a world without borders possible?",
  "Does advertising influence consumer behavior too much?",
  "Should school days be reduced to 4 per week?",
  "Is death penalty justified?",
  "Is online gaming addiction a real problem?",
  "Should traditional art be preserved?",
  "Is social media destroying childhood?",
  "Are influencers replacing movie stars?",
  "Should politicians have an age limit?",
  "Is live-streaming news ethical?",
  "Can India rely fully on solar power?",
  "Should parenting classes be mandatory?",
  "Is beauty more important than brains?",
  "Should schools teach financial literacy?",
  "Is space tourism necessary?",
  "Should English be mandatory for success?",
  "Are CCTV cameras a violation of privacy?",
  "Is the youth today more stressed than ever?",
  "Should genetically modified food be allowed?",
  "Is vegetarianism better for health?",
  "Has globalization killed local cultures?",
  "Should voting age be lowered to 16?",
  "Is online activism effective?",
  "Is being famous a blessing or a curse?",
  "Should AI be allowed to make legal decisions?",
  "Is future of India in villages?",
];


export default function RoomsPage() {
  const navigate = useNavigate();
  const { wakieeID } = useWakieeID();

 


  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  const [socket, setSocket] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
    const [roomList, setRoomList] = useState([]);


  const currentAvatar = AVATARS[avatarIndex];
//---------------------------- when screen off / app background----------------------------------------------
  useEffect(() => {
  if (!socket || !roomCode) return;

  const handleVisibility = () => {
    const locked = document.hidden === true;

    socket.emit("screen-locked-changed", {
      roomCode,
      locked,
    });
  };

  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}, [socket, roomCode]);
//-------------------------------------------------------------------------------------------------------------------------
  // Ask for microphone permission as soon as user lands here
  useEffect(() => {
    const askMic = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setHasMicPermission(true);
      } catch (err) {
        console.warn('Mic permission denied:', err);
        setHasMicPermission(false);
      }
    };
    askMic();
  }, []);

// Connect to /rooms namespace (separate from your existing sockets)
useEffect(() => {
  const s = io('/rooms');
  setSocket(s);

  s.on('room-update', (data) => {
    setRoomState(data);
    if (data && data.creatorId === s.id) {
      setIsCreator(true);
    } else {
      setIsCreator(false);
    }
  });

  s.on('rooms-list', (list) => {
    setRoomList(Array.isArray(list) ? list : []);
  });

  // 🟥 If THIS user gets kicked
  s.on('kicked', () => {
    // 1️⃣ Drop room state immediately
    setTokenData(null);
    setRoomState(null);
    setIsCreator(false);
    setName('');
    setRoomCode('');
    setAvatarIndex(0);

    // 2️⃣ Navigate back to lobby
    navigate('/rooms');

    // 3️⃣ Show popup
    setTimeout(() => {
      alert('You were kicked by admin');
    }, 200);
  });

  //-----------------------------------------------------new code-----------------------------------
s.on("banned-room", ({ remainingSeconds }) => {

  setTokenData(null);
  setRoomState(null);
  setIsCreator(false);
  setName('');
  setRoomCode('');
  setAvatarIndex(0);

  navigate("/rooms");

  setTimeout(() => {
    const minutes = Math.ceil(remainingSeconds / 60);
    alert(`🚫 You have been banned for ${minutes} minute(s)`);
  }, 200);
});

  // ======================================================
// Room auto closed due to inactivity
//
// Happens when only 1 user stayed in room
// and nobody joined before timeout
// ======================================================
s.on("room-inactive-close", () => {

  // Disconnect LiveKit cleanly first
  // This will trigger handleExitRoom()
  setTokenData(null);

  // Show popup after navigation finishes
  setTimeout(() => {
    alert(
      "Room closed due to inactivity, create room again"
    );
  }, 300);
});

  return () => {
    s.off('room-update');
    s.off('rooms-list');
    s.off('kicked');
    s.off('banned-room');
     s.off('room-inactive-close');
    s.disconnect();
  };
}, [navigate]);




  const validateInputs = () => {
    if (!name || name.trim().length < 1 || name.trim().length > 10) {
      return 'Name must be 1–10 characters.';
    }
    if (!/^\d{3}$/.test(roomCode)) {
      return 'Room number must be exactly 3 digits (000–999).';
    }
    return null;
  };

  const handleCreateJoin = async (e) => {
    e.preventDefault();
    if (joining) return;
    const v = validateInputs();
    if (v) {
      setError(v);
      return;
    }
    if (!socket) {
      setError('Connection error. Please try again.');
      return;
    }

    setError('');
    setJoining(true);

    try {
  const res = await fetch('/api/rooms/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    
   body: JSON.stringify({
  name: name.trim(),
  roomCode,
  avatar: currentAvatar,
  socketId: socket.id,
  wakieeID, // 🔥 ADD THIS
  }),
    
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));

   

    throw new Error(data.error || 'Unable to join room.');
  }

  const data = await res.json();

  setTokenData({
    token: data.token,
    url: data.url,
    roomName: data.roomName,
  });

  setRoomState(data.room);
  if (data.room && data.room.creatorId === socket.id) {
    setIsCreator(true);
  }

  socket.emit('join-room', { roomCode });

} catch (err) {
  console.error(err);
  setError(err.message || 'Unable to join room.');
} finally {
  setJoining(false);
}

  };

  const handleExitRoom = () => {
    if (socket && roomCode) {
      socket.emit('leave-room', { roomCode });
    }
    setTokenData(null);
    setRoomState(null);
    setIsCreator(false);
    setName('');
    setRoomCode('');
    setAvatarIndex(0);

    // go back to lobby
    navigate('/rooms');
  };

const availableRooms = roomList.filter(
    (room) => !room.locked && room.count < 10
  );
  
  // --------------- LOBBY VIEW (before joining) ---------------
  if (!tokenData) {
   return (
  <div className="rooms-page rooms-page-container-room">
    <div className="rooms-lobby-box rooms-lobby-gradient-room">
      
          <h2 className="rooms-title">Join a Room</h2>

          {!hasMicPermission && (
            <p className="rooms-warning">
              Please allow microphone access in your browser to talk in rooms.
            </p>
          )}

  {/* 🔹 Rooms summary panel above avatar */}
          <div className="rooms-summary-box">
            <div className="rooms-summary-header">
              <span className="rooms-summary-heading">Available rooms</span>
              <span className="rooms-summary-total">
                Rooms Online : {roomList.length}
              </span>
            </div>

            <div className="rooms-summary-list">
              {availableRooms.length === 0 ? (
                <div className="rooms-summary-empty">
                  No Room data available
                </div>
              ) : (
                availableRooms.map((r) => (
                <div key={r.roomCode} className="rooms-summary-row">
  <span className="rooms-summary-room">

    <span className="room-code-text">
      Room : {r.roomCode}
    </span>

    {r.roomName && (
      <span className="room-name-centered">
        {r.roomName} 
      </span>
    )}

  </span>

  <span className="rooms-summary-capacity">
    {r.count}/10
  </span>
</div>

                ))
              )}
            </div>
          </div>
          
          {/* Avatar carousel */}
          <div className="avatar-carousel">
            <button
              type="button"
              className="avatar-arrow"
              onClick={() =>
                setAvatarIndex((prev) => (prev - 1 + AVATARS.length) % AVATARS.length)
              }
            >
              ‹
            </button>

            <div className="avatar-circle">
              <span className="avatar-emoji">{currentAvatar}</span>
            </div>

            <button
              type="button"
              className="avatar-arrow"
              onClick={() =>
                setAvatarIndex((prev) => (prev + 1) % AVATARS.length)
              }
            >
              ›
            </button>
          </div>

          <form onSubmit={handleCreateJoin} className="rooms-form">
            <label className="field-label">
              {/* NAME - IN FUTURE IF YOU WANNA ADD TEXT ABOVE INPUT FIELD */}
              <input
                type="text"
                value={name}
                maxLength={10}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name"
                required
              />
            </label>

            <label className="field-label">
              {/* Room number (000–999) - IN FUTURE IF YOU WANNA ADD TEXT ABOVE INPUT FIELD */}
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  const value = e.target.value;
                  const clean = value.replace(/\D/g, '').slice(0, 3);
                  setRoomCode(clean);
                }}
                placeholder="Enter Room Number(000-999)"
                inputMode="numeric"
                pattern="[0-9]{3}"
                required
              />
            </label>

            {error && <div className="rooms-error">{error}</div>}

            <button type="submit" className="rooms-primary-btn" disabled={joining}>
              {joining ? 'Joining...' : 'Create / Join'}
            </button>
          </form>
        </div>
    
        {/* Wakiee Rooms Intro Section */}


      </div>
    );
  }

  // --------------- ROOM VIEW (after joining) ---------------
  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.url}
      connect={true}
      video={false}
      audio={true}
      onDisconnected={handleExitRoom}
      className="livekit-room-root"
    >
      <RoomInner
        roomCode={roomCode}
        roomState={roomState}
        isCreator={isCreator}
        socket={socket}
        onExitRoom={handleExitRoom}
      />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

// ---------------------- INNER ROOM LAYOUT ----------------------

function RoomInner({ roomCode, roomState, isCreator, socket, onExitRoom }) {
  const participants = roomState?.participants || [];

  const { leftCol, rightCol } = useMemo(() => {
    const left = [];
    const right = [];
    participants.forEach((p, idx) => {
      if (idx % 2 === 0) left.push(p);
      else right.push(p);
    });
    return { leftCol: left, rightCol: right };
  }, [participants]);

  const room = useRoomContext();
  const [speakingIdentities, setSpeakingIdentities] = useState([]);
  
  // 🔋 Screen Wake Lock (keeps screen on)
const wakeLockRef = useRef(null);

  const [showActivity, setShowActivity] = useState(false);   // local dropdown
  const [gdTopicIndex, setGdTopicIndex] = useState(null);    // shared via socket
    // For kick feature
  const [kickModalTarget, setKickModalTarget] = useState(null); // { id, name } or null
  const [kickNotice, setKickNotice] = useState(null);
  const kickNoticeTimeoutRef = useRef(null);
  const { localParticipant } = useLocalParticipant(); // 🔹 add this line

const [chatOpen, setChatOpen] = useState(false);
const [chatInput, setChatInput] = useState("");
const [chatMessages, setChatMessages] = useState([]);
const chatBoxRef = useRef(null);
  //------------------room name gear button----------------
  const [showRoomSettings, setShowRoomSettings] = useState(false);
 const [roomNameDraft, setRoomNameDraft] = useState("");
useEffect(() => {
  setRoomNameDraft(roomState?.roomName || "");
}, [roomState?.roomName]);



//--------------------------------CHATS INSIDE ROOM --------------------------------------
  useEffect(() => {
  if (!socket) return;

  const handleChatUpdate = (list) => {
    setChatMessages(list);

    // auto-scroll if at bottom
    if (chatBoxRef.current) {
      const el = chatBoxRef.current;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;

      if (atBottom) {
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
        }, 50);
      }
    }
  };

  socket.on("chat-update", handleChatUpdate);

  return () => socket.off("chat-update", handleChatUpdate);
}, [socket]);
//--------------------------------------------------------------------------------------------
  //---------------------------------------------send message function----------------------
  // ------- CHAT SEND HANDLERS --------
const sendChat = () => {
  if (!socket || !roomCode || !chatInput.trim()) return;

 socket.emit("room-chat-message", {
  roomCode,
  text: chatInput,
});


  setChatInput("");
};

const handleChatKey = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendChat();
  }
};
//---------------------------------------------------------------------------------------------------------------------------

  // ================== WAKE LOCK HELPERS ==================
const requestWakeLock = async () => {
  try {
    if ("wakeLock" in navigator) {
      wakeLockRef.current = await navigator.wakeLock.request("screen");

      wakeLockRef.current.addEventListener("release", () => {
        console.log("🔋 Wake lock released");
      });

      console.log("🔋 Wake lock active");
    }
  } catch (err) {
    console.warn("Wake lock error:", err);
  }
};

const releaseWakeLock = async () => {
  try {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  } catch {}
};
//-----------------------------------------------------------------------------------------------------

  // If this user is muted by admin → turn off their mic immediately
  useEffect(() => {
    if (!socket) return;

    const handleMutedByAdmin = () => {
      if (localParticipant) {
        localParticipant.setMicrophoneEnabled(false);
      }
    };

    socket.on('muted-by-admin', handleMutedByAdmin);

    return () => {
      socket.off('muted-by-admin', handleMutedByAdmin);
    };
  }, [socket, localParticipant]);


  // LiveKit: track active speakers
  useEffect(() => {
    if (!room) return;

    const handleActiveSpeakers = (speakers) => {
      const ids = speakers.map((s) => s.identity);
      setSpeakingIdentities(ids);
    };

    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);

    return () => {
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
    };
  }, [room]);

   // -----------------------------🔋 Keep screen awake while in room-----------------
useEffect(() => {
  if (roomCode) {
    requestWakeLock();
  }

  return () => {
    releaseWakeLock();
  };
}, [roomCode]);
//------------------------------------------------------------------------------------
  
   // Listen for room-wide GD activity + kick notifications from server
  useEffect(() => {
    if (!socket) return;

    const handleRoomActivity = (payload) => {
      if (payload.type === 'gd-set') {
        setGdTopicIndex(payload.topicIndex);
      } else if (payload.type === 'gd-clear') {
        setGdTopicIndex(null);
      }
    };

    const handleKickNotice = (payload) => {
      if (!payload || !payload.targetName) return;

      const msg = payload.targetName;
      setKickNotice(msg);

      // auto-hide after 2 seconds
      if (kickNoticeTimeoutRef.current) {
        clearTimeout(kickNoticeTimeoutRef.current);
      }
      kickNoticeTimeoutRef.current = setTimeout(() => {
        setKickNotice(null);
        kickNoticeTimeoutRef.current = null;
      }, 2000);
    };

    socket.on('room-activity', handleRoomActivity);
    socket.on('kick-notice', handleKickNotice);

    return () => {
      socket.off('room-activity', handleRoomActivity);
      socket.off('kick-notice', handleKickNotice);
    };
  }, [socket]);

  // When admin clicks on a profile -> open Kick modal
  const handleKickClick = (targetId, targetName) => {
    if (!isCreator || !socket || !roomCode) return;
    if (!targetId || targetId === roomState?.creatorId) return; // don't kick self
    setKickModalTarget({ id: targetId, name: targetName });
  };


    const handleConfirmMute = () => {
    if (!kickModalTarget || !socket || !roomCode) return;

    socket.emit('mute-user', {
      roomCode,
      targetId: kickModalTarget.id,
      targetName: kickModalTarget.name,
    });

    setKickModalTarget(null);
  };

  const handleConfirmKick = () => {
    if (!kickModalTarget || !socket || !roomCode) return;

    socket.emit('kick-user', {
      roomCode,
      targetId: kickModalTarget.id,
      targetName: kickModalTarget.name,
    });

    setKickModalTarget(null);
  };

  const handleCancelKick = () => {
    setKickModalTarget(null);
  };
//......................................................admin clicks profile end ..............//
  const handleToggleLock = () => {
    if (!roomCode) return;
    socket.emit('toggle-lock', { roomCode });
  };

  // When admin clicks "Group Discussion"
  const handleGroupDiscussionClick = () => {
    if (!isCreator) return;              // UI + safety
    if (!GD_TOPICS.length) return;

    const topicIndex = Math.floor(Math.random() * GD_TOPICS.length);

    socket.emit('room-activity', {
      roomCode,
      type: 'gd-set',
      topicIndex,
    });

    setShowActivity(false); // close dropdown for admin
  };

  // When admin clicks "Spy Game" (stub for now)
  const handleSpyGameClick = () => {
    if (!isCreator) return;
    console.log('Spy Game clicked (to be implemented later)');
    setShowActivity(false);
  };

  // When admin reloads topic
  const handleReloadTopic = () => {
    if (!isCreator) return;
    if (!GD_TOPICS.length) return;

    setGdTopicIndex((prev) => {
      let next = prev;

      if (GD_TOPICS.length === 1) {
        next = 0;
      } else {
        while (next === prev || next === null) {
          next = Math.floor(Math.random() * GD_TOPICS.length);
        }
      }

      socket.emit('room-activity', {
        roomCode,
        type: 'gd-set',
        topicIndex: next,
      });

      return next;
    });
  };

// When admin closes GD card
const handleCloseGd = () => {
  if (!isCreator) return;

  socket.emit("room-activity", {
    roomCode,
    type: "gd-clear",
  });
};

const renderProfileSlots = (
  sideParticipants,
  count,
  roomCode,
  creatorId,
  speakingIds
) => {
  const slots = [];

  for (let i = 0; i < count; i++) {
    const p = sideParticipants[i];

    if (p) {
      const isAdmin = p.socketId === creatorId;
      const identity = `${roomCode}-${p.socketId}`;
      const isSpeaking = speakingIds.includes(identity);

      const isKickable = isCreator && !isAdmin;
      const isMutedByAdmin = !!p.adminMuted;
      const isSelfMuted = !!p.selfMuted;

      // 🔹 unified "muted" flag (logic unchanged)
      const isMuted = isMutedByAdmin || isSelfMuted;

      slots.push(
        <div
          key={p.socketId}
          className={
            `profile-slot filled ${isSpeaking ? "speaking" : ""} ` +
            (isKickable ? "kickable" : "")
          }
          onClick={() => {
            if (isKickable) {
              handleKickClick(p.socketId, p.name);
            }
          }}
        >
          {/* ================== AVATAR CIRCLE ================== */}
          <div
            className={
              "profile-avatar-circle" +
              (isMuted ? " profile-avatar-muted" : "")
            }
          >
            {/* Avatar emoji */}
            <span className="profile-avatar-emoji">{p.avatar}</span>

            {/* SCREEN LOCKED overlay */}
            {p.screenLocked && (
              <div className="profile-locked-overlay">
                SCREEN LOCKED
              </div>
            )}

            {/* Mic overlay (appears once only) */}
            {isMuted && (
              <span className="profile-mic-overlay">
                <span className="profile-mic-icon" />
              </span>
            )}
          </div>

          {/* ================== NAME SECTION ================== */}
          <div className="profile-name">
            {isAdmin && (
              <span className="admin-badge room-admin-badge">ADMIN</span>
            )}
            <span className="profile-username">{p.name}</span>
          </div>
        </div>
      );
    } else {
      // Empty placeholder slot
      slots.push(
        <div key={i} className="profile-slot empty">
          <div className="profile-avatar-circle empty-circle" />
        </div>
      );
    }
  }

  return slots;
};


  return (
    <div className="room-view">
      <div className="room-top-bar">
        <div className="room-code-block">
  <div className="room-code-display">Room #{roomCode}</div>

  {roomState?.locked && (
    <div className="room-locked-text">
      Room is locked
    </div>
  )}
</div>


        {isCreator ? (
          <div
            className="room-activity-trigger"
            onClick={() => setShowActivity((prev) => !prev)}
          >
            Activity ▾
          </div>
        ) : (
          <div className="room-activity-spacer" />
        )}

        <div className="room-top-actions">
          {isCreator && (
            <button
              type="button"
              className={`lock-btn-modern ${roomState?.locked ? 'locked' : 'unlocked'}`}
              onClick={handleToggleLock}
            >
              <span className="lock-icon">
                <span className="shackle"></span>
                <span className="body">
                  <span className="keyhole"></span>
                </span>
              </span>
            </button>
          )}

          <button
            type="button"
            className="exit-btn"
            onClick={onExitRoom}
          >
            Exit Room
          </button>
        </div>
      </div>

      <div className="profiles-container">
         {/* Kick notice above mic, visible to everyone */}
        {kickNotice && (
          <div className="kick-notice-banner">
            {kickNotice}
          </div>
        )}
        <div className="profiles-column">
          {renderProfileSlots(leftCol, 5, roomCode, roomState?.creatorId, speakingIdentities)}
        </div>

      <div className="mic-center-floating">

  {/* ⚙️ Admin Room Settings */}
  {isCreator && (
    <button
      className="room-settings-btn"
      onClick={() => {
        setRoomNameDraft(roomState?.roomName || "");
        setShowRoomSettings(true);
      }}
      aria-label="Room settings"
    >
      ⚙️
    </button>
  )}

  <MicToggle roomCode={roomCode} socket={socket} />
        
         {/* 💬 Chat Toggle */}
  <button
    className={`chat-icon-btn ${chatOpen ? "active" : ""}`}
    onClick={() => setChatOpen((prev) => !prev)}
    aria-label="Room chat"
  >
    💬
  </button>
</div>



        <div className="profiles-column">
          {renderProfileSlots(rightCol, 5, roomCode, roomState?.creatorId, speakingIdentities)}
        </div>

        

        {/* Activity dropdown: only admin + local state */}
        {isCreator && showActivity && (
          <div className="activity-dropdown">
            <button
              type="button"
              className="activity-option"
              onClick={handleGroupDiscussionClick}
            >
              Group Discussion
            </button>

            {  /*     <button
              type="button"
              className="activity-option"
              onClick={handleSpyGameClick}
            >
              More Activities (coming soon)
            </button>      */}
            
          </div>
        )}

        {/* GD topic card: visible to EVERYONE if set */}
        {gdTopicIndex !== null && (
          <div className="gd-topic-box">
            {isCreator && (
              <button
                type="button"
                className="gd-topic-close"
                onClick={handleCloseGd}
              >
                ✕
              </button>
            )}

            <div className="gd-topic-label">GD Topic</div>
            <div className="gd-topic-text">
              {GD_TOPICS[gdTopicIndex]}
            </div>

            {isCreator && (
              <button
                type="button"
                className="gd-reload-btn"
                onClick={handleReloadTopic}
              >
                Next Topic
              </button>
            )}
          </div>
        )}
        

{/* -------- CHAT WINDOW -------- */}
{chatOpen && (
  <div className="room-chat-box">
    <div className="room-chat-messages" ref={chatBoxRef}>
      {chatMessages.length === 0 ? (
        <div className="room-chat-empty">No messages yet</div>
      ) : (
        chatMessages.map((m) => (
          <div key={m.id} className="room-chat-message">
            <strong>{m.name}:</strong> {m.text}
          </div>
        ))
      )}
    </div>

    <div className="room-chat-input-row">
      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={handleChatKey}
        placeholder="Type a message..."
        className="room-chat-input"
      />
      <button className="room-chat-send" onClick={sendChat}>
        Send
      </button>
    </div>
  </div>
)}
        
      </div>
     

{/* Admin user actions: Mute / Kick / Ban */}
{kickModalTarget && (
  <div className="kick-modal-backdrop">
    <div className="kick-modal">
      <button
        type="button"
        className="kick-modal-close"
        onClick={handleCancelKick}
      >
        ✕
      </button>

      <div className="kick-modal-title">
        Actions
      </div>

      <div className="kick-modal-actions">
        {/* Mute */}
        <button
          type="button"
          className="kick-modal-mute-btn"
          onClick={handleConfirmMute}
        >
          Mute {kickModalTarget.name}
        </button>

        {/* Kick */}
        <button
          type="button"
          className="kick-modal-kick-btn"
          onClick={handleConfirmKick}
        >
          Kick {kickModalTarget.name}
        </button>


        
  <button
  type="button"
  className="kick-modal-ban-btn"
  onClick={() => {

    // 🔍 Find target safely
    const target = roomState?.participants?.find(
      p => p.socketId === kickModalTarget.id
    );

    // ❌ If missing wakieeID → stop
    if (!target?.wakieeID) {
      alert("Error banning user. Try again.");
      return;
    }

    // ✅ Emit ban event
    socket.emit("room-ban-user", {
      roomCode,
      targetSocketId: kickModalTarget.id,
      targetName: kickModalTarget.name,
      targetWakieeID: target.wakieeID
    });

    handleCancelKick();
  }}
>
  Ban {kickModalTarget.name}
</button> 
        
      </div>
    </div>
  </div>
)}

    {isCreator && showRoomSettings && (
  <div className="room-settings-backdrop">
    <div className="room-settings-modal">
      <button
        className="room-settings-close"
        onClick={() => setShowRoomSettings(false)}
      >
        ✕
      </button>

      <div className="room-settings-title">Room Settings</div>

      <input
        type="text"
        value={roomNameDraft}
        maxLength={20}
        placeholder="Enter room name"
        onChange={(e) => setRoomNameDraft(e.target.value)}
        className="room-settings-input"
      />

      <button
        className="room-settings-save"
        onClick={() => {
          socket.emit("update-room-name", {
            roomCode,
            roomName: roomNameDraft.trim(),
          });
          setShowRoomSettings(false);
        }}
      >
        Save
      </button>
    </div>
  </div>
)}


      
    </div>
  );
}




// ---------------------- MIC TOGGLE BUTTON ----------------------
// ---------------------- MIC TOGGLE BUTTON ----------------------
function MicToggle({ roomCode, socket }) {
  const { localParticipant } = useLocalParticipant();

  // If no participant yet, treat as muted
  const isMuted =
    !localParticipant || localParticipant.isMicrophoneEnabled === false;

  const toggleMic = async () => {
    if (!localParticipant) return;

    // new state will be opposite of current
    const newMuted = !isMuted;

    if (newMuted) {
      // turn OFF mic
      await localParticipant.setMicrophoneEnabled(false);
    } else {
      // turn ON mic
      await localParticipant.setMicrophoneEnabled(true);
    }

    // 🔹 Tell server so profile avatar dim / mic overlay is synced
    if (socket && roomCode) {
      socket.emit('self-mute-changed', {
        roomCode,
        isMuted: newMuted,
      });
    }
  };

  return (
    <div className="mic-wrapper">
      <button
        type="button"
        className={`mic-btn-modern ${isMuted ? 'muted' : ''}`}
        onClick={toggleMic}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {/* Mic Icon */}
        <span className="mic-icon"></span>

        {/* Red slash only visible when muted */}
        {isMuted && <span className="mic-slash"></span>}
      </button>

      {/* Small "Muted" text only when muted */}
      {isMuted && <div className="mic-muted-text">Muted</div>}
    </div>
  );
}
