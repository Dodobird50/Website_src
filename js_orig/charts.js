var _ = window._

_.resetCharts = function() {
	if ( select2.value != "USA" ) { 
		select2.value = "USA";
		for ( var i = 0; i < _.charts.length; i++ ) {
			if ( _.charts[i].dateRange != 0 ) {
				_.charts[i].dateRange = 0;
			}
			_.makeChart( _.charts[i], "USA", false );
		}
	}
	else {
		for ( var i = 0; i < _.charts.length; i++ ) {
			if ( _.charts[i].dateRange != 0 ) {
				_.charts[i].dateRange = 0;
			}
			_.makeChart( _.charts[i], "USA", true );
		}
	}
};

_.checkboxLabelWidth = null;
// makeChart must be called under the following conditions (after setup):
// - Data is updated
// - Time is changed
// - Language is changed
// - Window size is changed
// - User changes state for charts
// - User clicks resetChartsButton
_.makeChart = function( chart, state, dataOrDateRangeChange ) {
	if ( !state ) {
		throw new Error( "state must be defined" );
	}
	
	if ( !chart.field ) {
		switch ( chart.id ) {
			case "totalCasesChart": {
				chart.field = 0;
				break;
			}
			case "newCasesChart": {
				chart.field = 1;
				break;
			}
			case "totalCasesPer100000PeopleChart": {
				chart.field = 2;
				break;
			}
			case "newCasesPer100000PeopleChart": {
				chart.field = 3;
				break;
			}
			case "totalDeathsChart": {
				chart.field = 4;
				break;
			}
			case "newDeathsChart": {
				chart.field = 5;
				break;
			}
			default: {
				// If chart.field is still undefined
				throw new Error( "provided div must be a chart" );
			}
		}
	}
	
	var style = chart.style;
	
	chart.width = 0.97 * _.baseWidth;
	chart.height = chart.width * 0.375;	// height is 3/8 of width
	style.height = chart.height + "px";
	
	if ( !chart.toXCoordinate ) {
		_.chart.setupMappingFunctions( chart );
	}
	
	// Sync borderWidth with that of rowA1
	if ( _.isUSMapVisible ) {
		style.borderWidth = 0.01 * _.baseWidth / 12 + "px";
	}
	else {
		style.borderWidth = 0.01 * _.baseWidth / 6 + "px";
	}

	if ( chart.state != state || dataOrDateRangeChange ) {
		_.chart.setupData( chart, state );
	}
	_.chart.draw( chart );
	
	chart.xOfMouse = -1;
	if ( !chart.isOutOfBounds ) {
		_.chart.applyMiscellaneousFunctions( chart );
	}
	
	if ( !_.isMobile ) {
		chart.mouseDownStatus = -1;
		chart.currentlyHighlightedBar = null;
		_.chart.setupChartGuideLines( chart );

		if ( !chart.onmousemove ) {
			_.chart.applyOnMouseDownHandler( chart );
			_.chart.applyOnMouseUpHandler( chart );
			_.chart.applyOnMouseMoveHandler( chart );
			_.chart.applyOnMouseLeaveHandler( chart );
		}
	}
	else {
		chart.lastXCoordinate = null;
		chart.lastYCoordinate = null;
		
		if ( !chart.ontouchmove ) {
			_.chart.applyOnTouchStartHandler( chart );
			_.chart.applyOnTouchMoveHandler( chart );
			_.chart.applyOnTouchEndHandler( chart );
		}
	}
	
	chart.isNightMode = false;
	if ( !chart.toggleNightMode ) {
		_.chart.setupToggleNightMode( chart );
	}
	if ( _.userSettings.isNightMode ) {
		chart.toggleNightMode();
	}
}

_.chart.setupMappingFunctions = function( chart ) {
	chart.toXCoordinate = function( x ) {
		var self = this;
		var w = self.width;
		return 0.9 * w / ( self.xAxisRange - 1 ) * ( x - 1 ) + 0.07 * w;
	};
	// Inverse function of toXCoordinate
	chart.toX = function( xCoordinate ) {
		var self = this;
		var w = self.width;
		if ( xCoordinate >= 0.07 * w && xCoordinate <= 0.97 * w ) {
			return ( self.xAxisRange - 1 ) / ( 0.9 * w ) * ( xCoordinate - 0.07 * w ) + 1;
		}
		else if ( xCoordinate >= 0.06 * w && xCoordinate <= 0.07 * w ) {
			return 1;
		}
		else if ( xCoordinate >= 0.97 * w && xCoordinate <= 0.98 * w ) {
			return self.xAxisRange;
		}
		else {
			return -1;
		}
	};
	chart.toYCoordinate = function( y ) {
		var self = this;
		var h = self.height;
		var yCoordinate = -0.8 * h / self.yAxisRange * y + 0.85 * h;
		if ( yCoordinate >= 1 ) {
			return yCoordinate;
		}
		else {
			return 1;
		}
	};
	chart.toY = function( yCoordinate ) {
		var self = this;
		var h = self.height;
		return -self.yAxisRange / 0.8 / h * ( yCoordinate - 0.85 * h );
	};
}

