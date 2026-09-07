//  client/src/RoomsPage.jsx
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { updateSEO } from "./updateSEO";
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

 useEffect(() => {
  updateSEO({
    title: "Random Group Chat | Free Group Voice Chat Rooms | Wakiee",

    description:
      "Join Wakiee Rooms for free random group chat and live group voice chat rooms. Talk with strangers, practice English, make friends, and enjoy AI-moderated discussions with room controls including mute, kick, ban, lock, room names, and discussion topics. No signup or downloads required.",
     

    
    
    keywords:
      "random group chat, group voice chat,group chat, chat room online, talk to strangers in group, group voice call, online chat rooms, wakiee rooms, free group chat , live group call,talk in group call,random gc, group chat rooms, random group call,  online group chat, voice rooms, join group chat, make friends online, AI moderated chat rooms, group discussion, no signup group chat, no download group chat",


    robots: "index, follow, max-image-preview:large",

    canonical: "https://wakiee.live/rooms",

    og: {
      title: "Random Group Chat Rooms – Wakiee",
      description:
        "Join Wakiee group voice chat rooms and talk with strangers in real-time discussions.",
      url: "https://wakiee.live/rooms",
      image: "https://wakiee.live/android-chrome-192x192.png",
    },

    twitter: {
      title: "Random Group Chat Rooms – Wakiee",
      description:
        "Talk to strangers in group voice chat rooms and build confidence.",
      image: "https://wakiee.live/android-chrome-192x192.png",
    },

    schema: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Wakiee Rooms",
      url: "https://wakiee.live/rooms",
      applicationCategory: "CommunicationApplication",
      operatingSystem: "All",
      description:
        "Wakiee Rooms lets users join random group chat rooms and talk with strangers in real-time voice discussions.",

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

      breadcrumb: {
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
            name: "Rooms",
            item: "https://wakiee.live/rooms",
          },
        ],
      },
    },
  });
}, []);
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
<section
  className="rooms-intro"
  style={{
    marginTop: "22px",
    textAlign: "left",
    lineHeight: "1.7",
    fontSize: "0.95rem",
    color: "#d1d5db",
  }}
>
  <h1 style={{ fontSize: "1.15rem", marginBottom: "8px", color: "#ffffff" }}>
   Random Group Chat – Free Group Voice Chat Rooms
  </h1>
<p>
Sometimes the best conversations happen when more than two people are involved. Instead of speaking with just one stranger, <strong>Wakiee Rooms</strong> lets you join a <strong>random group chat</strong> where up to ten people can talk together in real time. Whether you want to meet new people, practice English, improve your communication skills, or simply enjoy interesting conversations after a busy day, <strong>Wakiee Rooms</strong> makes joining a <strong><a href="https://wakiee.live/rooms">group voice chat</a></strong> simple. There is <strong>no login, no signup, and no downloads</strong> required, so you can start talking within seconds directly from your browser.
</p>
<p>
Every <strong>group voice call</strong> is different because every person brings a unique story, opinion, and life experience. One room might be discussing travel destinations, another could be debating the latest technology, while another group is simply laughing and getting to know each other. Unlike traditional messaging apps, <strong>Wakiee Rooms</strong> creates live conversations where everyone can participate naturally. If you're looking for <strong><a href="https://wakiee.live/rooms">online chat rooms</a></strong> that feel welcoming and active, you'll always find something new to talk about.
</p>
<p>
Many people use <strong>Wakiee Rooms</strong> for more than entertainment. Students join to practice spoken English with people from different countries. Professionals use <strong>group chat rooms</strong> to become more confident speaking in front of others. Some users simply want to make friends online, while others enjoy learning about different cultures through real conversations. Whatever your reason for joining, every <strong>random group call</strong> is an opportunity to learn something new and meet people you would never normally encounter.
</p>
<p>
Creating a friendly community is just as important as making conversations easy. That's why <strong>Wakiee Rooms</strong> combines <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and powerful room management tools to help keep discussions respectful. Room creators can <strong>mute</strong> disruptive users, <strong>kick</strong> participants who break the rules, <strong>ban</strong> repeat offenders, <strong>lock</strong> rooms to prevent unwanted interruptions, and even <strong>rename rooms</strong> to match the topic being discussed. Built-in <strong>group discussion topics</strong> also help break the ice whenever a conversation needs fresh ideas, making every room more engaging and enjoyable for everyone.
</p>


  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Why Do People Join Random Group Chats?
  </h2>
