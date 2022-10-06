var _ = window._;

var lastMultiplier;
// loadColB must be called when the following things happen (after setup is finished):
// - Window size is changed
// - Language is changed
// - When time is changed
// - Data is updated
// Before setup, call loadColB once to setup contents of colB
_.loadColB = function() {
	if ( !_.isUSMapVisible && _.finishedSetup ) {
		return;
	}

	colB.style.height = 0.35625 * _.baseWidth + "px";
	
	if ( _.finishedSetup ) {
		usMap.width = 0.475 * _.baseWidth;
		usMap.height = 0.75 * 0.475 * _.baseWidth;
		
		var correspondingCircles = new Array();
		var boxRelativeLefts = new Array();
		var boxRelativeTops = new Array();
		var movedByUsers = new Array();
		// All state data boxes are at at least index 57
		for ( var i = 57; i < colB.children.length; i++ ) {
			var box = colB.children[i];
			var circle = box.circle;
			if ( circle.isPinned ) {
				correspondingCircles.push( circle );
				boxRelativeLefts.push( circle.boxRelativeLeft );
				boxRelativeTops.push( circle.boxRelativeTop );
				movedByUsers.push( box.movedByUser );
				
				// Unpin circle
				circle.onmousedown();
			}
			
			circle.onmouseleave();
			i--;
		}
		for ( var i = 2; i <= 56; i++ ) {
			var circle = colB.children[i];
			circle.stateDataBox = null;
		}
		
		colB.activeBox = null;
		
		var multiplier = 0.00059375 * _.baseWidth;
		for ( var i = 2; i < colB.children.length; i++ ) {
			var circle = colB.children[i];
			
			_.colB.setColorOfCircle( circle );
			if ( _.isUpdatedToday( circle.state ) && _.colB.indicateUpdatedStates() ) {
				circle.innerHTML = "✔";
			}
			else {
				circle.innerHTML = "";
			}
			
			if ( lastMultiplier != multiplier ) {
				var circleLeft = circle.defaultLeft * multiplier + 0.01 * _.baseWidth;
				circle.style.left = circleLeft + "px";
				var circleTop = circle.defaultTop * multiplier;
				circle.style.top = circleTop + "px";
				
				var circleWidth = circle.defaultWidth * multiplier;
				circle.style.width = circleWidth + "px";
				circle.style.height = circleWidth + "px";
				circle.style.lineHeight = circleWidth + "px";
				circle.style.fontSize = 0.8 * circleWidth + "px";
				circle.style.borderWidth = multiplier * 2.5 + "px";
				
				circle.radius = circleWidth / 2;
				circle.centerX = circleLeft + circle.radius;
				circle.centerY = circleTop + circle.radius;
			}
		}
		lastMultiplier = multiplier;
		
		while ( correspondingCircles.length > 0 ) {
			var circle = correspondingCircles.shift();
			if ( !_.isMobile ) {
				circle.onmouseenter();
				circle.onmousedown();
			}
			else {
				circle.ontouchend();
			}
			
			var box = circle.stateDataBox;
			
			var boxRelativeLeft = boxRelativeLefts.shift();
			var boxRelativeTop = boxRelativeTops.shift();
			if ( movedByUsers.shift() ) {
				// If user has moved this box before, respect previous positioning of the box with respect to colB, with exceptions
				var left = boxRelativeLeft * colB.offsetWidth;
				if ( left + box.offsetWidth < colB.offsetWidth ) {
					circle.boxRelativeLeft = boxRelativeLeft;
				}
				else {
					// If loadColB was invoked by changing the language, it is possible that the relative width of box will be extended
					// so that it goes beyond the right edge of colB.
					// In that case, readjust left so that the right edge is pushed back within colB.
					left = colB.offsetWidth - box.offsetWidth;
					circle.boxRelativeLeft = left / colB.offsetWidth;
				}
				box.style.left = left + "px";

				circle.boxRelativeTop = boxRelativeTop;
				circle.stateDataBox.style.top = boxRelativeTop * colB.offsetHeight + "px";
				
				box.movedByUser = true;
			}
		}
		
		for ( var i = 2; i <= 56; i++ ) {
			if ( colB.children[i].matches( ":hover" ) ) {
				colB.children[i].onmouseenter();
				break;
			}
		}
		
		return;
	}
	
	usMap.addEventListener( "contextmenu", event => {
		event.preventDefault();
	});
	
	var states = stateCircleData.split( "\n" );
	var multiplier = 0.00059375 * _.baseWidth;
	lastMultiplier = multiplier;
	for ( var i = 0; i < states.length; i++ ) {
		if ( states[i] == "" ) {
			continue;
		}
		var data = states[i].split( " " );

		var circle = document.createElement( "span" );
		circle.setAttribute( "class", "circle" );
		circle.addEventListener( "contextmenu", event => {
			event.preventDefault();
		});

		circle.defaultLeft = data[0];
		circle.defaultTop = data[1];
		circle.defaultWidth = data[2];
		
		var state = data[3];
		circle.state = state;
		_.colB.setColorOfCircle( circle );
		var circleLeft, circleTop, circleWidth;
		if ( _.colB.indicateUpdatedStates() && _.isUpdatedToday( circle.state ) ) {
			circle.innerHTML = "✔";
		}
		else {
			circle.innerHTML = "";
		}

		var circleLeft = circle.defaultLeft * multiplier + 0.01 * _.baseWidth;
		circle.style.left = circleLeft + "px";
		var circleTop = circle.defaultTop * multiplier;
		circle.style.top = circleTop + "px";
		
		var circleWidth = circle.defaultWidth * multiplier;
		circle.style.width = circleWidth + "px";
		circle.style.height = circleWidth + "px";
		circle.style.lineHeight = circleWidth + "px";
		circle.style.fontSize = 0.8 * circleWidth + "px";
		circle.style.borderWidth = multiplier * 2.5 + "px";
		
		circle.radius = circleWidth / 2;
		circle.centerX = circleLeft + circle.radius;
		circle.centerY = circleTop + circle.radius;
		
		_.colB.setupFunctionalityOfCircle( circle );
		
		colB.appendChild( circle );
	}
		
	colB.activeBox = null;
	colB.onmousemove = function( event ) {
		if ( event.movementX == 0 && event.movementY == 0 ) {
			return;
		}
		
		if ( event.pageX >= colB.offsetLeft && event.pageX < colB.offsetLeft + 0.01 * _.baseWidth ) {
			// If mouse moves to the left padding of colB, treat it as if mouse left colB altogether
			colB.onmouseleave();
		}
		
		if ( colB.activeBox != null ) {
			// self.activeBox can only be set if mouse is currently pressed over a box
			var box = colB.activeBox;
			var circle = box.circle;
			event.preventDefault();
			// If user starts to drag the box, then do not redirect when user lets go of the box
			box.redirectToCharts = false;
			// Mark box as having been moved by user
			box.movedByUser = true;

			var newPageXOfBox = event.pageX - box.deltaX;
			var newLeft = newPageXOfBox - colB.offsetLeft;
			if ( newLeft < 0.01 * _.baseWidth ) {
				newLeft = 0.01 * _.baseWidth;
				newPageXOfBox = newLeft + colB.offsetLeft;
				box.deltaX = event.pageX - newPageXOfBox;
				if ( box.deltaX < 2 ) {
					box.deltaX = 2;
				}
			}
			else if ( newLeft + box.width > colB.offsetWidth ) {
				newLeft = colB.offsetWidth - box.width;
				newPageXOfBox = newLeft + colB.offsetLeft;
				box.deltaX = event.pageX - newPageXOfBox;
				if ( box.deltaX > box.width - 2 ) {
					box.deltaX = box.width - 2;
				}
			}
			var newPageYOfBox = event.pageY - box.deltaY;
			var newTop = newPageYOfBox - colB.offsetTop;
			if ( newTop < 0 ) {
				newTop = 0;
				newPageYOfBox = colB.offsetTop;
				box.deltaY = event.pageY - newPageYOfBox;
				if ( box.deltaY < 2 ) {
					box.deltaY = 2;
				}
			}
			else if ( newTop > 0.78 * colB.offsetHeight ) {
				newTop = 0.78 * colB.offsetHeight;
				newPageYOfBox = newTop + colB.offsetTop;
				box.deltaY = event.pageY - newPageYOfBox;
				if ( box.deltaY > box.height - 2 ) {
					box.deltaY = box.height - 2;
				}
			}
			
			box.style.left = newLeft + "px";
			box.style.top = newTop + "px";
			
			circle.boxRelativeLeft = parseFloat( box.style.left ) / colB.offsetWidth;
			circle.boxRelativeTop = parseFloat( box.style.top ) / colB.offsetHeight;
		}
	}
	
	colB.onmouseleave = function() {
		var self = this;
		if ( self.activeBox ) {
			// Deactivate any active box
			var box = self.activeBox;
			box.redirectToCharts = false;
			box.onmouseup();
			colB.activeBox = null;
		}
	}
}