_.chart.setupNumbers = function( chart, state ) {
	chart.dateOffset = 0;
	chart.xAxisRange = _.isTimeTravelActive() ? _.userSettings.dataFromTodayIndex : _.allData.length - 1;
	if ( chart.field % 2 == 0 ) {
		chart.xAxisRange++;
	}
	chart.months = new Array( chart.xAxisRange );
	chart.days = new Array( chart.xAxisRange );
	chart.years = new Array( chart.xAxisRange );
	chart.numbers = new Array( chart.xAxisRange );	// Number of cases, cases per 100,000 people, or deaths
	chart.sevenDayMovingAverages;
	if ( chart.field % 2 == 1 ) {
		chart.sevenDayMovingAverages = new Array( chart.xAxisRange );
	}
	
	dataIndex = ( [1, 1, 2, 2, 3, 3] )[chart.field];
	if ( chart.state == "USA" ) {
		dataIndex--;
	} 
	if ( chart.field % 2 == 0 ) {
		for ( var i = 0; i < chart.xAxisRange; i++ ) {
			var data = _.allData[i];
			chart.months[i] = data.d[1];
			chart.days[i] = data.d[2];
			chart.years[i] = data.d[0];
			if ( chart.state == "USA" ) {
				chart.numbers[i] = data.n[dataIndex];
			}
			else {
				var entry = data.getEntry( chart.state );
				chart.numbers[i] = entry[dataIndex];
			}
		}
	}
	else {
		for ( var i = 1; i <= chart.xAxisRange; i++ ) {
			var data = _.allData[i];
			var yesterdayData = _.allData[i - 1];
			chart.months[i - 1] = data.d[1];
			chart.days[i - 1] = data.d[2];
			chart.years[i - 1] = data.d[0];
			if ( chart.state == "USA" ) {
				chart.numbers[i - 1] = data.n[dataIndex] - yesterdayData.n[dataIndex];
			}
			else {
				var entry = data.getEntry( chart.state );
				var yesterdayEntry = yesterdayData.getEntry( chart.state );
				chart.numbers[i - 1] = entry[dataIndex] - yesterdayEntry[dataIndex];
			}
		} 
	}
	
	if ( chart.field % 2 == 1 ) {
		for ( var i = 0; i < chart.xAxisRange; i++ ) {
			if ( i >= 6 ) {
				// Index i for sevenDayMovingAverages is 1 behind index i in _.allData
				if ( chart.field == 1 ) {
					chart.sevenDayMovingAverages[i] = _.sevenDayAverageInNewCases( chart.state, i + 1 );
				}
				else if ( chart.field == 3 ) {
					chart.sevenDayMovingAverages[i] = _.sevenDayAverageInNewCasesPer100000People( chart.state, i + 1 );
				}
				else if ( chart.field == 5 ) {
					chart.sevenDayMovingAverages[i] = _.sevenDayAverageInNewDeaths( chart.state, i + 1 );
				}
			}
			else {
				chart.sevenDayMovingAverages[i] = 0;
			}
		}
		
		if ( chart.dateRange == 1 ) {
			while ( chart.xAxisRange > 120 ) {
				chart.numbers.shift();
				chart.years.shift();
				chart.months.shift();
				chart.days.shift();
				
				chart.sevenDayMovingAverages.shift();
				chart.dateOffset++;
				chart.xAxisRange--;
			}
		}
		else {
			while ( chart.xAxisRange > 730 ) {
				chart.numbers.shift();
				chart.years.shift();
				chart.months.shift();
				chart.days.shift();
				
				chart.sevenDayMovingAverages.shift();
				chart.dateOffset++;
				chart.xAxisRange--;
			}
		}
	}
}
_.chart.setupYAxisRange = function( chart ) {
	var maxNumber;
	if ( chart.field % 2 == 1 ) {
		maxNumber = Math.max( ...chart.sevenDayMovingAverages );
	}
	else {
		maxNumber = Math.max( ...chart.numbers );
	}
	
	// Determine chart.yAxisRange
	if ( maxNumber > 0 ) {
		// Get maxNumber in scientific notation (multiplier * 10^exponent)
		maxNumberExponent = parseInt( Math.log10( maxNumber ) );
		maxNumberMultiplier = maxNumber / Math.pow( 10, maxNumberExponent );
		
		// Requirements:
		// - exponent >= -1 for cases per 100,000 people chart, and exponent >= 0 for all other charts
		// - 1.4 <= multiplier < 14
		// In edge case where maxNumber == 0.1 for cases per 100,000 people chart or maxNumber == 1 for all other
		// charts, exponent requirement overrides multiplier requirement
		if ( maxNumberMultiplier < 1.4 ) {
			if ( chart.field == 2 || chart.field == 3 ) {
				if ( maxNumberExponent > -1 ) {
					maxNumberMultiplier *= 10;
					maxNumberExponent--;
				}
			}
			else if ( maxNumberExponent > 0 ) {
				maxNumberMultiplier *= 10;
				maxNumberExponent--;
			}
		}
		
		// yAxisRangeMultiplier is maxNumberMultiplier rounded up to the nearest 0.2 or 0.5
		var yAxisRangeMultiplier = maxNumberMultiplier;
		var yAxisRangeExponent = maxNumberExponent;
		if ( maxNumberMultiplier < 4.8 ) {
			// maxNumberMultiplier < 4.8 -> chart.numMajorTicks <= 4
			// Distance between minor ticks will be 0.2 * Math.pow( 10, yAxisRangeExponent ), so yAxisRange must be
			// a multiple of 0.2 * Math.pow( 10, yAxisRangeExponent )
			// Therefore, yAxisRangeMultiplier must be a multiple of 0.2
			if ( yAxisRangeMultiplier / 0.2 != parseInt( yAxisRangeMultiplier / 0.2 ) ) {
				yAxisRangeMultiplier = ( parseInt( yAxisRangeMultiplier / 0.2 ) + 1 ) * 0.2;
			}
		}
		else {
			if ( yAxisRangeMultiplier / 0.5 != parseInt( yAxisRangeMultiplier / 0.5 ) ) {
				yAxisRangeMultiplier = ( parseInt( yAxisRangeMultiplier / 0.5 ) + 1 ) * 0.5;
			}
		}
		
		chart.distanceBetweenMajorTicks = Math.pow( 10, yAxisRangeExponent );
		chart.yAxisRange = yAxisRangeMultiplier * chart.distanceBetweenMajorTicks;
		chart.numMajorTicks = parseInt( yAxisRangeMultiplier );
	}
	else {
		if ( chart.field == 2 || chart.field == 3 ) {
			chart.yAxisRange = 0.1;
			chart.distanceBetweenMajorTicks = 0.1;
		}
		else {
			chart.yAxisRange = 1;
			chart.distanceBetweenMajorTicks = 1;
		}
		
		chart.numMajorTicks = 1;
	}
}
_.chart.setupData = function( chart, state ) {
	chart.state = state;
	_.chart.setupNumbers( chart, state );
	_.chart.setupYAxisRange( chart );
}