<p> People have always enjoyed sharing ideas, telling stories, and meeting others with similar interests. Today, <strong>random group chat</strong> makes those experiences possible without needing to know anyone beforehand. Instead of waiting for invitations or searching through social media, you can instantly join a conversation with people from different countries, cultures, and backgrounds. Every discussion is different because every participant brings their own experiences, opinions, and personality to the room. </p> <p> Many users join <strong>Wakiee Rooms</strong> because group conversations often feel more natural than one-to-one calls. If one person runs out of things to say, someone else can continue the discussion, keeping the conversation active and interesting. Whether the topic is travel, technology, movies, books, sports, music, gaming, or everyday life, there's always a chance to hear a different point of view and learn something new through <strong>group voice chat</strong>. </p> 
  <p> Imagine joining a room where people are discussing the best places to visit in the United States. One person recommends national parks, another shares hidden local restaurants, while someone else talks about their favourite road trip. A simple conversation like this can introduce new ideas, inspire future travel plans, or simply make your evening more enjoyable. That's what makes every <strong>group voice call</strong> unique—you never know where the conversation will lead. </p> <p> Some people join because they want to <strong>practice English</strong>, while others hope to improve their communication skills by speaking with several people at once. Many users simply enjoy making friends online or listening to conversations before joining in themselves. No matter your reason, <strong>Wakiee Rooms</strong> provides a welcoming place where everyone has the opportunity to speak, listen, learn, and connect through meaningful conversations. </p>


  
<h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Benefits of Group Voice Chat
  </h2>
<p> Talking with several people at the same time offers a completely different experience from a private conversation. A <strong>group voice chat</strong> brings together different personalities, ideas, and experiences, creating discussions that feel more dynamic and engaging. Instead of hearing just one perspective, you can learn how people from different countries think, solve problems, and experience everyday life. Every conversation becomes an opportunity to discover something you didn't know before. </p> <p> One of the biggest benefits of <strong>Wakiee Rooms</strong> is the opportunity to improve communication skills naturally. Speaking in front of a small group helps many people become more confident when expressing opinions, asking questions, and participating in discussions. Students often use <strong>online chat rooms</strong> to practice English pronunciation, while professionals join group conversations to become more comfortable speaking during meetings, presentations, or interviews. </p> <p> Group conversations also help reduce the pressure that some people feel during one-to-one calls. If you're naturally shy, you don't have to carry the entire conversation by yourself. You can listen, contribute when you feel comfortable, and gradually become more confident over time. Many users find that joining a friendly <strong>random group chat</strong> is one of the easiest ways to build confidence while meeting new people from around the world. </p> <p> Another advantage is the variety of conversations you can experience in a single day. One room might focus on learning languages, another could be discussing current events, while another group simply enjoys casual conversations and laughter after work. Because <strong>Wakiee Rooms</strong> allows users to create and rename rooms with different discussion topics, it's easy to find conversations that match your interests or start your own room around a subject you're passionate about. </p>
<h3>Why People Enjoy Wakiee Rooms</h3>
  <ul> 
    <li> Join free group voice chats within seconds.</li> 
    <li> Meet people from different countries and cultures.</li> 
    <li> Practice English and improve communication skills.</li>
    <li> Make new friends through real conversations.</li>
    <li> Learn from different opinions and life experiences.</li> 
    <li> Join rooms based on discussion topics or create your own.</li> 
    <li> No login, no signup, and no downloads required.</li> 
    <li> AI-assisted moderation, human reporting, and room management tools help keep conversations respectful.</li> 
  </ul>


  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Who Uses Online Chat Rooms?
  </h2>
