import { useState } from "react";


export function useReportSystem(socket, wakieeID, partnerInfo){

const [showModal,setShowModal] = useState(false);
const [reason,setReason] = useState("");
const [cooldown,setCooldown] = useState(false);
  
  /* ===============================
Report storage helpers
=============================== */

function loadReports(){

try{
return JSON.parse(localStorage.getItem("wakieeReports") || "[]");
}catch{
return [];
}

}

function saveReports(reports){

localStorage.setItem("wakieeReports",JSON.stringify(reports));

document.cookie = `wakieeReports=${encodeURIComponent(JSON.stringify(reports))}; path=/; max-age=31536000`;

}

function formatDate(){

const now = new Date();

return now.toLocaleString();

}

function openReport(){

if(!wakieeID){
console.warn("WakieeID not ready yet");
return;
}

let reports = loadReports();
const now = Date.now();
reports.sort((a,b)=>a.time-b.time); //===Add sorting before checking oldest.===

if(reports.length < 3){
setShowModal(true);
return;
}

/* check oldest report */

const oldest = reports[0];

if(now - oldest.time > 30 * 60 * 1000){

reports.shift();   // remove oldest
saveReports(reports);

setShowModal(true);
return;

}

/* cooldown */
setReason("");
setCooldown(true);

}

function closeReport(){
setShowModal(false);
setReason("");
}

  
function submitReport(){

if(!reason || !partnerInfo?.wakieeID) {
console.warn("Invalid report attempt");
return;
}

if(!wakieeID){
console.warn("Missing WakieeID");
return;
}

socket.emit("report-user", {
  reportedID: partnerInfo.wakieeID,
  reason
});
  
  /* store report entry */

let reports = loadReports();

reports.push({
time: Date.now(),
date: formatDate(),
reason
});

if(reports.length > 3){
reports = reports.slice(-3);
}

saveReports(reports);

console.log("📢 Report sent:", partnerInfo.wakieeID, reason);

socket.emit("leave");
closeReport();

}

/* ===============================
Report Modal
=============================== */

function ReportModal(){

if(!showModal) return null;

const reasons = ["nudity","spam","harassment","other"];

return(

<div className="report-overlay">

<div className="report-box">

<h3>Select reason for reporting</h3>

<div className="report-reasons">

{reasons.map(r => (

<button
key={r}
className={`reason-btn ${reason===r?"active":""}`}
onClick={() => setReason(r)}
>

{r}

</button>

))}

</div>

<div className="report-actions">

<button
className="cancel-btn"
onClick={closeReport}
>

Cancel

</button>

<button
className="submit-btn"
disabled={!reason}
onClick={submitReport}
>

Report

</button>

</div>

</div>

</div>

);

}

//============================Cooldown============
function CooldownModal(){

if(!cooldown) return null;

return(

<div className="report-overlay">

<div className="report-box">

<h3>
Enough reporting for today,
thanks for keeping Wakiee safe.😊
</h3>

<div className="report-actions">

<button
className="cancel-btn"
onClick={() => setCooldown(false)}
>
Close
</button>

</div>

</div>

</div>

);

}
//==========================================

return{
openReport,
ReportModal,
CooldownModal
};

}
