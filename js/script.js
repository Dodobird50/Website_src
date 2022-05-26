( function() {
	// "Global" variables
	var isMobile, baseWidth, bodyWidth, finishedSetup;
    var userSettings;
	var resize;
	var baseMinWidth, isUSMapVisible, stateCircleData, charts;
	var lastUpdatedOn, timestamp;
	
	var allData, dataFromToday, entriesFromToday, calendarFromToday;
    var dataFromYesterday, entriesFromYesterday, calendarFromYesterday;
    var dataDisplayHeaderHTML;
    var changeDataFromTodayIndex;
    
    const dataDisplayHeaderHTMLs = [
        '<div id="dataDisplayHeader" class="row">'
            +'<div><br>Rank</div>'
            +'<div><br>State/territory</div>'
            +'<div><br>Total cases</div>'
            +'<div>Per 100,000 people</div>'
            +'<div>7 day average <br>of new cases</div>'
            +'<div>Per 100,000 people</div>'
            +'<div><br>Total deaths</div>'
            +'<div>Updated today?</div>'
        +'</div>',
        
        '<div id="dataDisplayHeader" class="row">'
            +'<div><br><br>Rango</div>'
            +'<div><br><br>Estado/territorio</div>'
            +'<div><br><br>Casos totales</div>'
            +'<div><br>Por 100.000 personas</div>'
            +'<div>Promedio de 7 días de casos nuevos</div>'
            +'<div><br>Por 100.000 personas</div>'
            +'<div><br>Muertes totales</div>'
            +'<div><br>¿Actualizado hoy?</div>'
        +'</div>',
        
        '<div id="dataDisplayHeader" class="row">'
            +'<div><br>排名</div>'
            +'<div><br>州/领土</div>'
            +'<div><br>累计确诊</div>'
            +'<div><br>每10万人中</div>'
            +'<div>新确诊的7天<br>平均</div>'
            +'<div><br>每10万人中</div>'
            +'<div><br>累计死亡</div>'
            +'<div>今天更新了吗？</div>'
        +'</div>',
            
        '<div id="dataDisplayHeader" class="row">'
            +'<div><br><br>Rang</div>'
            +'<div><br><br>État/territoire</div>' 
            +'<div><br>Nombre total des cas</div>'
            +'<div><br>Pour 100&nbsp;000 personnes</div>'
            +'<div>Moyenne sur <br>7 jours de nouveaux cas</div>'
            +'<div><br>Pour 100&nbsp;000 personnes</div>'
            +'<div><br>Nombre total des décès</div>'
            +'<div><br>Mis à jour aujourd\'hui?</div>'
        +'</div>',
        
        '<div id="dataDisplayHeader" class="row" onmouseenter="displayNationalStats()">'
            +'<div><br>ランク</div>'
            +'<div><br>州/領土</div>'
            +'<div><br>累積診断</div>' 
            +'<div>10万人あたりの</div>'
            +'<div>新たに診断の7日間の平均</div>'
            +'<div>10万人あたりの</div>'
            +'<div><br>累積死亡</div>' 
            +'<div>今日更新しましたか？</div>'
        +'</div>'
    ];
    const lg = "lightgray";
    const b = "black";

	function init() {
		body = document.getElementsByTagName( "body" )[0];
		isMobile = false;
		try {
			var indexOfLeftBrace = document.cookie.indexOf( "{" );
			var indexOfRightBrace = document.cookie.indexOf( "}" );
			userSettings = JSON.parse( document.cookie.substring( indexOfLeftBrace, indexOfRightBrace + 1 ) );
            
            // Validation
            var isValid = Math.abs( userSettings.sortingMethod ) <= 5;
            if ( !isValid ) {
                throw new Error();  // Redirect to catch
            }
            
            var validLanguages = ["en-US", "es-ES", "zh-CN", "fr-FR", "ja-JP"];
            isValid = false;
            for ( var i = 0; i < 5; i++ ) {
                if ( userSettings.language == validLanguages[i] ) {
                    isValid = true;
                    break;
                }
            }
            if ( !isValid ) {
                throw new Error();
            }
            
            isValid = false;
            if ( userSettings.pinnedState ) {
                for ( var i = 0; i < 55; i++ ) {
                    if ( userSettings.pinnedState == stateAbbreviations[i] ) {
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
			userSettings = {};
            userSettings.language = "en-US";
            userSettings.indicateUpdatedStates = false;
            userSettings.isNightMode = false;
            userSettings.hideLanguageDiv = false;
            // userSettings.sortingMethod = 0 is an indicator that there were no cookies stored
            // Cookies will be stored during processData
            userSettings.sortingMethod = 0;
            userSettings.pinnedState = null;
		}
        
		setTitle();
        if ( userSettings.isNightMode ) {
            document.getElementsByTagName( "body" )[0].style.backgroundColor = b;
        }
		
		// Adjust selected option in select0 to option containing the language in document.cookies
        select0.value = userSettings.language;
        select0.onchange = select0Change;
		
		if ( navigator.userAgent.match( /Android/i ) || navigator.userAgent.match( /webOS/i ) 
			|| navigator.userAgent.match( /iPhone/i ) || navigator.userAgent.match( /iPad/i ) 
			|| navigator.userAgent.match( /iPod/i ) || navigator.userAgent.match( /BlackBerry/i ) 
			|| navigator.userAgent.match( /Windows Phone/i ) ) {
			isMobile = true;
		}
		
        // If operating system is Windows, then enable Calibri font
		if ( navigator.userAgent.indexOf( "Win" ) != -1 ) {
			body.style.fontFamily = "Calibri";
		}
		
		var doResize = function() {
			if ( finishedSetup && bodyWidth != body.offsetWidth ) {
                bodyWidth = body.offsetWidth;
				readjustSizes();
				resize = null;
			}
		};
		window.onresize = function() {
            // Reset resize contents timer
			if ( resize != null ) {
				clearTimeout( resize );
			}
			
            // Resize contents in 0.25 seconds when window is resized
			resize = setTimeout( doResize, 250 );
		};
		
        if ( !isMobile ) {
            window.onscroll = function() {
                if ( isTimeTravelActive() ) {
                    var left = parseFloat( base.style.paddingLeft ) - window.pageXOffset;
                    timeTravelDiv.style.left = left + "px";
                    
                    recolorTimeTravelDivBorder();
                }
            };
        }

		var doCheckForUpdates = function() {
            if ( !finishedSetup ) {
                return;
            }
            
            // Purpose of "../data/last-updated.txt": to indicate timestamp of data.json without downloading entire data.json file.
            // Timestamp of data.json and last-updated.txt are usually synchronized.
			$.get( "../data/last-updated.txt", function( responseText ) {
                var newTimestamp = parseInt( responseText );
                // If last-updated.txt is equal to timestamp, then data.json and allData are synchronized.
                // If last-updated.txt is behind timestamp, then data.json and allData are synchronized, but last-updated.txt
                // hasn't been "caught up" with data.json yet due to update delays.
				if ( newTimestamp > timestamp ) {
					// If last-updated.txt is ahead of timestamp, then timestamp in data.json is likely ahead of timestamp in allData.
					$.get( "../data/data.json", function( data ) {
						var newAllData = JSON.parse( data );
						var newDataFromToday = newAllData[newAllData.length - 1];
						
						if ( newDataFromToday.t <= allData[allData.length - 1].t ) {
                            // Timestamp in data.json is not guaranteed to be ahead of timestamp in allData due to update delays.
                            // If that happens, reject data.json.
                            // For example, timestamp is 50000, data.json is 50000
							return;
						}

						setTimeout( function() {
                            // If time travel is inactive (timeTravelRange is set to today), then continue to make time travel inactive
                            // by setting dataFromTodayIndex to newAllData.length - 1, which may be larger than allData.length - 1
                            var wasTimeTravelActive = userSettings.dataFromTodayIndex >= 0;
                            // Extend max of timeTravelRange (length of allNewData may be longer)
                            timeTravelRange.max = newAllData.length - 1 + "";
                            
                            if ( !wasTimeTravelActive ) {
                                // Scroll timeTravelRange to the end
                                timeTravelRange.value = newAllData.length - 1 + "";
                            }
                            processData( newAllData );
                            
                            // Refresh display
                            setLastUpdatedOnText();
							refreshDataDisplay();
							loadColB();
							for ( var i = 0; i < charts.length; i++ ) {
								var state = charts[i].state;
								var checked = i % 2 == 1 && charts[i].checkbox.checked;
                                makeChart( charts[i], state, true );
								if ( checked ) {
                                    charts[i].checkbox.checked = true;
                    				charts[i].checkbox.onclick();
								}
							}
							
							// Update timestamp
							timestamp = allData[allData.length - 1].t;
							
							var scrollTop = html.scrollTop;	// Get scroll position before updateDiv is added
							var updateAlreadyVisible = true;
							if ( updateDiv.className == "d-none" ) {
								updateDiv.className = "";
								updateAlreadyVisible = false;
                                
                                // While updateDiv was hidden, language might have changed
                                setDismissUpdateButtonInnerHTML();
							}
                            // Update notification inner HTML always changes between data updates
                            setUpdateNotificationInnerHTML();
							
							// readjustSizes(), but only for update
							var w = baseWidth;
							
							var fontSize;
							if ( isUSMapVisible ) {
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
        var checkForUpdates = setInterval( doCheckForUpdates, 10000 );
		
        // Set up everything, make base visible, then readjustSizes()
		dismissUpdateButton.onclick = function() {
			updateDiv.className = "d-none";
		};
		
        setHideLanguageDivButtonInnerHTML();
        if ( userSettings.hideLanguageDiv ) {
            languageDiv.className = "d-none";
        }
        hideLanguageDivButton.onclick = function() {
            userSettings.hideLanguageDiv = true;
            languageDiv.className = "d-none";
            updateCookies();
        }
        
        toggleNightModeButton.onclick = toggleNightMode;
        setToggleNightModeButtonInnerHTML();
        
        dataDisplay.onmouseleave = displayNationalStats;
        
        // Set options for select2
        select2.onchange = select2Change;
		for ( var i = 0; i < states.length; i++ ) {
			var state = states[i];
            var stateAbbreviation = stateAbbreviations[i];
			var option = document.createElement( "option" );
			option.innerHTML = translate( state );
			option.setAttribute( "value", stateAbbreviation );
			select2.appendChild( option );
		}
        resetChartsButton.onclick = resetCharts;
		
		$.ajaxSetup( { cache: false } );	// Disable cache
		$.get( "../data/data.json", function( data ) {
            var dataFromJSON = JSON.parse( data );
			processData( dataFromJSON );
            setLastUpdatedOnText();
            
			// If last-updated.txt hasn't caught up with data.json, then timestamp will be "ahead" of last-updated.txt.
			// timestamp is bound to data.
			timestamp = allData[allData.length - 1].t;
			
			dataDisplayHeaderHTML = dataDisplayHeaderHTMLs[languageIndex()];
            
			refreshDataDisplay();
			
            setTimeTravelRangeLabelInnerHTML();
            timeTravelRange.min = "30";
            timeTravelRange.max = allData.length - 1 + "";
            if ( isTimeTravelActive() ) {
                if ( !isMobile ) {
                    timeTravelDiv.style.position = "fixed";
                    timeTravelDiv.style.width = bodyWidth - 0.03 * baseWidth + "px";
                    if ( !userSettings.isNightMode ) {
                        timeTravelDiv.style.borderColor = "black";
                    }
                }
                timeTravelRange.value = userSettings.dataFromTodayIndex + "";
            }
            else {
                timeTravelRange.value = allData.length - 1 + "";
            }
            
			$.get( "../data/state-circle-data.txt", function( responseText ) {
				stateCircleData = responseText;
                // No need to loadColB(), as it will be done during readjustSizes()
                
				setResetChartsButtonInnerHTML();
                setIndicateUpdatedStatesCheckboxLabelInnerHTML();
                if ( userSettings.indicateUpdatedStates ) {
                    indicateUpdatedStatesCheckbox.checked = true;
                }
                indicateUpdatedStatesCheckbox.onclick = toggleIndicateUpdatedStates;
                
                // Create charts
                charts = [ 
    				totalCasesChart, newCasesChart, totalCasesPer100000PeopleChart, newCasesPer100000PeopleChart, 
                    totalDeathsChart, newDeathsChart
    			];
                
                for ( var i = 0; i < charts.length; i++ ) {
                    charts[i].dateRange = 0;
				}
                
                base.className = "container-fluid";
        		body.style.overflowY = "scroll";
                bodyWidth = body.offsetWidth;
                baseMinWidth = 0.9 * bodyWidth;
                if ( !isMobile ) {
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

                isUSMapVisible = getComputedStyle( colB ).display != "none";
                readjustSizes();
                
                if ( userSettings.isNightMode ) {
                    userSettings.isNightMode = false;
                    toggleNightMode();
                }
				finishedSetup = true;
			});
            
            var doChangeDataFromTodayIndex = function() {
                var value = parseInt( timeTravelRange.value );
                if ( value == allData.length - 1 ) {
                    value = -1;
                }
                if ( !finishedSetup || value == userSettings.dataFromTodayIndex ) {
                    changeDataFromTodayIndex = null;
                    return;
                }
                
                userSettings.dataFromTodayIndex = value;
                if ( isTimeTravelActive() ) {
                    dataFromToday = allData[userSettings.dataFromTodayIndex];
                    dataFromYesterday = allData[userSettings.dataFromTodayIndex - 1];
                }
                else {
                    dataFromToday = allData[allData.length - 1];
                    dataFromYesterday = allData[allData.length - 2];
                }
                entriesFromToday = dataFromToday.e;
                calendarFromToday = dataFromToday.d;
                entriesFromYesterday = dataFromYesterday.e;
                calendarFromYesterday = dataFromYesterday.d;
                
        		sortEntries();
                setLastUpdatedOnText();
                refreshDataDisplay();
                loadColB();
                for ( var i = 0; i < charts.length; i++ ) {
                    var state = charts[i].state;
                    var checked = i % 2 == 1 && charts[i].checkbox.checked;
                    makeChart( charts[i], state, true );
                    if ( checked ) {
                        charts[i].checkbox.checked = true;
        				charts[i].checkbox.onclick();
                    }
                }
                
                if ( !isMobile ) {
                    if ( !isTimeTravelActive() ) {
                        if ( !timeTravelRange.isActive ) {
                            timeTravelDiv.style.position = "";
                            // Reset timeTravelDiv to span entire base
                            timeTravelDiv.style.width = "";
                            timeTravelDiv.style.left = "";
                            recolorTimeTravelDivBorder();
                        }
                    }
                    else {
                        timeTravelDiv.style.position = "fixed";
                        // Make timeTravelDiv aligned with base even if window is scrolled right
                        var left = parseFloat( base.style.paddingLeft ) - window.pageXOffset;
                        timeTravelDiv.style.left = left + "px";
                        // Force timeTravelDiv to span the entire base over just the entire body
                        timeTravelDiv.style.width = 0.97 * baseWidth + "px";
                        recolorTimeTravelDivBorder();
                    }
                }

                changeDataFromTodayIndex = null;
                updateCookies();
            }
            timeTravelRange.oninput = function() {
                var value = parseInt( timeTravelRange.value );
                if ( value == allData.length - 1 ) {
                    value = -1;
                }

                setTimeTravelRangeLabelInnerHTML( value );
                
                // Only enable doChangeDataFromTodayIndex to execute once every 0.25 seconds
                if ( changeDataFromTodayIndex == null ) {
                    changeDataFromTodayIndex = setTimeout( doChangeDataFromTodayIndex, 250 );
                }
            }
            if ( !isMobile ) {
                timeTravelRange.isActive = false;
                timeTravelRange.onmousedown = function() {
                    timeTravelRange.isActive = true;
                };
                timeTravelRange.onmouseup = function() {
                    timeTravelRange.isActive = false;
                    // Upon disengaging with timeTravelRange, restore it to bottom of the window
                    if ( !isTimeTravelActive() ) {
                        timeTravelDiv.style.position = "";
                        timeTravelDiv.style.left = "";
                        timeTravelDiv.style.width = "";
                        recolorTimeTravelDivBorder();
                    }
                };
            }
		}, "text" );
	}
	
	function processData( allDataFromJSON ) {
		allData = allDataFromJSON;
        if ( userSettings.dataFromTodayIndex == undefined ) {
            userSettings.dataFromTodayIndex = -1;
        }
		
		for ( var i = 0; i < allData.length; i++ ) {
			var data = allData[i];
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
		
        if ( userSettings.dataFromTodayIndex >= 0 ) {
            dataFromToday = allData[userSettings.dataFromTodayIndex];
            dataFromYesterday = allData[userSettings.dataFromTodayIndex - 1];
        }
		else {
            dataFromToday = allData[allData.length - 1];
            dataFromYesterday = allData[allData.length - 2];
        }
		entriesFromToday = dataFromToday.e;
		calendarFromToday = dataFromToday.d;
		entriesFromYesterday = dataFromYesterday.e;
        calendarFromYesterday = dataFromYesterday.d;

        // Will happen if there are currently no cookies
        if ( userSettings.sortingMethod == 0 ) {
            if ( sevenDayAverageInNewCasesPer100000People() >= 10 ) {
                userSettings.sortingMethod = 5;
            }
            else {
                userSettings.sortingMethod = 2;
            }
            updateCookies();
        }
		sortEntries();
	}
    
    function dateAndTimeFromCalendarFromToday() {
        return dateAndTimeFromCalendar( calendarFromToday );
    }
    
    function dateFromCalendarFromYesterday() {
        return dateAndTimeFromCalendar( calendarFromYesterday );
    }
    
    function dateAndTimeFromCalendar( calendar ) {
        if ( calendar[3] == undefined ) {
            return dateFromCalendar( calendar );
        }
        
        var date;
		var time = calendar[3] + ":";
		if ( calendar[4] >= 10 ) {
			time += calendar[4];
		}
		else {
			time += "0" + calendar[4];
		}
        
        switch ( languageIndex() ) {
            case 0: {
                date = calendar[1] + "/" + calendar[2] + "/" + calendar[0];
                return date + ", " + time + " ET";
            }
            case 1:
            case 3: {
                date = calendar[2] + "/" + calendar[1] + "/" + calendar[0];
                if ( languageIndex() == 3 ) {
                    return date + ", " + time + " heure de l'Est";
                }
                else {
                    return date + ", " + time + " hora del este";
                }
            }
            case 2:
            case 4: {
                date = calendar[0] + "/" + calendar[1] + "/" + calendar[2];
                if ( languageIndex() == 4 ) {
                    return date + "、東部時" + time;
                }
                else {
                    return date + "，东部时间" + time + "";
                }
            }
        }
    }

    function dateFromCalendar( calendar ) {
        switch ( languageIndex() ) {
            case 0: {
                return calendar[1] + "/" + calendar[2] + "/" + calendar[0];
            }
            case 1:
            case 3: {
                return calendar[2] + "/" + calendar[1] + "/" + calendar[0];
            }
            case 2:
            case 4: {
                return calendar[0] + "/" + calendar[1] + "/" + calendar[2];
            }
        }
    }

	function compareEntries( entry1, entry2 ) {
		if ( entry1[0] == entry2[0] ) {
			return 0;
        }
		
		var tiebreakerOrder;
        var absSortingMethod = Math.abs( userSettings.sortingMethod );
        
		if ( absSortingMethod == 1 ) {
            // If sorting method is total cases, then tiebreaker order is:
            // Total cases, total cases per capita, 7 day average for total cases, 7 day average for total cases per capita, total deaths
            tiebreakerOrder = [1, 2, 4, 5, 3];
		}
        else if ( absSortingMethod == 2 ) {
            // If sorting method is total cases per capita, then tiebreaker order is:
            // Total cases per capita, total cases, 7 day average for total cases per capita, 7 day average for total cases, total deaths
            tiebreakerOrder = [2, 1, 5, 4, 3];
        }
        else if ( absSortingMethod == 3 ) {
            // If sorting method is total deaths, then tiebreaker order is:
            // Total deaths, total cases, total cases per capita, 7 day average for total cases, 7 day average for total cases per capita
            tiebreakerOrder = [3, 1, 2, 4, 5];
        }
        else if ( absSortingMethod == 4 ) {
            // If sorting method is 7 day average for total cases, then tiebreaker order is:
            // 7 day average for total cases, 7 day average for total cases per capita, total cases, total cases per capita, total deaths
			tiebreakerOrder = [4, 5, 1, 2, 3];
        }
		else if ( absSortingMethod == 5 ) {
            // If sorting method is 7 day average for total cases per capita, then tiebreaker order is:
            // 7 day average for total cases per capita, 7 day average for total cases, total cases per capita, total cases, total deaths
			tiebreakerOrder = [5, 4, 2, 1, 3];
		}
		
		var reverse = userSettings.sortingMethod < 0;
		for ( var i = 0; i < tiebreakerOrder.length; i++ ) {
			var tiebreaker = tiebreakerOrder[i];
            var var1, var2;
            if ( tiebreaker < 4 ) {
                var1 = entry1[tiebreaker];
    			var2 = entry2[tiebreaker];
            }
			else if ( tiebreaker == 4 ) {
                // Compare seven day averages of new cases
                var1 = sevenDayAverageInNewCases( entry1[0] );
                var2 = sevenDayAverageInNewCases( entry2[0] );
            }
            else if ( tiebreaker == 5 ) {
                // Compare seven day averages of new cases per 100,000 people
                var1 = sevenDayAverageInNewCasesPer100000People( entry1[0] );
                var2 = sevenDayAverageInNewCasesPer100000People( entry2[0] );
            }
            var c = var1 - var2;
            if ( reverse ) {
				c = -c;
			}
			if ( c > 0 ) {
				return 1;
			}
			else if ( c < 0 ) {
				return -1;
			}
			// Move on to next tiebreaker
		}
		// To reach here, all data must have been equal
		return entry1[0].localeCompare( entry2[0] );
	}
	
	// Mergesort
	function sortEntries() {
		entriesFromToday = sortEntries2( entriesFromToday, 0, entriesFromToday.length - 1 );
        if ( userSettings.dataFromTodayIndex >= 0 ) {
            allData[userSettings.dataFromTodayIndex].e = entriesFromToday;
        }
		else {
            allData[allData.length - 1].e = entriesFromToday;
        }
	}
	
	function sortEntries2( entries, l, h ) {
		// Subarray length is more than 1
		if ( l < h ) {
			var m = Math.trunc( ( l + h ) / 2 );
			entries = sortEntries2( entries, l, m );
			entries = sortEntries2( entries, m + 1, h );
			entries = merge( entries, l, h );
		}
		
		return entries;
	}
	
	function merge( entries, l, h ) {
		if ( l >= h )
			return;
		var m = Math.trunc( ( l + h ) / 2 );
		var index1 = l;
		var index2 = m + 1;
        // Create copy of entries
		var sorted = JSON.parse( JSON.stringify( entries ) );
		var index3 = l;
		while ( index1 <= m && index2 <= h ) {
			var entry1 = entries[index1];
			var entry2 = entries[index2];
			var c = compareEntries( entry1, entry2 );
			// If entry1 is larger
			if ( c > 0 ) {
				sorted[index3] = entry1;
				index3++;
				index1++;
			}
			// If entry2 is larger
			else if ( c < 0 ) {
				sorted[index3] = entry2;
				index3++;
				index2++;
			}
			else {
				// Add both
				sorted[index3] = entry1;
				index3++;
				sorted[index3] = entry2;
				index3++;
				
				index1++;
				index2++;
			}
		}
		while ( index1 <= m ) {
			var entry1 = entries[index1];
			sorted[index3] = entry1;
			index3++;
			index1++;
		}
		while ( index2 <= h ) {
			var entry2 = entries[index2];
			sorted[index3] = entry2;
			index3++;
			index2++;
		}
		return sorted;
	}
	
    function toggleIndicateUpdatedStates() {
        for ( var i = 2; i <= 56; i++ ) {
            var circle = colB.children[i];
            if ( indicateUpdatedStates() && isUpdatedToday( circle.state ) ) {
                circle.innerHTML = "✔";
            }
            else {
                circle.innerHTML = "";
            }
        }
        
        userSettings.indicateUpdatedStates = indicateUpdatedStates();
        updateCookies();
    }
    
    function pinState( state, rowToPin ) {
        // Place pinnedRow back in default unpinned position
        var pinnedRow = dataDisplay.children[1];
        dataDisplay.removeChild( pinnedRow );
        dataDisplay.insertBefore( pinnedRow, dataDisplay.children[pinnedRow.displayRank] );
        
        pinnedRow.children[0].innerHTML = pinnedRow.displayRank;
        
        if ( userSettings.pinnedState != state ) {
            if ( !rowToPin ) {
                // Locate row with new pin to state, and put the state at the top
                for ( var i = 1; i < dataDisplay.children.length; i++ ) {
                    if ( dataDisplay.children[i].state == state ) {
                        rowToPin = dataDisplay.children[i];
                        break;
                    }
                }
            }
            
            // Insert rowToPin at the top of the table
            dataDisplay.insertBefore( rowToPin, dataDisplay.children[1] );
            rowToPin.children[0].innerHTML = rowToPin.displayRank + "&nbsp;&nbsp;📌";
            userSettings.pinnedState = state;
        }
        else {
            userSettings.pinnedState = null;
        }
        
        updateCookies();
    }
    
    var rowOnMouseEnter = function() {
        // Highlight row, and display state stats of that row
        var self = this;
        displayStateStats( self.state );
        if ( !userSettings.isNightMode ) {
            self.style.backgroundColor = "#ebebeb";
        }
        else {
            self.style.backgroundColor = "#202020";
        }
    };
    var rowOnMouseLeave = function( event ) {
        // De-highlight row
        var self = this;
        self.style.backgroundColor = "";
        
        var index = dataDisplay.children.length - 1;
        var last = dataDisplay.children[index];
        while ( last.className == "row d-none" ) {
            index--;
            var last = dataDisplay.children[index];
        }
        
        // Due to padding bottom of dataDisplay, if self is the last child of dataDisplay and location
        // of mouseleave is at the bottom, act as if mouse left dataDisplay altogether
        if ( self == last && event.clientY > 1 ) {
            displayNationalStats();
        }
    }
    var rowOnClick = function( event ) {
        var self = this;
        var state = self.state;
        if ( event.button == 0 ) {
            setTimeout( function() {
                var state = self.state;
                if ( select2.value != state ) {
                    select2.value = state;
                    select2Change();
                }
                scrollToCharts();
                if ( isMobile ) {
                    self.style.backgroundColor = "";
                    displayNationalStats();
                }
            }, 1 );
        }
        else if ( event.button == 2 ) {
            pinState( state, self );
        }
    }
    
    // refreshDataDisplay must be invoked when the following things happen (after setup is finished):
    // - Data is updated or resorted
    // - Language is changed
    // - When time is changed
    // Before setup is finished, call refreshDataDisplay to setup contents of dataDisplay
	function refreshDataDisplay() {
        var pinnedRow;
        var displayRank = 1;
        if ( finishedSetup ) {
            dataDisplayHeader.outerHTML = dataDisplayHeaderHTML;
            setDataDisplayHeaderFunctionality();
            
            for ( var i = 0; i < entriesFromToday.length; i++ ) {
    			var entry = entriesFromToday[i];
                var row = dataDisplay.children[i + 1];
                row.state = entry[0];
                if ( entry[0] == userSettings.pinnedState ) {
                    pinnedRow = row;
                }

                row.displayRank = displayRank++;
                // Unhighlight row
                row.style.backgroundColor = "";
                setRowInnerHTML( row, entry );
    		}
        }
        else {
            dataDisplay.innerHTML = dataDisplayHeaderHTML;
            setDataDisplayHeaderFunctionality();
    		for ( var i = 0; i < entriesFromToday.length; i++ ) {
    			var entry = entriesFromToday[i];
    			var row = document.createElement( "div" );
    			
    			row.state = entry[0];
                if ( entry[0] == userSettings.pinnedState ) {
                    pinnedRow = row;
                }
    			
                // Add interactive features
    			row.onmouseenter = rowOnMouseEnter;
    			row.onmouseleave = rowOnMouseLeave;
    			row.onmousedown = rowOnClick;
                row.addEventListener( "contextmenu", event => {
                    event.preventDefault();
                });
    			
                row.setAttribute( "class", "row" );
                row.displayRank = displayRank++;
                
                setRowInnerHTML( row, entry );
    			dataDisplay.appendChild( row );
    		}
        }
        
        if ( pinnedRow && dataDisplay.children.length > 1 ) {
            var firstRow = dataDisplay.children[1];
            if ( firstRow != pinnedRow ) {
                // Swap positions of firstRow and pinnedRow
                dataDisplay.insertBefore( pinnedRow, firstRow );
            }
        }
        
        recolorRows();
        displayNationalStats();
	}
    
    var dataDisplayHeaderChildrenSortingMethods = [1, 2, 4, 5, 3]
    var dataDisplayHeaderChildrenOnClick = function() {
        var self = this;
        var simplyReverseEntries = false;
        if ( self.state == 0 ) {
            userSettings.sortingMethod = self.sortingMethod;
            self.style.textDecoration = "underline";
            self.state = 1;
        }
        else if ( self.state == 1 ) {
            userSettings.sortingMethod = -self.sortingMethod;
            self.style.fontStyle = "italic";
            self.state = 2;
            simplyReverseEntries = true;
            
        }
        else {
            userSettings.sortingMethod = self.sortingMethod;
            self.style.fontStyle = "normal";
            self.state = 1;
            simplyReverseEntries = true;
        }
        
        if ( simplyReverseEntries ) {
            for ( var i = 0; i < entriesFromToday.length / 2; i++ ) {
                var j = entriesFromToday.length - i - 1;
                var temp = entriesFromToday[i];
                entriesFromToday[i] = entriesFromToday[j];
                entriesFromToday[j] = temp;
            }
        }
        else {
            sortEntries();
        }
        
        refreshDataDisplay();
        updateCookies();
        
        for ( var i = 0; i < dataDisplay.children[0].children.length; i++ ) {
            var child = dataDisplay.children[0].children[i];
            if ( child.sortingMethod != self.sortingMethod ) {
                child.style.textDecoration = "normal";
                child.style.fontStyle = "normal";
                child.state = 0;
            }
        }
    };
    
    function setDataDisplayHeaderFunctionality() {
        dataDisplayHeader.onmouseenter = displayNationalStats;
        
        for ( var i = 0; i < dataDisplayHeader.children.length; i++ ) {
			var child = dataDisplayHeader.children[i];
			if ( i >= 2 && i < 7 ) {
				child.sortingMethod = dataDisplayHeaderChildrenSortingMethods[i - 2];
				if ( !isMobile ) {
					child.onclick = dataDisplayHeaderChildrenOnClick;
				}
				else {
					child.ontouchend = dataDisplayHeaderChildrenOnClick;
				}
				
				if ( child.sortingMethod == userSettings.sortingMethod ) {
					child.style.textDecoration = "underline";
					child.state = 1;
				}
				else if ( -child.sortingMethod == userSettings.sortingMethod ) {
					child.style.textDecoration = "underline";
					child.style.fontStyle = "italic";
					child.state = 2;
				}
				else {
					child.state = 0;
				}
				
				child.style.cursor = "pointer";
			}
		}
    }
    
    function setRowInnerHTML( row, entry ) {
        if ( !entry ) {
            entry = dataFromToday.getEntry( row.state );
        }
        
        var language = userSettings.language;
        
        var finalHTML = "";
        if ( entry[0] == userSettings.pinnedState ) {
            finalHTML += "<div>" + row.displayRank + "&nbsp;&nbsp;📌</div>";
        }
        else {
            finalHTML += "<div>" + row.displayRank + "</div>";
        }
        finalHTML += "<div>" + translate( stateFromAbbreviation( entry[0] ) ) + "</div>";
        finalHTML += "<div>" + entry[1].toLocaleString( language ) + "</div>";
        finalHTML += "<div>" + entry[2].toLocaleString( language ) + "</div>";
        finalHTML += "<div>" + sevenDayAverageInNewCases( entry[0] ).toLocaleString( language ) + "</div>";
        finalHTML += "<div>" + sevenDayAverageInNewCasesPer100000People( entry[0] ).toLocaleString( language ) + "</div>";
        finalHTML += "<div>" + entry[3].toLocaleString( language ) + "</div>";
        if ( !isUpdatedToday( entry[0] ) ) {
            finalHTML += "<div></div>";
        }
        else {
            // Mark update from yesterday
            finalHTML += "<div>✔</div>";
        }
        row.innerHTML = finalHTML;
    }
    
    var dayModeRowColors = ["red", "orange", "goldenrod", "green", "blue", "purple"];
    var nightModeRowColors = ["red", "orange", "yellow", "lime", "deepskyblue", "mediumpurple"];
    function recolorRows() {
        for ( var i = 1; i < dataDisplay.children.length; i++ ) {
            recolorRow( dataDisplay.children[i] );
		}
    }
    
    function recolorRow( row ) {
        if ( row.className == "row" && row.displayRank - 1 < 6 ) {
            if ( !userSettings.isNightMode ) {
                row.style.color = dayModeRowColors[row.displayRank - 1];
            }
            else {
                row.style.color = nightModeRowColors[row.displayRank - 1];
            }
        }
        else {
            row.style.color = "";
        }
    }
	
    function scrollToCharts() {
        var y = 0.015 * baseWidth;
        if ( updateDiv.className == "" ) {
            y += updateDiv.offsetHeight;
            y += 0.015 * baseWidth;
        }
        
        if ( languageDiv.className != "d-none" ) {
            y += parseFloat( languageDiv.style.height );
            y += parseFloat( languageDiv.style.marginBottom );
        }

        y += row1.offsetHeight;
        y += 0.015 * baseWidth;
        
        window.scrollTo( { left: window.scrollX, top: y, behavior: "smooth" } );
    }
    
	function isEntrySignificant( entry ) {
		return entry[1] >= 20000;
	}
	
	function isStateSignificant( state ) {
		return isEntrySignificant( dataFromToday.getEntry( state ) );
	}
	
    // readjustSizes must be invoked under the following things happen:
    // - window is readjusted (i.e. bodyWidth is changed)
	function readjustSizes() {
        // Determine baseWidth
        if ( bodyWidth > baseMinWidth ) {
            base.style.width = bodyWidth - 1 + "px";
            baseWidth = bodyWidth - 1;
        }
        else {
            base.style.width = baseMinWidth + "px";
            baseWidth = baseMinWidth;
        }
        
		var w = baseWidth;
        if ( isMobile ) {
            // Visibility of colA and colB are not definite
            if ( w >= 975 ) {
                colA.className = "col-6";
                colB.className = "col-6";
                isUSMapVisible = true;
            }
            else {
                colA.className = "";
                colB.className = "d-none";
                isUSMapVisible = false;
            }
        }
        base.style.padding = 0.015 * w + "px";
		
		var fontSize;
		if ( isUSMapVisible ) {
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
            hideLanguageDivButton.style.fontSize = tempFontSize + "px";
            hideLanguageDivButton.style.height = select0.offsetHeight + "px";
            hideLanguageDivButton.style.borderWidth = tempFontSize / 12 + "px";
            if ( isUSMapVisible ) {
                hideLanguageDivButton.style.width = "";
                select0.style.width = "";
                select0.style.right = "";
            }
            else {
                hideLanguageDivButton.style.width = "36%";
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
		if ( isUSMapVisible ) {
			colAWidth = 0.485 * baseWidth;
		}
		else {
			colAWidth = 0.97 * baseWidth;
		}
		
		// Now on rowA2
		readjustrowA2TextFonts();
		// No marginBottom for rowA2, because there is nothing below it
		
		// Now on colB
		loadColB();
        if ( isUSMapVisible ) {
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
		if ( isUSMapVisible ) {
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
		
		// Now on chartControlDiv
        // Similar functionality to updateDiv
        select2.style.fontSize = 1.1 * fontSize + "px";
		resetChartsButton.style.fontSize = fontSize + "px";
		resetChartsButton.style.borderWidth = fontSize / 12 + "px";
        select2.style.height = resetChartsButton.offsetHeight + "px";
        chartControlDiv.style.height = select2.style.height;
        if ( isUSMapVisible ) {
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
        
        if ( finishedSetup ) {
            for ( var i = 0; i < charts.length; i++ ) {
    			var checked = i % 2 == 1 && charts[i].checkbox.checked;

                // checkboxLabelWidth will have changed with a new screen width
                checkboxLabelWidth = null;
    			makeChart( charts[i], charts[i].state, false );
    			if ( checked ) {
                    charts[i].checkbox.checked = true;
    				charts[i].checkbox.onclick();
    			}
    		}
        }
		else {
            // This code will be invoked the first time readjustSizes() is invokved before finishedSetup is true
            for ( var i = 0; i < charts.length; i++ ) {
                checkboxLabelWidth = null;
    			makeChart( charts[i], "USA", false );
    		}
        }

        timeTravelDiv.style.borderWidth = charts[0].style.borderWidth;
        timeTravelDiv.style.bottom = base.style.paddingBottom;
        if ( !isMobile && isTimeTravelActive() ) {
            timeTravelDiv.style.width = 0.97 * baseWidth + "px";
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
	
	function readjustrowA2TextFonts() {
		var w = baseWidth;
		var fontSizes;
		if ( isUSMapVisible ) {
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
	
	function displayStateStats( state ) {
		var entry = getEntryFromToday( state );
		var yesterdayEntry = getEntryFromYesterday( state );
		var changeInCases = entry[1] - yesterdayEntry[1];
		var changeInCasesPer100000People = entry[2] - yesterdayEntry[2];
        var newCasesAverage = sevenDayAverageInNewCases( state );
        var newCasesPer100000PeopleAverage = sevenDayAverageInNewCasesPer100000People( state );
		var changeInDeaths = entry[3] - yesterdayEntry[3];
        var yesterday =  dateFromCalendarFromYesterday();
        
		var strings;
        var language = userSettings.language;
        switch ( languageIndex() ) {
			case 0: {
				strings = [
					" - Total cases: " + entry[1].toLocaleString( language ) + " (+" 
						+ changeInCases.toLocaleString( language ) + " from yesterday)",
                    
					"&emsp;&emsp; - Per 100,000 people: " + entry[2].toLocaleString( language ) + " (+" 
						+ changeInCasesPer100000People.toLocaleString( language ) + " from yesterday)",
                    
                    "- 7 day average of new cases (as of ?): " + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - Per 100,000 people: " + newCasesPer100000PeopleAverage.toLocaleString( language ),
                    
					" - Total deaths: " + entry[3].toLocaleString( language ) + " (+" 
						+ changeInDeaths.toLocaleString( language ) + " from yesterday)",
				];
				break;
			}
			case 1: {
				strings = [
					" - Casos totales: " + entry[1].toLocaleString( language ) + " (+" 
						+ changeInCases.toLocaleString( language ) + " de ayer)",
                        
					"&emsp;&emsp; - Por 100,000 personas: " + entry[2].toLocaleString( language ) + " (+" 
						+ changeInCasesPer100000People.toLocaleString( language ) + " de ayer)",
                    
                    " - Promedio de 7 días de casos nuevos (a partir de ?): " + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - Por 100.000 personas: " + newCasesPer100000PeopleAverage.toLocaleString( language ),
                        
					" - Muertes totales: " + entry[3].toLocaleString( language ) + " (+" 
						+ changeInDeaths.toLocaleString( language ) + " de ayer)",
				];
				break;
			}
			case 2: {
				var strings = [
					" - 累计确诊：" + entry[1].toLocaleString( language ) + " (从昨天+" 
						+ changeInCases.toLocaleString( language ) + ")",
                    
					"&emsp;&emsp; - 每10万人中：" + entry[2].toLocaleString( language ) + " (从昨天+" 
						+ changeInCasesPer100000People.toLocaleString( language ) + ")",
                    
                    " - 新确诊的7天平均(截至?)：" + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - 每10万人中：" + newCasesPer100000PeopleAverage.toLocaleString( language ),
                    
					" - 累计死亡：" + entry[3].toLocaleString( language ) + " (从昨天+" 
						+ changeInDeaths.toLocaleString( language ) + ")",
				];
				break;
			}
			case 3: {
				strings = [
					" - Nombre total des cas: " + entry[1].toLocaleString( language ) + " (+" 
						+ changeInCases.toLocaleString( language ) + " d'hier)",
                    
					"&emsp;&emsp; - Pour 100 000 personnes: " + entry[2].toLocaleString( language ) 
						+ " (+" + changeInCasesPer100000People.toLocaleString( language ) + " d'hier)",
                    
                    " - Moyenne sur 7 jours de nouveaux cas (à partir ?): " 
                        + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - Pour 100 000 personnes: " 
                        + newCasesPer100000PeopleAverage.toLocaleString( language ),
                    
					" - Nombre total des décès: " + entry[3].toLocaleString( language ) + " (+" 
						+ changeInDeaths.toLocaleString( language ) + " d'hier)",
				];
				break;
			}
			case 4: {
				var strings = [
					" - 累積診断：" + entry[1].toLocaleString( language ) + " (昨日から+" 
						+ changeInCases.toLocaleString( language ) + ")",
                    
					"&emsp;&emsp; - 10万人あたりの：" + entry[2].toLocaleString( language ) + " (昨日から+" 
						+ changeInCasesPer100000People.toLocaleString( language ) + ")",
                    
                    " - 新たに診断の7日間の平均(?現在)：" + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - 10万人あたりの：" + newCasesPer100000PeopleAverage.toLocaleString( language ),
                    
					" - 累積死亡：" + entry[3].toLocaleString( language ) + " (昨日から+" 
						+ changeInDeaths.toLocaleString( language ) + ")",
				];
				break;
			}
		}
        
        strings.unshift( translate( stateFromAbbreviation( state ) ) + ":" );
        strings.push( lastUpdatedOn );
		
        fillRowA2StringsMissingInfo( strings );
        fillRowA2( strings );
	}
	
	function displayNationalStats() {
		var changeInCases = dataFromToday.n[0] - dataFromYesterday.n[0];
		var changeInCasesPer100000People = dataFromToday.n[1] - dataFromYesterday.n[1];
        var newCasesAverage = sevenDayAverageInNewCases();
        var newCasesPer100000PeopleAverage = sevenDayAverageInNewCasesPer100000People();
		var changeInDeaths = dataFromToday.n[2] - dataFromYesterday.n[2];
        var yesterday = dateFromCalendarFromYesterday();
        
		var strings;
        var language = userSettings.language;
		switch ( languageIndex() ) {
			case 0: {
				strings = [
                    "Across the country:",
				
					" - Total cases: " + dataFromToday.n[0].toLocaleString( language ) + " (+" 
						+ changeInCases.toLocaleString( language ) + " from yesterday)",
                    
					"&emsp;&emsp; - Per 100,000 people: " + dataFromToday.n[1].toLocaleString( language ) + " (+" 
						+ changeInCasesPer100000People.toLocaleString( language ) + " from yesterday)",
                    
                    "- 7 day average of new cases (as of ?): " + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - Per 100,000 people: " + newCasesPer100000PeopleAverage.toLocaleString( language ),
                    
					" - Total deaths: " + dataFromToday.n[2].toLocaleString( language ) + " (+" 
						+ changeInDeaths.toLocaleString( language ) + " from yesterday)",
				];
				break;
			}
			case 1: {
				strings = [
                    "A escala nacional:",
				
					" - Casos totales: " + dataFromToday.n[0].toLocaleString( language ) + " (+" 
						+ changeInCases.toLocaleString( language ) + " de ayer)",
                        
					"&emsp;&emsp; - Por 100,000 personas: " + dataFromToday.n[1].toLocaleString( language ) + " (+" 
						+ changeInCasesPer100000People.toLocaleString( language ) + " de ayer)",
                    
                    " - Promedio de 7 días de casos nuevos (a partir de ?): " + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - Por 100.000 personas: " + newCasesPer100000PeopleAverage.toLocaleString( language ),
                        
					" - Muertes totales: " + dataFromToday.n[2].toLocaleString( language ) + " (+" 
						+ changeInDeaths.toLocaleString( language ) + " de ayer)",
				];
				break;
			}
			case 2: {
				var strings = [
					"全美国：",
				
					" - 累计确诊：" + dataFromToday.n[0].toLocaleString( language ) + " (从昨天+" 
						+ changeInCases.toLocaleString( language ) + ")",
                    
					"&emsp;&emsp; - 每10万人中：" + dataFromToday.n[1].toLocaleString( language ) + " (从昨天+" 
						+ changeInCasesPer100000People.toLocaleString( language ) + ")",
                    
                    "- 新确诊的7天平均(截至?)：" + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - 每10万人中：" + newCasesPer100000PeopleAverage.toLocaleString( language ),
                    
					" - 累计死亡：" + dataFromToday.n[2].toLocaleString( language ) + " (从昨天+" 
						+ changeInDeaths.toLocaleString( language ) + ")",
				];
				break;
			}
			case 3: {
				strings = [
					"À l'échelle nationale" + ":",
					
					" - Nombre total des cas: " + dataFromToday.n[0].toLocaleString( language ) + " (+" 
						+ changeInCases.toLocaleString( language ) + " d'hier)",
                    
					"&emsp;&emsp; - Pour 100 000 personnes: " + dataFromToday.n[1].toLocaleString( language ) 
						+ " (+" + changeInCasesPer100000People.toLocaleString( language ) + " d'hier)",
                    
                    " - Moyenne sur 7 jours de nouveaux cas (à partir ?): " 
                        + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - Pour 100 000 personnes: " 
                        + newCasesPer100000PeopleAverage.toLocaleString( language ),
                    
					" - Nombre total des décès: " + dataFromToday.n[2].toLocaleString( language ) + " (+" 
						+ changeInDeaths.toLocaleString( language ) + " d'hier)",
				];
				break;
			}
			case 4: {
				var strings = [
					"全国で：",
				
					" - 累積診断：" + dataFromToday.n[0].toLocaleString( language ) + " (昨日から+" 
						+ changeInCases.toLocaleString( language ) + ")",
                    
					"&emsp;&emsp; - 10万人あたりの：" + dataFromToday.n[1].toLocaleString( language ) + " (昨日から+" 
						+ changeInCasesPer100000People.toLocaleString( language ) + ")",
                    
                    " - 新たに診断の7日間の平均(?現在)：" + newCasesAverage.toLocaleString( language ),
                    
                    "&emsp;&emsp; - 10万人あたりの：" + newCasesPer100000PeopleAverage.toLocaleString( language ),
                    
					" - 累積死亡：" + dataFromToday.n[2].toLocaleString( language ) + " (昨日から+" 
						+ changeInDeaths.toLocaleString( language ) + ")",
				];
				break;
			}
		}
        strings.push( lastUpdatedOn );

        fillRowA2StringsMissingInfo( strings );
        fillRowA2( strings );
	}

    function fillRowA2StringsMissingInfo( strings ) {
        if ( !isTimeTravelActive() ) {
            switch ( languageIndex() ) {
                case 0: {
                    strings[3] = strings[3].replace( "?", "yesterday" );
                    break;
                }
                case 1: {
                    strings[3] = strings[3].replace( "?", "ayer" );
                    break;
                }
                case 2: {
                    strings[3] = strings[3].replace( "?", "昨天" );
                    break;
                }
                case 3: {
                    strings[3] = strings[3].replace( "?", "d'hier" );
                    break;
                }
                case 4: {
                    strings[3] = strings[3].replace( "?", "昨日" );
                    break;
                }
            }
        }
        else {
            switch ( languageIndex() ) {
                case 0: {
                    strings[3] = strings[3].replace( "?", "today" );
                    break;
                }
                case 1: {
                    strings[3] = strings[3].replace( "?", "hoy" );
                    break;
                }
                case 2: {
                    strings[3] = strings[3].replace( "?", "今天" );
                    break;
                }
                case 3: {
                    strings[3] = strings[3].replace( "?", "d'aujourd'hui" );
                    break;
                }
                case 4: {
                    strings[3] = strings[3].replace( "?", "今日" );
                    break;
                }
            }
        }
    }

    function fillRowA2( strings ) {
        if ( strings.length != 7 ) {
            throw new Error( "rowA2 must have 7 strings" );
        }
        
        var w = baseWidth;
	    
        if ( rowA2.children.length == 0 ) {
            if ( isUSMapVisible ) {
                var fontSizes;
				fontSizes = [w / 60, w / 100, w / 100, w / 100, w / 100, w / 100, w / 140];
			}
			else {
				fontSizes = [w / 30, w / 50, w / 50, w / 50, w / 50, w / 50, w / 70];
			}
            
            var padding = w / 800 + "px";
			for ( var i = 0; i < 7; i++ ) {
				var div = document.createElement( "div" );
                
				strings[i] = strings[i].replaceAll( "+-", "-" );
				div.innerHTML = strings[i];
				div.style.fontSize = fontSizes[i] + "px";
				div.style.paddingBottom = padding;
				if ( i == 0 ) {
					div.style.fontWeight = "bold";
				}
				
				rowA2.appendChild( div );
			}
        }
        else {
            for ( var i = 0; i < 7; i++ ) {
				var div = rowA2.children[i];
				strings[i] = strings[i].replaceAll( "+-", "-" );
				div.innerHTML = strings[i];
			}
        }
    }

    var lastMultiplier;
    // loadColB must be called when the following things happen (after setup is finished):
    // - Window size is changed
    // - Language is changed
    // - When time is changed
    // - Data is updated
    // Before setup, call loadColB once to setup contents of colB
	function loadColB() {
		if ( !isUSMapVisible && finishedSetup ) {
			return;
		}

        colB.style.height = 0.35625 * baseWidth + "px";
        
        if ( finishedSetup ) {
            usMap.width = 0.475 * baseWidth;
            usMap.height = 0.75 * 0.475 * baseWidth;
            
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
            
            var multiplier = 0.00059375 * baseWidth;
            for ( var i = 2; i < colB.children.length; i++ ) {
                var circle = colB.children[i];
                
                setColorOfCircle( circle );
                if ( isUpdatedToday( circle.state ) && indicateUpdatedStates() ) {
                    circle.innerHTML = "✔";
                }
                else {
                    circle.innerHTML = "";
                }
                
                if ( lastMultiplier != multiplier ) {
                    var circleLeft = circle.defaultLeft * multiplier + 0.01 * baseWidth;
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
				if ( !isMobile ) {
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
		var multiplier = 0.00059375 * baseWidth;
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
            setColorOfCircle( circle );
            var circleLeft, circleTop, circleWidth;
            if ( indicateUpdatedStates() && isUpdatedToday( circle.state ) ) {
                circle.innerHTML = "✔";
            }
            else {
                circle.innerHTML = "";
            }

            var circleLeft = circle.defaultLeft * multiplier + 0.01 * baseWidth;
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
            
            setupFunctionalityOfCircle( circle );
			
			colB.appendChild( circle );
		}
			
		colB.activeBox = null;
		colB.onmousemove = function( event ) {
            if ( event.movementX == 0 && event.movementY == 0 ) {
                return;
            }
            
			if ( event.pageX >= colB.offsetLeft && event.pageX < colB.offsetLeft + 0.01 * baseWidth ) {
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
				if ( newLeft < 0.01 * baseWidth ) {
					newLeft = 0.01 * baseWidth;
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

    function indicateUpdatedStates() {
        return indicateUpdatedStatesCheckbox.checked;
    }

    var zeroCases = [0, 240, 0];    // 0 new cases / 100000 people (green)
    var mild = [240, 240, 0];       // 25 new cases / 100000 people (yellow)
    var moderate = [240, 120, 0];   // 75 new cases / 100000 people (orange-red)
    var severe = [120, 0, 20];      // 150 new cases / 100000 people (dark red)
    var extreme = [60, 0, 40];      // 300+ new cases / 100000 people (dark purple)
    var ranges = [[0, 25], [25, 75], [75, 150], [150, 300]];
    var correspondingColors = [[zeroCases, mild], [mild, moderate], [moderate, severe], [severe, extreme]];
    function setColorOfCircle( circle ) {
        var state = circle.state;
        var entry = getEntryFromToday( state );
        var averageCasesPer100000 = sevenDayAverageInNewCasesPer100000People( circle.state );

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
            circle.style.backgroundColor = "rgb(60,0,40)";
            circle.style.color = "white";
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

    function toggleCircleBorder( circle ) {
        var circleLeft, circleTop, circleWidth;
        var multiplier = 0.00059375 * baseWidth;
        if ( circle.style.borderStyle == "" ) {
            circle.style.borderStyle = "solid";
            var borderWidth = parseFloat( circle.style.borderWidth );
            circleLeft = circle.defaultLeft * multiplier + 0.01 * baseWidth - borderWidth;
            circleTop = circle.defaultTop * multiplier - borderWidth;
            circleWidth = circle.defaultWidth * multiplier + 2 * borderWidth;
        }
        else {
            circle.style.borderStyle = "";
            circleLeft = circle.defaultLeft * multiplier + 0.01 * baseWidth;
            circleTop = circle.defaultTop * multiplier;
            circleWidth = circle.defaultWidth * multiplier;
        }
        
        circle.style.left = circleLeft + "px";
        circle.style.top = circleTop + "px";
        circle.style.width = circleWidth + "px";
        circle.style.height = circleWidth + "px";
        circle.radius = circleWidth / 2;
    }

    function setupFunctionalityOfCircle( circle ) {
        if ( !isMobile ) {
            circle.isActive = false;
            circle.onmouseenter = function() {
                var self = this;
                if ( self.isPinned ) {
                    return;
                }
                
                var box = self.stateDataBox;
                if ( !self.stateDataBox ) {
                    // Create box, append it, and adjust its width
                    self.stateDataBox = getStateDataBox( self );
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
                defaultPositioningOfStateDataBox( self, box );
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
                    pinState( self.state );
                    return;
                }
                
                if ( !self.stateDataBox ) {
                    self.onmouseenter();
                }
                self.isPinned = !self.isPinned;
                toggleCircleBorder( self );
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
                        self.stateDataBox = getStateDataBox( self );
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

	function defaultPositioningOfStateDataBox( circle, box ) {
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

	function getStateDataBox( circle ) {
		var box = document.createElement( "div" );
		box.setAttribute( "class", "state-data-box" );
		box.state = circle.state;
		box.circle = circle;
		
		var multiplier = 0.00059375 * baseWidth;
		box.height = 0.22 * usMap.height;
		
		var entry = getEntryFromToday( circle.state );
		var yesterdayEntry = getEntryFromYesterday( circle.state );
		var delta1 = entry[1] - yesterdayEntry[1];
		var delta2 = entry[2] - yesterdayEntry[2];
		var delta3 = entry[3] - yesterdayEntry[3];
        var newCasesAverage = sevenDayAverageInNewCases( circle.state );
        var newCasesPer100000PeopleAverage = sevenDayAverageInNewCasesPer100000People( circle.state );
        
		var strings;
        var language = userSettings.language;
		switch ( languageIndex() ) {
			case 0: {
				strings = [ 
					stateFromAbbreviation( circle.state ), 
					
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
					translate( stateFromAbbreviation( circle.state ) ), 
                    
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
					translate( stateFromAbbreviation( circle.state ) ), 
                    
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
					translate( stateFromAbbreviation( circle.state ) ) + ":",
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
					translate( stateFromAbbreviation( circle.state ) ) + "：",
					
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
        if ( userSettings.isNightMode ) {
            box.style.borderColor = lg;
            box.style.backgroundColor = "rgb(0,0,75)";
            box.style.color = lg;
        }
        
		box.movedByUser = false;
		if ( !isMobile ) {
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
                        pinState( self.state );       
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
                            select2Change();
        				}
                        
						scrollToCharts();
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
				
				setTimeout( scrollToCharts, 1 );
			};
		}
		
		return box;
	}
	
	function getEntryFromToday( state ) {
		return dataFromToday.getEntry( state );
	}
	
	function getEntryFromYesterday( state ) {
		return dataFromYesterday.getEntry( state );
	}
	
	function select2Change() {
		var state = select2.value;
		for ( var i = 0; i < charts.length; i++ ) {
			var isChecked = i % 2 == 1 && charts[i].checkbox.checked;
			
			makeChart( charts[i], state, false );
			if ( isChecked ) {
                charts[i].checkbox.checked = true;
				charts[i].checkbox.onclick();
			}
		}
	} 
	
	function resetCharts() {
		if ( select2.value != "USA" ) { 
			select2.value = "USA";
			for ( var i = 0; i < charts.length; i++ ) {
				charts[i].dateRange = 0;
				makeChart( charts[i], "USA", false );
			}
		}
        else {
            for ( var i = 0; i < charts.length; i++ ) {
                if ( charts[i].dateRange != 0 ) {
                    charts[i].dateRange = 0;
                }
                makeChart( charts[i], "USA", true );
			}
        }
	}
	
    var checkboxLabelWidth;
	// makeChart must be called under the following conditions (after setup):
    // - Data is updated
    // - Time is changed
    // - Language is changed
    // - Window size is changed
    // - User changes state for charts
    // - User clicks resetChartsButton
	function makeChart( chart, state, dataOrDateRangeChange ) {
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
		
        var width = 0.97 * baseWidth;
		chart.width = width;
		var height = width * 0.375;	// height is 3/8 of width
		style.height = height + "px";
        chart.height = height;
		if ( !chart.toXCoordinate ) {
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
				return -0.8 * h / self.yAxisRange * y + 0.85 * h;
			};
            chart.toY = function( yCoordinate ) {
                var self = this;
				var h = self.height;
                return -self.yAxisRange / 0.8 / h * ( yCoordinate - 0.85 * h );
            };
		}
		
        // Sync borderWidth with that of rowA1
        if ( isUSMapVisible ) {
			style.borderWidth = 0.01 * baseWidth / 12 + "px";
		}
		else {
			style.borderWidth = 0.01 * baseWidth / 6 + "px";
		}
		
		var numberOfPoints = chart.xAxisRange;
        var dateOffset = 0;

		if ( chart.state != state || dataOrDateRangeChange ) {
            var numberOfPoints = isTimeTravelActive() ? userSettings.dataFromTodayIndex : allData.length - 1;
			if ( chart.field % 2 == 0 ) {
                numberOfPoints++;
			}
            
			chart.state = state;
			chart.months = new Array( numberOfPoints );
			chart.days = new Array( numberOfPoints );
			chart.years = new Array( numberOfPoints );
			chart.numbers = new Array( numberOfPoints );	// Number of cases, cases per 100,000 people, or deaths
			chart.sevenDayMovingAverages;
			if ( chart.field % 2 == 1 ) {
				chart.sevenDayMovingAverages = new Array( numberOfPoints );
			}
			
			dataIndex = ( [1, 1, 2, 2, 3, 3] )[chart.field];
            if ( chart.state == "USA" ) {
                dataIndex--;
            } 
			if ( chart.field % 2 == 0 ) {
				for ( var i = 0; i < allData.length; i++ ) {
					var data = allData[i];
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
				for ( var i = 1; i < allData.length; i++ ) {
					var data = allData[i];
					var yesterdayData = allData[i - 1];
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
                for ( var i = 0; i < numberOfPoints; i++ ) {
                    if ( i >= 6 ) {
                        // Index i for sevenDayMovingAverages is 1 behind index i in allData
                        if ( chart.field == 1 ) {
                            chart.sevenDayMovingAverages[i] = sevenDayAverageInNewCases( chart.state, i + 1 );
                        }
                        else if ( chart.field == 3 ) {
                            chart.sevenDayMovingAverages[i] = sevenDayAverageInNewCasesPer100000People( chart.state, i + 1 );
                        }
                        else if ( chart.field == 5 ) {
                            chart.sevenDayMovingAverages[i] = sevenDayAverageInNewDeaths( chart.state, i + 1 );
                        }
                    }
                    else {
                        chart.sevenDayMovingAverages[i] = 0;
                    }
                }
                
                if ( chart.dateRange == 1 ) {
                    while ( numberOfPoints > 120 ) {
                        chart.numbers.shift();
                        chart.years.shift();
                        chart.months.shift();
                        chart.days.shift();
                        
                        chart.sevenDayMovingAverages.shift();
                        numberOfPoints--;
                        dateOffset++;
                    }
                }
            }
            chart.xAxisRange = numberOfPoints;
            
            // Determine max number
            var maxNumber = 0;
            for ( var i = 0; i < numberOfPoints; i++ ) {
                if ( chart.numbers[i] > maxNumber ) {
                    maxNumber = chart.numbers[i];
                }
                if ( chart.field % 2 == 1 && chart.sevenDayMovingAverages[i] > maxNumber ) {
                    maxNumber = chart.sevenDayMovingAverages[i];
                }
            }
            
            // Determine chart.yAxisRange
			if ( maxNumber > 0 ) {
                // Get maxNumber in scientific notation (multiplier * 10^exponent)
                maxNumberExponent = parseInt( Math.log10( maxNumber ) );
                maxNumberMultiplier = maxNumber / Math.pow( 10, maxNumberExponent );
                
                // Requirements:
                // - exponent >= -1 for cases per 100,000 people chart, and exponent >= 0 for all other charts
                // - 1.4 <= multiplier < 14
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
		
        // Insert chart components. From back to front, (polyline or bars), sevenDayMovingAveragePolyline, cover, 
        // (xAxis, yAxis, ticks, labels, and titleNode), (horizontalLine, verticalLine, horizontalLineLabel, verticalLineLabel)
        var draw;
        if ( !chart.draw ) {
            draw = SVG().addTo( "#" + chart.id ).size( width, height * 0.9 );
            draw.node.setAttribute( "id", "svg" + chart.field );
            chart.draw = draw;
        }
        else {
            draw = chart.draw;
            draw.size( width, height * 0.9 );
            var node = draw.node;
            for ( var i = 0; i < node.children.length; i++ ) {
                var child = node.children[i];
                // Only keep xAxis, yAxis, cover, polyline (for total graphs) and bars (for new graphs)
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
        
        // barWidth is only applicable to new charts, strokeWidth is applicable to both total and new charts
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
        
        if ( chart.field % 2 == 0 ) {
            var pointsForPolyline = new Array();
            for ( var i = 0; i < numberOfPoints; i++ ) {
				var number = chart.numbers[i];
				// Only draw data from most recent day if there was an update from the previous day, and/or if time travel is active
				if ( i == numberOfPoints - 1 && !isTimeTravelActive() ) {
					var difference = chart.numbers[i] - chart.numbers[i - 1];
					if ( difference <= 0 ) {
                        numberOfPoints--;
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
                chart.polyline = draw.polyline( pointsForPolyline );
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
            for ( var i = 0; i < numberOfPoints; i++ ) {
                var number = Math.max( 0, chart.numbers[i] );
                // If no change from yesterday, then ignore today
                if ( i == numberOfPoints - 1 && number <= 0 && !isTimeTravelActive() ) {
                    numberOfPoints--;
                    break;
                }
                
                var xCoordinate = chart.toXCoordinate( i + 1 );
                var yCoordinate = chart.toYCoordinate( number );
                var barHeight = 0.85 * height - yCoordinate;
                if ( barHeight < 0 ) {
                    barHeight = 0;
                    // barHeight < 0 also implies yCoordinate > 0.85 * height
                    yCoordinate = 0.85 * height;
                }
                
                if ( chart.bars[i] ) {
                    chart.bars[i].size( barWidth, barHeight ).move( xCoordinate - barWidth / 2, yCoordinate );
                    chart.bars[i].fill( barColor );
                    chart.bars[i].opacity( 1 );
                }
                else {
                    chart.bars[i] = draw.rect( barWidth, barHeight ).fill( barColor ).move( xCoordinate - barWidth / 2, yCoordinate );
                    if ( chart.xAxis ) {
                        // Put chart.bars[i].node behind xAxis
                        draw.node.removeChild( chart.bars[i].node );
                        draw.node.insertBefore( chart.bars[i].node, chart.xAxis.node );
                    }
                    
                    chart.bars[i].defaultColor = barColor;
                    chart.bars[i].node.isBar = true;
                }
                
                // Start on 7th day for sevenDayMovingAverage
				if ( i + dateOffset >= 6 ) {
					var yCoordinateForSevenDayMovingAveragePolyline = chart.toYCoordinate( chart.sevenDayMovingAverages[i] );
					pointsForSevenDayMovingAveragePolyline.push( xCoordinate );
                    pointsForSevenDayMovingAveragePolyline.push( yCoordinateForSevenDayMovingAveragePolyline );
				}
			}
            while ( chart.bars.length > numberOfPoints ) {
                // Remove excess bars
                var bar = chart.bars[chart.bars.length - 1];
                bar.remove();
                chart.bars.pop();
            }
            
            if ( !chart.sevenDayMovingAveragePolyline ) {
                chart.sevenDayMovingAveragePolyline = draw.polyline( pointsForSevenDayMovingAveragePolyline );
				chart.sevenDayMovingAveragePolyline.fill( "none" );
            }
			else {
                chart.sevenDayMovingAveragePolyline.plot( pointsForSevenDayMovingAveragePolyline );
            }
            
            var polylineStrokeColor = ( ["blue", "#6600ff",  "#aa0000"] )[( chart.field - 1 ) / 2];
            var polylineStrokeColorNightMode = ( ["#a5a5ff", "#cdabff",  "#ffa7a7"] )[( chart.field - 1 ) / 2];
			chart.sevenDayMovingAveragePolyline.stroke( { color: polylineStrokeColor, 
                width: strokeWidth, linecap: 'round', linejoin: 'round' } );
            
            chart.sevenDayMovingAveragePolyline.strokeColor = polylineStrokeColor;
            chart.sevenDayMovingAveragePolyline.strokeColorNightMode = polylineStrokeColorNightMode;
            // Don't show sevenDayMovingAveragePolyline yet
			chart.sevenDayMovingAveragePolyline.remove();
        }
		
        if ( !chart.cover ) {
            chart.cover = draw.rect( 0.92 * width, height * 0.1 ).move( 0.06 * width, 0.85 * height - height / 400 ).fill( "white" );
        }
        else {
            chart.cover.size( 0.92 * width, height * 0.1 ).move( 0.06 * width, 0.85 * height - height / 400 ).fill( "white" );
        }
        
        var axisWidth = height / 200;
        // xAxis spans from left edge of yAxis (0.06 * width - height / 400) to 0.98 * width
        // Thickness is height / 200 and vertical center is 0.85 * height
        if ( !chart.xAxis ) {
            chart.xAxis = draw.rect( 0.92 * width + height / 400, axisWidth )
                .move( 0.06 * width - height / 400, 0.85 * height - height / 400 );
        }
        else {
            chart.xAxis.size( 0.92 * width + height / 400, axisWidth )
                .move( 0.06 * width - height / 400, 0.85 * height - height / 400 );
        }
        
        // yAxis spans from 0.025 * height to bottom edge of xAxis (0.85 * height + height / 400)
        // Thickness (width) is height / 200 and horizontal center is 0.06 * height
        if ( !chart.yAxis ) {
            chart.yAxis = draw.rect( axisWidth, 0.825 * height + height / 400 )
                .move( 0.06 * width - height / 400, 0.025 * height );
        }
        else {
            chart.yAxis.size( axisWidth, 0.825 * height + height / 400 )
                .move( 0.06 * width - height / 400, 0.025 * height );
        }
		
		var interval = parseInt( chart.xAxisRange / 30 + 1 );
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
        var fontSizeForXAxisLabels = parseInt( horizontalSpacingBetweenPoints * interval / 3 );
        if ( fontSizeForXAxisLabels > 0.015 * width ) {
            fontSizeForXAxisLabels = 0.015 * width;
        }
        chart.widthForXAxisLabels = horizontalSpacingBetweenPoints * interval;
        for ( var i = 0; i < chart.xAxisRange; i += interval ) {
            // x is one-indexed, different from array indices
            var xCoordinate = chart.toXCoordinate( i + 1 );
            var yCoordinate = 0.85 * height;
            var displayDate = document.createElement( "div" );
            if ( languageIndex() % 2 == 0 ) {
                displayDate.innerHTML = chart.months[i] + "/" + chart.days[i];
            }
            else {
                displayDate.innerHTML = chart.days[i] + "/" + chart.months[i];
            }
            
            displayDate.style.width = chart.widthForXAxisLabels + "px";
            displayDate.style.fontSize = fontSizeForXAxisLabels + "px";
            displayDate.style.left = xCoordinate - horizontalSpacingBetweenPoints * interval / 2 + "px";
            displayDate.style.top = 0.865 * height + "px";
            
            displayDate.className = "x-axis-label";
            chart.appendChild( displayDate );
            chart.labels.push( displayDate );
            
            // Horizontally center tick along xCoordinate, and span it vertically from 0.84 * height to 0.86 * height
            var tick = draw.rect( height / 300, 0.02 * height ).move( xCoordinate - height / 600, 0.84 * height );
            chart.ticks.push( tick );
        }
		
		var y = chart.yAxisRange;
		var xCoordinate = 0.06 * width;
        chart.fontSizeForYAxisLabels = 14 * height / 600;
        
        var language = userSettings.language;
        for ( var y = chart.numMajorTicks * chart.distanceBetweenMajorTicks; y > 0; y -= chart.distanceBetweenMajorTicks ) {
            if ( chart.distanceBetweenMajorTicks < 1 ) {
                y = y.toFixed( 1 );
                if ( y == 0 ) {
                    break;
                }
            }
            
            var yCoordinate = chart.toYCoordinate( y );
            // Vertically center at yCoordinate, span from 0.055 * width to 0.065 * width
            var majorTick = draw.rect( 0.01 * width, height / 300 ).move( 0.055 * width, yCoordinate - height / 600 );
			chart.ticks.push( majorTick );
			
			var majorTickLabel = document.createElement( "div" );
			majorTickLabel.innerHTML = y.toLocaleString( language );
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
            for ( var y = chart.numMajorTicks * chart.distanceBetweenMajorTicks; y > 0; y -= distanceBetweenMinorTicks ) {
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
                var minorTick = draw.rect( 0.006 * width, height / 300 ).move( 0.057 * width, yCoordinate - height / 600 );
				chart.ticks.push( minorTick );
				
				var minorTickLabel = document.createElement( "div" );
				minorTickLabel.innerHTML = y.toLocaleString( language );
                minorTickLabel.className = "y-axis-label";
				chart.appendChild( minorTickLabel );
				chart.labels.push( minorTickLabel );
				var fontSize = height / 60;
				minorTickLabel.style.fontSize = fontSize + "px";
				minorTickLabel.style.lineHeight = fontSize + "px";
				minorTickLabel.style.top = yCoordinate - fontSize / 2 + "px";
            }
            
            for ( var y = chart.numMajorTicks * chart.distanceBetweenMajorTicks; y <= chart.yAxisRange; y += distanceBetweenMinorTicks ) {
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
                var minorTick = draw.rect( 0.006 * width, height / 300 ).move( 0.057 * width, yCoordinate - height / 600 );
				chart.ticks.push( minorTick );
				
				var minorTickLabel = document.createElement( "div" );
				minorTickLabel.innerHTML = y.toLocaleString( language );
                minorTickLabel.className = "y-axis-label";
				chart.appendChild( minorTickLabel );
				chart.labels.push( minorTickLabel );
				var fontSize = height / 60;
				minorTickLabel.style.fontSize = fontSize + "px";
				minorTickLabel.style.lineHeight = fontSize + "px";
				minorTickLabel.style.top = yCoordinate - fontSize / 2 + "px";
            }
		}
		
        // Add checkboxDiv
		if ( chart.field % 2 == 1 ) {		
            if ( !chart.checkboxDiv ) {
                var checkboxDiv = document.createElement( "div" );
                checkboxDiv.className = "checkbox-div";
                var fontSize = 0.03 * height;
                
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
			
            var fontSize = 0.03 * height;
            var checkbox = chart.checkbox;
            checkbox.style.width = 1.4 * fontSize + "px";
            checkbox.style.height = 1.4 * fontSize + "px";
            checkbox.style.marginRight = 0.6 * fontSize + "px";
            checkbox.checked = false;
            
            var label = chart.checkboxDiv.children[1];
            label.style.lineHeight = 1.4 * fontSize + "px";
            label.style.fontSize = fontSize + "px";
            label.innerHTML = (["Display 7 day moving average", "Mostrar la media móvil de 7 días", "显示7天移动平均", 
                "Afficher la moyenne mobile sur 7 jours", "7日間の移動平均を表示する"])[languageIndex()];
            
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
		
        if ( !chart.titleNode ) {
            chart.titleNode = document.createElement( "div" );
            chart.titleNode.className = "chart-title";
            chart.appendChild( chart.titleNode );
        }
		
		var titles;
		switch ( languageIndex() ) {
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
		chart.titleNode.innerHTML = titles[chart.field].replaceAll( "{s}", translate( stateFromAbbreviation( chart.state ) ) );
		if ( isUSMapVisible ) {
			chart.titleNode.style.fontSize = height / 24 + "px";
		}
		else {
			chart.titleNode.style.fontSize = height / 16 + "px";
		}
		
        chart.resetTitle = function() {
			var self = this;
			self.titleNode.innerHTML = titles[chart.field].replaceAll( "{s}", translate( stateFromAbbreviation( chart.state ) ) );
		}
	
        if ( chart.field % 2 == 1 ) {
            if ( !chart.dateRangeSelect ) {
                chart.dateRangeSelect = document.createElement( "select" );
                chart.dateRangeSelect.onchange = function() {
                    var self = this;
                    var chart = self.chart;
                    var oldDateRange = self.chart.dateRange;
                    chart.dateRange = self.value;
                    var state = chart.state;
                    chart.state = null;
                    
                    isChecked = chart.checkbox.checked;
                    makeChart( chart, state, true );
    				
    				if ( isChecked ) {
    					chart.checkbox.checked = true;
                        chart.checkbox.onclick();
    				}
                };
                chart.appendChild( chart.dateRangeSelect );
            }
            
            chart.dateRangeSelect.style.fontSize = 0.025 * height + "px";
        
            chart.dateRangeSelect.chart = chart;
            var innerHTMLs;
            switch ( languageIndex() ) {
                case 0: {
                    innerHTMLs = ["All time", "Last 120 days"];
                    break;
                }
                case 1: {
                    innerHTMLs = ["Desde el comienzo", "Últimos 120 días"];
                    break;
                }
                case 2: {
                    innerHTMLs = ["所有时间", "最近120天"];
                    break;
                }
                case 3: {
                    innerHTMLs = ["Toute la période", "120 derniers jours"];
                    break;
                }
                case 4: {
                    innerHTMLs = ["全期間", "最新の120日"]
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
        
		var strings;
		switch ( languageIndex() ) {
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
		chart.userInteractionTitle = strings[chart.field];
		
		chart.xOfMouse = -1;
        if ( !chart.handleMouseMoveEvent ) {
            chart.handleMouseMoveEvent = function( x ) {
                var self = this;
                // "x" (position of mouse) is one-indexed, while "i" (used for array indices) is zero-indexed
                var i = x - 1;
                
                // If there is no update from the previous day, act as if mouse is hovering over previous day instead of current day
                if ( x == self.xAxisRange && !self.isThereAnUpdateToday() && !isTimeTravelActive() ) {
                    i--;
                }
                
                var number = self.numbers[i];
                finalHTML = self.userInteractionTitle;
                finalHTML = finalHTML.replaceAll( "{s}", translate( stateFromAbbreviation( self.state ) ) );
                finalHTML = finalHTML.replaceAll( "{y}", self.years[i] );
                finalHTML = finalHTML.replaceAll( "{m}", self.months[i] );
                finalHTML = finalHTML.replaceAll( "{d}", self.days[i] );
                finalHTML = finalHTML.replaceAll( "{n}", number.toLocaleString( language ) );
                if ( number == 1 ) {
                    // Go to singular form instead of plural
                    switch ( languageIndex() ) {
                        case 0: {
                            if ( self.field <= 3 ) {
                                finalHTML = finalHTML.replace( "cases", "case" );
                            }
                            else {
                                finalHTML = finalHTML.replace( "deaths", "death" );
                            }
                            break;
                        }
                        case 1: {
                            if ( self.field <= 3 ) {
                                finalHTML = finalHTML.replace( "casos", "caso" );
                            }
                            else {
                                finalHTML = finalHTML.replace( "muertes", "muerte" );
                            }
                            break;
                        }
                    }
                }
                
                if ( self.field % 2 == 1 && self.checkbox.checked && ( i >= 6 || self.dateRange != 0 ) ) {
                    var sevenDayMovingAverages = self.sevenDayMovingAverages;
                    switch ( languageIndex() ) {
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
                    if ( self.field == 3 ) {
                        // Round to nearest tenth
                        var sevenDayMovingAverage = sevenDayMovingAverages[i].toFixed( 1 );
                        if ( sevenDayMovingAverage == parseInt( sevenDayMovingAverage) ) {
                            sevenDayMovingAverage = parseInt( sevenDayMovingAverage );
                        }
                        finalHTML += sevenDayMovingAverage.toLocaleString( language );
                    }
                    else {
                        // Round to nearest integer
                        var sevenDayMovingAverage = sevenDayMovingAverages[i];
                        finalHTML += parseInt( sevenDayMovingAverage + 0.5 ).toLocaleString( language );
                    }
                }
                
                if ( self.field % 2 == 1 ) {
                    if ( self.mouseDownStatus == -1 ) {
                        // Reset last highlighted bar
                        if ( self.currentlyHighlightedBar ) {
                            self.currentlyHighlightedBar.fill( self.currentlyHighlightedBar.defaultColor );
                        }
                        
                        var bar = self.bars[i];
                        // Highlight current bar
                        if ( !self.isNightMode ) {
                            bar.fill( b );
                        }
                        else {
                            bar.fill( "white" );
                        }
                        // Update currentlyHighlightedBar
                        self.currentlyHighlightedBar = bar;
                    }
                    else {
                        // Unhighlight all bars if mouse is currently down
                        if ( self.currentlyHighlightedBar ) {
                            self.currentlyHighlightedBar.fill( self.currentlyHighlightedBar.defaultColor );
                            self.currentlyHighlightedBar = null;
                        }
                    }
                }
                
                self.titleNode.innerHTML = finalHTML;
                self.xOfMouse = x;
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
            }
            
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
            }
        }
        
        if ( !isMobile ) {
            chart.mouseDownStatus = -1;
            chart.currentlyHighlightedBar = null;
            
            // Similar to x = c for some c in a graph
            chart.verticalLine = draw.rect( height / 400, 0.825 * height ).move( 0.025 * height, 0 );
            chart.verticalLine.remove();
                
            if ( !chart.verticalLineLabel ) {
                chart.verticalLineLabel = document.createElement( "div" );
                chart.verticalLineLabel.style.textAlign = "center";
            }
            chart.verticalLineLabel.style.fontSize = fontSizeForXAxisLabels + "px";
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
        
		if ( !isMobile && !chart.onmousemove ) {
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
                    self.addGuidelines();
                    self.moveGuideLines( xCoordinate, yCoordinate, false );
                    
                    // Unhighlight all bars
                    if ( self.currentlyHighlightedBar ) {
                        self.currentlyHighlightedBar.fill( self.currentlyHighlightedBar.defaultColor );
                        self.currentlyHighlightedBar = null;
                    }
                }
                else {
                    self.mouseDownStatus = 0;
                }
            }
            
            chart.addGuidelines = function() {
                var self = this;
                
                self.xAxis.opacity( 0.4 );
                self.yAxis.opacity( 0.4 );
                self.titleNode.style.opacity = 0.4;
                self.labels.forEach( label => label.style.opacity = 0.4 );
                self.ticks.forEach( tick => tick.opacity( 0.4 ) );
                if ( self.bars && !self.checkbox.checked ) {
                    // Reduce opacity of bars, but opacity from displaying of 7 day moving average polyline has higher priority
                    self.bars.forEach( bar => bar.opacity( 0.4 ) );
                }
                
                // Add guidelines
                self.verticalLine.addTo( "#svg" + self.field );
                self.horizontalLine.addTo( "#svg" + self.field );
                self.appendChild( self.verticalLineLabel );
                self.appendChild( self.horizontalLineLabel );
            };
            chart.moveGuideLines = function( xCoordinate, yCoordinate, ctrlKey ) {
                var self = this;
                if ( self.mouseDownStatus != 1 ) {
                    return;
                }
                
                var width = self.width;
                var height = self.height;
                // Vertically center verticalLine along xCoordinate
                self.verticalLine.move( xCoordinate - height / 800, 0.025 * height );
                // Vertically center verticalLineLabel along xCoordinate too
                self.verticalLineLabel.style.left = xCoordinate - self.widthForXAxisLabels / 2 + "px";
                var x = parseInt( self.toX( xCoordinate ) + 0.5 );
                var i = x - 1;
                if ( x == self.xAxisRange && !self.isThereAnUpdateToday() ) {
                    i--;
                }
                switch ( languageIndex() ) {
                    case 0:
                    case 2:
                    case 4: {
                        chart.verticalLineLabel.innerHTML = self.months[i] + "/" + self.days[i];
                        break;
                    }
                    case 1:
                    case 3: {
                        chart.verticalLineLabel.innerHTML = self.days[i] + "/" + self.months[i];
                        break;
                    }
                }
                
                if ( !ctrlKey ) {
                    // Vertically center horizontalLine along yCoordinate
                    self.horizontalLine.move( 0.06 * width, yCoordinate - height / 800 );
                    // Vertically center horizontalLineLabel along yCoordinate too
                    self.horizontalLineLabel.style.top = yCoordinate - self.fontSizeForYAxisLabels / 2 + "px";
                    var y = chart.toY( yCoordinate );
                    
                    if ( self.field == 2 || self.field == 3 ) {
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
                    self.horizontalLineLabel.innerHTML = y.toLocaleString( language );
                }
            }
            
            chart.onmouseup = function( event ) {
                var self = this;
                if ( self.mouseDownStatus == -1 ) {
                    return;
                }
                
                // Remove guidelines if mouse is currently down within bounds
                if ( self.mouseDownStatus == 1 ) {
                    self.removeGuideLines();
                    
                    // Highlight bar that mouse is on top of
                    var xCoordinate = event.pageX - parseFloat( base.style.paddingLeft );
                    var x = parseInt( self.toX( xCoordinate ) + 0.5 );
                    if ( self.bars ) {
                        var bar = self.bars[x - 1];
                        if ( bar ) {
                            // If state is not updated today, self.bars.length will be 1 less than xAxisRange
                            // Therefore, if user invokes onmouseup on today, self.bars[x - 1] will be undefined
                            if ( !userSettings.isNightMode ) {
                                bar.fill( b );
                            }
                            else {
                                bar.fill( "white" );
                            }
                            self.currentlyHighlightedBar = bar;
                        }
                    }
                }
                self.mouseDownStatus = -1;
            }
            
            chart.removeGuideLines = function() {
                var self = this;
                
                self.xAxis.opacity( 1 );
                self.yAxis.opacity( 1 );
                self.titleNode.style.opacity = 1;
                self.labels.forEach( label => label.style.opacity = 1 );
                self.ticks.forEach( tick => tick.opacity( 1 ) );
                if ( self.bars && !self.checkbox.checked ) {
                    // Restore opacity of bars, but opacity from displaying of 7 day moving average polyline has higher priority
                    self.bars.forEach( bar => bar.opacity( 1 ) );
                }
                
                self.verticalLine.remove();
                self.horizontalLine.remove();
                self.removeChild( self.verticalLineLabel );
                self.removeChild( self.horizontalLineLabel );
            };
            
			chart.onmousemove = function( event ) {
				var self = this;
                if ( self.isOutOfBounds( event ) ) {
                    self.resetTitle();
					self.xOfMouse = -1;
                    
                    if ( self.mouseDownStatus == 1 ) {
                        self.removeGuideLines();
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
                var y = self.toY( yCoordinate );
                // If x of mouse did not change from the last mousemove event
				if ( self.xOfMouse == x ) {
                    if ( self.mouseDownStatus == 1 ) {
                        self.moveGuideLines( xCoordinate, yCoordinate, event.ctrlKey );
                    }
					return;
				}
                
				self.handleMouseMoveEvent( x );
                if ( self.mouseDownStatus == 0 ) {
                    // If mouse was previously out of bounds
                    self.addGuidelines();
                    self.mouseDownStatus = 1;
                }
                if ( self.mouseDownStatus == 1 ) {
                    self.moveGuideLines( xCoordinate, yCoordinate, event.ctrlKey );
                }
			};
			chart.onmouseleave = function() {
				var self = this;
				self.resetTitle();
                if ( self.mouseDownStatus == 1 ) {
                    self.removeGuideLines();
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
		else if ( isMobile && !chart.ontouchmove ) {
			chart.lastXCoordinate = null;
			chart.lastYCoordinate = null;
			
			chart.ontouchstart = function( event ) {
				var self = this;
				chart.lastXCoordinate = event.pageX - parseFloat( base.style.paddingLeft );
				// No need to determine actual y coordinate with respect to the chart, because only the change in
				// y is being recorded and used.
				chart.lastYCoordiante = event.pageY;
			}
			
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
				
				self.handleMouseMoveEvent( x );
			};
			
			chart.ontouchend = function() {
				var self = this;
				self.resetTitle();
				self.lastXCoordinate = null;
				self.lastYCoordiante = null;
			};
		}
        
        chart.isNightMode = false;
        if ( !chart.toggleNightMode ) {
            chart.toggleNightMode = function() {
                var self = this;
                self.isNightMode = !self.isNightMode;
                if ( !self.isNightMode ) {
                    self.style.borderColor = "";
                    
                    if ( self.field % 2 == 1 ) {
                        self.sevenDayMovingAveragePolyline.stroke( self.sevenDayMovingAveragePolyline.strokeColor );
                        if ( self.currentlyHighlightedBar ) {
                            self.currentlyHighlightedBar.fill( b );
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
                    
                    if ( !isMobile ) {
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
                    self.style.borderColor = lg;
                    
                    if ( self.field % 2 == 1 ) {
                        self.sevenDayMovingAveragePolyline.stroke( self.sevenDayMovingAveragePolyline.strokeColorNightMode );
                        if ( self.currentlyHighlightedBar ) {
                            self.currentlyHighlightedBar.fill( "white" );
                        }
                    }
                    
                    self.titleNode.style.color = lg;
                    self.xAxis.fill( lg );
                    self.yAxis.fill( lg );
                    self.cover.fill( b );
                    for ( var i = 0; i < self.ticks.length; i++ ) {
                        self.ticks[i].fill( lg );
                    }
                    for ( var i = 0; i < self.labels.length; i++ ) {
                        self.labels[i].style.color = lg;
                    }
                    
                    if ( !isMobile ) {
                        self.horizontalLine.fill( lg );
                        self.horizontalLineLabel.style.color = lg;
                        self.verticalLine.fill( lg );
                        self.verticalLineLabel.style.color = lg;
                    }
                    
                    if ( self.field % 2 == 1 ) {
                        self.checkboxDiv.children[1].style.color = lg;
                    }
                }
            }
        }
        if ( userSettings.isNightMode ) {
            chart.toggleNightMode();
        }
	}
	
	function isUpdatedToday( state ) {
		var entry = dataFromToday.getEntry( state );
		var yesterdayEntry = dataFromYesterday.getEntry( state );
		return entry[1] - yesterdayEntry[1] > 0 || entry[3] - yesterdayEntry[3] > 0;
	}
    
    function sevenDayAverageInNewCases( state, index ) {
        if ( index == undefined ) {
            if ( !isTimeTravelActive() ) {
                index = allData.length - 2;
            }
            else {
                index = userSettings.dataFromTodayIndex;
            }
        }
        
        if ( index < 7 ) {
            return null;
        }

        var one, two;
        if ( !state || state == "USA" ) {
            one = allData[index].n[0];
            two = allData[index - 7].n[0];
        }
        else {
            one = allData[index].getEntry( state )[1];
            two = allData[index - 7].getEntry( state )[1];
        }
        return parseInt( ( one - two ) / 7 + 0.5 );
    }
    
    function sevenDayAverageInNewCasesPer100000People( state, index ) {
        if ( index == undefined ) {
            if ( !isTimeTravelActive() ) {
                index = allData.length - 2;
            }
            else {
                index = userSettings.dataFromTodayIndex;
            }
        }
        
        if ( index < 7 ) {
            return null;
        }

        var one, two;
        if ( !state || state == "USA" ) {
            one = allData[index].n[1];
            two = allData[index - 7].n[1];
        }
        else {
            one = allData[index].getEntry( state )[2];
            two = allData[index - 7].getEntry( state )[2];
        }
        
        var difference = ( one - two ) / 7;
        // Round to nearest tenth
        return parseInt( difference * 10 + 0.5 ) / 10;
    }
    
    function sevenDayAverageInNewDeaths( state, index ) {
        if ( index == undefined ) {
            if ( !isTimeTravelActive() ) {
                index = allData.length - 2;
            }
            else {
                index = userSettings.dataFromTodayIndex;
            }
        }
        
        if ( index < 7 ) {
            return null;
        }

        var one, two;
        if ( !state || state == "USA" ) {
            one = allData[index].n[2];
            two = allData[index - 7].n[2];
        }
        else {
            one = allData[index].getEntry( state )[3];
            two = allData[index - 7].getEntry( state )[3];
        }
        return parseInt( ( one - two ) / 7 );
    }
    
	function select0Change() {
		userSettings.language = select0.value;
		
        setTitle();
        if ( updateDiv.className != "d-none" ) {
            setUpdateNotificationInnerHTML();
            setDismissUpdateButtonInnerHTML();
            
            // Since updateNotification.innerHTML changed, width and/or height of updateNotification will have changed too
            dismissUpdateButton.style.height = updateNotification.offsetHeight + "px";
            var combinedWidth = updateNotification.offsetWidth + dismissUpdateButton.offsetWidth;
            var updateNotificationLeft = ( 0.97 * baseWidth - combinedWidth ) / 2;
            updateNotification.style.left = updateNotificationLeft + "px";
            dismissUpdateButton.style.right = updateNotificationLeft + "px";
            updateDiv.style.height = updateNotification.offsetHeight + "px";
        }
        if ( languageDiv.className != "d-none" ) {
            setHideLanguageDivButtonInnerHTML();
        }
        
        setLastUpdatedOnText();
        setToggleNightModeButtonInnerHTML();
        setIndicateUpdatedStatesCheckboxLabelInnerHTML();
        setResetChartsButtonInnerHTML();
        setTimeTravelRangeLabelInnerHTML();
        
        for ( var i = 0; i < select2.children.length; i++ ) {
            var option = select2.children[i];
            var state = stateFromAbbreviation( option.value );
            option.innerHTML = translate( state );
        }
		
        updateCookies();
        dataDisplayHeaderHTML = dataDisplayHeaderHTMLs[languageIndex()];
        setTimeout( function() {
            refreshDataDisplay();
            loadColB();
            
            // Reset checkboxLabelWidth, as it will be different in a new language
            checkboxLabelWidth = null;
            for ( var i = 0; i < charts.length; i++ ) {
    			var checked = i % 2 == 1 && charts[i].checkbox.checked;

                // checkboxLabelWidth will have changed with a new screen width
                checkboxLabelWidth = null;
    			makeChart( charts[i], charts[i].state, false );
    			if ( checked ) {
                    charts[i].checkbox.checked = true;
    				charts[i].checkbox.onclick();
    			}
    		}
        }, 1 );
	}
    
    function toggleNightMode() {
        userSettings.isNightMode = !userSettings.isNightMode;
        if ( !userSettings.isNightMode ) {
            document.getElementsByTagName( "body" )[0].style.backgroundColor = "";
            
            updateNotification.style.color = "";
            
            rowA1.style.borderColor = "";
            rowA1.style.color = "";
            rowA2.style.color = "";
            for ( var i = 0; i < colB.children.length; i++ ) {
                var child = colB.children[i];
                if ( child.className == "state-data-box" ) {
                    child.style.borderColor = "";
                    child.style.backgroundColor = "";
                    child.style.color = "";
                }
                else if ( child.className == "circle" ) {
                    if ( child.stateDataBox ) {
                        // child.stateDataBox may not be on colB right now
                        var box = child.stateDataBox;
                        box.style.borderColor = "";
                        box.style.backgroundColor = "";
                        box.style.color = "";
                    }
                }
            }
            indicateUpdatedStatesCheckboxLabel.style.color = "";
            
            timeTravelDiv.style.backgroundColor = "white";
            timeTravelRangeLabel.style.color = "";
        }
        else {
            document.getElementsByTagName( "body" )[0].style.backgroundColor = b;
            
            updateNotification.style.color = lg;
            
            rowA1.style.borderColor = lg;
            rowA1.style.color = lg;
            rowA2.style.color = lg;
            for ( var i = 0; i < colB.children.length; i++ ) {
                var child = colB.children[i];
                if ( child.className == "state-data-box" ) {
                    child.style.borderColor = lg;
                    child.style.backgroundColor = "rgb(0,0,75)";
                    child.style.color = lg;
                }
                else if ( child.className == "circle" ) {
                    if ( child.stateDataBox ) {
                        var box = child.stateDataBox;
                        box.style.borderColor = lg;
                        box.style.backgroundColor = "rgb(0,0,75)";
                        box.style.color = lg;
                    }
                }
            }
            indicateUpdatedStatesCheckboxLabel.style.color = lg;
            
            timeTravelDiv.style.backgroundColor = b;
            timeTravelRangeLabel.style.color = lg;
        }
        
        recolorRows();
        for ( var i = 0; i < charts.length; i++ ) {
            if ( charts[i].isNightMode != userSettings.isNightMode ) {
                charts[i].toggleNightMode();
            }
        }
        
        setToggleNightModeButtonInnerHTML();
        recolorTimeTravelDivBorder();
        updateCookies();
    }
    
    // recolorTimeTravelDivBorder() will have to be recolored under the following conditions:
    // - timeTravelDiv.style.position is changed
    // - window is scrolled while time travel is active
    // - Night mode is toggled
    function recolorTimeTravelDivBorder() {
        if ( isTimeTravelActive() ) {
            if ( html.scrollTop + window.innerHeight + 1 < base.offsetHeight ) {
                // Show border
                if ( !userSettings.isNightMode ) {
                    timeTravelDiv.style.borderColor = b;
                }
                else {
                    timeTravelDiv.style.borderColor = lg;
                }
            }
            else {
                // If window is extremely close to being scrolled to the bottom, hide border
                if ( !userSettings.isNightMode ) {
                    timeTravelDiv.style.borderColor = "";
                }
                else {
                    timeTravelDiv.style.borderColor = b;
                }
            }
        }
        else {
            if ( !userSettings.isNightMode ) {
                timeTravelDiv.style.borderColor = "";
            }
            else {
                timeTravelDiv.style.borderColor = b;
            }
        }
    }
    
    var documentTitles = ["COVID-19 tracker", "Rastreador de COVID-19", "新冠肺炎追踪器", "Traqueur de COVID-19", "COVID-19トラッカー"];
    function setTitle() {
        document.title = documentTitles[languageIndex()];
    }
    
    function setUpdateNotificationInnerHTML() {
        var dateAndTime = dateAndTimeFromCalendar( allData[allData.length - 1].d );
        switch ( languageIndex() ) {
            case 0: {
                updateNotification.innerHTML = "An update from " + dateAndTime + " is currently in effect.";
                break;
            }
            case 1: {
                updateNotification.innerHTML = "Una actualización de " + dateAndTime + " actualmente está activa.";
                break;
            }
            case 2: {
                updateNotification.innerHTML = "一个从" + dateAndTime + "的更新正在生效。";
                break;
            }
            case 3: {
                updateNotification.innerHTML = "Une mise à jour à partir de " + dateAndTime + " est actuellement en vigueur.";
                break;
            }
            case 4: {
                updateNotification.innerHTML = "現在、" + dateAndTime + "からの更新が有効です。";
                break;
            }
        }
    }
    
    var dismissUpdateButtonInnerHTMLs = ["OK", "Bueno", "好的", "D'accord", "よし"];
    function setDismissUpdateButtonInnerHTML() {
        dismissUpdateButton.innerHTML = dismissUpdateButtonInnerHTMLs[languageIndex()];
    }
    
    var hideLanguageDivButtonInnerHTMLs = ["Confirm language", "Confirmar idioma", "确认语言", "Confirmer la langue", "言語を確認する"];
    function setHideLanguageDivButtonInnerHTML() {
        hideLanguageDivButton.innerHTML = hideLanguageDivButtonInnerHTMLs[languageIndex()];
    }
    
    var dayModeToggleNightModeButtonInnerHTMLs = ["Switch to night mode", "Cambiar al modo nocturno", "切换到夜间模式", 
        "Passer en mode nuit", "ナイトモードに切り替えます"];
    var nightModeToggleNightModeButtonInnerHTMLs = ["Switch to day mode", "Cambiar al modo de día", "切换到白天模式", 
        "Passer en mode jour", "日モードに切り替えます"];
    function setToggleNightModeButtonInnerHTML() {
        if ( !userSettings.isNightMode ) {
            toggleNightModeButton.innerHTML = dayModeToggleNightModeButtonInnerHTMLs[languageIndex()];
        }
        else {
            toggleNightModeButton.innerHTML = nightModeToggleNightModeButtonInnerHTMLs[languageIndex()];
        }
    }
    
    function setLastUpdatedOnText() {
        var dateAndTime = dateAndTimeFromCalendarFromToday();
        if ( userSettings.dataFromTodayIndex == -1 ) {
            switch ( languageIndex() ) {
                case 0: {
                    lastUpdatedOn = "Last updated on " + dateAndTime + ". Source of data: "
                        + "<a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>. NOT FOR COMMERICAL USE.";
                    break;
                }
                case 1: {
                    lastUpdatedOn = "Ultima actualización en " + dateAndTime + ". Fuente "
                        + "de datos: <a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>. NO ES PARA USO COMERCIAL.";
                    break;
                }
                case 2: {
                    lastUpdatedOn = "最后更新时间：" + dateAndTime + "。 数据来源："
                        + "<a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>。 不用于商业用途。";
                    break;
                }
                case 3: {
                    lastUpdatedOn = "Dernière mise à jour à " + dateAndTime + ". "
                        + "Source de données: <a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>. PAS POUR UN USAGE COMMERCIAL.";
                    break;
                }
                case 4: {
                    lastUpdatedOn = "最終更新日は" + dateAndTime + "です。データのソース:"
                        + "<a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>。商用目的ではありません。";
                    break;
                }
            }
        }
        else {
            switch ( languageIndex() ) {
                case 0: {
                    lastUpdatedOn = "Displayed data is as of " + dateAndTime + ". Source of data: "
                        + "<a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>. NOT FOR COMMERICAL USE.";
                    break;
                }
                case 1: {
                    lastUpdatedOn = "Los datos mostrados son a partir de " + dateAndTime + ". Fuente "
                        + "de datos: <a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>. NO ES PARA USO COMERCIAL.";
                    break;
                }
                case 2: {
                    lastUpdatedOn = "显示的数据截至" + dateAndTime + "。 数据来源："
                        + "<a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>。 不用于商业用途。";
                    break;
                }
                case 3: {
                    lastUpdatedOn = "Les données affichées sont en date du " + dateAndTime + ". "
                        + "Source de données: <a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>. PAS POUR UN USAGE COMMERCIAL.";
                    break;
                }
                case 4: {
                    lastUpdatedOn = "表示されているデータは" + dateAndTime + "現在のものです。データのソース:"
                        + "<a target='_blank' href='http://worldometers.info/coronavirus/country/us'>"
                        + "worldometers.info/coronavirus/country/us</a>。商用目的ではありません。";
                    break;
                }
            }
        }
    }
    
    var indicateUpdatedStatesInnerHTMLs = [
        "Indicate states/territories that updated today.",
        "Indicar estados/territorios que se actualizaron hoy.",
        "指出今天更新的州/领土。",
        "Indiquer les états/territoires qui ont mis à jour aujourd'hui.",
        "今日更新された州/領土を示す。"
    ];
    function setIndicateUpdatedStatesCheckboxLabelInnerHTML() {
        indicateUpdatedStatesCheckboxLabel.innerHTML = indicateUpdatedStatesInnerHTMLs[languageIndex()];
    }
    
    
    var resetChartsButtonInnerHTMLs = ["Reset charts", "Restablecer gráficos", "重置图表", "Réinitialiser les graphiques", "チャートをリセット"];
    function setResetChartsButtonInnerHTML() {
        resetChartsButton.innerHTML = resetChartsButtonInnerHTMLs[languageIndex()];
    }
    
    function setTimeTravelRangeLabelInnerHTML( index ) {
        if ( index == undefined ) {
            index = userSettings.dataFromTodayIndex;
        }
        if ( index == -1 ) {
            switch ( languageIndex() ) {
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
            var date = dateAndTimeFromCalendar( allData[index].d );
            switch ( languageIndex() ) {
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
    
    function isTimeTravelActive() {
        return userSettings.dataFromTodayIndex >= 0;
    }
    
    var stateAbbreviations = [
        "USA", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "GU", "HI", "ID", "IL", "IN", "IA", 
        "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", 
        "ND", "NMI", "OH", "OK", "OR", "PA", "PR", "RI", "SC", "SD", "TN", "TX", "VI", "UT", "VT", "VA", "WA", "WV",
        "WI", "WY"
    ];
	var states = [
		"USA", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
		"District of Columbia", "Florida", "Georgia", "Guam", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",
		"Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
		"Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", 
		"North Dakota", "Northern Mariana Islands", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Puerto Rico", 
		"Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "U.S. Virgin Islands", "Utah", "Vermont", 
		"Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
	];
	var esTranslations = [
		"EE.UU", "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
		"Distrito de Columbia", "Florida", "Georgia", "Guam", "Hawái", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", 
		"Kentucky", "Luisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Misisipí", "Misuri", 
		"Montana", "Nebraska", "Nevada", "Nueva Hampshire", "Nueva Jersey", "Nuevo México", "Nueva York", 
		"Carolina del Norte", "Dakota del Norte", "Islas Marianas del Norte", "Ohio", "Oklahoma", "Oregón", "Pensilvania", 
		"Puerto Rico", "Rhode Island", "Carolina del Sur", "Dakota del Sur", "Tennessee", "Texas", 
		"Islas Vírgenes de EE.UU", "Utah", "Vermont", "Virginia", "Washington", "Virginia del Oeste", "Wisconsin", "Wyoming"
	];
	var cnTranslations = [
		"美国", "阿拉巴马州",  "阿拉斯加州", "亚利桑那州", "阿肯色州", "加利福尼亚州", "科罗拉多州", "康涅狄格州", "特拉华州", "哥伦比亚特区",
		"佛罗里达州", "乔治亚州", "关岛", "夏威夷", "爱达荷州", "伊利诺伊州", "印第安纳州", "爱荷华州", "堪萨斯州", "肯塔基州",
		"路易斯安那州", "缅因州", "马里兰州", "马萨诸塞州", "密歇根州", "明尼苏达州", "密西西比州", "密苏里州", "蒙大拿州", 
		"内布拉斯加州", "内华达州", "新罕布什尔州", "新泽西州", "新墨西哥州", "纽约州", "北卡罗来纳州", "北达科他州",
		"北马里亚纳群岛", "俄亥俄州", "俄克拉荷马州", "俄勒冈州", "宾夕法尼亚州", "波多黎各", "罗德岛", "南卡罗来纳州", "南达科他州", 
		"田纳西州", "得克萨斯州", "美属维尔京群岛", "犹他州", "佛蒙特", "弗吉尼亚州", "华盛顿州", "西弗吉尼亚州", "威斯康星州", "怀俄明州"
	];
	var frTranslations = [
		"États-Unis", "Alabama", "Alaska", "Arizona", "Arkansas", "Californie", "Colorado", "Connecticut", "Delaware", 
		"District de Colombie", "Floride", "Géorgie", "Guam", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", 
		"Kentucky", "Louisiane", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
		"Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "Nouveau Mexique", "New York", "Caroline du Nord", 
		"Dakota du Nord", "Îles Mariannes du Nord", "Ohio", "Oklahoma", "Oregon", "Pennsylvanie", "Porto Rico", 
		"Rhode Island", "Caroline du Sud", "Dakota du Sud", "Tennessee", "Texas", "Îles Vierges américaines", "Utah", 
		"Vermont", "Virginie", "Washington", "Virginie-Occidentale", "Wisconsin", "Wyoming"
	];
	var jpTranslations = [
		"米国", "アラバマ", "アラスカ", "アリゾナ", "アーカンザス", "カリフォルニア", "コロラド", "コネチカット", "デラウェア", 
		"コロンビア特別区", "フロリダ", "ジョージア", "グアム", "ハワイ", "アイダホ", "イリノイ", "インディアナ", "アイオワ", 
		"カンザス", "ケンタッキー", "ルイジアナ", "メイン", "メリーランド", "マサチューセッツ", " ミシガン", "ミネソタ", 
		"ミシシッピ", "ミズーリ", "モンタナ", "ネブラスカ", "ネバダ", "ニューハンプシャー", "ニュージャージー", "ニューメキシコ", 
		"ニューヨーク", "ノースカロライナ", "ノースダコタ", "北マリアナ諸島", "オハイオ", "オクラホマ", "オレゴン", "ペンシルベニア",
		"プエルトリコ", "ロードアイランド", " サウスカロライナ", "サウスダコタ", "テネシー", "テキサス", "米国バージン諸島", "ユタ", 
		"バーモント", "バージニア", "ワシントン", "ウェストバージニア", "ウィスコンシン", "ワイオミング"
	];
    
    function stateFromAbbreviation( abbreviation ) {
        for ( var i = 0; i < stateAbbreviations.length; i++ ) {
			if ( abbreviation == stateAbbreviations[i] ) {
                return states[i];
            }
		}
    }
    
	function translate( state ) {
		if ( userSettings.language == "en-US" ) {
			return state;
		}
		for ( var i = 0; i < states.length; i++ ) {
			if ( state == states[i] ) {
				switch ( languageIndex() ) {
					case 1: {
						return esTranslations[i];
					}
					case 2: {
						return cnTranslations[i];
					}
					case 3: {
						return frTranslations[i];
					}
					case 4: {
						return jpTranslations[i];
					}
				}
			}
		}
	}
	
	function updateCookies() {
		// Reset cookie
		var keyValuePairs = document.cookie.split( ';' ); 
		for ( var i = 0; i < keyValuePairs.length; i++ ) {
			// Make every key-value pair in cookie expire instantly by giving it a expire value of 1/1/1970
			document.cookie = keyValuePairs[i] + "= ;expires=Thu, 01 Jan 1970 00:00:00 GMT";
		}
		document.cookie = "userSettings=" + JSON.stringify( userSettings ) + ";";
		// Expire in 30 days
		document.cookie = "expires=" + ( Date.now() + 18144000 ) + ";";
	}
	
	function languageIndex() {
		switch ( userSettings.language ) {
			// English is 0, Spanish is 1, Chinese is 2, French is 3, and Japanese is 4. In select0, the languages are not ordered
			// the same, but that won't matter; language and languageIndex() depend on the VALUE of
			// the selected option, and not on its position/index in select0.
			// For example, if the user selects French (option at position 2 in select0), languageIndex() will still 
			// return 3 regardless of the position of the selected option (2).
			case "en-US": {
				return 0;
			}
			case "es-ES": {
				return 1;
			}
			case "zh-CN": {
				return 2;
			}
			case "fr-FR": {
				return 3;
			}
			case "ja-JP": {
				return 4;
			}
			default: {
				return -1;
			}
		}
	}
    
    $( document ).ready( function() {
        init();
    } );
}) ();