<p> People from all walks of life join <strong>Wakiee Rooms</strong>. Some are students looking to practice English with speakers from different countries, while others are professionals who enjoy relaxing with a friendly <strong>group voice chat</strong> after work. Many people simply want to make new friends, hear different opinions, or spend time in a welcoming <strong>online chat room</strong> where conversations happen naturally. Whatever your background, every room is an opportunity to meet someone with a different story to share. </p> <p> If you're naturally outgoing, you'll probably enjoy leading discussions and meeting new people every day. If you're a little shy, <strong>Wakiee Rooms</strong> is just as welcoming. You can start by listening, join the conversation when you feel comfortable, and gradually build confidence. Many users say they feel less pressure in a <strong>random group chat</strong> because several people are talking together, making conversations feel more relaxed than one-to-one calls. </p> <p> Language learners also enjoy joining <strong>group chat rooms</strong> because they hear different accents, speaking styles, and everyday expressions. Listening to several people discuss real-life topics can improve pronunciation, vocabulary, and confidence in ways that textbooks simply can't. Others join to exchange travel experiences, discuss technology, gaming, sports, movies, music, books, or current events. Every room offers something different because every group creates its own unique conversation. </p> <p> Some people only stay for a few minutes during a lunch break, while others spend hours talking with people who share similar interests. Whether you're hoping to improve communication skills, enjoy meaningful discussions, or simply laugh with strangers from around the world, <strong>Wakiee Rooms</strong> gives everyone a place to join the conversation. </p>



  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    How Wakiee Rooms Work?
  </h2>
<p> Getting started with <strong>Wakiee Rooms</strong> is simple. You don't need to create an account, install software, or complete a lengthy registration process. Just open the Rooms page, choose whether you'd like to join an existing room or create your own, allow microphone access, and you're ready to start talking. With <strong>no login</strong>, <strong>no signup</strong>, and <strong>no downloads</strong>, joining a <strong>group voice call</strong> only takes a few seconds. </p> <p> If you create a room, you can give it a custom name that tells others what the discussion is about. For example, you might create a room for practising English, discussing movies, talking about technology, sharing travel experiences, or simply having casual conversations. Clear room names help people find discussions that match their interests and encourage better conversations from the beginning. </p> <p> You can also invite friends by sharing a unique room number, making it easy for everyone to join the same conversation. Prefer meeting new people? Simply browse the available public rooms and join the discussion that interests you most. Every <strong>random group chat</strong> is different because the people, topics, and conversations change throughout the day. </p> <p> To help keep conversations enjoyable, <strong>Wakiee Rooms</strong> includes several room management features. Room creators can <strong>mute</strong> users who are creating unnecessary noise, <strong>kick</strong> disruptive participants from the room, <strong>ban</strong> users who repeatedly break the rules, and <strong>lock</strong> the room whenever they want to prevent additional people from joining. These tools help room owners maintain friendly discussions while giving everyone a better experience. </p> <p> Built-in <strong>discussion topics</strong> also make it easier to keep conversations flowing. If a room becomes quiet or people aren't sure what to talk about next, suggested topics can help break the ice and encourage everyone to participate. Combined with <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and community guidelines, these features help make <strong>Wakiee Rooms</strong> a welcoming place where people can enjoy meaningful group conversations with confidence. </p>
 <h3>Creating or Joining a Room Is Easy</h3>
  <ul> 
    <li> Open the Wakiee Rooms page.</li> 
    <li> Create a new room or join an existing public room.</li> 
    <li> Choose a room name that matches your discussion topic.</li>
    <li> Share your room number if you want friends to join.</li> 
    <li> Start talking, listen to others, and enjoy the conversation.</li> 
    <li> Room owners can mute, kick, ban, or lock the room whenever needed to keep discussions respectful.</li> 
  </ul>


  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Why Choose Group Voice Chat Instead of One-to-One Calls?
  </h2>
<p> Both private conversations and <strong>group voice chat</strong> have their own advantages, but many people find that group discussions feel more energetic and engaging. In a one-to-one conversation, there's often pressure to keep the discussion going by yourself. In a <strong>random group chat</strong>, however, everyone contributes different ideas, stories, and experiences, making conversations flow much more naturally. If one topic comes to an end, another person often introduces something completely new, keeping the discussion interesting for everyone. </p> <p> Imagine joining <strong>Wakiee Rooms</strong> where one person is talking about travelling across Europe, another is sharing tips for learning English, while someone else recommends their favourite movies or music. Instead of hearing just one perspective, you get to experience several viewpoints in a single conversation. These unexpected discussions are one of the biggest reasons people enjoy <strong>online chat rooms</strong> and return every day to meet new people. </p> <p> Group conversations also make it easier for quieter users to participate. If you're naturally shy, you don't need to speak immediately. You can spend a few minutes listening to the discussion, understand the topic, and join whenever you feel comfortable. Many users say this makes <strong>Wakiee Rooms</strong> feel much more welcoming than traditional one-to-one conversations because there's never pressure to carry the discussion alone. </p> <p> Whether you're hoping to <strong>practice English</strong>, improve communication skills, make friends online, or simply enjoy interesting conversations after work, <strong>group voice calls</strong> offer a relaxed environment where everyone can contribute at their own pace. Every room becomes an opportunity to learn, laugh, and discover something new together. </p>




  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    How to Join Your First Group Voice Chat ?
  </h2>
