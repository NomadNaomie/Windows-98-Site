GuessHandler.prototype = new BaseControl("GuessHandler");
var guessed={
	1:false,
	2:false,
	3:false,
	4:false,
	5:false
}
var seasonSevenIcons = []
var seasonSixIcons = []
var guess = null;
var guessCoords = [];
var the_ui = null;
var audio = true;
let finalMark;
let finalLine;
var guesses = [];
var guessCount = 1;
var lines = [];
var answers = [];
var guessIcons = {
    1: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    2: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    3: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    4: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    5: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
}

function GuessHandler() {
}
GuessHandler.prototype.create = function(wrapper) {
    var text = document.createElement("span");
	text.setAttribute("id", "guess-move-div");
	var addMarker = function(ui) {
		return function(e) {
			if (finalMark){the_ui.lmap.removeLayer(finalMark);}
            if (finalLine){the_ui.lmap.removeLayer(finalLine);}
            if (!guessed[guessCount]){
			guessed[guessCount]=true;
            if (audio==true)plopA.play();
			guesses[guessCount] = new L.marker(e.latlng,{icon:guessIcons[guessCount]}).addTo(ui.lmap);
            guessCoords = ui.latLngToMC(e.latlng, 64);
        }
            else{
				ui.lmap.removeLayer(guesses[guessCount]);
                if (audio==true) plopA.play();
				guesses[guessCount] = new L.marker(e.latlng,{icon:guessIcons[guessCount]}).addTo(ui.lmap);
                guessCoords = ui.latLngToMC(e.latlng, 64);

            }
            document.getElementById("guess-move-div").innerHTML = '<div class="btn-group" role="group">'
            + `<p style="color:white;  -webkit-text-stroke: 1px black;font-size:2em;"><b>Your guess:</b></p>`
			+ '<button type="button" class="btn btn-default" coord="'+Math.round(guessCoords[0])+ '"id="xguess">' + "X: " + Math.round(guessCoords[0]) + '</button>'
			+ '<button type="button" class="btn btn-default" coord="'+Math.round(guessCoords[1])+'"id="zguess">' + "Z: " + Math.round(guessCoords[1]) + '</button>'
			+ '<button type="button" class="btn btn-default">' + "Y: " + Math.round(guessCoords[2]) + '</button>'
			+ "</div>";
		};
	}(this.ui);
	this.ui.lmap.on("click", addMarker);
	the_ui = this.ui;
    wrapper.appendChild(text);
};

GuessHandler.prototype.getName = function() {
	return 'guess-pos';
};