_.chart.resetChartDraw = function( chart ) {
	draw = chart.draw;
	draw.size( chart.width, chart.height * 0.9 );
	var node = draw.node;
	for ( var i = 0; i < node.children.length; i++ ) {
		var child = node.children[i];
		// Only keep xAxis, yAxis, cover, polyline (for "total" graphs) and bars (for "new" graphs)
		var removeChild = true;
		if ( child == chart.xAxis.node || child == chart.yAxis.node || child == chart.cover.node ) {
			removeChild = false;
		}
		else if ( chart.polyline && child == chart.polyline.node ) {
			removeChild = false;
		}
		else if ( child.isBar ) {
			removeChild = false;
		}
		
		if ( removeChild ) {
			node.removeChild( child );
			i--;
		}
	}
}
_.chart.setupPolylineOrBars = function( chart ) {
	// barWidth is only applicable to bars in "new" charts, strokeWidth is applicable to polylines in both "total" 
	// and "new" charts
	var width = chart.width;
	var barWidth = ( chart.toXCoordinate( 2 ) - chart.toXCoordinate( 1 ) ) * 0.45;
	if ( barWidth > 0.02 * width ) {
		barWidth = 0.02 * width;
	}
	if ( barWidth < 1 ) {
		barWidth = Math.min( 1, ( chart.toXCoordinate( 2 ) - chart.toXCoordinate( 1 ) ) * 0.9 );
	}
	var strokeWidth = barWidth * 1.5;
	if ( chart.field % 2 == 1 ) {
		strokeWidth = Math.max( strokeWidth, width / 500 );
		strokeWidth = Math.min( strokeWidth, width / 250 );
	}
	else {
		strokeWidth = Math.max( strokeWidth, width / 400 );
		strokeWidth = Math.min( strokeWidth, width / 200 );
	}
	
	chart.numberOfPoints = chart.xAxisRange;
	if ( chart.field % 2 == 0 ) {
		var pointsForPolyline = new Array();
		for ( var i = 0; i < chart.xAxisRange; i++ ) {
			var number = chart.numbers[i];
			// Only draw data from most recent day if there was an update from the previous day, and/or if time travel is active
			if ( i == chart.xAxisRange - 1 && !_.isTimeTravelActive() ) {
				var difference = chart.numbers[i] - chart.numbers[i - 1];
				if ( difference <= 0 ) {
					chart.numberOfPoints--;
					break;
				}
			}
			
			// x = i + 1
			var xCoordinate = chart.toXCoordinate( i + 1 );
			var yCoordinate = chart.toYCoordinate( number );
			pointsForPolyline.push( xCoordinate );
			pointsForPolyline.push( yCoordinate );
		}
		
		var strokeForPolyline = ( ["deepskyblue", "#b390fb", "red"] )[chart.field / 2];
		if ( !chart.polyline ) {
			chart.polyline = chart.draw.polyline( pointsForPolyline );
			chart.polyline.fill( "none" );
		}
		else {
			chart.polyline.plot( pointsForPolyline );
		}
		
		chart.polyline.stroke( { color: strokeForPolyline, width: strokeWidth, linecap: 'round', 
			linejoin: 'round' } );
	}
	else {
		var pointsForSevenDayMovingAveragePolyline = new Array();
		var barColor = ( ["deepskyblue", "#b390fb", "red"] )[( chart.field - 1 ) / 2];
		if ( !chart.bars ) {
			chart.bars = new Array();
		}
		
		chart.currentlyHighlightedBar = null;
		for ( var i = 0; i < chart.numberOfPoints; i++ ) {
			var number = Math.max( 0, chart.numbers[i] );
			// If no change from yesterday, then ignore today
			if ( i == chart.numberOfPoints - 1 && number <= 0 && !_.isTimeTravelActive() ) {
				chart.numberOfPoints--;
				break;
			}
			
			var xCoordinate = chart.toXCoordinate( i + 1 );
			var yCoordinate = chart.toYCoordinate( number );
			var barHeight = 0.85 * chart.height - yCoordinate;
			if ( barHeight < 0 ) {
				barHeight = 0;
				// barHeight < 0 also implies yCoordinate > 0.85 * height
				yCoordinate = 0.85 * chart.height;
			}
			
			if ( chart.bars[i] ) {
				chart.bars[i].size( barWidth, barHeight ).move( xCoordinate - barWidth / 2, yCoordinate );
				chart.bars[i].opacity( 1 );
			}
			else {
				chart.bars[i] = chart.draw.rect( barWidth, barHeight ).move( xCoordinate - barWidth / 2, yCoordinate );
				if ( chart.xAxis ) {
					// Put chart.bars[i].node behind xAxis
					chart.draw.node.removeChild( chart.bars[i].node );
					chart.draw.node.insertBefore( chart.bars[i].node, chart.xAxis.node );
				}
				
				chart.bars[i].defaultColor = barColor;
				chart.bars[i].fill( chart.bars[i].defaultColor );
				chart.bars[i].node.isBar = true;
			}

			
			if ( _.casesDataAnomalies[chart.state] ) {
				if ( chart.field == 1 || chart.field == 3 ) {
					if ( _.casesDataAnomalies[chart.state].has( i + 1 + chart.dateOffset ) ) {
						chart.bars[i].isAnomaly = true;
					}
				}
				else {
					if ( _.deathsDataAnomalies[chart.state].has( i + 1 + chart.dateOffset ) ) {
						chart.bars[i].isAnomaly = true;
					}
				}
			}
			
			
			// Start on 7th day for sevenDayMovingAverage
			if ( i + chart.dateOffset >= 6 ) {
				var yCoordinateForSevenDayMovingAveragePolyline = chart.toYCoordinate( chart.sevenDayMovingAverages[i] );
				pointsForSevenDayMovingAveragePolyline.push( xCoordinate );
				pointsForSevenDayMovingAveragePolyline.push( yCoordinateForSevenDayMovingAveragePolyline );
			}
		}
		while ( chart.bars.length > chart.numberOfPoints ) {
			// Remove excess bars
			var bar = chart.bars[chart.bars.length - 1];
			bar.remove();
			chart.bars.pop();
		}
		
		if ( !chart.sevenDayMovingAveragePolyline ) {
			chart.sevenDayMovingAveragePolyline = chart.draw.polyline( pointsForSevenDayMovingAveragePolyline );
			chart.sevenDayMovingAveragePolyline.fill( "none" );
		}
		else {
			chart.sevenDayMovingAveragePolyline.plot( pointsForSevenDayMovingAveragePolyline );
		}
		
		var polylineStrokeColor = ( ["blue", "#6600ff",  "#aa0000"] )[( chart.field - 1 ) / 2];
		var polylineStrokeColorNightMode = ( ["#a5a5ff", "#cdabff",  "#ffa7a7"] )[( chart.field - 1 ) / 2];
		// var polylineStrokeColor = ( ["deepskyblue", "#b390fb", "red"] )[( chart.field - 1 ) / 2];
		chart.sevenDayMovingAveragePolyline.stroke( { color: polylineStrokeColor, 
			width: strokeWidth, linecap: 'round', linejoin: 'round' } );
		
		chart.sevenDayMovingAveragePolyline.strokeColor = polylineStrokeColor;
		chart.sevenDayMovingAveragePolyline.strokeColorNightMode = polylineStrokeColorNightMode;
		// Don't show sevenDayMovingAveragePolyline yet
		chart.sevenDayMovingAveragePolyline.remove();
	}
}
_.chart.setupAxes = function( chart ) {
	var width = chart.width;
	var height = chart.height;
	if ( !chart.cover ) {
		chart.cover = chart.draw.rect( 0.92 * width, height * 0.1 ).move( 0.06 * width, 0.85 * height - height / 400 )
			.fill( "white" );
	}
	else {
		chart.cover.size( 0.92 * width, height * 0.1 ).move( 0.06 * width, 0.85 * height - height / 400 ).fill( "white" );
	}
	
	var axisWidth = height / 200;
	// xAxis spans from left edge of yAxis (0.06 * width - height / 400) to 0.98 * width
	// Thickness is height / 200 and vertical center is 0.85 * height
	if ( !chart.xAxis ) {
		chart.xAxis = chart.draw.rect( 0.92 * width + height / 400, axisWidth )
			.move( 0.06 * width - height / 400, 0.85 * height - height / 400 );
	}
	else {
		chart.xAxis.size( 0.92 * width + height / 400, axisWidth )
			.move( 0.06 * width - height / 400, 0.85 * height - height / 400 );
	}
	
	// yAxis spans from 0.025 * height to bottom edge of xAxis (0.85 * height + height / 400)
	// Thickness (width) is height / 200 and horizontal center is 0.06 * height
	if ( !chart.yAxis ) {
		chart.yAxis = chart.draw.rect( axisWidth, 0.825 * height + height / 400 )
			.move( 0.06 * width - height / 400, 0.025 * height );
	}
	else {
		chart.yAxis.size( axisWidth, 0.825 * height + height / 400 )
			.move( 0.06 * width - height / 400, 0.025 * height );
	}
}
_.chart.setupXAxisTicksAndLabels = function( chart ) {
	var dateInterval = parseInt( chart.xAxisRange / 30 + 1 );
	var horizontalSpacingBetweenPoints = chart.toXCoordinate( 2 ) - chart.toXCoordinate( 1 );
	chart.ticks = new Array();
	if ( !chart.labels ) {
		chart.labels = new Array();
	}
	while ( chart.labels.length > 0 ) {
		// Remove any old labels
		chart.removeChild( chart.labels[chart.labels.length - 1] );
		chart.labels.pop();
	}

	chart.widthForXAxisLabels = horizontalSpacingBetweenPoints * dateInterval;
	chart.fontSizeForXAxisLabels = Math.min( parseInt( chart.widthForXAxisLabels / 3 ), 0.015 * chart.width );
	var height = chart.height;
	for ( var i = 0; i < chart.xAxisRange; i += dateInterval ) {
		// x is one-indexed, different from array indices
		var xCoordinate = chart.toXCoordinate( i + 1 );
		var displayDate = document.createElement( "div" );
		if ( _.languageIndex() % 2 == 0 ) {
			displayDate.innerHTML = chart.months[i] + "/" + chart.days[i];
		}
		else {
			displayDate.innerHTML = chart.days[i] + "/" + chart.months[i];
		}
		
		displayDate.style.width = chart.widthForXAxisLabels + "px";
		displayDate.style.fontSize = chart.fontSizeForXAxisLabels + "px";
		displayDate.style.left = xCoordinate - horizontalSpacingBetweenPoints * dateInterval / 2 + "px";
		displayDate.style.top = 0.865 * height + "px";
		
		displayDate.className = "x-axis-label";
		chart.appendChild( displayDate );
		chart.labels.push( displayDate );
		
		// Horizontally center tick along xCoordinate, and span it vertically from 0.84 * height to 0.86 * height
		var tick = chart.draw.rect( height / 300, 0.02 * height ).move( xCoordinate - height / 600, 0.84 * height );
		chart.ticks.push( tick );
	}
}
_.chart.setupYAxisTicksAndLabels = function( chart ) {
	var y = chart.yAxisRange;
	var height = chart.height;
	chart.fontSizeForYAxisLabels = 14 * height / 600;
	
	for ( var y = chart.numMajorTicks * chart.distanceBetweenMajorTicks; y > 0; y -= chart.distanceBetweenMajorTicks ) {
		if ( chart.distanceBetweenMajorTicks < 1 ) {
			y = y.toFixed( 1 );
			if ( y == 0 ) {
				break;
			}
		}
		
		var yCoordinate = chart.toYCoordinate( y );
		// Vertically center at yCoordinate, span from 0.055 * width to 0.065 * width
		var majorTick = chart.draw.rect( 0.01 * chart.width, chart.height / 300 ).move( 0.055 * chart.width, 
			yCoordinate - chart.height / 600 );
		chart.ticks.push( majorTick );
		
		var majorTickLabel = document.createElement( "div" );
		majorTickLabel.innerHTML = y.toLocaleString( _.userSettings.language );
		majorTickLabel.className = "y-axis-label";
		chart.appendChild( majorTickLabel );
		chart.labels.push( majorTickLabel );
		majorTickLabel.style.fontSize = chart.fontSizeForYAxisLabels + "px";
		majorTickLabel.style.lineHeight = chart.fontSizeForYAxisLabels + "px";
		majorTickLabel.style.top = yCoordinate - chart.fontSizeForYAxisLabels / 2 + "px";
	}
	
	// For cases and deaths chart, only display minor ticks if maxNumberExponent > 0 (i.e. distance between major ticks
	// is at least 10)
	// Otherwise, only display minor ticks if maxNumberExponent > -1
	var displayMinorTicks = false;
	if ( chart.field == 2 || chart.field == 3 ) {
		displayMinorTicks = maxNumberExponent >= 0;
	}
	else {
		displayMinorTicks = maxNumberExponent >= 1;
	}
	
	if ( displayMinorTicks ) {
		var distanceBetweenMinorTicks;
		if ( chart.numMajorTicks <= 4 ) {
			distanceBetweenMinorTicks = chart.distanceBetweenMajorTicks / 5;
		}
		else {
			distanceBetweenMinorTicks = chart.distanceBetweenMajorTicks / 2;
		}

		var minorTickLabelFontSize = 0.7 * chart.fontSizeForYAxisLabels;
		var addMinorTickAndLabel = function( y, yCoordinate ) {
			// Vertically center at yCoordinate, span from 0.057 * width to 0.063 * width
			var minorTick = chart.draw.rect( 0.006 * chart.width, chart.height / 300 ).move( 0.057 * chart.width, 
				yCoordinate - chart.height / 600 );
			chart.ticks.push( minorTick );
			
			var minorTickLabel = document.createElement( "div" );
			minorTickLabel.innerHTML = y.toLocaleString( _.userSettings.language );
			minorTickLabel.className = "y-axis-label";
			chart.appendChild( minorTickLabel );
			chart.labels.push( minorTickLabel );
			minorTickLabel.style.fontSize = minorTickLabelFontSize + "px";
			minorTickLabel.style.lineHeight = minorTickLabelFontSize + "px";
			minorTickLabel.style.top = yCoordinate - minorTickLabelFontSize / 2 + "px";
		}

		var isYInBounds= function( y ) {
			return y >= 0 && y <= chart.yAxisRange;
		}
		var yIncrements = [-distanceBetweenMinorTicks, distanceBetweenMinorTicks]

		for ( var i = 0; i < 2; i++ ) {
			// Add minor ticks from top major tick to y = 0
			for ( var y = chart.numMajorTicks * chart.distanceBetweenMajorTicks; isYInBounds( y ); y += yIncrements[i] ) {
				if ( distanceBetweenMinorTicks < 1 ) {
					y = y.toFixed( 1 );
					if ( y == 0 ) {
						break;
					}
				}
				if ( y / chart.distanceBetweenMajorTicks == parseInt( y / chart.distanceBetweenMajorTicks ) ) {
					continue;
				}
				
				var yCoordinate = chart.toYCoordinate( y );
				addMinorTickAndLabel( y, yCoordinate );
			}
		}
	}
}
_.chart.setupCheckboxDiv = function( chart ) {
	var width = chart.width;
	var height = chart.height;

	if ( !chart.checkboxDiv ) {
		var checkboxDiv = document.createElement( "div" );
		checkboxDiv.className = "checkbox-div";
		var checkboxLabelFontSize = 0.03 * height;
		
		var checkbox = document.createElement( "input" );
		checkbox.setAttribute( "type", "checkbox" );
		checkbox.id = "display7DayMovingAverage-" + chart.field;
		
		checkbox.chart = chart;
		checkbox.onclick = function() {
			var self = this;
			if ( self.checked ) {
				// Remove cover, xAxis and ticks to put sevenDayMovingAveragePolyline underneath
				self.chart.cover.remove();
				self.chart.xAxis.remove();
				self.chart.ticks.forEach( tick => tick.remove() );
				
				// Insert sevenDayMovingAveragePolyline
				self.chart.sevenDayMovingAveragePolyline.addTo( "#svg" + self.chart.field );
				// Put everything else on top
				self.chart.cover.addTo( "#svg" + self.chart.field );
				self.chart.xAxis.addTo( "#svg" + self.chart.field );
				self.chart.ticks.forEach( tick => tick.addTo( "#svg" + self.chart.field ) );
				
				self.chart.bars.forEach( bar => bar.opacity( 0.32 ) );
			}
			else {
				// Simply remove sevenDayMovingAveragePolyline from underneath
				self.chart.sevenDayMovingAveragePolyline.remove();
				self.chart.bars.forEach( bar => bar.opacity( 1 ) );
			}
		}
		chart.checkbox = checkbox;
		checkboxDiv.appendChild( checkbox );
		
		var label = document.createElement( "label" );
		label.setAttribute( "for", "display7DayMovingAverage-" + chart.field );
		
		checkboxDiv.appendChild( label );
		
		chart.checkboxDiv = checkboxDiv;
		chart.appendChild( checkboxDiv );
	}
	
	var checkboxLabelFontSize = 0.03 * height;
	var checkbox = chart.checkbox;
	checkbox.style.width = 1.4 * checkboxLabelFontSize + "px";
	checkbox.style.height = 1.4 * checkboxLabelFontSize + "px";
	checkbox.style.marginRight = 0.6 * checkboxLabelFontSize + "px";
	checkbox.checked = false;
	
	var label = chart.checkboxDiv.children[1];
	label.style.lineHeight = 1.4 * checkboxLabelFontSize + "px";
	label.style.fontSize = checkboxLabelFontSize + "px";
	label.innerHTML = (["Display 7 day moving average", "Mostrar la media móvil de 7 días", "显示7天移动平均", 
		"Afficher la moyenne mobile sur 7 jours", "7日間の移動平均を表示する"])[_.languageIndex()];
	
	// Center checkboxDiv with respect to the chart.
	chart.checkboxDiv.style.bottom = 0.025 * height + "px";
	if ( !checkboxLabelWidth ) {
		checkboxLabelWidth = label.offsetWidth;
	}
	var widthOfCheckboxDiv = 0.06 * height + checkboxLabelWidth;
	// Center checkboxDiv horizontally in chart
	chart.checkboxDiv.style.left = 0.5 * width - widthOfCheckboxDiv / 2 + "px";
	chart.checkboxDiv.style.height = 1.4 * 0.03 * height + "px";  // Height of checkboxDiv often does not match with height of checkbox
}
_.chart.setupDateRangeSelect = function( chart ) {
	if ( !chart.dateRangeSelect ) {
		chart.dateRangeSelect = document.createElement( "select" );
		chart.dateRangeSelect.onchange = function() {
			var self = this;
			var chart = self.chart;
			chart.dateRange = self.value;
			var state = chart.state;
			chart.state = null;
			
			isChecked = chart.checkbox.checked;
			_.makeChart( chart, state, true );
			
			if ( isChecked ) {
				chart.checkbox.checked = true;
				chart.checkbox.onclick();
			}
		};
		chart.appendChild( chart.dateRangeSelect );
	}
	
	chart.dateRangeSelect.style.fontSize = 0.025 * chart.height + "px";

	chart.dateRangeSelect.chart = chart;
	var innerHTMLs;
	switch ( _.languageIndex() ) {
		case 0: {
			innerHTMLs = ["Last 2 years", "Last 120 days"];
			break;
		}
		case 1: {
			innerHTMLs = ["Últimos 2 años", "Últimos 120 días"];
			break;
		}
		case 2: {
			innerHTMLs = ["最近2年", "最近120天"];
			break;
		}
		case 3: {
			innerHTMLs = ["2 dernières années", "120 derniers jours"];
			break;
		}
		case 4: {
			innerHTMLs = ["最新の120年", "最新の120日"]
		}
	}
	chart.dateRangeSelect.innerHTML = "";
	for ( var i = 0; i < innerHTMLs.length; i++ ) {
		var option = document.createElement( "option" );
		option.value = i;
		option.innerHTML = innerHTMLs[i];
		chart.dateRangeSelect.appendChild( option );
	}
	chart.dateRangeSelect.value = chart.dateRange;
	chart.dateRangeSelect.style.opacity = 0.6;
}
_.chart.setTitleAndUserInteractionTextTemplate = function( chart ) {
	var titles;
	switch ( _.languageIndex() ) {
		case 0:  {
			titles = [ 
				"{s}: total cases", "{s}: new cases", "{s}: total cases per 100,000 people", "{s}: new cases per 100,000 people", 
				"{s}: total deaths", "{s}: new deaths"
			];
			break;
		}
		case 1: {
			titles = [ 
				"{s}: casos totales", "{s}: nuevos casos", "{s}: casos totales por 100,000 personas", "{s}: nuevos casos por 100,000 personas", 
				"{s}: muertes totales", "{s}: nuevos muertes"
			];
			break;
		}
		case 2: {
			titles = [ 
				"{s}：累计确诊", "{s}：新确诊", "{s}：每10万人中的累计确诊", "{s}：每10万人中的新确诊", 
				"{s}：累计死亡", "{s}：新死亡"
			];
			break;
		}
		case 3: {
			titles = [ 
				"{s}: nombre total des cas", "{s}: nouveaux cas", "{s}: nombre total des cas pour 100 000 personnes", 
				"{s}: nouveaux cas pour 100 000 personnes", "{s}: nombre total des décès", "{s}: nouveaux décès"
			];
			break;
		}
		case 4: {
			titles = [
				"{s}：累積診断", "{s}：新たに診断された", "{s}：10万人あたりの累積診断", 
				"{s}：10万人あたりの新たに診断", "{s}：累積死亡", "{s}：新たに死亡された"
			];
			break;
		}
	}
	chart.titleTemplate = titles[chart.field];
	chart.titleNode.innerHTML = titles[chart.field].replaceAll( "{s}", _.translateState( _.stateFromAbbreviation ( chart.state ) ) );
	if ( _.isUSMapVisible ) {
		chart.titleNode.style.fontSize = chart.height / 24 + "px";
	}
	else {
		chart.titleNode.style.fontSize = chart.height / 16 + "px";
	}

	var strings;
	switch ( _.languageIndex() ) {
		case 0: {
			strings = [ 
				"{s}: {n} cases as of {m}/{d}/{y}", 
				"{s}: {n} new cases on {m}/{d}/{y}", 
				"{s}: {n} cases per 100,000 people as of {m}/{d}/{y}", 
				"{s}: {n} new cases per 100,000 people on {m}/{d}/{y}", 
				"{s}: {n} total deaths on {m}/{d}/{y}", 
				"{s}: {n} new deaths on {m}/{d}/{y}",
			];
			break;
		}
		case 1: {
			strings = [ 
				"{s}: {n} casos a partir de {d}/{m}/{y}", 
				"{s}: {n} nuevos casos en {d}/{m}/{y}", 
				"{s}: {n} casos por 100,000 personas a partir de {d}/{m}/{y}", 
				"{s}: {n} nuevos casos por 100,000 personas en {d}/{m}/{y}", 
				"{s}: {n} muertes a partir de {d}/{m}/{y}", 
				"{s}: {n} nuevos muertes en {d}/{m}/{y}",
			];
			break;
		}
		case 2: {
			strings = [ 
				"{s}:截至{y}/{m}/{d}，共有{n}个确诊", 
				"{s}:{y}/{m}/{d}，有了{n}个新确诊", 
				"{s}:截至{y}/{m}/{d}，每10万人中共有了{n}个确诊", 
				"{s}:{y}/{m}/{d}，每10万人中有了{n}个新确诊", 
				"{s}:截至{y}/{m}/{d}，共有{n}个死亡", 
				"{s}:{y}/{m}/{d}，有了{n}个新死亡",
			];
			break;
		}
		case 3: {
			strings = [ 
				"{s}: {n} cas au {d}/{m}/{y}", 
				"{s}: {n} nouveaux cas au {d}/{m}/{y}", 
				"{s}: {n} cas pour 100000 personnes au {d}/{m}/{y}", 
				"{s}: {n} nouveaux cas por 100,000 personas au {d}/{m}/{y}", 
				"{s}: {n} décès au {d}/{m}/{y}", 
				"{s}: {n} nouveaux décès au {d}/{m}/{y}",
			];
			break;
		}
		case 4: {
			strings = [ 
				"{s}：{y}/{m}/{d}の時点で、{n}個の診断があります", 
				"{s}：{y}/{m}/{d}に{n}の新しい診断があります", 
				"{s}：{y}/{m}/{d}の時点で、10万人あたり{n}個の診断があります", 
				"{s}：{y}/{m}/{d}に10万人あたり{n}の新しい診断があります", 
				"{s}：{y}/{m}/{d}の時点で、{n}個の死亡があります", 
				"{s}：{y}/{m}/{d}に{n}の新しい死亡があります", 
			];
			break;
		}
	}
	// Template of text to display when user is interacting with the chart
	chart.userInteractionTextTemplate = strings[chart.field];
}
_.chart.draw = function( chart ) {
	// Insert chart components. From back to front, (polyline or bars), sevenDayMovingAveragePolyline, cover, 
	// (xAxis, yAxis, ticks, labels, and titleNode), (horizontalLine, verticalLine, horizontalLineLabel, verticalLineLabel)
	var draw;
	if ( !chart.draw ) {
		draw = SVG().addTo( "#" + chart.id ).size( chart.width, chart.height * 0.9 );
		draw.node.setAttribute( "id", "svg" + chart.field );
		chart.draw = draw;
	}
	else {
		_.chart.resetChartDraw( chart );
	}
	
	_.chart.setupPolylineOrBars( chart );
	_.chart.setupAxes( chart );
	_.chart.setupXAxisTicksAndLabels( chart );
	_.chart.setupYAxisTicksAndLabels( chart );

	// Add checkboxDiv
	if ( chart.field % 2 == 1 ) {		
		_.chart.setupCheckboxDiv( chart );
	}
	
	if ( !chart.titleNode ) {
		chart.titleNode = document.createElement( "div" );
		chart.titleNode.className = "chart-title";
		chart.appendChild( chart.titleNode );
	}

	if ( chart.field % 2 == 1 ) {
		_.chart.setupDateRangeSelect( chart );
	}

	_.chart.setTitleAndUserInteractionTextTemplate( chart );
}