<p> If you've never joined a <strong>group voice chat</strong> before, getting started is simple. You don't need previous experience or special communication skills. Great conversations usually begin with a friendly greeting and a willingness to listen. Whether you're joining a public room or creating your own, <strong>Wakiee Rooms</strong> makes the entire process quick and straightforward. </p> <h3>Step 1: Open Wakiee Rooms</h3> <p> Visit the Rooms page and browse the available public rooms, or create your own room if you'd like to start a new discussion. Since Wakiee works directly in your browser, there are <strong>no login requirements</strong>, <strong>no signup</strong>, and <strong>no downloads</strong> before joining your first <strong>group voice call</strong>. </p> <h3>Step 2: Allow Microphone Access</h3> <p> Your browser will ask for microphone permission before you begin speaking. This allows everyone in the room to hear you clearly. Using headphones and choosing a quiet environment can improve audio quality and make conversations more enjoyable for everyone participating. </p> <h3>Step 3: Introduce Yourself</h3> <p> You don't need an impressive introduction. A simple "Hi everyone, how's your day going?" is often enough to join the conversation naturally. Listen to the current discussion, wait for an appropriate moment, and share your thoughts politely. Group conversations work best when everyone has the opportunity to speak and listen. </p> <h3>Step 4: Respect Everyone in the Room</h3> <p> Every <strong>random group chat</strong> brings together people from different cultures, backgrounds, and opinions. Be respectful, avoid interrupting others, and give everyone a chance to participate. If you disagree with someone, keep the discussion friendly and constructive. Respectful conversations create better experiences for everyone. </p> <h3>Step 5: Enjoy the Conversation</h3> <p> Not every room will become your favourite, and that's perfectly normal. If one discussion doesn't match your interests, simply explore another room or create your own around a topic you enjoy. Every new <strong>group discussion</strong> is another opportunity to meet interesting people, exchange ideas, and build confidence through real conversations. </p> <h3>Quick Checklist Before Joining</h3> 
  <ul>
    <li> Check that your microphone is working properly.</li> 
    <li> Use headphones for clearer audio and less background noise.</li> 
    <li> Join with an open mind and a positive attitude.</li> 
    <li> Listen carefully before speaking.</li> 
    <li> Respect different opinions and give everyone a chance to participate.</li> 
    <li> Report inappropriate behaviour if necessary.</li> 
    <li> Relax, enjoy the discussion, and have fun meeting people from around the world.</li> 
  </ul>



  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Why Choose Wakiee Rooms?
  </h2>
  <p> A great <strong>random group chat</strong> isn't just about connecting people—it's about creating an environment where everyone feels comfortable joining the conversation. That's exactly what <strong>Wakiee Rooms</strong> was designed to do. Whether you're chatting with strangers for the first time or joining daily discussions with people from around the world, every room is built to encourage friendly conversations, respectful communication, and meaningful connections. Instead of simply providing a place to talk, Wakiee gives both participants and room creators the tools needed to keep conversations enjoyable for everyone. </p> <p> Unlike many traditional <strong>online chat rooms</strong>, <strong>Wakiee Rooms</strong> combines browser-based simplicity with powerful room management features. You don't need to download an application or spend time creating an account before joining a conversation. Simply open the Rooms page, allow microphone access, and start talking. Whether you're looking for a casual <strong>group voice chat</strong>, a place to practise English, or a discussion about technology, music, gaming, travel, or everyday life, joining takes only a few seconds. </p> <p> Every room owner has access to moderation tools that help maintain a positive atmosphere. If someone creates unnecessary background noise, the room owner can <strong>mute</strong> them without interrupting everyone else's experience. If a participant repeatedly disrupts the conversation, they can be <strong>kicked</strong> from the room. For more serious or repeated violations of the community guidelines, room owners also have the ability to <strong>ban</strong> users from returning. These features help ensure that respectful conversations remain the focus of every discussion. </p> <p> Room creators also have complete control over how their conversations are managed. They can <strong>lock</strong> a room whenever they want to prevent additional people from joining, making it useful for private discussions or when the room has reached a comfortable number of participants. They can also <strong>rename the room</strong> at any time, making it easy to change the discussion topic as conversations naturally evolve. A room that begins as a travel discussion might later become a conversation about books, careers, or favourite movies, and updating the room name helps new participants know exactly what to expect before joining. </p> <p> Another feature that makes <strong>Wakiee Rooms</strong> unique is its built-in <strong>discussion topics</strong>. Sometimes conversations naturally slow down, especially when people have just joined the room. Suggested discussion topics help break the ice by giving everyone something interesting to talk about. Whether it's sharing travel experiences, discussing current events, recommending books, talking about sports, learning languages, or simply asking fun questions, these conversation starters help people participate more comfortably and keep discussions flowing naturally. </p> <p> Behind the scenes, <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and clear community guidelines work together to support room owners. While moderation tools allow creators to manage their own rooms, AI systems help identify suspicious behaviour, and community reports help improve the platform over time. Together, these layers of protection create a safer and more welcoming environment where people can confidently enjoy <strong>group voice calls</strong> and meet new people from around the world. </p>

  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
   Free Group Chat Without Login, Signup or Downloads
  </h2>