_.colB.indicateUpdatedStates = function() {
	return indicateUpdatedStatesCheckbox.checked;
}

var zeroCases = [0, 240, 0];    // 0 new cases / 100000 people (green)
var mild = [240, 240, 0];       // 25 new cases / 100000 people (yellow)
var moderate = [240, 120, 0];   // 75 new cases / 100000 people (orange-red)
var severe = [120, 0, 20];      // 150 new cases / 100000 people (dark red)
var extreme = [60, 0, 40];      // 300+ new cases / 100000 people (dark purple)
var ranges = [[0, 25], [25, 75], [75, 150], [150, 300]];
var correspondingColors = [[zeroCases, mild], [mild, moderate], [moderate, severe], [severe, extreme]];
_.colB.setColorOfCircle = function( circle ) {
	var averageCasesPer100000 = _.sevenDayAverageInNewCasesPer100000People( circle.state );

	var color1, color2;
	var range;
	for ( var i = 0; i < 4; i++ ) {
		var range = ranges[i];
		if ( averageCasesPer100000 >= range[0] && averageCasesPer100000 < range[1] ) {
			color1 = correspondingColors[i][0];
			color2 = correspondingColors[i][1];
			range = ranges[i];
			break;
		}
	}
	if ( !color1 ) {
		if ( averageCasesPer100000 > 0 ) {
			circle.style.backgroundColor = "rgb(60,0,40)";
			circle.style.color = "white";
		}
		else {
			circle.style.backgroundColor = "rgb(0,240,0)";
			circle.style.color = "";
		}
		return;
	}
	
	// weight1 * range[0] + weight2 * range[1] = averageCasesPer100000
	// weight1 + weight2 = 1
	var weight2 = ( averageCasesPer100000 - range[0] ) / ( range[1] - range[0] );
	var weight1 = 1 - weight2;
	
	var red = weight1 * color1[0] + weight2 * color2[0];
	var green = weight1 * color1[1] + weight2 * color2[1];
	var blue = weight1 * color1[2] + weight2 * color2[2];
	
	circle.style.backgroundColor = "rgb(" + parseInt( red ) + "," + parseInt( green ) + "," + parseInt( blue ) + ")";
	var brightness = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
	if ( brightness < 128 ) {
		circle.style.color = "white";
	}
	else {
		circle.style.color = "";
	}
}