_.chart.applyMiscellaneousFunctions = function( chart ) {
	chart.resetTitle = function() {
		var self = this;
		self.titleNode.innerHTML = self.titleTemplate.replaceAll( "{s}", 
			_.translateState( _.stateFromAbbreviation ( chart.state ) ) );
	};
	chart.isThereAnUpdateToday = function() {
		var self = this;
		// "Total" charts
		var i = self.xAxisRange - 1;
		if ( self.field % 2 == 0 ) {
			var difference = self.numbers[i] - self.numbers[i - 1];
			if ( difference <= 0 ) {
				return false;
			}
		}
		// "New" charts
		else {
			var difference = self.numbers[i];
			if ( difference <= 0 ) {
				return false;
			}
		}
		return true;
	};
	chart.isOutOfBounds = function( event ) {
		var self = this;
		var xCoordinate = event.pageX - parseFloat( base.style.paddingLeft );
		var yCoordinate = event.pageY - parseFloat( self.offsetTop );
		var height = self.height;
		if ( yCoordinate <= 0.025 * height || yCoordinate >= 0.85 * height ) {
			return true;
		}
		var x = self.toX( xCoordinate );
		x = parseInt( x + 0.5 );
		if ( x <= 0 || x > self.xAxisRange ) {
			return true;
		}
		
		var width = self.width;
		if ( self.field % 2 == 1 && xCoordinate > 0.85 * width && xCoordinate < 0.98 * width 
			&& yCoordinate > 0.025 * height && yCoordinate < 0.085 * height ) {
			return true;
		}
		
		return false;
	};
}