<p> Joining a conversation shouldn't feel like completing paperwork. Many people simply want to meet new people, share ideas, or enjoy a quick discussion without creating another online account. That's why <strong>Wakiee Rooms</strong> lets you enjoy <strong>free group chat without login, signup, or downloads</strong>. Simply open the Rooms page, allow microphone access, and start talking within seconds. </p> <p> This browser-based experience is especially useful when you only have a few spare minutes. Maybe you're taking a break between classes, relaxing after work, travelling, or simply curious about joining a new conversation. Instead of filling out registration forms or verifying email addresses, you can immediately join an active <strong>group voice chat</strong> and start participating. The process is fast, simple, and designed to remove unnecessary barriers so you can focus on the conversation rather than the setup. </p> <p> Whether you're joining to practise English, improve communication skills, make friends online, or simply enjoy interesting discussions, <strong>Wakiee Rooms</strong> gives you a quick and welcoming way to connect with people from around the world—without complicated registration, downloads, or waiting. </p>


  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Tips for Better Group Conversations
  </h2>
<p> The best conversations in <strong>Wakiee Rooms</strong> don't happen because someone has the perfect story to tell—they happen because everyone feels comfortable participating. Whether you're joining your first <strong>random group chat</strong> or you're a regular visitor, a little courtesy goes a long way. Listening carefully, respecting different opinions, and giving everyone a chance to speak creates a much more enjoyable experience for the entire room. </p> <p> If you're new to <strong>group voice chat</strong>, don't worry about making a great first impression. A simple "Hello everyone" or "What are you all talking about?" is often enough to join naturally. Most people are happy to welcome new participants, especially when they show genuine curiosity and a positive attitude. Remember, every person in the room joined for the same reason—to enjoy a conversation and meet interesting people. </p> <p> One helpful habit is asking open-ended questions. Instead of asking questions that can be answered with "yes" or "no," encourage people to share their experiences. For example, ask about favourite travel destinations, hobbies, books, music, technology, or memorable life experiences. These questions often lead to longer and more engaging discussions where everyone has something to contribute. </p> <p> It's also important to know when to listen. Group discussions work best when everyone has the opportunity to speak without interruptions. Giving others time to finish their thoughts, responding respectfully, and welcoming different viewpoints helps create the friendly atmosphere that makes <strong>Wakiee Rooms</strong> enjoyable for everyone. </p>


  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Common Mistakes to Avoid
  </h2>
