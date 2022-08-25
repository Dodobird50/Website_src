var _ = window._;

window.onscroll = function() {
	if ( !_.isMobile ) {
		if ( _.isTimeTravelActive() ) {
			var left = parseFloat( base.style.paddingLeft ) - window.pageXOffset;
			timeTravelDiv.style.left = left + "px";
			
			_.recolorTimeTravelDivBorder();
		}
	}
};

_.updateTimeTravelMax = function( newAllData ) {
	// If time travel is inactive (timeTravelRange is set to today), then continue to make time travel inactive
	// by setting dataFromTodayIndex to newAllData.length - 1, which may be larger than allData.length - 1
	var wasTimeTravelActive = _.userSettings.dataFromTodayIndex >= 0;
	// Extend max of timeTravelRange (length of allNewData may be longer)
	timeTravelRange.max = newAllData.length - 1 + "";
	
	if ( !wasTimeTravelActive ) {
		// Scroll timeTravelRange to the end
		timeTravelRange.value = newAllData.length - 1 + "";
	}
}

_.setTimeTravelRangeLabelInnerHTML = function( index ) {
	if ( index == undefined ) {
		index = _.userSettings.dataFromTodayIndex;
	}
	if ( index == -1 ) {
		switch ( _.languageIndex() ) {
			case 0: {
				timeTravelRangeLabel.innerHTML = "Time machine is currently inactive";
				break;
			}
			case 1: {
				timeTravelRangeLabel.innerHTML = "La máquina del tiempo actualmente está inactiva";
				break;
			}
			case 2: {
				timeTravelRangeLabel.innerHTML = "时间机器目前处于非活动状态";
				break;
			}
			case 3: {
				timeTravelRangeLabel.innerHTML = "La machine à remonter le temps est actuellement inactive";
				break;
			}
			case 4: {
				timeTravelRangeLabel.innerHTML = "タイムマシンは現在非アクティブです";
				break;
			}
		}
	}
	else {
		var date = _.dateAndTimeFromCalendar( _.allData[index].d );
		switch ( _.languageIndex() ) {
			case 0: {
				timeTravelRangeLabel.innerHTML = "Time machine: current date is " + date;
				break;
			}
			case 1: {
				timeTravelRangeLabel.innerHTML = "La máquina del tiempo: la fecha actual es " + date;
				break;
			}
			case 2: {
				timeTravelRangeLabel.innerHTML = "时间机器：现在的日期是" + date;
				break;
			}
			case 3: {
				timeTravelRangeLabel.innerHTML = "La machine à remonter le temps: la date actuelle est " + date;
				break;
			}
			case 4: {
				timeTravelRangeLabel.innerHTML = "タイムマシン：現在の日付は" + date + "です";
				break;
			}
		}
	}
}

// recolorTimeTravelDivBorder() will have to be recolored under the following conditions:
// - timeTravelDiv.style.position is changed
// - window is scrolled while time travel is active
// - Night mode is toggled
_.recolorTimeTravelDivBorder = function() {
	if ( _.isTimeTravelActive() ) {
		if ( html.scrollTop + window.innerHeight + 1 < base.offsetHeight ) {
			// Show border
			if ( !_.userSettings.isNightMode ) {
				timeTravelDiv.style.borderColor = "black";
			}
			else {
				timeTravelDiv.style.borderColor = "lightgray";
			}
		}
		else {
			// If window is extremely close to being scrolled to the bottom, hide border
			if ( !_.userSettings.isNightMode ) {
				timeTravelDiv.style.borderColor = "";
			}
			else {
				timeTravelDiv.style.borderColor = "black";
			}
		}
	}
	else {
		if ( !_.userSettings.isNightMode ) {
			timeTravelDiv.style.borderColor = "";
		}
		else {
			timeTravelDiv.style.borderColor = "black";
		}
	}
}