_.colB.toggleCircleBorder = function( circle ) {
	var circleLeft, circleTop, circleWidth;
	var multiplier = 0.00059375 * _.baseWidth;
	if ( circle.style.borderStyle == "" ) {
		circle.style.borderStyle = "solid";
		var borderWidth = parseFloat( circle.style.borderWidth );
		circleLeft = circle.defaultLeft * multiplier + 0.01 * _.baseWidth - borderWidth;
		circleTop = circle.defaultTop * multiplier - borderWidth;
		circleWidth = circle.defaultWidth * multiplier + 2 * borderWidth;
	}
	else {
		circle.style.borderStyle = "";
		circleLeft = circle.defaultLeft * multiplier + 0.01 * _.baseWidth;
		circleTop = circle.defaultTop * multiplier;
		circleWidth = circle.defaultWidth * multiplier;
	}
	
	circle.style.left = circleLeft + "px";
	circle.style.top = circleTop + "px";
	circle.style.width = circleWidth + "px";
	circle.style.height = circleWidth + "px";
	circle.radius = circleWidth / 2;
}

_.colB.setupFunctionalityOfCircle = function( circle ) {
	if ( !_.isMobile ) {
		circle.isActive = false;
		circle.onmouseenter = function() {
			var self = this;
			if ( self.isPinned ) {
				return;
			}
			
			var box = self.stateDataBox;
			if ( !self.stateDataBox ) {
				// Create box, append it, and adjust its width
				self.stateDataBox = _.colB.getStateDataBox( self );
				box = self.stateDataBox;
				colB.appendChild( box );
				box.width = box.offsetWidth;
			}
			else {
				// Append already existing box
				colB.appendChild( box );
			}
			
			// Reset box
			self.stateDataBox.movedByUser = false;
			_.colB.defaultPositioningOfStateDataBox( self, box );
		};
		circle.onmouseleave = function() {
			var self = this;
			// Possible that when calling loadColB, mouse is already in self without self.onmouseenter being called, so
			// self.stateDataBox was never created
			if ( !self.isPinned && self.stateDataBox ) {
				colB.removeChild( self.stateDataBox );
			}
		};
		circle.onmousedown = function( event ) {
			var self = this;
			if ( event && event.button == 2 ) {
				_.pinState( self.state );
				return;
			}
			
			if ( !self.stateDataBox ) {
				self.onmouseenter();
			}
			self.isPinned = !self.isPinned;
			_.colB.toggleCircleBorder( self );
		};
	}
	// Controls are different for mobile mode
	else {
		circle.ontouchend = function() {
			var self = this;
			self.isPinned = !self.isPinned;
			
			// If  pinned, add state data box
			if ( self.isPinned ) {
				var box = self.stateDataBox;
				if ( self.stateDataBox == undefined ) {
					// Create box, append it, and adjust its width
					self.stateDataBox = _.colB.getStateDataBox( self );
					box = self.stateDataBox;
					colB.appendChild( box );
					box.width = box.offsetWidth;
				}
				else {
					// Append already existing box
					colB.appendChild( box );
				}
				
				// Reset location of box
				defaultPositioningOfStateDataBox( self, box );
			}
			
			toggleCircleBorder( self );
			
			// If not pinned at end, then remove state data box
			if ( !self.isPinned ) {
				colB.removeChild( self.stateDataBox );
			}
		};
	}
}

