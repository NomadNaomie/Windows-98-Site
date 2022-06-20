var socket = new WebSocket('wss://' + window.location.hostname);
socket.addEventListener("open",()=>{
    socket.send(JSON.stringify({"admin":true,type:"status",pass:new URLSearchParams(window.location.search).get("pass")}))
})
socket.addEventListener("message",(m)=>{
    let data = JSON.parse(m.data);
    if (data.type=="serverHealth"){
        let ramChart = document.getElementById("ram");
        ramChart.dataset.free = data.ram
        ramChart.dataset.used = 100-data.ram
        let cpuChart = document.getElementById("cpu");
        cpuChart.dataset.cpu = data.cpu
    }
})