_.initTimeTravel = function() {
	_.setTimeTravelRangeLabelInnerHTML();
	timeTravelRange.min = "30";
	timeTravelRange.max = _.allData.length - 1 + "";
	if ( _.isTimeTravelActive() ) {
		if ( !_.isMobile ) {
			timeTravelDiv.style.position = "fixed";
			timeTravelDiv.style.width = _.bodyWidth - 0.03 * _.baseWidth + "px";
			if ( !_.userSettings.isNightMode ) {
				timeTravelDiv.style.borderColor = "black";
			}
		}
		timeTravelRange.value = _.userSettings.dataFromTodayIndex + "";
	}
	else {
		timeTravelRange.value = _.allData.length - 1 + "";
	}

	var changeDataFromTodayIndex = function() {
		var value = parseInt( timeTravelRange.value );
		if ( value == _.allData.length - 1 ) {
			value = -1;
		}
		if ( !_.finishedSetup || value == _.userSettings.dataFromTodayIndex ) {
			changeDataFromTodayIndex = null;
			return;
		}
		
		_.userSettings.dataFromTodayIndex = value;
		if ( _.isTimeTravelActive() ) {
			_.dataFromToday = _.allData[_.userSettings.dataFromTodayIndex];
			_.dataFromYesterday = _.allData[_.userSettings.dataFromTodayIndex - 1];
		}
		else {
			_.dataFromToday = _.allData[_.allData.length - 1];
			_.dataFromYesterday = _.allData[_.allData.length - 2];
		}
		_.entriesFromToday = _.dataFromToday.e;
		_.calendarFromToday = _.dataFromToday.d;
		_.entriesFromYesterday = _.dataFromYesterday.e;
		_.calendarFromYesterday = _.dataFromYesterday.d;
		
		_.sortEntries();
		_.setLastUpdatedOnText();
		_.refreshDataDisplay();
		_.loadColB();
		for ( var i = 0; i < _.charts.length; i++ ) {
			var state = _.charts[i].state;
			var checked = i % 2 == 1 && _.charts[i].checkbox.checked;
			_.makeChart( _.charts[i], state, true );
			if ( checked ) {
				_.charts[i].checkbox.checked = true;
				_.charts[i].checkbox.onclick();
			}
		}
		
		if ( !_.isMobile ) {
			if ( !_.isTimeTravelActive() ) {
				if ( !timeTravelRange.isActive ) {
					timeTravelDiv.style.position = "";
					// Reset timeTravelDiv to span entire base
					timeTravelDiv.style.width = "";
					timeTravelDiv.style.left = "";
					_.recolorTimeTravelDivBorder();
				}
			}
			else {
				timeTravelDiv.style.position = "fixed";
				// Make timeTravelDiv aligned with base even if window is scrolled right
				var left = parseFloat( base.style.paddingLeft ) - window.pageXOffset;
				timeTravelDiv.style.left = left + "px";
				// Force timeTravelDiv to span the entire base over just the entire body
				timeTravelDiv.style.width = 0.97 * _.baseWidth + "px";
				_.recolorTimeTravelDivBorder();
			}
		}

		_.changeDataFromTodayIndexTimeout = null;
		_.updateCookies();
	}

	_.changeDataFromTodayIndexTimeout = null;
	timeTravelRange.oninput = function() {
		var value = parseInt( timeTravelRange.value );
		if ( value == _.allData.length - 1 ) {
			value = -1;
		}

		_.setTimeTravelRangeLabelInnerHTML( value );
		
		// Only enable changeDataFromTodayIndex to execute once every 0.25 seconds
		if ( _.changeDataFromTodayIndexTimeout == null ) {
			_.changeDataFromTodayIndexTimeout = setTimeout( changeDataFromTodayIndex, 250 );
		}
	}
	if ( !_.isMobile ) {
		timeTravelRange.isActive = false;
		timeTravelRange.onmousedown = function() {
			timeTravelRange.isActive = true;
		};
		timeTravelRange.onmouseup = function() {
			timeTravelRange.isActive = false;
			// Upon disengaging with timeTravelRange, restore it to bottom of the window
			if ( !_.isTimeTravelActive() ) {
				timeTravelDiv.style.position = "";
				timeTravelDiv.style.left = "";
				timeTravelDiv.style.width = "";
				_.recolorTimeTravelDivBorder();
			}
		};
	}
}

_.isTimeTravelActive = function() {
	return _.userSettings.dataFromTodayIndex >= 0;
}