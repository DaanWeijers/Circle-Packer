var d = document;
var w = window;
var svg;
var Circle;
var Circles = [];

var colours = ["#D6FFBE", "#B4EEFF", "#FFB86D", "#D58EFF"];
var colourIndex = 0;

var stopBtn

var frame = 1;

var FRAMERATE = 24;
var MAXFRAMES = 2500;
var MINRADIUS = 3;
var MAXRADIUS = 25;
var GROWRATE = 1;
var SPAWNRATE = 3;
var CIRCLEDISTANCE = 2;

function init() {
	svg = d.getElementById("drawArea");
	svgwidth = svg.getBoundingClientRect().width;
	svgheight = svg.getBoundingClientRect().height;

	stopBtn = d.getElementById("stop");
	stopBtn.addEventListener("click", stopAlgorithm);

	svg.setAttribute("viewBox", "0 0 "+svgwidth+" "+svgheight);
}

var Circle = function(){
	this.x_ = ranNum(0,svgwidth);
	this.y_ = ranNum(0,svgheight);
	this.r_ = MINRADIUS;

	this.DOMobj;
	this.growing = true;
	this.valid = true;
	this.firstDraw = true;
}

Circle.prototype.draw = function() {
	if(this.firstDraw){
		this.DOMobj = d.createElementNS("http://www.w3.org/2000/svg", "circle");
		this.firstDraw = false;
		this.DOMobj.setAttributeNS(null, "cx", this.x_);
		this.DOMobj.setAttributeNS(null, "cy", this.y_);
		// this.DOMobj.setAttributeNS(null, "fill", "none");
		// this.DOMobj.setAttributeNS(null, "stroke", "#000000");
		if(colours.length > 0) {
			this.DOMobj.setAttributeNS(null, "fill", colours[(colourIndex % colours.length)]);
			colourIndex++;
		}
		svg.appendChild(this.DOMobj);
	}

	this.DOMobj.setAttributeNS(null, "r",  this.r_);
}

Circle.prototype.grow = function() {
	if(this.growing) {
		this.r_ = this.r_ + GROWRATE;
	}
}

function newCircle() {
	var tempCircle = new Circle();
	if(Circles.length > 0){
		for (var i = 0; i < Circles.length; i++) {
			var c = Circles[i];
			if(findDist(tempCircle.x_, tempCircle.y_, c.x_, c.y_) < (c.r_ + (CIRCLEDISTANCE + MINRADIUS))){
				tempCircle.valid = false;
				break;
			}
		}
	} else {
		tempCircle.valid = true;
	}

	if(tempCircle.valid) {
		Circles.push(tempCircle);
	} else {
		console.log("attempted creation of colliding circle");
	}
}

function drawCircles() {
	//svg.innerHTML = "";
	for (var i = 0; i < Circles.length; i++) {
		Circles[i].draw();
	}
}

function growCircles() {
	for (var i = 0; i < Circles.length; i++) {
		var c = Circles[i];
		if(c.r_ < MAXRADIUS) {
			if( (c.x_ - c.r_) < 0  || (c.x_ + c.r_) > svgwidth || (c.y_ - c.r_) < 0 || (c.y_ + c.r_) > svgheight ) {
				c.growing = false;
			}
			for (var j = 0; j < Circles.length; j++) {
				var cCheck = Circles[j];
				if(c != cCheck && findDist(c.x_, c.y_, cCheck.x_, cCheck.y_) < ((c.r_ + cCheck.r_) + CIRCLEDISTANCE)) {
					c.growing = false;
				}
			}
		} else {
			c.growing = false;
		}
		Circles[i].grow();
	}
}

function findDist(x1, y1, x2, y2) {
	return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
}

function ranNum(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

function loop() {
	if(frame < MAXFRAMES) {
		for (var i = 0; i < SPAWNRATE; i++) {
			newCircle();
			drawCircles();
			growCircles();
		}
		frame++;
	} else {
		alert("max attempts reached");
		clearInterval(looping);
	}
}

function stopAlgorithm() {
	clearInterval(looping);
}

var looping = setInterval(loop, 1000/FRAMERATE);

w.addEventListener("load", init);
