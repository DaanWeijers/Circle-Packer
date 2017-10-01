function ColorInput(element){

}

ColorInput.reset = function(){
	var elems = document.getElementsByClassName('colorVal');
	for (var i = 0; i < elems.length; i++) {
		elems[i].addEventListener('keydown', colorEvent)
	}
}

function colorEvent(e){
	if(e.key=='ArrowUp' || e.key=='ArrowDown'){
		e.preventDefault();
		var chg = e.key == 'ArrowDown'?-1:1;
		if(e.shiftKey) chg *= 16;
		console.log(e);
		var value = e.target.value;
		var selection = e.target.selectionStart
		var se = e.target.selectionEnd;
		selection--;

		var r = parseInt(value.substr(1,2), 16);
		var g = parseInt(value.substr(3,2), 16);
		var b = parseInt(value.substr(5,2), 16);
		if(selection <= 1 || selection == -1){
			r += chg;
			if(r >= 256) r -= 256;
			if(r < 0) r += 256;
		}
		if(selection == 3 || selection == 2 || selection == -1){
			g += chg;
			if(g >= 256) g -= 256;
			if(g < 0) g += 256;
		}
		if(selection >= 4 || selection == -1){
			b += chg;
			if(b >= 256) b -= 256;
			if(b < 0) b += 256;
		}
		r = r.toString(16);
		g = g.toString(16);
		b = b.toString(16);
		if(r.length==1) r = "0"+r;
		if(g.length==1) g = "0"+g;
		if(b.length==1) b = "0"+b;
		e.target.value = "#" + r+g+b;
		console.log(selection, e.key)
		e.target.selectionStart  = selection+1;
		e.target.selectionEnd = se;
	}
}
window.addEventListener('load', function(){
	setTimeout(ColorInput.reset, 1000);
});