_.chart.applyOnMouseDownHandler = function( chart ) {
	chart.onmousedown = function( event ) {
		var self = this;
		if ( self.mouseDownStatus >= 0 ) {
			return;
		}
		
		if ( !self.isOutOfBounds( event ) ) {
			var xCoordinate = event.pageX - parseFloat( base.style.paddingLeft );
			var yCoordinate = event.pageY - parseFloat( self.offsetTop );
			
			// Add guidelines to chart, then move them to the correct position
			self.mouseDownStatus = 1;
			_.chart.addChartGuideLines( chart );
			_.chart.moveChartGuideLines( chart, xCoordinate, yCoordinate, false );
			
			// Unhighlight all bars
			if ( self.currentlyHighlightedBar ) {
				self.currentlyHighlightedBar.fill( self.currentlyHighlightedBar.defaultColor );
				self.currentlyHighlightedBar = null;
			}
		}
		else {
			self.mouseDownStatus = 0;
		}
	};
}
_.chart.reflectMouseMove = function( chart, x ) {
	// "x" (position of mouse) is one-indexed, while "i" (used for array indices) is zero-indexed
	var i = x - 1;
		
	// If there is no update from the previous day, act as if mouse is hovering over previous day instead of current day
	if ( x == chart.xAxisRange && !chart.isThereAnUpdateToday() && !_.isTimeTravelActive() ) {
		i--;
	}
	
	var number = chart.numbers[i];
	var finalHTML = chart.userInteractionTextTemplate;
	finalHTML = finalHTML.replaceAll( "{s}", _.translateState( _.stateFromAbbreviation ( chart.state ) ) );
	finalHTML = finalHTML.replaceAll( "{y}", chart.years[i] );
	finalHTML = finalHTML.replaceAll( "{m}", chart.months[i] );
	finalHTML = finalHTML.replaceAll( "{d}", chart.days[i] );
	finalHTML = finalHTML.replaceAll( "{n}", number.toLocaleString( _.userSettings.language ) );
	if ( number == 1 ) {
		// Go to singular form instead of plural
		switch ( _.languageIndex() ) {
			case 0: {
				if ( chart.field <= 3 ) {
					finalHTML = finalHTML.replace( "cases", "case" );
				}
				else {
					finalHTML = finalHTML.replace( "deaths", "death" );
				}
				break;
			}
			case 1: {
				if ( chart.field <= 3 ) {
					finalHTML = finalHTML.replace( "casos", "caso" );
				}
				else {
					finalHTML = finalHTML.replace( "muertes", "muerte" );
				}
				break;
			}
		}
	}

	var addDataAnomaly = function() {
		switch ( _.languageIndex() ) {
			case 0: {
				finalHTML += " (data anomaly)";
				break;
			}
			case 1: {
				finalHTML += " (anomalía de datos)";
				break;
			}
			case 2: {
				finalHTML += " (数据异常)";
				break;
			}
			case 3: {
				finalHTML += " (anomalie de données)";
				break;
			}
			case 4: {
				finalHTML += " データ異常";
				break;
			}
		}
	}

	if ( _.casesDataAnomalies[chart.state] ) {
		if ( ( chart.field == 1 || chart.field == 3 ) && _.casesDataAnomalies[chart.state].has( i + 1 + chart.dateOffset ) ) {
			addDataAnomaly();
		}
		
	}
	if ( _.deathsDataAnomalies[chart.state] ) {
		if ( chart.field == 5 && _.deathsDataAnomalies[chart.state].has( i + 1 + chart.dateOffset ) ) {
			addDataAnomaly();
		}
	}
	
	
	if ( chart.field % 2 == 1 && chart.checkbox.checked && ( i >= 6 || chart.dateRange != 0 ) ) {
		var sevenDayMovingAverages = chart.sevenDayMovingAverages;
		switch ( _.languageIndex() ) {
			case 0: {
				finalHTML += "<br>7 day moving average: ";
				break;
			}
			case 1: {
				finalHTML += "<br>Media móvil de 7 días: ";
				break;
			}
			case 2: {
				finalHTML += "<br>7天移动平均：";
				break;
			}
			case 3: {
				finalHTML += "<br>Moyenne mobile sur 7 jours: ";
				break;
			}
			case 4: {
				finalHTML += "<br>7日間の移動平均：";
				break;
			}
		}
		if ( chart.field == 3 ) {
			// Round to nearest tenth
			var sevenDayMovingAverage = sevenDayMovingAverages[i].toFixed( 1 );
			if ( sevenDayMovingAverage == parseInt( sevenDayMovingAverage) ) {
				sevenDayMovingAverage = parseInt( sevenDayMovingAverage );
			}
			finalHTML += sevenDayMovingAverage.toLocaleString( _.userSettings.language );
		}
		else {
			// Round to nearest integer
			var sevenDayMovingAverage = sevenDayMovingAverages[i];
			finalHTML += parseInt( sevenDayMovingAverage + 0.5 ).toLocaleString( _.userSettings.language );
		}
	}
	
	if ( chart.field % 2 == 1 ) {
		if ( chart.mouseDownStatus == -1 ) {
			// Reset last highlighted bar
			if ( chart.currentlyHighlightedBar ) {
				chart.currentlyHighlightedBar.fill( chart.currentlyHighlightedBar.defaultColor );
			}
	
			var bar = chart.bars[i];
			// Highlight current bar
			if ( !chart.isNightMode ) {
				bar.fill( "black" );
			}
			else {
				bar.fill( "white" );
			}
			// Update currentlyHighlightedBar
			chart.currentlyHighlightedBar = bar;
		}
		else {
			// Unhighlight all bars if mouse is currently down
			if ( chart.currentlyHighlightedBar ) {
				chart.currentlyHighlightedBar.fill( chart.currentlyHighlightedBar.defaultColor );
				chart.currentlyHighlightedBar = null;
			}
		}
	}
	
	chart.titleNode.innerHTML = finalHTML;
	chart.xOfMouse = x;
}
_.chart.applyOnMouseMoveHandler = function( chart ) {
	chart.onmousemove = function( event ) {
		var self = this;
		if ( self.isOutOfBounds( event ) ) {
			self.resetTitle();
			self.xOfMouse = -1;
			
			if ( self.mouseDownStatus == 1 ) {
				_.chart.removeChartGuidelines( self );
				self.mouseDownStatus = 0;
			}
			// Unhighlight currently highlighted bar
			if ( self.currentlyHighlightedBar ) {
				self.currentlyHighlightedBar.fill( self.currentlyHighlightedBar.defaultColor );
				self.currentlyHighlightedBar = null;
			}
			
			return;
		}
		
		var xCoordinate = event.pageX - parseFloat( base.style.paddingLeft );
		var yCoordinate = event.pageY - parseFloat( self.offsetTop );
		// Round self.toX( xCoordinate ) to the nearest integer
		var x = parseInt( self.toX( xCoordinate ) + 0.5 );
		// If x of mouse did not change from the last mousemove event
		if ( self.xOfMouse == x ) {
			if ( self.mouseDownStatus == 1 ) {
				_.chart.moveChartGuideLines( chart, xCoordinate, yCoordinate, event.ctrlKey );
			}
			return;
		}
		
		_.chart.reflectMouseMove( chart, x );
		if ( self.mouseDownStatus == 0 ) {
			// If mouse was previously out of bounds
			_.chart.addChartGuideLines( chart );
			self.mouseDownStatus = 1;
		}
		if ( self.mouseDownStatus == 1 ) {
			_.chart.moveChartGuideLines( chart, xCoordinate, yCoordinate, event.ctrlKey );
		}
	};
}
_.chart.applyOnMouseUpHandler = function( chart ) {
	chart.onmouseup = function( event ) {
		var self = this;
		if ( self.mouseDownStatus == -1 ) {
			return;
		}
		
		// Remove guidelines if mouse is currently down within bounds
		if ( self.mouseDownStatus == 1 ) {
			_.chart.removeChartGuidelines( self );
			
			// Highlight bar that mouse is on top of
			var xCoordinate = event.pageX - parseFloat( base.style.paddingLeft );
			var x = parseInt( self.toX( xCoordinate ) + 0.5 );
			if ( self.bars ) {
				var bar = self.bars[x - 1];
				if ( bar ) {
					// If state is not updated today, self.bars.length will be 1 less than xAxisRange
					// Therefore, if user invokes onmouseup on today, self.bars[x - 1] will be undefined
					if ( !_.userSettings.isNightMode ) {
						bar.fill( "black" );
					}
					else {
						bar.fill( "white" );
					}
					self.currentlyHighlightedBar = bar;
				}
			}
		}
		self.mouseDownStatus = -1;
	};
}
_.chart.applyOnMouseLeaveHandler = function( chart ) {
	chart.onmouseleave = function() {
		var self = this;
		self.resetTitle();
		if ( self.mouseDownStatus == 1 ) {
			_.chart.removeChartGuidelines( self );
			self.mouseDownStatus = -1;
		}
		else if ( self.mouseDownStatus == 0 ) {
			self.mouseDownStatus = -1;
		}
		// mouseDownStatus will equal -1 by this point
		if ( self.currentlyHighlightedBar ) {
			self.currentlyHighlightedBar.fill( self.currentlyHighlightedBar.defaultColor );
			self.currentlyHighlightedBar = null;
		}
	};
}

