import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";


export function useWakieeID(){

const navigate = useNavigate();

const [wakieeID,setWakieeID]=useState(null);
const [banInfo,setBanInfo]=useState(null);
const [remaining,setRemaining]=useState(0);
  

/* ===============================
Generate WakieeID
Format: WakieeID-XXXXX00000
Check if ID already exists
Show old ID in console
Generate only if not present
Store in localStorage + cookie (1 year)
clearing cookies
opening incognito
switching browser
=============================== */

function generateID(){

let existingID = localStorage.getItem("wakieeID");

if(existingID){

console.log("🔹 Existing WakieeID found:", existingID);
return existingID;

}

const letters="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers="0123456789";

let letterPart="";
let numberPart="";

/* 5 random letters */

for(let i=0;i<5;i++){
letterPart += letters[Math.floor(Math.random()*letters.length)];
}

/* 5 random numbers */

for(let i=0;i<5;i++){
numberPart += numbers[Math.floor(Math.random()*numbers.length)];
}

/* Final ID */

const id = `WakieeID-${letterPart}${numberPart}`;

/* Save */

localStorage.setItem("wakieeID",id);


  document.cookie = `wakieeID=${id}; path=/; max-age=31536000; SameSite=Lax`; /*❌ Without SameSite,Your cookie can be sent:from your site ✅ ,from other sites ❌ (danger)*/
/*document.cookie = `wakieeID=${id}; path=/; max-age=31536000; SameSite=Lax; Secure`;  👉 Only works on HTTPS👉 Prevents MITM attacks*/


/* Console */

console.log("🆕 Generated new WakieeID:", id);

return id;

}

/* ===============================
Check ban from server
=============================== */

async function checkBan(id){

try{

const res = await fetch("/api/check-ban",{
method:"POST",
headers:{ "Content-Type":"application/json"},
body:JSON.stringify({wakieeID:id})
});

const data = await res.json();

if(data.banned){

console.log("🚫 User banned:",data);

setBanInfo(data);
setRemaining(data.remainingSeconds);

}

}catch(err){

console.error("Ban check failed",err);

}

}

/* ===============================
Init
=============================== */

useEffect(()=>{

const id = generateID();

setWakieeID(id);

if(                             /*checks ban for both pages */
window.location.pathname.startsWith("/video") ||
window.location.pathname.startsWith("/voice")
){
checkBan(id);
}

},[]);

/* ===============================
Countdown
=============================== */

useEffect(()=>{

if(!banInfo) return;

const timer = setInterval(()=>{

setRemaining(prev=>{

if(prev<=1){

clearInterval(timer);
setBanInfo(null);

return 0;

}

return prev-1;

});

},1000);

return ()=>clearInterval(timer);

},[banInfo]);

/* ===============================
Ban Overlay
=============================== */

function BanOverlay(){

if(!banInfo) return null;

const minutes=Math.ceil(remaining/60);

return(

<div className="wakiee-ban-overlay">

<div className="wakiee-ban-box">

 <h2>🚫 You were Reported</h2>  

  {/* <p>Reason: {banInfo.reason}</p> */}

<p>Please wait {minutes} minute</p>

    <div className="ban-divider">
      <span>— Or —</span>
    </div>

    <button
      className="ban-blog-btn"
      onClick={() => navigate("/blog")}
    >
      Read Blogs
    </button>

</div>

</div>

);

}

return{
wakieeID,
banInfo,
BanOverlay
};

}
