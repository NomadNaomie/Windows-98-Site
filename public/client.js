
const socket = new WebSocket('wss://' + window.location.hostname);
socket.addEventListener('message', function (event) {
  tweets = event.data;
  tweets = JSON.parse(tweets)
  for (tweet of tweets) {
    tweetDiv = document.createElement("div");
    tweetDiv.classList.add("tweet");
    tweetDiv.innerHTML = `<img class='pfp' src="${tweet.pfp}"></img>
        <b>${tweet.author}</b>
        <p>${tweet.body}<br><a href="${tweet.link}">Tweet</a></p>`;
    document.getElementById("tweet-body").appendChild(tweetDiv);
  }
});

twitterFeed = document.getElementById("twitterFeed");
twitterMin = document.getElementById("twitter-min");
twitterClose = document.getElementById("twitter-close");
twitterBody = document.getElementById("tweet-body");
aboutMeMin = document.getElementById("me-min");
aboutMeClose = document.getElementById("me-close");
aboutMeBody = document.getElementById("me-body");
aboutMeWindow = document.getElementById('aboutMe');
aboutMeLaunch = document.getElementById("AboutMeLaunch");
twitterLaunch = document.getElementById("TwitterLaunch");
heatmapLaunch = document.getElementById("ParlerHeatMapLaunch");
convoyLaunch = document.getElementById("ConvoyMapLaunch");
hearthLaunch = document.getElementById("HearthLaunch");
a3body = document.getElementById("a3-body");
a3win = document.getElementById("a3win");
a2body = document.getElementById("a2-body");
a2win = document.getElementById("a2win");
a1body = document.getElementById("a1-body");
a1win = document.getElementById("a1win");
a3close = document.getElementById("a3-close");
a3min = document.getElementById("a3-min");
a2close = document.getElementById("a2-close");
a2min = document.getElementById("a2-min");
a1close = document.getElementById("a1-close");
a1min = document.getElementById("a1-min");

contBtn = document.getElementById("confBtn");
contWin = document.getElementById("confirmWindow");
contBtn.addEventListener('click', function () {
  contWin.classList.add("off")
  aboutMeWindow.classList.toggle("off");
  aboutMeLaunch.classList.toggle("on");
  twitterFeed.classList.toggle("off");
  twitterLaunch.classList.toggle("on");
  hearthLaunch.classList.toggle("on");
  a1win.classList.toggle("on");
  a2win.classList.toggle("on");
  a3win.classList.toggle("on");
  document.getElementById("desktop-wallpaper").classList.toggle("inactive");
  document.getElementById("aboutMe").classList.toggle("inactive");
  document.getElementById("start-menu").classList.toggle("inactive");

})
startMen = document.getElementById("startMen")
startMen.classList.toggle("off");
aboutMeWindow.classList.toggle("off");
aboutMeLaunch.classList.toggle("on");
twitterFeed.classList.toggle("off");
twitterLaunch.classList.toggle("on");
hearthLaunch.classList.toggle("on");
a1win.classList.toggle("on");
a2win.classList.toggle("on");
a3win.classList.toggle("on");
startBtn = document.getElementById("sbtn");
startBtn.addEventListener("click", function () {
  startMen.classList.toggle("off");
})

dragables = [
  twitterFeed, aboutMeWindow, a1win, a2win, a3win
]
curZ = 3;
for (dragable of dragables) {
  dragElement(dragable);
  dragable.style.zIndex = curZ++;
}
function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {


    elmnt.style.zIndex = ++curZ;
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    var boun = document.documentElement.offsetWidth;
    if (pos3 - elmnt.offsetWidth / 2 > 0 && pos3 + elmnt.offsetWidth / 2 < window.innerWidth && pos4 > 0 && pos4 + elmnt.offsetHeight / 2 < window.innerHeight) {
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

a1min.addEventListener('click', function () {
  a1body.style.display != "none" ? a1body.style.display = "none" : a1body.style.display = "block";
})
a1close.addEventListener('click', function () {
  a1win.classList.toggle("off");
  hearthLaunch.classList.toggle("on");
})
a2min.addEventListener('click', function () {
  a2body.style.display != "none" ? a2body.style.display = "none" : a2body.style.display = "block";
})
a2close.addEventListener('click', function () {
  a2win.classList.toggle("off");
  convoyLaunch.classList.toggle("on");
})
a3min.addEventListener('click', function () {
  a3body.style.display != "none" ? a3body.style.display = "none" : a3body.style.display = "block";
})
a3close.addEventListener('click', function () {
  a3win.classList.toggle("off");
  heatmapLaunch.classList.toggle("on");
})
a3body.addEventListener('click', function () {
  a3win.style.zIndex = ++curZ;
});
a2body.addEventListener('click', function () {
  a2win.style.zIndex = ++curZ;
});
a1body.addEventListener('click', function () {
  a1win.style.zIndex = ++curZ;
});
a1win.addEventListener('click', function () {
  a1win.style.zIndex = ++curZ;
});
a2win.addEventListener('click', function () {
  a2win.style.zIndex = ++curZ;
});
a3win.addEventListener('click', function () {
  a3win.style.zIndex = ++curZ;
});
a3body.addEventListener('mouseover', function () {
  a3win.style.zIndex = ++curZ;
});
a2body.addEventListener('mouseover', function () {
  a2win.style.zIndex = ++curZ;
});
a1body.addEventListener('mouseover', function () {
  a1win.style.zIndex = ++curZ;
});
twitterMin.addEventListener('click', function (button) {
  twitterBody.classList.toggle("off");
}, false)
aboutMeMin.addEventListener('click', function (button) {
  aboutMeBody.classList.toggle("off");
}, false)
aboutMeClose.addEventListener('click', function (button) {
  aboutMeWindow.classList.toggle("off");
  aboutMeLaunch.classList.toggle("on");
})
twitterClose.addEventListener('click', function (button) {
  twitterFeed.classList.toggle("off");
  twitterLaunch.classList.toggle("on");
})
aboutMeLaunch.addEventListener('click', function (button) {
  if (aboutMeWindow.classList.contains("off")) {aboutMeWindow.classList.toggle("off");aboutMeLaunch.classList.toggle("on");}
})
twitterLaunch.addEventListener('click', function (button) {
  if (twitterFeed.classList.contains("off")) { twitterFeed.classList.toggle("off"); twitterLaunch.classList.toggle("on"); }
})
heatmapLaunch.addEventListener('click', function () {
  if (a3win.classList.contains("off")) {a3win.classList.toggle("off");heatmapLaunch.classList.toggle("on");}
});
convoyLaunch.addEventListener('click', function () {
  if (a2win.classList.contains("off")){a2win.classList.toggle("off");convoyLaunch.classList.toggle("on");}
});
hearthLaunch.addEventListener('click', function () {
  if (a1win.classList.contains("off")) {a1win.classList.toggle("off");hearthLaunch.classList.toggle("on");}
});




function showTime() {
  var date = new Date();
  var h = date.getHours(); // 0 - 23
  var m = date.getMinutes(); // 0 - 59
  var s = date.getSeconds(); // 0 - 59

  h = (h < 10) ? "0" + h : h;
  m = (m < 10) ? "0" + m : m;
  s = (s < 10) ? "0" + s : s;

  var time = h + ":" + m + ":" + s;
  document.getElementById("time").innerText = time;
  document.getElementById("time").textContent = time;

  setTimeout(showTime, 1000);

}
showTime();