_.chart.setupChartGuideLines = function( chart ) {
	var draw = chart.draw;
	var width = chart.width;
	var height = chart.height;
	// Similar to x = c for some c in a graph
	chart.verticalLine = draw.rect( height / 400, 0.825 * height ).move( 0.025 * height, 0 );
	chart.verticalLine.remove();
		
	if ( !chart.verticalLineLabel ) {
		chart.verticalLineLabel = document.createElement( "div" );
		chart.verticalLineLabel.style.textAlign = "center";
	}
	chart.verticalLineLabel.style.fontSize = chart.fontSizeForXAxisLabels + "px";
	chart.verticalLineLabel.style.width = chart.widthForXAxisLabels + "px";
	chart.verticalLineLabel.style.top = 0.865 * height + "px";
	
	// Similar to y = c for some c in a graph
	chart.horizontalLine = draw.rect( 0.92 * width, height / 400 ).move( 0.92 * width, 0 );
	chart.horizontalLine.remove();
	
	if ( !chart.horizontalLineLabel ) {
		chart.horizontalLineLabel = document.createElement( "div" );
		chart.horizontalLineLabel.style.textAlign = "right";
	}
	chart.horizontalLineLabel.style.fontSize = chart.fontSizeForYAxisLabels + "px";
	chart.horizontalLineLabel.style.lineHeight = chart.fontSizeForYAxisLabels + "px";
	chart.horizontalLineLabel.style.width = 0.053 * width + "px";
}
_.chart.addChartGuideLines = function( chart ) {
	chart.xAxis.opacity( 0.4 );
	chart.yAxis.opacity( 0.4 );
	chart.titleNode.style.opacity = 0.4;
	chart.labels.forEach( label => label.style.opacity = 0.4 );
	chart.ticks.forEach( tick => tick.opacity( 0.4 ) );
	if ( chart.bars && !chart.checkbox.checked ) {
		// Reduce opacity of bars
		chart.bars.forEach( bar => bar.opacity( 0.4 ) );
	}
	
	// Add guidelines
	chart.verticalLine.addTo( "#svg" + chart.field );
	chart.horizontalLine.addTo( "#svg" + chart.field );
	chart.appendChild( chart.verticalLineLabel );
	chart.appendChild( chart.horizontalLineLabel );
}
_.chart.moveChartGuideLines = function( chart, xCoordinate, yCoordinate, ctrlKey ) {
	if ( chart.mouseDownStatus != 1 ) {
		return;
	}
	
	var width = chart.width;
	var height = chart.height;
	// Vertically center verticalLine along xCoordinate
	chart.verticalLine.move( xCoordinate - height / 800, 0.025 * height );
	// Vertically center verticalLineLabel along xCoordinate too
	chart.verticalLineLabel.style.left = xCoordinate - chart.widthForXAxisLabels / 2 + "px";
	var x = parseInt( chart.toX( xCoordinate ) + 0.5 );
	var i = x - 1;
	if ( x == chart.xAxisRange && !chart.isThereAnUpdateToday() ) {
		i--;
	}
	switch ( _.languageIndex() ) {
		case 0:
		case 2:
		case 4: {
			chart.verticalLineLabel.innerHTML = chart.months[i] + "/" + chart.days[i];
			break;
		}
		case 1:
		case 3: {
			chart.verticalLineLabel.innerHTML = chart.days[i] + "/" + chart.months[i];
			break;
		}
	}
	
	if ( !ctrlKey ) {
		// Vertically center horizontalLine along yCoordinate
		chart.horizontalLine.move( 0.06 * width, yCoordinate - height / 800 );
		// Vertically center horizontalLineLabel along yCoordinate too
		chart.horizontalLineLabel.style.top = yCoordinate - chart.fontSizeForYAxisLabels / 2 + "px";
		var y = chart.toY( yCoordinate );
		
		if ( chart.field == 2 || chart.field == 3 ) {
			var round = 10;
			
			y *= round;
			y += 0.5;
			y = parseInt( y );
			y /= round;
		}
		else {
			// Non-decimal charts: round to nearest integer
			y = parseInt( y + 0.5 );
		}
		chart.horizontalLineLabel.innerHTML = y.toLocaleString( _.userSettings.language );
	}
}
_.chart.removeChartGuidelines = function( chart ) {
	chart.xAxis.opacity( 1 );
	chart.yAxis.opacity( 1 );
	chart.titleNode.style.opacity = 1;
	chart.labels.forEach( label => label.style.opacity = 1 );
	chart.ticks.forEach( tick => tick.opacity( 1 ) );
	if ( chart.bars && !chart.checkbox.checked ) {
		// Restore opacity of bars, but opacity from displaying of 7 day moving average polyline has higher priority
		chart.bars.forEach( bar => bar.opacity( 1 ) );
	}
	
	chart.verticalLine.remove();
	chart.horizontalLine.remove();
	chart.removeChild( chart.verticalLineLabel );
	chart.removeChild( chart.horizontalLineLabel );
}

