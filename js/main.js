var img,
	imgHeight,
	imgWidth,
	interactionLayerCanvas,
	pixelOverlayCanvas,
	cellPixelWidth = 15,
	normalizationFactor = 3;

$(document).bind('pageinit', function() {	
	
	//target the entire page, and listen for touch events
	$('html, body').on('touchstart touchmove', function(e){ 
		//prevent native touch activity like scrolling
		e.preventDefault(); 
	});

	img = $('#target-img');
	interactionLayerCanvas = document.createElement('canvas');
	interactionLayerCanvas.setAttribute(
		'class', 'interaction-overlay target-overlay');
	img.parent()[0].appendChild(interactionLayerCanvas);

	img.load(function() {
		imgHeight = img.height();
		imgWidth = img.width();

		interactionLayerCanvas.setAttribute('height', imgHeight);
		interactionLayerCanvas.setAttribute('width', imgWidth);
		attachDrawerListener($(interactionLayerCanvas));
	});	
	$("#nudifier").bind('touch click', function() {
		updatePixelization();
	});
});

var pixelize = function() {
	var macroPixelsToBlur = detectPixels();
	turnPixelsToFlesh(macroPixelsToBlur);
	processData_simple(pixelOverlayCanvas);
};

var palettes = {
	'light_pink' : {
		'colors': [
			"234,201,174",
			"239,214,193",
			"233,161,138",
			"245,228,213",
			"250,241,232"
		],
		'desc' : 'light pink skin/flesh colors'
	}
};

/*
var rgbToHsl = function (r, g, b) {
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h, s, l];
};
*/


var updatePixelization = function() {
	if(pixelOverlayCanvas) {
		// Empty existing pixel mask:
		// Slow but should be good enough.
		pixelOverlayCanvas.width = pixelOverlayCanvas.width;
	} else {
		// Create a new empty pixel mask:
		var canvas = document.createElement('canvas');
		canvas.setAttribute('class', 'pixel-mask-overlay target-overlay');
		canvas.setAttribute('height', imgHeight);
		canvas.setAttribute('width', imgWidth);
		pixelOverlayCanvas = canvas;
		img.parent()[0].appendChild(canvas);
	}
	pixelize();	
};

var detectPixels = function() {
	var ctx = interactionLayerCanvas.getContext('2d');
	var pixelInfo = ctx.getImageData(0, 0, img.width(), img.height());
	console.log(pixelInfo.data.length);
	var macroPixelWidth = Math.floor(pixelInfo.width/cellPixelWidth) ;
	var macroPixelHeight = Math.floor(pixelInfo.height/cellPixelWidth) ;
	
	var colorIndex;
	var acc;
	var ratio;	
	var macroPixels = [];	
	for(var hc=0; hc<macroPixelWidth ; hc++ ) {
		for(var vc=0; vc<macroPixelHeight ; vc++ ) {
			acc = 0;
			for(var l=0; l<cellPixelWidth; l++) {
				for(var c=0; c<cellPixelWidth; c++) {
					colorIndex = 4*(hc*cellPixelWidth + c) + 4*(vc*cellPixelWidth + l)*pixelInfo.width;
					//if(colorIndex > 2000) break;
					if(pixelInfo.data[colorIndex + 3] != 0) {
						acc++;
						//console.log(pixelInfo.data[colorIndex])
					}
				}
			}
			if(acc > 0) {
				//console.log(acc);
				//console.log(cellPixelWidth * cellPixelWidth);
				ratio = acc / (cellPixelWidth * cellPixelWidth);
				//console.log(ratio);
				macroPixels.push({
					"col" : hc,
					"row" : vc,
					"fillRatio" : ratio
				});
			}
		}
	}
	//console.log(macroPixels);
	return macroPixels;
};


var turnPixelsToFlesh = function(macroPixels) {
	var pixel;
	pixelOverlayCanvas.width = pixelOverlayCanvas.width;
	var ctx = pixelOverlayCanvas.getContext('2d');
	//ctx.beginPath();
	for (var i = macroPixels.length - 1; i >= 0; i--) {
		pixel = macroPixels[i];
		var paletteColorIndex = Math.floor(Math.random() * palettes['light_pink'].colors.length);
		var currentColor = palettes['light_pink']['colors'][paletteColorIndex];
		ctx.fillStyle = "rgba(" + currentColor + ", " + pixel.fillRatio + ")";
		console.log("rgba(255, 165, 0, " + pixel.fillRatio + ")");
		ctx.fillRect(
			pixel.col * cellPixelWidth,
			pixel.row * cellPixelWidth,
			cellPixelWidth,
			cellPixelWidth);
	};
};

