var _ = window._;

( function() {
	var baseMinWidth;
	var timestamp;
	
	function init() {
		body = document.getElementsByTagName( "body" )[0];
		_.isMobile = false;
		_.finishedSetup = false;
		try {
			var indexOfLeftBrace = document.cookie.indexOf( "{" );
			var indexOfRightBrace = document.cookie.indexOf( "}" );
			_.userSettings = JSON.parse( document.cookie.substring( indexOfLeftBrace, indexOfRightBrace + 1 ) );
            
            // Validation
            var isValid = Math.abs( _.userSettings.sortingMethod ) <= 5;
            if ( !isValid ) {
                throw new Error();  // Redirect to catch
            }
            
            var validLanguages = ["en-US", "es-ES", "zh-CN", "fr-FR", "ja-JP"];
            isValid = false;
            for ( var i = 0; i < 5; i++ ) {
                if ( _.userSettings.language == validLanguages[i] ) {
                    isValid = true;
                    break;
                }
            }
            if ( !isValid ) {
                throw new Error();
            }
            
            isValid = false;
            if ( _.userSettings.pinnedState ) {
                for ( var i = 0; i < 55; i++ ) {
                    if ( _.userSettings.pinnedState == stateAbbreviations[i] ) {
                        isValid = true;
                        break;
                    }
                }
            }
            else {
                isValid = true;
            }
            if ( !isValid ) {
                throw new Error();
            }
		}
		catch ( error ) {
			_.userSettings = {};
            _.userSettings.language = "en-US";
            _.userSettings.indicateUpdatedStates = false;
            _.userSettings.isNightMode = false;
            _.userSettings.hideLanguageDiv = false;
            // _.userSettings.sortingMethod = 0 is an indicator that there were no cookies stored
            // Cookies will be stored during processData
            _.userSettings.sortingMethod = 0;
            _.userSettings.pinnedState = null;
		}
        
		_.setTitle();
        if ( _.userSettings.isNightMode ) {
            document.getElementsByTagName( "body" )[0].style.backgroundColor = "black";
        }
		
		// Adjust selected option in select0 to option containing the language in document.cookies
        select0.value = _.userSettings.language;
		
		if ( navigator.userAgent.match( /Android/i ) || navigator.userAgent.match( /webOS/i ) 
			|| navigator.userAgent.match( /iPhone/i ) || navigator.userAgent.match( /iPad/i ) 
			|| navigator.userAgent.match( /iPod/i ) || navigator.userAgent.match( /BlackBerry/i ) 
			|| navigator.userAgent.match( /Windows Phone/i ) ) {
			_.isMobile = true;
		}
		
        // If operating system is Windows, then enable Calibri font
		if ( navigator.userAgent.indexOf( "Win" ) != -1 ) {
			body.style.fontFamily = "Calibri";
		}
		
		var resizeTimeout;
		var resize = function() {
			if ( _.finishedSetup && _.bodyWidth != body.offsetWidth ) {
                _.bodyWidth = body.offsetWidth;
				readjustSizes();
				resizeTimeout = null;
			}
		};
		window.onresize = function() {
            // Reset resize contents timer
			if ( resizeTimeout != null ) {
				clearTimeout( resizeTimeout );
			}
			
            // Resize contents in 0.25 seconds when window is resized
			resizeTimeout = setTimeout( resize, 250 );
		};
		
		var checkForUpdates = function() {
            if ( !_.finishedSetup ) {
                return;
            }
            
            // Purpose of "../data/last-updated.txt": to indicate timestamp of data.json without downloading entire data.json file.
            // Timestamp of data.json and last-updated.txt are usually synchronized.
			$.get( "../data/last-updated.txt", function( responseText ) {
                var newTimestamp = parseInt( responseText );
                // If last-updated.txt is equal to timestamp, then data.json and _.allData are synchronized.
                // If last-updated.txt is behind timestamp, then data.json and _.allData are synchronized, but last-updated.txt
                // hasn't been "caught up" with data.json yet due to update delays.
				if ( newTimestamp > timestamp ) {
					// If last-updated.txt is ahead of timestamp, then timestamp in data.json is likely ahead of timestamp in _.allData.
					$.get( "../data/data.json", function( data ) {
						data = JSON.parse( data )
						var newAllData = data.data;
						if ( newAllData[newAllData.length - 1].t <= _.allData[_.allData.length - 1].t ) {
                            // Timestamp in data.json is not guaranteed to be ahead of timestamp in _.allData due to update delays.
                            // If that happens, reject data.json.
                            // For example, timestamp is 50000, data.json is 50000
							return;
						}

						setTimeout( function() {
                            _.updateTimeTravelMax( newAllData );
                            processData( data );
                            
                            // Refresh display
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
							
							// Update timestamp
							timestamp = _.allData[_.allData.length - 1].t;
							
							var scrollTop = html.scrollTop;	// Get scroll position before updateDiv is added
							var updateAlreadyVisible = true;
							if ( updateDiv.className == "d-none" ) {
								updateDiv.className = "";
								updateAlreadyVisible = false;
                                
                                // While updateDiv was hidden, language might have changed
                                _.setDismissUpdateButtonInnerHTML();
							}
                            // Update notification inner HTML always changes between data updates
                            _.setUpdateNotificationInnerHTML();
							
							// readjustSizes(), but only for update
							var w = _.baseWidth;
							
							var fontSize;
							if ( _.isUSMapVisible ) {
								fontSize = 0.01 * w;
							}
							else {
								fontSize = 0.02 * w;
							}
                            updateNotification.style.fontSize = 1.3 * fontSize + "px";
                            dismissUpdateButton.style.fontSize = 1.1 * fontSize + "px";
                            dismissUpdateButton.style.borderWidth = fontSize / 12 + "px";
                            dismissUpdateButton.style.height = updateNotification.offsetHeight + "px";
                            var combinedWidth = updateNotification.offsetWidth + dismissUpdateButton.offsetWidth;
                            var updateNotificationLeft = ( 0.97 * w - combinedWidth ) / 2;
                            updateNotification.style.left = updateNotificationLeft + "px";
                            dismissUpdateButton.style.right = updateNotificationLeft + "px";
                            updateDiv.style.height = updateNotification.offsetHeight + "px";
                            updateDiv.style.marginBottom = 0.015 * w + "px";
                            
							if ( !updateAlreadyVisible ) {
                                // Everything will move down by updateDiv.offsetHeight + 0.015 * w, so scroll down by same amount
								window.scrollTo( 0, scrollTop + parseFloat( updateDiv.style.height ) + 0.015 * w );
							}
						}, 1 );
					}, "text" );
				}	
			});
		};
        setInterval( checkForUpdates, 10000 );
		
        // Set up everything, make base visible, then readjustSizes()
		dismissUpdateButton.onclick = function() {
			updateDiv.className = "d-none";
		};
		
       _.setConfirmLanguageButtonInnerHTML();
        if ( _.userSettings.hideLanguageDiv ) {
            languageDiv.className = "d-none";
        }
        
        _.setToggleNightModeButtonInnerHTML();
        
        // Set options for select2
		for ( var i = 0; i < _.states.length; i++ ) {
			var state = _.states[i];
            var stateAbbreviation = _.stateAbbreviations[i];
			var option = document.createElement( "option" );
			option.innerHTML = _.translateState( state );
			option.setAttribute( "value", stateAbbreviation );
			select2.appendChild( option );
		}
		
		$.ajaxSetup( { cache: false } );	// Disable cache
		$.get( "../data/data.json", function( data ) {
            var dataFromJSON = JSON.parse( data );
			processData( dataFromJSON );
			_.initTimeTravel();
            _.setLastUpdatedOnText();
            
			// If last-updated.txt hasn't caught up with data.json, then timestamp will be "ahead" of last-updated.txt.
			// timestamp is bound to data.
			timestamp = _.allData[_.allData.length - 1].t;
			_.dataDisplayHeaderHTML = _.dataDisplayHeaderHTMLs[_.languageIndex()];
			_.refreshDataDisplay();
			
			$.get( "../data/state-circle-data.txt", function( responseText ) {
				stateCircleData = responseText;
                // No need to loadColB(), as it will be done during readjustSizes()
                
				_.setResetChartsButtonInnerHTML();
                _.setIndicateUpdatedStatesCheckboxLabelInnerHTML();
                if ( _.userSettings.indicateUpdatedStates ) {
                    indicateUpdatedStatesCheckbox.checked = true;
                }
                indicateUpdatedStatesCheckbox.onclick = _.toggleIndicateUpdatedStates;
                
                // Create _.charts
                _.charts = [ 
    				totalCasesChart, newCasesChart, totalCasesPer100000PeopleChart, newCasesPer100000PeopleChart, 
                    totalDeathsChart, newDeathsChart
    			];
                
                for ( var i = 0; i < _.charts.length; i++ ) {
                    _.charts[i].dateRange = 0;
				}
                
                base.className = "container-fluid";
        		body.style.overflowY = "scroll";
                _.bodyWidth = body.offsetWidth;
                baseMinWidth = 0.9 * _.bodyWidth;
                if ( !_.isMobile ) {
                    // baseMinWidth cannot go below 975
                    baseMinWidth = Math.max( baseMinWidth, 975 );
                    // Visibility of colA and colB are predetermined
                    colA.className = "col-6";
                    colB.className = "col-6";
                }
                else {
                    // Determine visibility of colA and colB in readjustSizes
                    baseMinWidth = 0;
                }

                _.isUSMapVisible = getComputedStyle( colB ).display != "none";
                readjustSizes();
                
                if ( _.userSettings.isNightMode ) {
                    _.userSettings.isNightMode = false;
                    toggleNightModeButton.click();
                }
				_.finishedSetup = true;
			});
            
            
		}, "text" );
	}
	
	function processData( allDataFromJSON ) {
		_.allData = allDataFromJSON.data;
        if ( _.userSettings.dataFromTodayIndex == undefined ) {
            _.userSettings.dataFromTodayIndex = -1;
        }
		
		for ( var i = 0; i < _.allData.length; i++ ) {
			var data = _.allData[i];
			data.getEntry = function( state ) {
				var self = this;
				var entries = self.e;
				for ( var j = 0; j < entries.length; j++ ) {
					if ( entries[j][0] == state ) {
						return entries[j];
					}
				}
				
				return null;
			};
		}
		
        if ( _.userSettings.dataFromTodayIndex >= 0 ) {
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

		_.casesDataAnomalies = allDataFromJSON.cases_data_anomalies;
		_.deathsDataAnomalies = allDataFromJSON.deaths_data_anomalies;
		for ( var key in _.casesDataAnomalies ) {
			_.casesDataAnomalies[key] = new Set( _.casesDataAnomalies[key] )
		}
		for ( var key in _.deathsDataAnomalies ) {
			_.deathsDataAnomalies[key] = new Set( _.deathsDataAnomalies[key] )
		}

        // Will happen if there are currently no cookies
        if ( _.userSettings.sortingMethod == 0 ) {
            if ( _.sevenDayAverageInNewCasesPer100000People() >= 10 ) {
                _.userSettings.sortingMethod = 5;
            }
            else {
                _.userSettings.sortingMethod = 2;
            }
            _.updateCookies();
        }
		
		_.sortEntries();
	}
	
    // readjustSizes must be invoked under the following things happen:
    // - window is readjusted (i.e. _.bodyWidth is changed)
	function readjustSizes() {
        // Determine _.baseWidth
        if ( _.bodyWidth > baseMinWidth ) {
            base.style.width = _.bodyWidth - 1 + "px";
            _.baseWidth = _.bodyWidth - 1;
        }
        else {
            base.style.width = baseMinWidth + "px";
            _.baseWidth = baseMinWidth;
        }
        
		var w = _.baseWidth;
        if ( _.isMobile ) {
            // Visibility of colA and colB are not definite
            if ( w >= 975 ) {
                colA.className = "col-6";
                colB.className = "col-6";
                _.isUSMapVisible = true;
            }
            else {
                colA.className = "";
                colB.className = "d-none";
                _.isUSMapVisible = false;
            }
        }
        base.style.padding = 0.015 * w + "px";
		
		var fontSize;
		if ( _.isUSMapVisible ) {
			fontSize = 0.01 * w;
		}
		else {
			fontSize = 0.02 * w;
		}
		
		// Now on update
		if ( updateDiv.className == "" ) {
            updateNotification.style.fontSize = 1.3 * fontSize + "px";
            
            dismissUpdateButton.style.fontSize = 1.1 * fontSize + "px";
            dismissUpdateButton.style.borderWidth = fontSize / 12 + "px";
            dismissUpdateButton.style.height = updateNotification.offsetHeight + "px";
            
            // Center both items horizontally
            var combinedWidth = updateNotification.offsetWidth + dismissUpdateButton.offsetWidth;
            var updateNotificationLeft = ( 0.97 * w - combinedWidth ) / 2;
            updateNotification.style.left = updateNotificationLeft + "px";
            dismissUpdateButton.style.right = updateNotificationLeft + "px";
            
            updateDiv.style.height = updateNotification.offsetHeight + "px";
            updateDiv.style.marginBottom = 0.015 * w + "px";
		}
		
        // Now on languageDiv
        if ( languageDiv.className != "d-none" ) {
            var tempFontSize = 1.1 * fontSize;  // fontSize is bigger for languageDiv
            
            select0.style.fontSize = 1.1 * tempFontSize + "px";
            confirmLanguageButton.style.fontSize = tempFontSize + "px";
            confirmLanguageButton.style.height = select0.offsetHeight + "px";
            confirmLanguageButton.style.borderWidth = tempFontSize / 12 + "px";
            if ( _.isUSMapVisible ) {
                confirmLanguageButton.style.width = "";
                select0.style.width = "";
                select0.style.right = "";
            }
            else {
                confirmLanguageButton.style.width = "36%";
                select0.style.right = "40%";
                select0.style.width = "36%";
            }
            
            languageDiv.style.height = select0.offsetHeight + "px";
    		languageDiv.style.marginBottom = 0.015 * w + "px";
        }
		
        // Now on rowA0
        toggleNightModeButton.style.fontSize = fontSize + "px";
		toggleNightModeButton.style.borderWidth = fontSize / 12 + "px";
		rowA0.style.height = toggleNightModeButton.offsetHeight + "px";
        
		// Now on rowA1
		rowA1.style.borderWidth = fontSize / 12 + "px";
		// Get scroll position of rowA1 with respect to its height
		readjustDataDisplayTextFonts();
		var colAWidth;
		if ( _.isUSMapVisible ) {
			colAWidth = 0.485 * _.baseWidth;
		}
		else {
			colAWidth = 0.97 * _.baseWidth;
		}
		
		// Now on rowA2
		readjustRowA2TextFonts();
		// No marginBottom for rowA2, because there is nothing below it
		
		// Now on colB
		_.loadColB();
        if ( _.isUSMapVisible ) {
            // fontSize of indicateUpdatedStatesCheckbox = w / 100
            indicateUpdatedStatesCheckbox.style.width = 0.014 * w + "px";
			indicateUpdatedStatesCheckbox.style.height = 0.014 * w + "px";
            indicateUpdatedStatesCheckbox.style.marginRight = 0.003 * w + "px";
			indicateUpdatedStatesCheckboxLabel.style.lineHeight = 0.014 * w + "px";
            indicateUpdatedStatesCheckboxLabel.style.fontSize = 0.01 * w + "px";
            rowB1.style.height = 0.014 * w + "px";
        }
        
		// Redetermine height of rowA1
		var rowA1Height;
		if ( _.isUSMapVisible ) {
            // Make it so that height of colA equals the height of colB
            // parseFloat( rowA0.style.height ) + [rowA0 marginBottom] + rowA1Height + [rowA1 marginBottom]
            // [rowA0 marginBottom] = 1% * colAWidth
            // [rowA1 marginBottom] = 1.5% * colAWidth
            // usMap.height = 0.75 * usMap.width, or 0.75 * (0.475 * w) = 0.35625 * w
			rowA1Height = 0.35625 * w - parseFloat( rowA0.style.height ) - rowA2.offsetHeight - 0.025 * colAWidth;
		}
		else {
            // Make it so that h = 1/2 of width of rowA1
			rowA1Height = rowA1.offsetWidth * 0.5;
		}
		rowA1.style.height = rowA1Height + "px";
		row1.height = row1.offsetHeight;
		
		// Now on chartControlDiv
        // Similar functionality to updateDiv
        select2.style.fontSize = 1.1 * fontSize + "px";
		resetChartsButton.style.fontSize = fontSize + "px";
		resetChartsButton.style.borderWidth = fontSize / 12 + "px";
        select2.style.height = resetChartsButton.offsetHeight + "px";
        chartControlDiv.style.height = select2.style.height;
        if ( _.isUSMapVisible ) {
            select2.style.width = "";
            select2.style.left = "";
            resetChartsButton.style.width = "";
            resetChartsButton.style.right = "";
        }
        else {
            select2.style.width = "40%";
            select2.style.left = "6.67%";
            resetChartsButton.style.width = "40%";
            resetChartsButton.style.right = "6.67%";
        }
        
        if ( _.finishedSetup ) {
            for ( var i = 0; i < _.charts.length; i++ ) {
    			var checked = i % 2 == 1 && _.charts[i].checkbox.checked;

                // checkboxLabelWidth will have changed with a new screen width
                checkboxLabelWidth = null;
    			_.makeChart( _.charts[i], _.charts[i].state, false );
    			if ( checked ) {
                    _.charts[i].checkbox.checked = true;
    				_.charts[i].checkbox.onclick();
    			}
    		}
        }
		else {
            for ( var i = 0; i < _.charts.length; i++ ) {
                checkboxLabelWidth = null;
    			_.makeChart( _.charts[i], "USA", false );
    		}
        }

        timeTravelDiv.style.borderWidth = _.charts[0].style.borderWidth;
        timeTravelDiv.style.bottom = base.style.paddingBottom;
        if ( !_.isMobile && _.isTimeTravelActive() ) {
            timeTravelDiv.style.width = 0.97 * _.baseWidth + "px";
            var left = parseFloat( base.style.paddingLeft ) - window.pageXOffset;
            timeTravelDiv.style.left = left + "px";
        }
        
        timeTravelRangeLabel.style.fontSize = 1.6 * fontSize + "px";
        timeTravelDivFiller.style.height = timeTravelDiv.offsetHeight + "px";
	}

	function readjustDataDisplayTextFonts() {
		var w = dataDisplay.offsetWidth;
		dataDisplay.style.fontSize = w / 55 + "px";
	}
	
	function readjustRowA2TextFonts() {
		var w = _.baseWidth;
		var fontSizes;
		if ( _.isUSMapVisible ) {
			fontSizes = [w / 60, w / 100, w / 100, w / 100, w / 100, w / 100, w / 140];
		}
		else {
			fontSizes = [w / 30, w / 50, w / 50, w / 50, w / 50, w / 50, w / 70];
		}
		var padding = w / 800 + "px";
		for ( var i = 0; i < rowA2.children.length; i++ ) {
			var div = rowA2.children[i];
			div.style.fontSize = fontSizes[i] + "px";
			div.style.paddingBottom = padding;
			if ( i == 0 ) {
				div.style.fontWeight = "bold";
			}
		}
	}
	
    $( document ).ready( function() {
        init();
    } );
}) ();