_.chart.applyOnTouchStartHandler = function( chart ) {
	chart.ontouchstart = function( event ) {
		chart.lastXCoordinate = event.pageX - parseFloat( base.style.paddingLeft );
		// No need to determine actual y coordinate with respect to the chart, because only the change in
		// y is being recorded and used.
		chart.lastYCoordiante = event.pageY;
	}
}
_.chart.applyOnTouchMoveHandler = function( chart ) {
	chart.ontouchmove = function( event ) {
		var self = this;
		var xCoordinate = event.pageX - parseFloat( base.style.paddingLeft );
		var yCoordinate = event.pageY;
		
		var deltaY = yCoordinate - self.lastYCoordiante;
		var deltaX = xCoordinate - self.lastXCoordinate;
		// Or, if arctan( slope ) < 45 degrees, and user is only touching the chart at one point (i.e not pinching
		// the screen to zoom in/out).
		// In this way, the user can navigate the chart while zoomed in (by dragging it horizontally) without
		// shifting the screen
		if ( Math.abs( deltaY / deltaX ) < 1 && event.touches.length < 2 ) {
			event.preventDefault();
			event.stopPropagation();
		}
		
		event.lastXCoordinate = xCoordinate;
		event.lastYCoordiante = yCoordinate;
		
		var x = parseInt( self.toX( xCoordinate ) + 0.5 );
		if ( x <= 0 || x > self.xAxisRange ) {
			self.resetTitle();
			self.xOfMouse = -1;
			return;
		}
		else if ( self.xOfMouse == x ) {
			return;
		}
		
		_.chart.reflectMouseMove( chart, x );
	};
}
_.chart.applyOnTouchEndHandler = function( chart ) {
	chart.ontouchend = function() {
		var self = this;
		self.resetTitle();
		self.lastXCoordinate = null;
		self.lastYCoordiante = null;
	};
}

