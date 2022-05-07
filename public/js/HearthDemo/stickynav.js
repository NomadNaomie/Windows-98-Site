window.onscroll = function() {foo()};
function foo(){
    if (window.pageYOffset >= sticky) {navbar.classList.add("sticky")} else {navbar.classList.remove("sticky");}
}
var navbar = document.getElementById("nav");
var sticky = navbar.offsetTop;
foo();