var processData_simple = function(pixelOverlayCanvas) {

	var ctx = pixelOverlayCanvas.getContext('2d');
	var pixelInfo = ctx.getImageData(0, 0, img.width(), img.height());
	//console.log(pixelInfo.data.length);
	var cellWidthInPixel = Math.floor(pixelInfo.width/cellPixelWidth) ;
	var cellHeightInPixel = Math.floor(pixelInfo.height/cellPixelWidth) ;
	var palette = {};

	var r_avg, g_avg, b_avg, palette_label;
	for(var hc=0; hc<cellWidthInPixel ; hc++ ) {
		for(var vc=0; vc<cellHeightInPixel ; vc++ ) {

			r_avg = 0;
			g_avg = 0;
			b_avg = 0;

			// computing average values:
			for(var l=0; l<cellPixelWidth; l++) {
				for(var c=0; c<cellPixelWidth; c++) {
					r_avg += pixelInfo.data[4*(hc*cellPixelWidth + c) + 4*(vc*cellPixelWidth + l)*pixelInfo.width ];
					g_avg += pixelInfo.data[4*(hc*cellPixelWidth + c) + 4*(vc*cellPixelWidth + l)*pixelInfo.width + 1];
					b_avg += pixelInfo.data[4*(hc*cellPixelWidth + c) + 4*(vc*cellPixelWidth + l)*pixelInfo.width + 2];

				}
			}
			//console.log("r:"+ r_avg + " - g:"+g_avg+" -b:"+b_avg);
			var pixelInCell = cellPixelWidth * cellPixelWidth;
			r_avg = Math.floor(r_avg / pixelInCell);
			g_avg = Math.floor(g_avg / pixelInCell);
			b_avg = Math.floor(b_avg / pixelInCell);

			if(normalizationFactor > 1) {

				r_avg = r_avg - r_avg % normalizationFactor;
				g_avg = g_avg - g_avg % normalizationFactor;
				b_avg = b_avg - b_avg % normalizationFactor;
			}

			palette_label = r_avg + "_" + g_avg + "_" + b_avg ;
			palette[palette_label] = {"r": r_avg, "g": g_avg, "b":b_avg};

			// Setting computed values:
			for(var l=0; l<cellPixelWidth; l++) {
				for(var c=0; c<cellPixelWidth; c++) {
					for(var l=0; l<cellPixelWidth; l++) {
						for(var c=0; c<cellPixelWidth; c++) {
							pixelInfo.data[4*(hc*cellPixelWidth + c) + 4*(vc*cellPixelWidth + l)*pixelInfo.width ]	= r_avg;
							pixelInfo.data[4*(hc*cellPixelWidth + c) + 4*(vc*cellPixelWidth + l)*pixelInfo.width + 1]	= g_avg;
							pixelInfo.data[4*(hc*cellPixelWidth + c) + 4*(vc*cellPixelWidth + l)*pixelInfo.width + 2]	= b_avg;
						}
					}
				}
			}


		}

	}
	ctx.putImageData(pixelInfo, 0, 0);

	return palette;
};


var attachDrawerListener = function(canvas) {
	var canvasElt = canvas[0];
	var ctx = canvasElt.getContext('2d');
	ctx.lineWidth = 8;
	ctx.strokeStyle = "pink";
	ctx.fillStyle = "pink";
	var previousClick = null;

	var onMove_ = function(evt) {
		var position = canvasElt.getBoundingClientRect();
		var clientCoord = {};
		if(evt.clientX) {
			clientCoord.clientX = evt.clientX;
			clientCoord.clientY = evt.clientY;
		}
		else if(evt.originalEvent.touches[0]) {
			clientCoord.clientX = evt.originalEvent.touches[0].clientX;
			clientCoord.clientY = evt.originalEvent.touches[0].clientY;
		}
		var click = {
		  x: clientCoord.clientX - position.left,
		  y: clientCoord.clientY - position.top
		};
		
		//console.log(click);
		//console.log(previousClick);
		ctx.beginPath();
		if(previousClick) {
			ctx.moveTo(previousClick.x,previousClick.y);
			ctx.lineTo(click.x,click.y);
			ctx.stroke();
			ctx.arc(click.x, click.y, 4, 0, 2 * Math.PI, false);
			ctx.fill();
		} else {
			ctx.moveTo(click.x,click.y);
		}
		previousClick = click;
	};

	var start = 'touchstart mousedown';
	var end = 'touchend mouseup';
	var move = 'touchmove mousemove';
	
	canvas.bind(start, function(evt) {
		//console.log('touchstart')
		canvas.bind(move, onMove_);
	});

	canvas.bind(end, function(evt) {
		//console.log('touchend')
		canvas.unbind(move, onMove_);
		previousClick = null;
	});
};