const socket = new WebSocket('wss://'+window.location.hostname);


// Listen for messages
socket.addEventListener('message', function (event) {
    tweets = event.data;
    tweets = JSON.parse(tweets)
    for (tweet of tweets){
        tweetDiv = document.createElement("div");
        tweetDiv.classList.add("tweet");
        tweetDiv.innerHTML=`<img class='pfp' src="${tweet.pfp}"></img>
        <b>${tweet.author}</b>
        <p>${tweet.body}<br><a href="${tweet.link}">Tweet</a></p>`;
        document.getElementById("tweet-body").appendChild(tweetDiv);
    } 
});