<p> Even experienced users occasionally have conversations that don't go as planned, and that's completely normal. One of the most common mistakes is talking continuously without giving others an opportunity to participate. A great <strong>group voice call</strong> is a shared conversation where everyone feels heard, not a one-person presentation. </p> <p> Another mistake is changing the discussion topic too quickly or interrupting someone while they're speaking. Group conversations naturally move from one subject to another, but allowing people to finish their thoughts keeps discussions organised and respectful. If you disagree with someone, focus on sharing your opinion politely rather than trying to win an argument. </p> <p> Avoid sharing sensitive personal information such as your address, passwords, financial details, or anything that could affect your privacy. Although <strong>Wakiee Rooms</strong> includes <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and community guidelines, practising good online safety is always important. </p> <p> If you're creating a room, remember that you're also helping shape the experience for everyone else. Use the <strong>mute</strong> feature when background noise interrupts the discussion, <strong>kick</strong> users who repeatedly disrupt conversations, and <strong>ban</strong> anyone who continuously ignores the room rules. If you want to keep the discussion private or the room has reached a comfortable size, simply <strong>lock the room</strong>. These tools aren't meant to punish people—they're there to help maintain respectful, enjoyable conversations for everyone. </p>

  
<h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
   Is Group Voice Chat Safe?
  </h2>
<p> A common question people ask before joining a <strong>random group chat</strong> is whether it's safe. The answer depends on both the platform you choose and the way you use it. Wakiee is designed with safety in mind, combining <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, and community guidelines to encourage respectful discussions. While no online platform can guarantee that every interaction will be perfect, these systems help create a friendlier environment where genuine conversations can thrive. </p> <p> You can also help protect yourself by following a few simple habits. Avoid sharing personal information, use a nickname if you prefer extra privacy, and leave any conversation that makes you feel uncomfortable. If someone behaves inappropriately, report them so moderators and room owners can take action. Community participation plays an important role in keeping <strong>Wakiee Rooms</strong> welcoming for everyone. </p> <p> Most people join <strong>group chat rooms</strong> for positive reasons. Some want to make friends, others are practising English, discussing hobbies, or simply enjoying interesting conversations after work. By combining good online safety practices with Wakiee's moderation tools, you can confidently enjoy meaningful conversations with people from around the world. </p>
 <h3>Quick Safety Checklist</h3> 
  <ul>
    <li> Never share passwords, financial details, or your home address.</li>
    <li> Respect everyone, even when opinions are different.</li>
    <li> Use the report feature if someone breaks the community guidelines.</li> 
    <li> Room owners should use mute, kick, ban, and lock tools responsibly.</li>
    <li> Join discussions with an open mind and a positive attitude.</li> 
    <li> Enjoy meeting new people while protecting your privacy.</li> 
  </ul> 
  


  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Microphone Permissions Explained
  </h2>
<p> Before joining <strong>Wakiee Rooms</strong>, your browser will ask for permission to use your microphone. This is a normal security feature built into modern web browsers and gives you complete control over your privacy. Without your permission, no website can access your microphone. Once you allow access, you can immediately join a <strong>group voice chat</strong> and start talking with other participants in the room. </p> <p> Many first-time users wonder why microphone permission is required. The answer is simple—voice conversations wouldn't be possible without it. Just like making a phone call, everyone in the room needs microphone access to hear and respond to one another in real time. After your conversation ends, you can remove microphone permission whenever you choose through your browser settings. </p> <p> For the best experience, try joining from a quiet environment and use headphones whenever possible. This reduces background noise, improves sound quality, and helps everyone enjoy clearer conversations. Small steps like these make every <strong>group voice call</strong> smoother and more enjoyable for everyone in the room. </p>

  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Practice English and Build Communication Skills
  </h2>
<p> One of the biggest advantages of <strong>Wakiee Rooms</strong> is the opportunity to improve your communication skills through real conversations. Reading textbooks and watching videos are helpful, but speaking with real people is one of the fastest ways to become more confident. Every <strong>group voice chat</strong> gives you the chance to practise listening, speaking, and expressing your ideas naturally. </p> <p> Many users join specifically to practise English with people from different countries. Listening to different accents, learning everyday expressions, and participating in live discussions can help improve pronunciation and vocabulary in a way that feels enjoyable rather than like studying. Because conversations happen naturally, you'll often learn new words and phrases without even realising it. </p> <p> Even if English isn't your goal, joining <strong>group chat rooms</strong> can help you become more comfortable speaking in front of others. Whether you're preparing for job interviews, presentations, university classes, or simply trying to become a more confident communicator, regular conversations with new people provide valuable real-world experience. </p>

  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
  When Should You Join a Group Voice Chat?
