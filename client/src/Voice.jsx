//opus used in voice4  // add turn code like video for 98% connection success
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { io } from "socket.io-client";
import "./Voice.css";
import wakieeIcon from "./W1.png";
import { useWakieeID } from "./WakieeID";
import { useReportSystem } from "./ban";

const animalAvatars = [
"🐵","🐒","🦍","🦧",
"🐶","🐕","🐕‍🦺","🐩","🐺",
"🦊","🦝",
"🐱","🐈","🦁","🐯","🐅","🐆",
"🐴","🐎","🦄","🦓","🦌",
"🐮","🐂","🐃","🐄",
"🐷","🐖","🐗",
"🐏","🐑","🐐",
"🐪","🐫","🦙","🦒",
"🐘","🦏","🦛",
"🐭","🐁","🐀","🐹",
"🐰","🐇","🐿️","🦔","🦇",
"🐻","🐨","🐼",
"🦥","🦦","🦨","🦘","🦡",

"🦃","🐔","🐓","🐥",
"🐦","🐧","🕊️","🦅","🦆","🦢","🦉",
"🦩","🦚","🦜",

"🐸","🐊","🐢","🦎","🐍",

"🐳","🐋","🐬",
"🐟","🐠","🐡","🦈",
"🐙",
"🦀","🦞","🦐","🦑","🦪",

"🐌","🦋","🐛","🐜","🐝",
"🐞","🦗",
"🕷️","🦂",
"🦟"
];

