var start = function() {
	//	me being lazy
	var d = document;
	var w = window;

	//	user-adjustable variables
	var FRAMERATE = 24;
	var MAXFRAMES = 9999;
	var MINRADIUS = 1;
	var MAXRADIUS = 7.5;
	var GROWRATE = 1;
	var SPAWNRATE = 1;
	var CIRCLEDISTANCE = 3;

	//	circle-packing variables
	var svg;
	var Circle;
	var Circles = [];

	//	colors of circles
	var colors = ["#000000"];
	var colorIndex = 0;
	var colorInputs = [];
	var colorEls = [];
	var addColorBtn;
	var removeColorBtns = [];
	var colorIndex = 0;

	//	settings variables
	var colorsSet = ["#000000"];
	var minRadSet = 1;
	var maxRadSet = 7.5;
	var circleDistSet = 3;
	var spawnRateSet = 1;

	var sliders = [];
	var sliderVals = [];

	//	image canvas variables
	var canvas;
	var ctx;
	var imgData;
	var pixelData = [];

	// 	image upload
	var image = false;
	var imageLoaded = false;

	//	temp
	var img;

	// 	other
	var stopBtn, startBtn, exportBtn;
	var resizeTimer;
	var uplInput, uplLabel;
	var looping;
	var running = false;
	var falseColors = false;

	var frame = 1;
	var analysing = true;

	function init() {
		//initialise svg
		svg = d.getElementById("drawArea");
		svgwidth = svg.getBoundingClientRect().width;
		svgheight = svg.getBoundingClientRect().height;

		svg.setAttribute("viewBox", "0 0 "+svgwidth+" "+svgheight);

		//button functionality
		stopBtn = d.getElementById("stop");
		stopBtn.addEventListener("click", stopAlgorithm);
		startBtn = d.getElementById("start");
		startBtn.addEventListener("click", startAlgorithm);
		exportBtn = d.getElementById("export");
		exportBtn.addEventListener("click", exportSVG);

		uplLabel = d.getElementById("fileLabel");
		uplInput = d.getElementById("file");

		uplInput.addEventListener('change', function(e) { fileHandler(e);
			var fileName = '';
			if( this.files && this.files.length > 1 ) {
				fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
			} else {
				fileName = e.target.value.split( '\\' ).pop();
			}
			if( fileName ) {
				uplLabel.innerHTML = fileName;
			} else {
				uplLabel.innerHTML = "Upload a file";
			}
		});

		//initialise canvas
		canvas = d.getElementById("imageCanvas");
		canvas.setAttribute("width", svgwidth);
		canvas.setAttribute("height", svgheight);
		ctx = canvas.getContext("2d");

		// interface handlers
		w.addEventListener("resize", function() {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(adjustLength, 250);
		});

		addColorBtn = d.getElementById("addColor");
		addColorBtn.addEventListener("click", addColor);

		sliders = d.getElementsByClassName("slider");
		for (var i = 0; i < sliders.length; i++) {
			var s = sliders[i];
			s.addEventListener("input", function(e){
				setForm(e);
			});
		}
		sliderVals = d.getElementsByClassName("val");

		d.onkeyup=function(e){
			setForm(e);
		}
		indexColor();
		adjustLength();
		setForm();
	}

	// 	Point object
	function Point(x, y) {
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

	function Pixel(x, y, r, g, b, a) {
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
	function Circle(){
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
			if(colors.length > 0) {
				this.DOMobj.setAttributeNS(null, "fill", colors[(colorIndex % colors.length)]);
				colorIndex++;
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
			if(c.r_ < MAXRADIUS && c.growing) {
				//	check if circle is not growing beyond edges
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
			} else {
				c.growing = false;
			}
		}

		for (var i = 0; i < Circles.length; i++) {
			Circles[i].grow();
		}
	}

	//	————————————————
	// interface handling
	//	————————————————

	function addColor() {
		colorIndex++;

		for (var i = 0; i < colorEls.length; i++) {
			colorInputs[i].setAttribute("value", colorsSet[i]);
		}
		var container = d.getElementById("colorContainer");
		var curHTML = container.innerHTML;
		container.innerHTML = "";
		container.innerHTML = curHTML + "<p class='color' data-colorID='"+ colorIndex +"'>\n<a class='remove' data-colorID='"+ colorIndex +"' href='javascript:void(0)'>&times;</a>\n<span>\n<span data-colorID='"+ colorIndex +"' class='colorShow invalid'></span>\n	<input type='text' class='colorVal' data-colorID='"+ colorIndex +"' value='#000000'>\n</span>\n</p>";

		ColorInput.reset();

		indexColor();
		adjustLength();
	}

	function removeColor() {
		for (var i = 0; i < colorEls.length; i++) {
			el = colorEls[i];
			if(colorEls.length > 1){
				if(el.getAttribute("data-colorID") == this.getAttribute("data-colorID")) {
					el.parentNode.removeChild(el);
				}
			} else {
				colorInputs[0].setAttribute("value", "#000000");
			}
		}
		adjustLength();
	}

	function indexColor() {
		removeColorBtns = d.getElementsByClassName("remove");
		colorEls = d.getElementsByClassName("color");
		colorInputs = d.getElementsByClassName("colorVal");

		for (var i = 0; i < removeColorBtns.length; i++) {
			removeColorBtns[i].addEventListener("click", removeColor);
		}
	}

	function validateColors() {
		for (var i = 0; i < colorInputs.length; i++) {
			var el = colorInputs[i];
			if (el.value.indexOf("#") >= 0) {
				var stripped = el.value.split("#")[1];
			} else {
				stripped = el.value;
			}
			if(isHexaColor(stripped)) {
				d.getElementsByClassName("colorShow")[i].setAttribute("style", "background: #" + stripped + ";");
			} else {
				d.getElementsByClassName("colorShow")[i].setAttribute("style", "");
			}
		}
	}

	function adjustLength() {
		var contrLen = d.getElementsByClassName("controls")[0].getBoundingClientRect().height;
		if(w.innerWidth > 1100) {
			d.getElementsByClassName("view")[0].setAttribute("style", "height: "+ (contrLen + 100) + "px; max-height: inherit;")
		} else {
			d.getElementsByClassName("view")[0].setAttribute("style", "");
		}
	}

	function setForm(e) {
		for (var i = 0; i < colorInputs.length; i++) {
			colorsSet[i] = colorInputs[i].value;
			if(colorInputs[i].value.indexOf("#") >= 0) {
				colorsSet[i] = colorInputs[i].value;
			} else {
				colorsSet[i] = "#" + colorInputs[i].value;
			}
		}

		validateColors();

		for (var i = 0; i < sliderVals.length; i++) {
			var sv = sliderVals[i];
			var s = sliders[i];
			if(sv.getAttribute("data-slider") == sliders[i].getAttribute("id")){
				sv.innerHTML = s.value;
			}
		}

		minRadSet = sliders[0].value/2;
		maxRadSet = sliders[1].value/2;
		circleDistSet = parseInt(sliders[2].value);
		spawnRateSet = sliders[3].value;
	}

	//	————————————————
	// other
	//	————————————————

	function findDist(x1, y1, x2, y2) {
		return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2));
	}

	function ranNum(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	function isHexaColor(sNum){
		return (typeof sNum === "string") && sNum.length === 6
		&& ! isNaN( parseInt(sNum, 16) );
	}

	function loop() {
		if(!analysing) {
			if(frame < MAXFRAMES) {
				for (var i = 0; i < SPAWNRATE; i++) {
					newCircle();
				}
				drawCircles();
				growCircles();
				frame++;
			} else {
				clearInterval(looping);
			}
		}
	}

	function fileHandler(e) {
		stopAlgorithm();
		imageLoaded = false;
		var file = e.target.files[0];
		var reader = new FileReader();

		reader.onload = function(event) {
			image = new Image();
			image.onload = function() {
				imageLoaded = true;
				drawImageInCtx(image);
			}
			image.src = event.target.result;
		}
		reader.readAsDataURL(e.target.files[0]);

	}

	function drawImageInCtx(image){
		pixelData = [];

		//get data from image in canvas
		ctx.drawImage(image, 0,0);
		imgData = ctx.getImageData(0, 0, svgwidth, svgheight);

		//from imgData, store pixels into an array with {x,y} Point objects and rgba colour data
		for (var i = 0; i < imgData.data.length; i++) {
			var curPixel = parseInt(i / 4);
			pixelData.push(new Pixel( (curPixel % svgwidth), (parseInt(curPixel/svgheight)), imgData.data[i], imgData.data[i+1], imgData.data[i+2], imgData.data[i+3]));

			i = ((curPixel + 1) * 4)-1;

			if(i == imgData.data.length - 1) {
				analysing = false;
			}
		}
	}

	function stopAlgorithm() {
		startBtn.classList.remove("invisible");
		stopBtn.classList.add("invisible");
		clearInterval(looping);
	}
	function startAlgorithm() {
		if(imageLoaded) {
			for (var i = 0; i < colorsSet.length; i++) {
				if(!isHexaColor(colorsSet[i].split("#")[1])) {
					falseColors = true;
				}
			}
			if(minRadSet > maxRadSet) {
				console.log("hellooo");
				alert("Sorry, your minimum radius is smaller than your maximum");
			} else if(falseColors) {
				alert("Sorry, you've used invalid colors");
				falseColors = false;
			} else {
				Circles = [];
				svg.innerHTML = '';
				MINRADIUS = minRadSet;
				MAXRADIUS = maxRadSet;
				CIRCLEDISTANCE = circleDistSet;
				SPAWNRATE = spawnRateSet;
				for (var i = 0; i < colorsSet.length; i++) {
					colors[i] = colorsSet[i];
				}

				//console.log(MINRADIUS + " " + MAXRADIUS + " " + CIRCLEDISTANCE + " " + SPAWNRATE + " " + colors)

				startBtn.classList.add("invisible");
				stopBtn.classList.remove("invisible");

				looping = setInterval(loop, 1000/FRAMERATE);
			}
		} else {
			alert("Your image has not yet fully loaded");
		}
	}

	function exportSVG() {
		var svgData = svg.outerHTML;
		var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
		var svgUrl = URL.createObjectURL(svgBlob);
		var downloadLink = d.createElement("a");
		downloadLink.href = svgUrl;
		downloadLink.download = "circlepacker.svg";
		d.body.appendChild(downloadLink);
		downloadLink.click();
		d.body.removeChild(downloadLink);
	}

	w.addEventListener("load", init);
}
start();