</h2>

<p>
  There is no perfect time to join a <strong>group voice chat</strong>. One of the biggest advantages of <strong>Wakiee Rooms</strong> is that conversations are available whenever you have a few free minutes. Some people join after work to relax and unwind by chatting with people from different backgrounds. Others stop by during a lunch break for a quick conversation before returning to their daily routine. Whether you have ten minutes or an entire evening free, there's usually an active <strong>random group chat</strong> waiting for you.
</p>

<p>
  Many users also join while travelling. Long train rides, flights, or hotel stays can feel much more enjoyable when you can talk with interesting people from around the world. Instead of scrolling through social media, you can spend your time sharing travel stories, learning about different cultures, or discovering places you might want to visit in the future. Every conversation offers a chance to see the world from someone else's perspective.
</p>

<p>
  <strong>Wakiee Rooms</strong> are also popular with students who want to practise English through real conversations. Speaking with different people helps improve pronunciation, build vocabulary, and increase confidence far more naturally than simply reading textbooks. College students often use <strong>group chat rooms</strong> to discuss current events, technology, entertainment, or everyday life while becoming more comfortable speaking in front of others.
</p>

<p>
  Remote workers, freelancers, and people who spend much of the day working alone also enjoy joining <strong>group voice rooms</strong> for a change of pace. Gamers frequently use Rooms to discuss new releases, share strategies, and meet people with similar interests. Others simply join because they feel lonely or want a friendly conversation after a busy day. Whether your goal is making friends, improving communication skills, practising a language, or enjoying cultural exchange with people from different countries, Wakiee Rooms provides a welcoming place where meaningful conversations can happen at any time.
</p>



<h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
  Why People Keep Coming Back to Wakiee Rooms
</h2>

<p>
  One of the reasons people continue returning to <strong>Wakiee Rooms</strong> is that no two conversations are ever the same. Every room brings together different personalities, experiences, and opinions, creating discussions that feel fresh each time you join. One day you might find yourself talking about travel and food, while the next conversation could focus on technology, music, education, or current events. The variety keeps every <strong>group voice chat</strong> interesting.
</p>

<p>
  Another reason is the opportunity to meet people from different countries. Speaking with people from around the world introduces you to new cultures, traditions, accents, and ways of thinking that you may never experience in everyday life. These conversations often become memorable because they help you understand perspectives that are very different from your own while making the world feel a little smaller and more connected.
</p>

<p>
  Many users also notice that regular participation helps improve their confidence. Speaking with new people becomes easier over time, expressing ideas feels more natural, and joining conversations becomes less intimidating. Whether you're preparing for interviews, improving your communication skills, or simply becoming more comfortable talking with strangers, every discussion helps you grow a little more confident.
</p>

<p>
  Sometimes people join expecting only a short conversation, yet end up staying much longer because the discussion becomes genuinely interesting. A casual chat can lead to learning something new, discovering a shared hobby, or meeting someone with a completely different life experience. While not every conversation turns into a lasting friendship, many users return because they enjoy the excitement of never knowing who they'll meet next. It's this mix of new people, new discussions, and unexpected connections that makes <strong>Wakiee Rooms</strong> a place people enjoy visiting again and again.
</p>

  
  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
   Group Voice Chat or One-to-One Conversations?
  </h2>
