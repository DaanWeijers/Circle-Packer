//	me being lazy
var d = document;
var w = window;

//	user-adjustable variables
var FRAMERATE = 24;
var MAXFRAMES = 5000;
var MINRADIUS = 1;
var MAXRADIUS = 15;
var GROWRATE = 1;
var SPAWNRATE = 10;
var CIRCLEDISTANCE = 1;

//	circle-packing variables
var svg;
var Circle;
var Circles = [];

//			colours of circles
var colours = ["#000"];
var colourIndex = 0;

//	image canvas variables
var canvas;
var ctx;
var imgData;
var pixelData = [];

//	temp
var img;

// 	other
var stopBtn
var frame = 1;

function init() {
	//initialise svg
	svg = d.getElementById("drawArea");
	svgwidth = svg.getBoundingClientRect().width;
	svgheight = svg.getBoundingClientRect().height;

	svg.setAttribute("viewBox", "0 0 "+svgwidth+" "+svgheight);

	//stop functionality
	stopBtn = d.getElementById("stop");
	stopBtn.addEventListener("click", stopAlgorithm);

	//initialise canvas
	canvas = d.getElementById("imageCanvas");
	canvas.setAttribute("width", svgwidth);
	canvas.setAttribute("height", svgheight);
	ctx = canvas.getContext("2d");
	img = d.getElementById("testimg");
	ctx.drawImage(img, 0, 0);

	//get data from image in canvas
	imgData = ctx.getImageData(0, 0, svgwidth, svgheight);

	//from imgData, store pixels into an array with {x,y} Point objects and rgba colour data
	for (var i = 0; i < imgData.data.length; i++) {
		var curPixel = parseInt(i / 4);
		pixelData.push(new Pixel( (curPixel % svgwidth), (parseInt(curPixel/svgheight)), imgData.data[i], imgData.data[i+1], imgData.data[i+2], imgData.data[i+3]));

		i = ((curPixel + 1) * 4)-1;

		if(i == imgData.data.length - 1) {
			console.log("Done analysing");
		}
	}
}

// 	Point object
var Point = function(x, y) {
	this.x_ = x;
	this.y_ = y;
}

//	to check if two points are equal to each other
Point.prototype.isEqualTo = function(otherP) {
	if(this.x_ == otherP.x_ && this.y_ == otherP.y_) {
		return true;
	} else {
		return false;
	}
}

var Pixel = function(x, y, r, g, b, a,) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
	if (this.r == "255" && this.g == "255" && this.b == "255") {
		this.isWhite = true;
	} else {
		this.isWhite = false;
	}
}

//	Circle object
var Circle = function(){
	this.x_ = ranNum(0,svgwidth);
	this.y_ = ranNum(0,svgheight);
	this.r_ = MINRADIUS;

	this.DOMobj;
	this.growing = true;
	this.valid = true;
	this.firstDraw = true;
}

//	creating the <circle> element in the SVG
Circle.prototype.draw = function() {
	if(this.firstDraw){
		this.DOMobj = d.createElementNS("http://www.w3.org/2000/svg", "circle");
		this.firstDraw = false;
		this.DOMobj.setAttributeNS(null, "cx", this.x_);
		this.DOMobj.setAttributeNS(null, "cy", this.y_);
		if(colours.length > 0) {
			this.DOMobj.setAttributeNS(null, "fill", colours[(colourIndex % colours.length)]);
			colourIndex++;
		}
		svg.appendChild(this.DOMobj);
	}

	this.DOMobj.setAttributeNS(null, "r",  this.r_);
}

//	circle growing
Circle.prototype.grow = function() {
	if(this.growing) {
		this.r_ = this.r_ + GROWRATE;
	}
}

//	new Circle creation
function newCircle() {
	//	initialise temporary element
	var tempCircle = new Circle();

	//	check if new circle is not created inside another existing circle
	if(Circles.length > 0) {
		for (var i = 0; i < Circles.length; i++) {
			var c = Circles[i];
			if(findDist(tempCircle.x_, tempCircle.y_, c.x_, c.y_) < (c.r_ + (CIRCLEDISTANCE + MINRADIUS))){
				tempCircle.valid = false;
				break;
			}
		}
	}
	//	check if new circle is not created too close to edges
	if((tempCircle.x_ - MINRADIUS) < 0 || (tempCircle.x_ + MINRADIUS) > svgwidth || (tempCircle.y_ - MINRADIUS) < 0 || (tempCircle.y_ + MINRADIUS > svgheight)) {
		tempCircle.valid = false;
	}
	// 	check if inside non-white area (using image reference)
	else if(tempCircle.valid) {
		tempCircle.valid = false;
		var pointOne = new Point(tempCircle.x_, tempCircle.y_);
		for (var i = 0; i < pixelData.length; i++) {
			var p = new Point(pixelData[i].x, pixelData[i].y);

			if(p.isEqualTo(pointOne) && !pixelData[i].isWhite) {
				tempCircle.valid = true;
			}
		}
	}
	//	if checks are passed, "valid" should be true, and circle will pushed in array to be drawn
	if(tempCircle.valid) {
		Circles.push(tempCircle);
	}
}

//	draw the circles in the Circles array
function drawCircles() {
	for (var i = 0; i < Circles.length; i++) {
		Circles[i].draw();
	}
}


function growCircles() {
	for (var i = 0; i < Circles.length; i++) {
		var c = Circles[i];

		//	check if circle doesn't exceed max radius
		if(c.r_ < MAXRADIUS ) {
			//	check if circle is not growing beyong edges of svg
			if( (c.x_ - c.r_ - CIRCLEDISTANCE) < 0  || (c.x_ + c.r_ + CIRCLEDISTANCE)  > svgwidth || (c.y_ - c.r_ - CIRCLEDISTANCE) < 0 || (c.y_ + c.r_ + CIRCLEDISTANCE) > svgheight ) {
				c.growing = false;
				break;
			}
			//	check if circle is not growing against another circle
			for (var j = 0; j < Circles.length; j++) {
				var cCheck = Circles[j];
				if(c != cCheck && findDist(c.x_, c.y_, cCheck.x_, cCheck.y_) < ((c.r_ + cCheck.r_) + CIRCLEDISTANCE)) {
					c.growing = false;
					break;
				}
			}
			//	check if growing inside of non-white pixels
			for (var j = 0; j < pixelData.length; j++) {
				var p = pixelData[j];
				if(p.isWhite) {
					if(findDist(p.x, p.y, c.x_, c.y_) < (c.r_ - GROWRATE)) {
						c.growing = false;
						break;
					}
				}
			}
			c.grow();
		}
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