_.colB.defaultPositioningOfStateDataBox = function( circle, box ) {
	// distance: how far box should be away from the circle horizontally or vertically beyond the radius of the circle
	var distance = circle.radius + usMap.height / 100;
	var width = box.offsetWidth;
	var height = box.offsetHeight;
	var centerX = circle.centerX;
	var centerY = circle.centerY;
	
	if ( centerX + distance + width < colB.offsetWidth ) {
		box.style.left = centerX + distance + "px";
		circle.boxRelativeLeft = ( centerX + distance ) / colB.offsetWidth;
	}
	else {
		// Right edge of box should be at xCoordinate centerX - distance
		box.style.left = centerX - distance - width + "px";
		circle.boxRelativeLeft = ( centerX - width - distance ) / colB.offsetWidth;
	}
	if ( centerY + distance + height < colB.offsetHeight ) {
		box.style.top = centerY + distance + "px";
		circle.boxRelativeTop = ( centerY + distance ) / colB.offsetHeight;
	}
	else {
		box.style.top = centerY - distance - height + "px";
		circle.boxRelativeTop = ( centerY - height - distance ) / colB.offsetHeight;
	}
}

_.colB.getStateDataBox = function( circle ) {
	var box = document.createElement( "div" );
	box.setAttribute( "class", "state-data-box" );
	box.state = circle.state;
	box.circle = circle;
	
	var multiplier = 0.00059375 * _.baseWidth;
	box.height = 0.22 * usMap.height;
	
	var entry = _.getEntryFromToday( circle.state );
	var yesterdayEntry = _.getEntryFromYesterday( circle.state );
	var delta1 = entry[1] - yesterdayEntry[1];
	var delta2 = entry[2] - yesterdayEntry[2];
	var delta3 = entry[3] - yesterdayEntry[3];
	var newCasesAverage = _.sevenDayAverageInNewCases( circle.state );
	var newCasesPer100000PeopleAverage = _.sevenDayAverageInNewCasesPer100000People( circle.state );
	
	var strings;
	var language = _.userSettings.language;
	switch ( _.languageIndex() ) {
		case 0: {
			strings = [ 
				_.stateFromAbbreviation( circle.state ), 
				
				" - Total cases: " + entry[1].toLocaleString( language ) + " (+" + delta1.toLocaleString( language ) + ")",
				
				"&emsp;&emsp; - Per 100,000 people: " + entry[2].toLocaleString( language ) + " (+" 
					+ delta2.toLocaleString( language ) + ")",	// 8 spaces before everything else
					
				"- 7 day average of new cases: " + newCasesAverage.toLocaleString( language ),
				
				"&emsp;&emsp; - Per 100,000 people: " + newCasesPer100000PeopleAverage.toLocaleString( language ),
				
				" - Total deaths: " + entry[3].toLocaleString( language ) + " (+" + delta3.toLocaleString( language ) + ")", 
			];
			break;
		}
		case 1: {
			strings = [ 
				_.translateState( _.stateFromAbbreviation( circle.state ) ), 
				
				" - Casos totales: " + entry[1].toLocaleString( language ) + " (+" + delta1.toLocaleString( language ) + ")",
				
				"&emsp;&emsp; - Por 100,000 personas: " + entry[2].toLocaleString( language ) + " (+" 
					+ delta2.toLocaleString( language ) + ")",	// 8 spaces before everything else
				
				" - Promedio de 7 días de casos nuevos: " + newCasesAverage.toLocaleString( language ),
				
				"&emsp;&emsp; - Por 100.000 personas: " + newCasesPer100000PeopleAverage.toLocaleString( language ),
				
				" - Muertes totales: " + entry[3].toLocaleString( language ) + " (+" + delta3.toLocaleString( language ) + ")",
			];
			break;
		}
		case 2: {
			strings = [ 
				_.translateState( _.stateFromAbbreviation( circle.state ) ), 
				
				" - 累计确诊：" + entry[1].toLocaleString( language ) + " (+" + delta1.toLocaleString( language ) + ")",
				
				"&emsp;&emsp; - 每10万人中：" + entry[2].toLocaleString( language ) + " (+" 
					+ delta2.toLocaleString( language ) + ")",	// 8 spaces before everything else
				
				" - 新确诊的7天平均：" + newCasesAverage.toLocaleString( language ),
				
				"&emsp;&emsp; - 每10万人中：" + newCasesPer100000PeopleAverage.toLocaleString( language ),
				
				" - 累计死亡: " + entry[3].toLocaleString( language ) + " (+" + delta3.toLocaleString( language ) + ")", 
			];
			break;
		}
		case 3: {
			strings = [
				_.translateState( _.stateFromAbbreviation( circle.state ) ) + ":",
				" - Nombre total des cas: " + entry[1].toLocaleString( language ) + " (+" 
					+ delta1.toLocaleString( language ) + ")",
					
				"&emsp;&emsp; - Pour 100 000 personnes: " + entry[2].toLocaleString( language ) 
					+ " (+" + delta2.toLocaleString( language ) + ")",
				
				" - Moyenne sur 7 jours de nouveaux cas: " + newCasesAverage.toLocaleString( language ),
				
				"&emsp;&emsp; - Pour 100 000 personnes: " + newCasesPer100000PeopleAverage.toLocaleString( language ),
				
				" - Nombre total des décès: " + entry[3].toLocaleString( language ) + " (+" 
					+ delta3.toLocaleString( language ) + ")",
			];
			break;
		}
		case 4: {
			strings = [
				_.translateState( _.stateFromAbbreviation( circle.state ) ) + "：",
				
				" - 累積診断：" + entry[1].toLocaleString( language ) + " (+" + delta1.toLocaleString( language ) 
					+ ")",
					
				"&emsp;&emsp; - 10万人あたりの：" + entry[2].toLocaleString( language ) + " (+" 
					+ delta2.toLocaleString( language ) + ")",
				
				" - 新たに診断の7日間の平均：" + newCasesAverage.toLocaleString( language ),
				
				"&emsp;&emsp; - 10万人あたりの：" + newCasesPer100000PeopleAverage.toLocaleString( language ),
				
				" - 累積死亡：" + entry[3].toLocaleString( language ) + " (+" 
					+ delta3.toLocaleString( language ) + ")",
			];
			break;
		}
	}

	for ( var i = 0; i < strings.length; i++ ) {
		strings[i] = strings[i].replaceAll( "+-", "-" );
		var temp = document.createElement( "div" );
		temp.innerHTML = strings[i];
		if ( i == 0 ) {
			temp.style.fontSize = 18 * multiplier + "px";
			temp.style.fontWeight = "bold";
		}
		else {
			temp.style.fontSize = 12 * multiplier + "px";
		}
		temp.style.whiteSpace = "nowrap";
		
		box.appendChild( temp );
	}
	
	box.style.borderWidth = 3 * multiplier + "px";
	if ( _.userSettings.isNightMode ) {
		box.style.borderColor = "lightgray";
		box.style.backgroundColor = "rgb(0,0,75)";
		box.style.color = "lightgray";
	}
	
	box.movedByUser = false;
	if ( !_.isMobile ) {
		// When mouse is held down, deltaX and deltaY indicate coordinate differences from the mouse to the top left corner
		// of the box
		box.deltaX = null;	
		box.deltaY = null;
		box.addEventListener( "contextmenu", event => {
			event.preventDefault();
		});
		box.onmousedown = function( event ) {
			var self = this;
			if ( event.button != 0 ) {
				if ( event.button == 2 ) {
					_.pinState( self.state );       
				}
				
				return;
			}
			
			// Box is active when user clicks down on it
			self.active = true;
			colB.activeBox = self;
			
			// Determine deltaX and deltaY
			if ( event.target == self ) {
				self.deltaX = event.offsetX;
				self.deltaY = event.offsetY;
			}
			else {
				for ( var i = 0; i < self.children.length; i++ ) {
					if ( event.target == self.children[i] ) {
						self.deltaX = event.offsetX + self.children[i].offsetLeft;
						self.deltaY = event.offsetY + self.children[i].offsetTop;
					}
				}
			}
			// Keep deltaX and deltaY well within bounds of the box to avoid mouse going out of bounds
			var width = self.width;
			if ( self.deltaX > width - 2 ) {
				self.deltaX = width - 2;
			}
			else if ( self.deltaX < 2 ) {
				self.deltaX = 2;
			}
			var height = parseFloat( self.style.height );
			if ( self.deltaY > height - 2 ) {
				self.deltaY = height - 2;
			}
			else if ( self.deltaY < 2 ) {
				self.deltaY = 2;
			}
			
			self.redirectToCharts = true;
			// Do not redirect to graphs if self is covered by another box above it
			for ( var i = 0; i < colB.children.length; i++ ) {
				if ( colB.children[i] != self ) {
					continue;
				}
				
				// Check any boxes above it
				for ( var j = i + 1; j < colB.children.length; j++ ) {
					var box = colB.children[j];
					if ( box.className != "state-data-box" ) {
						continue;
					}
					
					var boxLeft = parseFloat( box.style.left );
					var selfLeft = parseFloat( self.style.left );
					// horizontalOverlap means that both self and box both occupy some xCoordinate
					var horizontalOverlap = false;
					if ( boxLeft <= selfLeft ) {
						// box is to the left of self
						var boxWidth = box.width;
						// If right edge of box (boxLeft + boxWidth) is more to the right than selfLeft
						if ( boxLeft + boxWidth > selfLeft ) {
							horizontalOverlap = true;
						}
					}
					else {
						var selfWidth = self.width;
						// If right edge of self (selfLeft + selfWidth) is more to the right than boxLeft
						if ( selfLeft + selfWidth > boxLeft ) {
							horizontalOverlap = true;
						}
					}
					
					var boxTop = parseFloat( box.style.top );
					var selfTop = parseFloat( self.style.top );
					// verticalOverlap means that both self and box both occupy some yCoordinate
					var verticalOverlap = false;
					// Vertically, box and self must be at least self.offsetHeight apart for them
					// to not overlap vertically
					if ( Math.abs( boxTop - selfTop ) < self.offsetHeight ) {
						verticalOverlap = true;
					}
					
					// If both horizontalOverlap and verticalOverlap are true, then self and box both occupy
					// an xCoordinate and yCoordinate (hence a point), and overlap. Therefore, box must be
					// covering some part of self
					if ( horizontalOverlap && verticalOverlap ) {
						self.redirectToCharts = false;
						break;
					}
				}
				
				// Move box to top
				colB.removeChild( self );
				colB.appendChild( self );
				break;
			}
		}
		box.onmouseup = function( event ) {
			if ( event && event.button != 0 ) {
				return;
			}
			
			// Box is no longer active when user releases mouse on it
			var self = this;
			self.active = false;
			self.deltaX = null;
			self.deltaY = null;
			
			colB.activeBox = null;
			if ( self.redirectToCharts ) {
				setTimeout( function() {
					var state = self.state;
					if ( select2.value != state ) {
						select2.value = state;
						select2.onchange();
					}
					
					_.scrollToCharts();
				}, 1 );
			}
		}
	}
	else {
		// isMobile is false
		box.ontouchend = function() {
			var self = this;
			var state = self.state;
			if ( select2.value != state ) {
				select2.value = state;
				select2Change();
			}
			
			setTimeout( _.scrollToCharts, 1 );
		};
	}
	
	return box;
}

_.toggleIndicateUpdatedStates = function() {
	for ( var i = 2; i <= 56; i++ ) {
		var circle = colB.children[i];
		if ( _.colB.indicateUpdatedStates() && _.isUpdatedToday( circle.state ) ) {
			circle.innerHTML = "✔";
		}
		else {
			circle.innerHTML = "";
		}
	}
	
	_.userSettings.indicateUpdatedStates = _.colB.indicateUpdatedStates();
	_.updateCookies();
}