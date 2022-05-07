(function() {
var socket;
window.location.hostname == 'localhost' ? socket = new WebSocket("wss://localhost:4430") : socket = new WebSocket("wss://"+window.location.hostname);
socket.onopen = function() {
    socket.send(JSON.stringify({"type":"hcgeo"}))
}
var choiceSelector = document.getElementById("choiceSelector");
var panorama = "";
var clickAudio = document.getElementById("clickA");
var celebrationAudio = document.getElementById("celebrationsA");
var disagreeAudio = document.getElementById("disagreeA");
var audioBtn = document.getElementById("audioBtn");
var agreeAudio = document.getElementById("agreeA");
var plopAudio = document.getElementById("plopA");
var submitBtn = document.getElementById("submitBtn");
var winOrLose = document.getElementById("winOrLose");
var scoreList = document.getElementById("scoreList");
var scoreText = document.getElementById("score");
var s6btn  = document.getElementById("s6btn");
var s7btn  = document.getElementById("s7btn");
var restartBtn = document.getElementById("restart-game");
let ans;
var seasonNum = 6;
let score = 0;
audioBtn.addEventListener("click", function(){
    audio = !audio;
    audioBtn.classList.toggle("mcbtn-active");
    if (audio==true){
        clickAudio.play();
        audioBtn.innerHTML = "SFX are On";
    }else{
        audioBtn.innerHTML = "SFX are Off";
    }
});
s6btn.addEventListener('click', function(e) {

    if (audio==true)clickAudio.play();
    if (!s7btn.classList.contains("mcbtn-active") && s6btn.classList.contains("mcbtn-active")) {
        if (audio==true)disagreeAudio.play();
        winOrLose.innerHTML=`1 season must <br> be active`;
        winOrLose.style.backgroundColor = `rgba(0,0,0,0.7);`;
        winOrLose.style.display = "block";
        setTimeout(function() {
            winOrLose.style.display = "none";
        }, 2500);
    }else{
        socket.send(JSON.stringify({
            "type": "seasonChange",
            "season": 6}));
    s6btn.classList.toggle("mcbtn-active");
    if (s6btn.classList.contains("mcbtn-active")){
        s6btn.innerHTML = "Season 6 is on";
    } else{
        s6btn.innerHTML = "Season 6 is off";
    }}
});
s7btn.addEventListener('click', function(e) {
    if (audio==true)clickAudio.play();
    if (s7btn.classList.contains("mcbtn-active") && !s6btn.classList.contains("mcbtn-active")) {
        if (audio==true)disagreeAudio.play();
        winOrLose.innerHTML=`1 season must <br> be active`;
        winOrLose.style.backgroundColor = `rgba(0,0,0,0.7);`;
        winOrLose.style.display = "block";
        setTimeout(function() {
            winOrLose.style.display = "none";
        }, 2500);
    }else{
        socket.send(JSON.stringify({
            "type": "seasonChange",
            "season": 7}));
    s7btn.classList.toggle("mcbtn-active");
    if (s7btn.classList.contains("mcbtn-active")){
        s7btn.innerHTML = "Season 7 is on";
    } else{
        s7btn.innerHTML = "Season 7 is off";
    }}
});

pannellum.viewer('panorama', {
    "type": "equirectangular",
    "panorama": "images/GeoGuessr/panos/"+`season7/DThrone.webp`,
    "autoLoad": true,
    "yaw":180,
});

socket.addEventListener("message", function(event) {
    var data = JSON.parse(event.data);
    if (data.type == "acceptable"){
        data.acceptable = JSON.parse(data.acceptable);
        if (data.acceptable[7] == true){
            if (!s7btn.classList.contains("mcbtn-active")){
                s7btn.classList.toggle("mcbtn-active");
                s7btn.innerHTML = "Season 7 is on";
            }
        }else{
            if (s7btn.classList.contains("mcbtn-active")){
                s7btn.classList.toggle("mcbtn-active");
                s7btn.innerHTML = "Season 7 is off";
            }
        }
        if (data.acceptable[6] == true){
            if (!s6btn.classList.contains("mcbtn-active")){
                s6btn.classList.toggle("mcbtn-active");
                s6btn.innerHTML = "Season 6 is on";
            }
        }else{
            if (s6btn.classList.contains("mcbtn-active")){
                s6btn.classList.toggle("mcbtn-active");
                s6btn.innerHTML = "Season 6 is off";
            }
        }
    }
    if (data.type == "guessAnswer"){
        winOrLose.innerHTML=`${data.distance} blocks off`;
        winOrLose.style.backgroundColor = `${data.distanceColour}`;
        winOrLose.style.display = "block";
        setTimeout(function() {
            winOrLose.style.display = "none";
        }, 1000);
        let listItem = document.createElement("ol")
        listItem.innerHTML= 
            `Score: ${data.score} (${data.distance} blocks off)`;
        scoreList.appendChild(listItem);
        score+=data.score;
        if (data.score > 95){
            if (audio==true)agreeAudio.play();
        }
        scoreText.innerHTML = `Score: ${score}`;
    }
    if (data.type == "gameOver"){
        socket.close();
        restartBtn.style.display="block";
        scoreText.innerHTML = `Final Score: ${score}`;
        submitBtn.disabled = true;
        winOrLose.innerHTML=`Game Over! Score: ${score}`;
        winOrLose.style.backgroundColor = `black`;
        winOrLose.style.display = "block";
        if (score==500){
        var duration = 5 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        if (audio==true)celebrationAudio.play();
        function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
        }

        var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        var particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
        setTimeout(function() {
            winOrLose.style.display = "none";
        }, 3000);
    }
    if (data.type == "panorama") {
        ans = data.ans;
        let seasonTemp = seasonNum;
        seasonNum = ans.season;
        if (the_ui){seasonNum==7?the_ui.setMap(the_ui.getMapConfigsOrder()[0]):the_ui.setMap(the_ui.getMapConfigsOrder()[1]);}
        pannellum.viewer('panorama', {
            "type": "equirectangular",
            "panorama": "images/GeoGuessr/panos/"+`season${seasonNum}/`+data.panorama,
            "autoLoad": true,
        });
        panorama = data.panorama;
        if (seasonTemp != seasonNum){
            if (seasonNum == 6){
                for (let icon of seasonSevenIcons){
                    the_ui.lmap.removeLayer(icon);
                }
                for (let icon of seasonSixIcons){
                    the_ui.lmap.addLayer(icon);
                }
            }else{
                for (let icon of seasonSixIcons){
                    the_ui.lmap.removeLayer(icon);
                }
                for (let icon of seasonSevenIcons){
                    the_ui.lmap.addLayer(icon);
                }
            }
        }
    }
    if (data.type == "timeout"){
            console.log("timeout");
            socket.close();
            winOrLose.innerHTML=`Connection Closed`;
            winOrLose.style.backgroundColor = `black`;
            winOrLose.style.display = "block";
            submitBtn.disabled = true;
            restartBtn.style.display="block";
    }
});
submitBtn.addEventListener("click", function() {
    var x = document.getElementById("xguess");
    var z = document.getElementById("zguess");
    if (x && z && guessed[guessCount]){
        socket.send(JSON.stringify({
            type: "choice",
            panorama: panorama,
            choice: {"x": parseInt(x.getAttribute("coord")), "z": parseInt(z.getAttribute("coord"))}
        }));
        answers[guessCount] = new L.marker(the_ui.mcToLatLng(ans.x,ans.z,64),{icon:guessIcons[guessCount]}).addTo(the_ui.lmap);
        lines[guessCount] = new L.polyline([the_ui.mcToLatLng(ans.x,ans.z,64),the_ui.mcToLatLng(parseInt(x.getAttribute("coord")),parseInt(z.getAttribute("coord")),64)],{color:"red"}).addTo(the_ui.lmap);
        if (seasonNum == 7){
            seasonSevenIcons.push(answers[guessCount]);
            seasonSevenIcons.push(lines[guessCount]);
            seasonSevenIcons.push(guesses[guessCount]);
        }else{
            seasonSixIcons.push(answers[guessCount]);
            seasonSixIcons.push(lines[guessCount]);
            seasonSixIcons.push(guesses[guessCount]);
        }
        guessCount +=1;
    }
    else{
        if (audio==true)disagreeAudio.play();
        winOrLose.innerHTML=`Make a guess first`;
        winOrLose.style.backgroundColor = `rgba(0,0,0,0.7);`;
        winOrLose.style.display = "block";
        setTimeout(function() {
            winOrLose.style.display = "none";
        }, 2500);
    }
});
})();