export default function Voice(){

  const navigate = useNavigate();


  
  const { wakieeID, banInfo, BanOverlay } = useWakieeID();

 
  
  useEffect(()=>{

if(!wakieeID) return;

console.log("🎧 Voice page WakieeID:", wakieeID);

},[wakieeID]);

  const socketRef = useRef(null);
  const peerRef = useRef(null);
const localStreamRef = useRef(null);
  
const [status,setStatus] = useState("ready");
const [avatar,setAvatar] = useState(null);
const [chatOpen,setChatOpen] = useState(false);
const [muted,setMuted] = useState(false);
const [continuous,setContinuous] = useState(false);
const [country,setCountry] = useState("");
const [messages,setMessages] = useState([]);
const [input,setInput] = useState("");
  const [partnerMuted,setPartnerMuted] = useState(false);
  const [partnerId,setPartnerId] = useState(null); // later use wakieeId to track partner
  const [callTime,setCallTime] = useState(0); // call timer
  const [partnerTyping,setPartnerTyping] = useState(false);
  const chatEndRef = useRef(null);
  const [partnerLeft,setPartnerLeft] = useState(false);

  const [partnerInfo,setPartnerInfo] = useState(null);

const { openReport, ReportModal, CooldownModal } =
useReportSystem(socketRef.current || null, wakieeID, partnerInfo);
  
useEffect(()=>{

if(status!=="searching") return;

const interval = setInterval(()=>{

const rand =
animalAvatars[Math.floor(Math.random()*animalAvatars.length)];

setAvatar(rand);

},400);

return ()=>clearInterval(interval);

},[status]);

 useEffect(()=>{

if(status==="connected"){

const rand =
animalAvatars[Math.floor(Math.random()*animalAvatars.length)];

setAvatar(rand);

}

if(status==="waiting"){

setAvatar(null); // show Wakiee logo

}

if(status==="ready"){

setAvatar(null); // show Wakiee logo

}

},[status]);
 //=======================================timer================
  useEffect(()=>{

let timer;

if(status === "connected"){

timer = setInterval(()=>{

setCallTime(prev => prev + 1);

},1000);

}else{

setCallTime(0);

}

return ()=>{

if(timer) clearInterval(timer);

};

},[status]);
  //=======================================================

useEffect(()=>{

fetch("https://ipapi.co/json/")
.then(r=>r.json())
.then(data=>setCountry(data.country_code))
.catch(()=>{});

},[]);
  //=======================voice=================namespace==========
  useEffect(()=>{

socketRef.current = io("/voice");

return ()=>{

socketRef.current.disconnect();

};

},[]);
  //====================micro phone====================
  useEffect(()=>{

async function initMic(){

try{

//const stream = await navigator.mediaDevices.getUserMedia({
//audio:true
//});

  const stream = await navigator.mediaDevices.getUserMedia({
audio:{
channelCount:2,
sampleRate:48000,
echoCancellation:true,
noiseSuppression:true,
autoGainControl:true
}
});

localStreamRef.current = stream;

}catch(e){

console.error("Mic permission denied",e);

}

}

initMic();

},[]);
  //===============================================
//=====================================pair=======================
useEffect(()=>{

socketRef.current.on("voice:paired",async (data)=>{

console.log("✅ Connected to partner WakieeID:", data.partnerInfo?.wakieeID);

setPartnerId(data.partnerId);
setPartnerInfo(data.partnerInfo); // add this
setStatus("connected");

createPeerConnection(data.partnerId);

if(data.initiator){

const offer = await peerRef.current.createOffer();

await peerRef.current.setLocalDescription(offer);

socketRef.current.emit("voice:offer",{
to:data.partnerId,
sdp:offer
});

}

});

return ()=>{

socketRef.current.off("voice:paired");

};

},[]);
//=====================================pair=======================
 //=====================================partner left=======================
useEffect(()=>{

socketRef.current.on("voice:partner-left",()=>{

if(peerRef.current){
peerRef.current.close();
peerRef.current=null;
}

// clear audio
const audio = document.getElementById("remoteAudio");
if(audio) audio.srcObject = null;

setMessages([]);
setPartnerTyping(false);
setPartnerId(null);
setPartnerInfo(null);

// show message
setPartnerLeft(true);

// hide message after 3 seconds
setTimeout(()=>{
setPartnerLeft(false);
},3000);

// reconnect logic after 4 seconds
setTimeout(()=>{

if(continuous){
setStatus("searching");
socketRef.current.emit("voice:start",{
wakieeID
});
}else{
setStatus("waiting");
}

},4000);

});

return ()=>{

socketRef.current.off("voice:partner-left");

};

},[continuous]);
//=====================================partner left=======================
  //===================================muted=========
  useEffect(()=>{

socketRef.current.on("voice:partner-muted",(data)=>{

setPartnerMuted(data.muted);

});

return ()=>{

socketRef.current.off("voice:partner-muted");

};

},[]);
  //====================================================muted ring===================
  //=================================typing============
  
  useEffect(()=>{

socketRef.current.on("voice:message",(data)=>{

setMessages(prev=>[
...prev,
{text:data.text,self:false}
]);

setPartnerTyping(false);

});

return ()=>{
socketRef.current.off("voice:message");
};

},[]);
  
  useEffect(()=>{

socketRef.current.on("voice:typing",()=>{

if(status==="connected"){
setPartnerTyping(true);

setTimeout(()=>{
setPartnerTyping(false);
},2000);

}

});

return ()=>{
socketRef.current.off("voice:typing");
};

},[status]);
  //=======================================================
  //===scroll===============================
  useEffect(()=>{
if(chatEndRef.current){
chatEndRef.current.scrollIntoView({behavior:"smooth"});
}
},[messages,partnerTyping]);
  //==============scroll================
  //=======================offer listner============
  useEffect(()=>{

socketRef.current.on("voice:offer",async ({from,sdp})=>{

if(peerRef.current){
peerRef.current.close();
peerRef.current=null;
}

createPeerConnection(from);

await peerRef.current.setRemoteDescription(
new RTCSessionDescription(sdp)
);

const answer = await peerRef.current.createAnswer();

await peerRef.current.setLocalDescription(answer);

socketRef.current.emit("voice:answer",{
to:from,
sdp:answer
});

});

return ()=>{

socketRef.current.off("voice:offer");

};

},[]);
  //===================offer listner=================
  //==================answer listner======================
  useEffect(()=>{

socketRef.current.on("voice:answer",async ({sdp})=>{

await peerRef.current.setRemoteDescription(
new RTCSessionDescription(sdp)
);

});

return ()=>{

socketRef.current.off("voice:answer");

};

},[]);
  //================================================

  //=================================add ice candidate listner=========================
  useEffect(()=>{

socketRef.current.on("voice:ice",async ({candidate})=>{

try{

await peerRef.current.addIceCandidate(
new RTCIceCandidate(candidate)
);

}catch(e){

console.error("ICE error",e);

}

});

return ()=>{

socketRef.current.off("voice:ice");

};

},[]);
  //=====================================================
  //===============================ban notice===========
  useEffect(()=>{

socketRef.current.on("banned-video", ({ reason, banMinutes })=>{

console.log("🚫 Voice banned:", reason);

if(peerRef.current){
peerRef.current.close();
peerRef.current=null;
}

// stop mic
if(localStreamRef.current){
localStreamRef.current.getTracks().forEach(track=>track.stop());
}

// clear audio element
const audio = document.getElementById("remoteAudio");
if(audio) audio.srcObject = null;

setMessages([]);
setPartnerTyping(false);
setPartnerId(null);
setPartnerInfo(null);

 navigate("/");

  setTimeout(() => {
    alert(`You have been banned for ${banMinutes} minutes`);
  }, 400);



});

return ()=>{

socketRef.current.off("banned-video");

};

},[]);
//====================================================
  //===================peer connection====================
function createPeerConnection(targetId){

peerRef.current = new RTCPeerConnection({

iceServers:[
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    {urls: "stun:stun.cloudflare.com:3478" },
    
      {
        urls: "turn:relay1.expressturn.com:3478",
        username: "000000002074682235",
        credential: "tN/jre4jo0Rpoi0z5MXgby3QAqo=",
      },
       {
        urls: "turn:relay1.expressturn.com:3480",
        username: "000000002075993076",
        credential: "95Ba+ErlB7Fg6HDb1t1tc5ju6Rc=",
      },

]

});

if(localStreamRef.current){
  
//localStreamRef.current.getTracks().forEach(track=>{
//peerRef.current.addTrack(track,localStreamRef.current);
//});
  localStreamRef.current.getTracks().forEach(track=>{

const sender = peerRef.current.addTrack(track,localStreamRef.current);

if(sender.track && sender.track.kind === "audio"){

const params = sender.getParameters();

if(!params.encodings)
params.encodings = [{}];

params.encodings[0].maxBitrate = 128000;

sender.setParameters(params).catch(()=>{});

}

});
  
}

peerRef.current.onicecandidate = (event)=>{

if(event.candidate){

socketRef.current.emit("voice:ice",{
to:targetId,
candidate:event.candidate
});

}

};

  peerRef.current.ontrack = (event)=>{

let audio = document.getElementById("remoteAudio");

if(!audio){
audio = document.createElement("audio");
audio.id = "remoteAudio";
audio.autoplay = true;
document.body.appendChild(audio);
}

audio.srcObject = event.streams[0];

};

}
  //=================peer connection======================
  //=====================================matching=======================
function startMatching(){
setStatus("searching");
socketRef.current.emit("voice:start",{
wakieeID
});

}


function stopMatching(){

socketRef.current.emit("voice:stop");

if(peerRef.current){
peerRef.current.close();
peerRef.current=null;
}

// 🔊 clear audio
const audio = document.getElementById("remoteAudio");
if(audio) audio.srcObject = null;
setMessages([]);
setPartnerTyping(false);
setStatus("ready");
setAvatar(null);
setPartnerMuted(false);
setPartnerId(null);

}

//===============================================================
function toggleMute(){

const newState = !muted;

setMuted(newState);

// 🔇 Actually mute microphone
if(localStreamRef.current){
localStreamRef.current.getAudioTracks().forEach(track=>{
track.enabled = !newState;
});
}

socketRef.current.emit("voice:mute",{ muted:newState });

}


function toggleContinuous(){

setContinuous(!continuous);

}


function sendMessage(){

if(!input.trim() || status !== "connected") return;

const text = input;

setMessages(prev=>[
...prev,
{text,self:true}
]);

socketRef.current.emit("voice:message",{
to:partnerId,
text
});

setInput("");

}

function handleNext(){

if(status!=="connected" && status!=="waiting") return;

socketRef.current.emit("voice:next");

if(peerRef.current){
peerRef.current.close();
peerRef.current=null;
}

const audio = document.getElementById("remoteAudio");
if(audio) audio.srcObject = null;

  setMessages([]);
setPartnerTyping(false);
setStatus("searching");

}

  function formatTime(seconds){

const minutes = Math.floor(seconds / 60);
const secs = seconds % 60;

return `${minutes.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;

}
  
return(

<div className="voice-page-voice">


<div className="voice-top-voice">

<div
className="voice-message-voice"
onClick={()=>setChatOpen(true)}
>
💬
{partnerTyping && status==="connected" && (
<div className="typing-mini-voice">
<span></span>
<span></span>
<span></span>
</div>
)}
</div>

</div>



<div className="voice-circle-area-voice">

<div
className={`voice-ring-voice
${status==="connected" && !partnerMuted ? "ring-green-voice":""}
${status==="connected" && partnerMuted ? "ring-red-voice":""}
`}
>

<div className="voice-avatar-voice">

{avatar ? avatar :
<img
src={wakieeIcon.src}
alt="Free voice chat with strangers on Wakiee"
/>
}

</div>

</div>
{status==="connected" && (
<>
<div className="voice-call-timer">
{formatTime(callTime)}
</div>

{partnerLeft && (
<div className="partner-left-voice">
Your partner left
</div>
)}

</>
)}
</div>



<div className="voice-status-row-voice">

<div className="voice-status-voice">

{status==="ready" && "Ready"}
{status==="searching" && "Searching"}
{status==="waiting" && "Waiting"}
{status==="connected" && "Connected"}

{/*
{country && (
<span className="voice-flag-voice">
{country}
</span>
)}
*/}

</div>

{status === "ready" && (

<div style={{display:"flex",alignItems:"center",gap:"8px"}}>

<span className="auto-connect-voice">
Auto connect
</span>

<div
className={`voice-toggle-voice ${continuous ? "toggle-on-voice":""}`}
onClick={toggleContinuous}
>

<div className="toggle-knob-voice"></div>

</div>

</div>

)}
  
</div>



<div className="voice-controls-voice">


{status==="ready" && (

<button
className={`control-btn-modern-voice start-btn-voice ${status==="ready" ? "pulse-green-voice" : ""}`}
onClick={startMatching}
  disabled={banInfo}
>

<svg viewBox="0 0 24 24">
<polygon points="6,4 20,12 6,20"/>
</svg>

<span>Start</span>

</button>

)}



<button
className={`control-btn-modern-voice mic-btn-voice ${muted ? "slash-voice" : ""}`}
onClick={toggleMute}
>

<svg viewBox="0 0 24 24">

<path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z"/>

<path d="M19 11a7 7 0 01-14 0"/>

<line x1="12" y1="18" x2="12" y2="22"/>

</svg>

<span>Mic</span>

</button>



<button
disabled={status!=="connected" && status!=="waiting"}
className={`control-btn-modern-voice next-btn-voice ${status==="waiting" ? "pulse-blue-voice" : ""}`}
onClick={handleNext}
>

<svg viewBox="0 0 24 24" className="next-icon-voice">

<polygon points="8,5 19,12 8,19"/>

</svg>

<span>Next</span>

</button>



{status!=="ready" && (

<button
className="control-btn-modern-voice stop-btn-voice"
onClick={stopMatching}
>

<div className="stop-icon-voice"></div>

<span>Stop</span>

</button>

)}



<button
disabled={status!=="connected"}
className="control-btn-modern-voice report-btn-voice"
onClick={()=>{
openReport();
}}
>

<span className="emoji-icon-voice">⚠️</span>

<span>Report</span>

</button>

</div>



{chatOpen && (

<div className="voice-chat-overlay-voice">

<div className="voice-chat-box-voice">

<div className="chat-header-voice">


<button
className="chat-close-voice"
onClick={()=>setChatOpen(false)}
>
✕
</button>

</div>


<div className="chat-messages-voice">

{messages.map((m,i)=>(
<div
key={i}
className={`msg-voice ${m.self ? "self-voice" : ""}`}
>
{m.text}
</div>
))}

{partnerTyping && status==="connected" && (
<div className="typing-indicator-voice">
<span></span>
<span></span>
<span></span>
</div>
)}
<div ref={chatEndRef}></div>
</div>

<div className="chat-input-voice">

<input
value={input}
onChange={(e)=>{

setInput(e.target.value);

if(status==="connected" && partnerId){

if(!window.voiceTypingCooldown){

socketRef.current.emit("voice:typing",{to:partnerId});

window.voiceTypingCooldown = true;

setTimeout(()=>{
window.voiceTypingCooldown = false;
},1000);

}

}

}}
placeholder="Type your message..."
/>

<button
disabled={status!=="connected"}
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
