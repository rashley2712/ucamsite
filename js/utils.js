var debugText = [];
var debugHistory = 15;

var masterObjectList = new Array();
var redObjectList = new Array();
var greenObjectList = new Array();
var blueObjectList = new Array();
var filteredObjectList = new Array();
var loadedMaster = false, loadedGreen = false, loadedRed = false, loadedBlue = false;
var selectedObject;
var width, height;	
var context;
var circles = false;
	
	
	function eventWindowLoaded() {
		debug("Loading the JSON data");
		
		rgbJSONFile = runName + "rgb.json";
		rJSONFile = runName + "r.json";
		gJSONFile = runName + "g.json";
		bJSONFile = runName + "b.json";
		imageFile = runName + "deepimager.png";
		
		$.getJSON(rgbJSONFile, jsonLoadedRGB);
		$.getJSON(rJSONFile, function (data) {
			console.log("got the data for the red channel");
			loadedRed = parseObjectData(data, redObjectList, "#rStatus");
			checkAllDataLoaded();
			});
		$.getJSON(gJSONFile, function (data) {
			console.log("got the data for the red channel");
			loadedGreen = parseObjectData(data, greenObjectList, "#gStatus");
			checkAllDataLoaded();
			});
		$.getJSON(bJSONFile, function (data) {
			console.log("got the data for the red channel");
			loadedBlue = parseObjectData(data, blueObjectList, "#bStatus");
			checkAllDataLoaded();
			});
		initCanvas();
		clearCanvas();
		loadPNG(imageFile);
		document.onkeydown = handleKeyPressed;
	}
	
	function checkAllDataLoaded() {
		if (!loadedMaster) return;
		if (!loadedRed) return;
		if (!loadedGreen) return;
		if (!loadedBlue) return;
		
		debug("All data successfully loaded");
		
		// Get the x,y position from the red channel
		for (i in masterObjectList) {
			masterObjectList[i].x = redObjectList[masterObjectList[i].red_id].x; 
			masterObjectList[i].y = redObjectList[masterObjectList[i].red_id].y; 
		}
		drawObjectTable();
	}
	
	function handleKeyPressed(e) {
		e = e?e:window.event;
		console.log(e.keyCode + " pressed");

		switch(e.keyCode) {
			case 67: //Toggle the circles
				toggleCircles();
				break;
		}
	}
		
	function listObjects() {
		for (i in masterObjectList) {
			object = masterObjectList[i]
			console.log(object.id + " (" + object.x + ", " + object.y +") frames: " + object.data.length + " last counts: " + object.data[object.data.length-1][1])
		}
	}
	
	function getObjectById(objects, id) {
		for (i in objects) {
			if (objects[i].id == id) return objects[i]
		}
		
		return null
	}
	
	function objectTable(objectList) {
		tableString = "<table>";
		
		tableString+= "<tr><th>ID</th><th>Red channel</th><th>Green channel</th><th>Blue channel</th></tr>";
		for (i in objectList) {
			tableString+= "<tr>";
			object = objectList[i]
			tableString+= "<td>" + object.id;
			tableString+=" (" + parseInt(object.x) + ", " + parseInt(object.y)  + ")";
			tableString+= "</td>";
			if (object.red_id!=-1) {
				redObject = getObjectById(redObjectList, object.red_id);
				tableString+="<td><table>";
				tableString+="<tr>";
				tableString+="<td>(" + parseInt(redObject.x) + ", " + parseInt(redObject.y) + ")</td>";
				tableString+="<td>[" + redObject.data.length +  "]</td>";
				tableString+="</tr>";				
				tableString+="</table></td>";				
			} else {
				tableString+="<td>none</td>"
			}
			if (object.green_id!=-1) {
				greenObject = getObjectById(greenObjectList, object.green_id);
				tableString+="<td><table>";
				tableString+="<tr>";
				tableString+="<td>(" + parseInt(greenObject.x) + ", " + parseInt(greenObject.y)  + ")</td>";
				tableString+="<td>[" + greenObject.data.length +  "]</td>";
				tableString+="</tr>";				
				tableString+="</table></td>";				
			} else {
				tableString+="<td>none</td>"
			}
			if (object.blue_id!=-1) {
				blueObject = getObjectById(blueObjectList, object.blue_id);
				tableString+="<td><table>";
				tableString+="<tr>";
				tableString+="<td>(" + parseInt(blueObject.x) + ", " + parseInt(blueObject.y)  + ")</td>";
				tableString+="<td>[" + blueObject.data.length +  "]</td>";
				tableString+="</tr>";				
				tableString+="</table></td>";				
			} else {
				tableString+="<td>none</td>"
			}
			
			tableString+= "</tr>";
		}
		tableString+= "</table>";
		
		return tableString;
	}
	
	function drawObjectTable() {
		htmlString =  objectTable(masterObjectList);
		$('#ObjectTable').html(htmlString);
	}
	
	function jsonLoadedRGB(data) {
		numberObjects = data.length;
		debug(numberObjects + " objects loaded");
		masterObjectList = [];
		for (i in data) {
			dataLine = data[i]
			dataObject = JSON.parse(dataLine);		
			masterObjectList.push(dataObject);
			console.log(dataObject);
			}
		loadedMaster = true;
		checkAllDataLoaded();
		
	}

	function parseObjectData(data, objectList, statusAttribute) {
		numberObjects = data.length;
		debug(numberObjects + " objects loaded");
		if (objectList.length!=0) {
			console.log("The objectList wasn't empty.... won't load new ones.");
			return false;
		}
		for (i in data) {
			dataLine = data[i]
			dataObject = JSON.parse(dataLine);		
			objectList.push(dataObject);
			console.log(dataObject);
			}

		$(statusAttribute).attr('class', 'statusOK');
		
		return true;
	}

	
	function clearCanvas() {
		// Clear the canvas area
		context.fillStyle = "#aaaaaa";
		context.fillRect(0, 0, width, height);
		context.fillStyle = "#000000";	
	}
	
	function initCanvas() {
		
		theCanvas = document.getElementById("ImageCanvas");
		context = theCanvas.getContext("2d");
		
		theCanvas.addEventListener('mousedown', mouseClicked);
		theCanvas.addEventListener('mousemove', mouseMoved);
		
		width = theCanvas.width;
		height = theCanvas.height;
	}
	
	function mouseClicked(evt) {
		console.log("Mouse clicked");
		x = parseInt(evt.offsetX)
		y = height - parseInt(evt.offsetY)
		currentObject = getObjectUnderMouseCursor(x, y)
		console.log(currentObject);
		if (currentObject!=0) {
			updateSelectedObject(currentObject)
		}
	}
	
	function mouseMoved(evt) {
		x = parseInt(evt.offsetX);
		y = height - parseInt(evt.offsetY);
		cursorString = " (" + x + ", " + y + ")";
		currentObject = getObjectUnderMouseCursor(x, y);
		if (currentObject!=0) cursorString+= " [" + currentObject.id + "]";
		$('#MouseLocation').text(cursorString);
	}
	
	function distance(x1, y1, x2, y2) {
		return Math.sqrt( (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2) )
	}
	
	function updateSelectedObject(object) {
		selectedObject = object;
		tableHTML = "<table>";
		tableHTML+= "<tr><td>" + selectedObject.id + "</td><td>(" + parseInt(selectedObject.x) + ", " + parseInt(selectedObject.y) + ")</td></tr>";
		tableHTML+= "</table>";
		$('#SelectedObjectTable').html(tableHTML);
		drawChartR();
		drawChartG();
		drawChartB();
	}
	
	function getObjectUnderMouseCursor(x, y) {
		object = 0
		for (i in masterObjectList) {
		 	ox = masterObjectList[i].x;
		 	oy = masterObjectList[i].y;
			if (distance(x, y, ox, oy)<15) object = masterObjectList[i]
			}
		return object
	}
	
	function loadPNG(filename) {
		//load the image
		var image = new Image();
		image.src = filename;
		image.onload = function () { context.drawImage(image, 0, 0);}
	}
	
	function filterObjects(objectList) {
		returnList = new Array();
		for (i in objectList) {
			if (objectList[i].data.length > 1) returnList.push(objectList[i])
		}
		
		return returnList;
	}
	
	function toggleCircles() {
		if (!circles) {
			drawCircles();
			circles = true;
		} else {
			undrawCircles();
			circles = false;
		}
	}
	
	function undrawCircles() {
		clearCanvas();
		loadPNG();
	}			
	
	function drawCircles() {
		console.log("Drawing circles");
      		context.lineWidth = 3;
      		context.strokeStyle = '#003300';
      		objects = filteredObjectList;
		for (i in objects) {
			x = objects[i].x
			y = height - objects[i].y
			context.beginPath();
	      		context.arc(x, y, 15, 0, 2 * Math.PI, false);
	      		context.stroke();
		}
		
	}
	
	function drawChartR() {
		var dataArray = [['MJD', 'Counts']];
		// Do the red channel
		console.log("Drawing the red chart");
		if (selectedObject.red_id!=-1) {
			redObject = redObjectList[selectedObject.red_id];
			for (i=0; i<redObject.data.length; i++) {
				console.log("MJD: " + redObject.data[i][0] + " Counts:" + redObject.data[i][1]);
				if (redObject.data[i][0]!=51544) {
					temp = [redObject.data[i][0], redObject.data[i][1]];
					dataArray.push(temp);
				}
			}
		} else return;
	        	
		var dataTable = google.visualization.arrayToDataTable(dataArray);

        var options = {
			title: 'Counts for Object: ' + selectedObject.id,
			colors: ['red', 'green', 'blue']
        	}

        var chart = new google.visualization.LineChart(document.getElementById('chart_div_r'));
        chart.draw(dataTable, options);
	}

	function drawChartG() {
		var dataArray = [['MJD', 'Counts']];
		// Do the green channel
		if (selectedObject.green_id!=-1) {
			object = greenObjectList[selectedObject.green_id];
			for (i=0; i<object.data.length; i++) {
				if (object.data[i][0]!=51544) {
					temp = [object.data[i][0], object.data[i][1]];
					dataArray.push(temp);
				}
			}
		} else return;
	        	
		var dataTable = google.visualization.arrayToDataTable(dataArray);

        var options = {
			title: 'Counts for Object: ' + selectedObject.id,
			colors: ['green']
        	}

        var chart = new google.visualization.LineChart(document.getElementById('chart_div_g'));
        chart.draw(dataTable, options);
	}

	function drawChartB() {
		var dataArray = [['MJD', 'Counts']];
		// Do the blue channel
		if (selectedObject.blue_id!=-1) {
			object = blueObjectList[selectedObject.blue_id];
			for (i=0; i<object.data.length; i++) {
				if (object.data[i][0]!=51544) {
					temp = [object.data[i][0], object.data[i][1]];
					dataArray.push(temp);
				}
			}
		} else return;
	        	
		var dataTable = google.visualization.arrayToDataTable(dataArray);

        var options = {
			title: 'Counts for Object: ' + selectedObject.id,
			colors: ['blue']
        	}

        var chart = new google.visualization.LineChart(document.getElementById('chart_div_b'));
        chart.draw(dataTable, options);
	}



function debug(debugString) {
	if (debugText.length>debugHistory) {
		debugText.shift();
	}
	
	dateString = formatTime(new Date());
	
	debugText.push(String(dateString + " : " + debugString));
	
	debugHTML = "";
	for (i in debugText) {
		debugHTML+= debugText[i] + "<br/>";		
	}
	
	$('#debugPanel').html(debugHTML);
}

function formatTime(date) {
	var hours;
	var minutes;
	var seconds;
	var millis;
	var timeString;
	
	hours = date.getHours();
 	minutes = date.getMinutes();
	seconds = date.getSeconds();
	millis = date.getMilliseconds();
	
	if (hours<10) hours = "0" + hours;
	if (seconds<10) seconds = "0" + seconds;
	if (minutes<10) minutes = "0" + minutes;
	if (millis<100) millis = "0" + millis;
	if (millis<10) millis = "0" + millis;
	
	timeString = hours + ":" + minutes + ":" + seconds + "." + millis;
	return timeString;
}