_.chart.setupToggleNightMode = function( chart ) {
	chart.toggleNightMode = function() {
		var self = this;
		self.isNightMode = !self.isNightMode;
		if ( !self.isNightMode ) {
			self.style.borderColor = "";
			
			if ( self.field % 2 == 1 ) {
				self.sevenDayMovingAveragePolyline.stroke( self.sevenDayMovingAveragePolyline.strokeColor );
				if ( self.currentlyHighlightedBar ) {
					self.currentlyHighlightedBar.fill( "black" );
				}
			}
			
			self.titleNode.style.color = "";
			self.xAxis.fill( "" );
			self.yAxis.fill( "" );
			self.cover.fill( "white" );
			for ( var i = 0; i < self.ticks.length; i++ ) {
				self.ticks[i].fill( "" );
			}
			for ( var i = 0; i < self.labels.length; i++ ) {
				self.labels[i].style.color = "";
			}
			
			if ( !_.isMobile ) {
				self.horizontalLine.fill( "" );
				self.horizontalLineLabel.style.color = "";
				self.verticalLine.fill( "" );
				self.verticalLineLabel.style.color = "";
			}
			
			if ( self.field % 2 == 1 ) {
				self.checkboxDiv.children[1].style.color = "";
			}
		}
		else {
			self.style.borderColor = "lightgray";
			
			if ( self.field % 2 == 1 ) {
				self.sevenDayMovingAveragePolyline.stroke( self.sevenDayMovingAveragePolyline.strokeColorNightMode );
				if ( self.currentlyHighlightedBar ) {
					self.currentlyHighlightedBar.fill( "white" );
				}
			}
			
			self.titleNode.style.color = "lightgray";
			self.xAxis.fill( "lightgray" );
			self.yAxis.fill( "lightgray" );
			self.cover.fill( "black" );
			for ( var i = 0; i < self.ticks.length; i++ ) {
				self.ticks[i].fill( "lightgray" );
			}
			for ( var i = 0; i < self.labels.length; i++ ) {
				self.labels[i].style.color = "lightgray";
			}
			
			if ( !_.isMobile ) {
				self.horizontalLine.fill( "lightgray" );
				self.horizontalLineLabel.style.color = "lightgray";
				self.verticalLine.fill( "lightgray" );
				self.verticalLineLabel.style.color = "lightgray";
			}
			
			if ( self.field % 2 == 1 ) {
				self.checkboxDiv.children[1].style.color = "lightgray";
			}
		}
	}
}