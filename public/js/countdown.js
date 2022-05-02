var countDownDate = new Date(1644688800000).getTime();
var x = setInterval(function() {
  var now = new Date().getTime();
  var distance = countDownDate - now;
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);
  dateString = "";
    if (days > 0) {
        dateString += days + " days ";
    }
    if (hours > 0) {
        dateString += hours + " hours ";
    }
    if (minutes > 0) {
        dateString += minutes + " minutes ";
    }
    if (seconds > 0) {
        dateString += seconds + " seconds ";
    }
    dateString += "until the Black History Month Charity Event!";
    // document.getElementById("countdown").innerHTML = dateString;

}, 1000);