<p> There's no right or wrong choice—it simply depends on the kind of conversation you're looking for. If you enjoy hearing several opinions, participating in lively discussions, and discovering different perspectives, <strong>Wakiee Rooms</strong> is an excellent choice. Group conversations often introduce topics you might never think of on your own, making every discussion feel fresh and unpredictable. </p> <p> If you prefer more personal conversations, you can also explore Wakiee's <strong><a href="https://wakiee.live/voice">Random Voice Call</a></strong> and <strong><a href="https://wakiee.live/video">Random Video Chat</a></strong> features. Some days you may want a private one-to-one discussion, while other days you might enjoy the energy of a room filled with people from different countries. Wakiee gives you the flexibility to choose whichever experience matches your mood. </p> <p> Many users switch between all three experiences. They might start the day with a quick <strong>random voice call</strong>, spend the evening joining a <strong><a href="https://wakiee.live/rooms">group voice chat</a></strong> in <strong>Wakiee Rooms</strong>, and later enjoy face-to-face conversations through <a href="https://wakiee.live/video">Random Video Call</a> . No matter which feature you choose, the goal remains the same—to help people connect through friendly, respectful, and meaningful conversations. </p>

  <h2 style={{ fontSize: "1.05rem", marginTop: "14px", color: "#ffffff" }}>
    Frequently Asked Questions About Wakiee Rooms
  </h2>
<p> If you're new to <strong>Wakiee Rooms</strong>, you may have a few questions before joining your first <strong>random group chat</strong>. Here are answers to the questions users ask most often. </p> <h3>What are Wakiee Rooms?</h3> <p> <strong>Wakiee Rooms</strong> are live <strong>group voice chat</strong> rooms where up to ten people can join the same conversation at the same time. You can meet new people, discuss different topics, practice English, make friends online, or simply enjoy talking with people from around the world. </p> <h3>Is Wakiee Rooms free to use?</h3> <p> Yes. You can join or create a <strong>free group chat</strong> without paying any fees. There are <strong>no login requirements</strong>, <strong>no signup</strong>, and <strong>no downloads</strong>. Simply open the Rooms page, allow microphone access, and start talking. </p> <h3>Do I need to create an account?</h3> <p> No. One of the biggest advantages of <strong>Wakiee Rooms</strong> is that you can join conversations without creating an account. This makes it quick and easy to start a <strong><a href="https://wakiee.live/rooms">group voice call</a></strong> whenever you want. </p> <h3>How many people can join a room?</h3> <p> Each room supports up to <strong>10 participants</strong>, making discussions large enough to include different opinions while still giving everyone a chance to participate comfortably. </p> <h3>Can I create my own room?</h3> <p> Yes. You can create your own room, choose a custom room name, select a discussion topic, and invite friends using a unique room number. You can also leave the room public so new people can join your conversation. </p> <h3>What can room owners control?</h3> <p> Room owners have several moderation tools to help keep discussions respectful. They can <strong>mute</strong> users creating background noise, <strong>kick</strong> disruptive participants, <strong>ban</strong> users who repeatedly break the rules, <strong>lock</strong> the room to prevent additional people from joining, and <strong>rename the room</strong> whenever the discussion topic changes. </p> <h3>Can I practice English in Wakiee Rooms?</h3> <p> Absolutely. Many users join <strong>group chat rooms</strong> specifically to improve their spoken English. Talking with people from different countries helps build confidence, improve pronunciation, and learn everyday expressions through natural conversations. </p> <h3>Why does Wakiee need microphone permission?</h3> <p> Microphone permission allows everyone in the room to hear your voice. Modern browsers always ask for your permission first, giving you complete control over your privacy. You can disable microphone access at any time through your browser settings. </p> <h3>Is Wakiee Rooms safe?</h3> <p> Wakiee combines <strong>AI-assisted moderation</strong>, <strong>human reporting</strong>, community guidelines, and room management tools to help create a welcoming environment. While it's always important to protect your personal information online, these features help make conversations more respectful and enjoyable. </p> <h3>Can I join private rooms?</h3> <p> Yes. If someone shares a room number with you, you can join their private room directly. You can also browse public rooms and participate in conversations that match your interests. </p> <h3>Can I switch to one-to-one conversations?</h3> <p> Yes. If you prefer private conversations, you can use Wakiee's <strong>Random Voice Call</strong> feature. If you'd rather meet people face-to-face, you can also explore <strong>Random Video Chat</strong>. Wakiee lets you choose the experience that best matches your mood. </p> <h3>Why choose Wakiee Rooms instead of other online chat rooms?</h3> <p> Unlike many traditional <strong>online chat rooms</strong>, Wakiee combines browser-based simplicity with modern features such as AI moderation, human reporting, room numbers, discussion topics, custom room names, mute, kick, ban, and lock controls. These tools help create a more organised, enjoyable, and welcoming group conversation experience. </p>
  

  
</section>

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
