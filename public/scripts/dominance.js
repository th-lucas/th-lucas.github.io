/* **************************************************** *
 *                 Private Functions                    *
 * **************************************************** */

 // Populates the dataset2 from a CSV file and creates the chart
 function createChart2(){
 	var nbOfArtists = d3.select('#numberOfArtistsSelector2')
						.selectAll('.active')
						.attr('data-val');

 	nbOfArtists = parseInt(nbOfArtists);

 	valueToDisplay2 = d3.select('#hotttnessOrFamiliaritySelector')
						.selectAll('.active')
						.attr('data-val');
	setXValues2(valueToDisplay2);

 	// Populates the dataset2 from a CSV file and creates
 	var dsv = d3.dsv(";", "text/plain");
	dsv('/public/csv/billboard_df-artist_count.csv', function(error, data) {
		if(error){ 
			throw error;
		}
		dataset2 = data.map(function(d, index) { 
			var dominanceAsJSON = JSON.parse(d['Dominance Max']);
			var dominanceYearsArray = dominanceAsJSON.years;

			for(var i = 0; i < dominanceYearsArray.length; i++){
				var dominanceYearsArraySplittedArray = dominanceYearsArray[i].split('Dominance ');
				var dominanceStartYear = null;
				var dominanceEndYear = null;
				if(typeof dominanceYearsArraySplittedArray[1] !== "undefined"){
					dominanceStartYear = dominanceYearsArraySplittedArray[1].split(' - ')[0];
					dominanceEndYear = dominanceYearsArraySplittedArray[1].split(' - ')[1];
				}
				
				if(dateRange[0] <= dominanceStartYear && dateRange[1] >= dominanceEndYear ){
					return {
						'Artist(s)': d['Artist(s)'],
						'Counts': +d['Counts'],
						'Rank': +d['Rank'],
						'Years of presence': +d['Years of presence'],
						'Image URL': d['Image URL'],
						'List of songs': JSON.parse('[' + d['List of songs'].split(',-,').toString() + ']'),
						'Familiarity': +d['familiarity'],
						'Hotttnesss': +d['hotttnesss'],
						'Dominance Max': JSON.parse(d['Dominance Max'])
					};
				}
				else {
					continue;
				}
			}
			return null;	
		});
		
		var datasetTemp = [];
		for(var i = 0; i < dataset2.length; i++){
			if(dataset2[i] !== null){
				datasetTemp.push(dataset2[i]);
			}
		}
		dataset2 = datasetTemp;

		dataset2.sort(function(a,b) {
			if(a['Dominance Max'].value > b['Dominance Max'].value){ 
				return -1;
			}
			else if(b['Dominance Max'].value > a['Dominance Max'].value) {
				return 1;
			}
			else{
				if(a['Years of presence'] > b['Years of presence']) {
					return -1;
				}
				else if(b['Years of presence'] > a['Years of presence']){
					return 1;
				} 
				else {
					return 0;
				}
			}
		});

		dataset2 = dataset2.slice(0, nbOfArtists + 1);

		// Scales
		var xMax = d3.max(dataset2, function(d) { return d[valueToDisplay2]; });
		var xMin = d3.min(dataset2, function(d) { return d[valueToDisplay2]; });
		xScale2 = d3.scale.linear().domain([xMin - 0.02, xMax + 0.02]).range([0, width2]);

		var dominanceMax = d3.max(dataset2, function(d) { return d['Dominance Max'].value; });
		var dominanceMin = d3.min(dataset2, function(d) { return d['Dominance Max'].value; });
		var lowerBound = (dominanceMin > 0.01) ? dominanceMin - 0.01 : 0;
		yScale2 = d3.scale.linear().domain([lowerBound, dominanceMax + 0.01]).range([height2, 0]);

		// Chart creation

		// Tooltip creation			
		createToolTip2();
		// Axis label creation		
		createAxesLabels2();
		// Gridlines creation
		createGridAxis2();
		// Patterns creation
		updatePatterns2(dataset2);
		// Circles creation
		updateCircles2(dataset2);
		// Resize
		//d3.select(window).on('resize', resize2); 
		resize2();
	});
}

// Update loop which builds the patterns elements (used to display the artist images)
function updatePatterns2(dataset2) {
	var p = container2
		.select('.defs')
		.selectAll('pattern')
		.data(dataset2);  

	p.enter()
		.append('pattern')
		.attr('id', function(d) {return camelize2(d['Artist(s)']) + '-img2'})
		.attr('patternContentUnits', 'objectBoundingBox')
		.attr('height', '100%')
		.attr('width', '100%')
			.append('image')
			.attr('width', '1')
			.attr('height', '1')
			.attr('preserveAspectRatio', 'none') // xMidYMid slice
			.attr('xlink:href', function(d) {return d['Image URL'];});

	p.exit().remove();	
}

// Update loop for the circles
function updateCircles2(dataset2) {
	var jitterIndex = 0; 
	dataset2.sort(function(a,b) {
		if(a['Dominance Max'].value > b['Dominance Max'].value){ 
			return -1;
		}
		else if(b['Dominance Max'].value > a['Dominance Max'].value) {
			return 1;
		}
		else{
			if(a['Years of presence'] > b['Years of presence']) {
				return -1;
			}
			else if(b['Years of presence'] > a['Years of presence']){
				return 1;
			} 
			else {
				return 0;
			}
		}
	});

	var u = container2
		.select('.circles')
		.selectAll('circle')
		.data(dataset2);

	u.enter()
		.append('circle')
		.attr('class', function(d) {
			var allCircles = container2.selectAll('circle');
			var filteredCircles = allCircles.filter(function(x) {
				return (d[valueToDisplay2] == x[valueToDisplay2]) && (d['Dominance Max'].value == x['Dominance Max'].value);
			});

			if(filteredCircles[0].length > 1){
				return 'multipleArtists';
			} else {
				return 'singleArtist';
			}
		});

	u.exit().remove();

	u.attr('cx', function(d) {
			if(d3.select(this).classed('multipleArtists')){
				var x_jitter = Math.pow(-1, jitterIndex) * jitter2 - Math.pow(-1, jitterIndex) * (jitter2 / 2);
				jitterIndex++;
				return xScale2(d[valueToDisplay2]) + x_jitter;
			} else {
				return xScale2(d[valueToDisplay2]);
			}
		})
		.attr('cy', function(d) {return yScale2(d['Dominance Max'].value);})
		.attr('r', radius2) //function(d) {return radiusScale2(1/d['Rank']);})
		.style('stroke-width', '2px')
		.style('fill', function(d) {return 'url(#' + camelize2(d['Artist(s)']) + '-img2)';});

	u.on('mouseover', function(d) {
		var selectedCircle = d3.select(this);
		var allCircles = container2.selectAll('circle');

		// All other circles are faded out
		allCircles.filter(function(x) { return d['Artist(s)'] != x['Artist(s)']; })
		        .style('opacity', 0.2);				

		selectedCircle.transition()
			.duration(200)
			.attr('r', hoveredRadius2)
			.each("end", function(d){ return tip2.show(d, this); });

		selectedCircle.moveToFront2();		
	});

	u.on('mouseout', function(d) {
		var selectedCircle = d3.select(this);
		
		var allCircles = d3.selectAll('circle')
						.style('opacity', 1);

		selectedCircle.attr('r', radius2)
						.transition()
						.duration(200);
		
		selectedCircle.moveToBack2();
		tip2.hide(d);
			
	});

	u.on('click', function(d) {
		var selectedCircle = d3.select(this);
		
		var artistDetails = d3.select('div#artistDetails2').style('display', 'block');

		artistDetails.select('.artistNameTitle')
			.text(d['Artist(s)']);

		artistDetails.select('.artistNameImage')
			.attr('src', d['Image URL']);

		// Select the artist table
		var artistTable = d3.select('#artistDetails2 .artistSongListDiv table');

		// Clear the table body
		artistTable.select('tbody').selectAll('tr').remove();

		var newTableRow = null;
		d['List of songs'].forEach(function(songObject, index){
			spotifyApi2.searchTracks(d['Artist(s)'] + ' ' + songObject.title, {limit: 1})
				.then(function(data) {
					newTableRow = artistTable.select('tbody').append('tr')
							.attr('id', 'song2-' + index)
							.attr('class', 'song-row');

					var previewUrl = data.tracks.items[0].preview_url;
					newTableRow.append('td')
						.text(songObject.title);
					newTableRow.append('td')
						.text(songObject.year);
					newTableRow.append('td')
						.text('#' + songObject.rank);
					var playerCell = newTableRow.append('td');
					var audioControls = playerCell.append('audio')
						.attr('controls', '')
						.attr('id', 'audio2-' + index)
						.on('ended', function() {
					          d3.select(this).currentTime = 0;
					          d3.select('#playDisplayButton2-' + index).classed('active', false);
					     });
					audioControls.append('source')
						.attr('src', previewUrl)
						.attr('type', 'audio/mpeg');
					audioControls.append('source')
						.attr('src', previewUrl)
						.attr('type', 'audio/ogg');
					playerCell.append('button')
						.attr('class', 'playDisplayButton')
						.attr('id', 'playDisplayButton2-' + index)
						.on('click', function(){
							var selectedID = d3.select(this).attr('id').split('playDisplayButton2-')[1];
							d3.selectAll('.playDisplayButton.active').each(function(){
								var idToPause = d3.select(this).attr('id').split('playDisplayButton2-')[1];
								if(selectedID != idToPause){
									d3.select(this).classed('active', false);
									d3.select('#audio2-' + idToPause)[0][0].pause();
								}
							});
							hasClass = d3.select(this).classed('active');
							d3.select(this).classed('active', !hasClass);
							if(hasClass){
								d3.select('#audio2-' + index)[0][0].pause();
							} else {
								d3.select('#audio2-' + index)[0][0].play();
							}
						});

					if(songObject.rank == 1){
						newTableRow.attr('class', 'success');
					}
				}, function(err) {
					newTableRow = artistTable.select('tbody').append('tr')
							.attr('id', 'song2-' + index);
					newTableRow.append('td')
						.text(songObject.title);
					newTableRow.append('td')
						.text(songObject.year);
					newTableRow.append('td')
						.text('#' + songObject.rank);
					newTableRow.append('td');

					if(songObject.rank == 1){
						newTableRow.attr('class', 'success');
					}
			});
		});

		goToByScroll2('artistDetails2');
	});
}


// Axis label creation
function createAxesLabels2() {
	container2.select('.x.axis')
		.append('text')
	    .attr('class', 'x label')
	    .attr('text-anchor', 'end')
	    .attr('x', width2)
	    .attr('y', height2 + 30)
	    .text('# of songs in the Billboard Hot 100 (year end)');

	 container2.select('.y.axis')
		.append('text')
	    .attr('class', 'y label')
	    .attr('text-anchor', 'end')
	    .attr('y', -35)
	    .attr('dy', '.75em')
	    .attr('transform', 'rotate(-90)')
	    .text('# of years of presence in the Billboard Hot 100 (year end)');
}

// Grid lines creation
function createGridAxis2() {
	// Define vertical grid lines
	gridXAxis2 = d3.svg.axis()
			.scale(xScale2)
			.orient('bottom')
			.tickFormat(formatPercent2)
			.ticks(5);

	container2.select('.grids')
		.append('g')         
		.attr('class', 'grid')
		.attr('id', 'gridY2')
		.attr('transform', 'translate(0, '+height2+')')
		.style('stroke-dasharray', ('2, 2'))
		.call(gridXAxis2.tickSize(-height2 - 15, 0, 0));

	// Define horizontal grid lines
	gridYAxis2 = d3.svg.axis()
			.scale(yScale2)
			.orient('left')
			.tickFormat(formatPercent2)
			.ticks(5);

	container2.select('.grids')
		.append('g')         
		.attr('class', 'grid')
		.attr('id', 'gridX2')
		.attr('transform', 'translate(0, 0)')
		.style('stroke-dasharray', ('2, 2'))
		.call(gridYAxis2.tickSize(-width2, 0, 0));
}

// Tooltip creation (uses the .tip() function from the d3-tip js library)
function createToolTip2(){
	tip2 = d3.tip()
	    .attr('class', 'd3-tip')
	    .offset([-10, 0])
	    .html(function(d) {
	    	var dominanceYearList = d['Dominance Max'].years;
	    	var dominanceYearPrint = "";
	    	for(var i = 0; i < dominanceYearList.length; i++){
	    		dominanceYearPrint += dominanceYearList[i].split("Dominance")[1];
	    		if(i != dominanceYearList.length - 1){
	    			dominanceYearPrint += " / ";
	    		}
	    	}
			return "<div><span class='tooltipTitle'>" + d['Artist(s)']+ "</span></div>" +
			      "<div><span>" + valueToDisplay2 + ":</span> <span class='tooltipContents'>" + (d[valueToDisplay2] * 100).toFixed(2) + "%</span></div>" +
			     "<div><span>Dominance Max:</span> <span class='tooltipContents'>" + (d['Dominance Max'].value * 100).toFixed(2) + "%</span></div>" +
			     "<div><span>Years:</span> <span class='tooltipContents'>" + dominanceYearPrint + "</span></div>";
		});

	container2.call(tip2);
}

// Resize function which makes the graph responsive
function resize2() {
	valueToDisplay2 = d3.select('#hotttnessOrFamiliaritySelector')
						.selectAll('.active')
						.attr('data-val');
	setXValues2(valueToDisplay2);

	// Find the new window dimensions 
    var width2 = parseInt(d3.select('#chart2').style('width')) - margin2.left - margin2.right,
    	height2 = parseInt(d3.select('#chart2').style('height')) - margin2.top - margin2.bottom;

    var xAxisText = xAxisValues2['Medium'];
    var yAxisText = yAxisValues2['Medium'];
    if((height2 + margin2.top + margin2.bottom) <= 370){
		yAxisText = yAxisValues2['Small'];
	}
    if(((width2 + margin2.left + margin2.right) >= 1500) && ((height2 + margin2.top + margin2.bottom) >= 700)){
		radius2 = radiusValues2['Big'];
		hoveredRadius2 = hoveredRadiusValues2['Big'];
	} else if (((width2 + margin2.left + margin2.right) <= 500) && ((height2 + margin2.top + margin2.bottom) <= 400)){
		radius2 = radiusValues2['Small'];
		hoveredRadius2 = hoveredRadiusValues2['Small'];
		xAxisText = xAxisValues2['Small'];
		yAxisText= yAxisValues2['Small'];
	} 
	else {
		radius2 = radiusValues2['Medium'];
		hoveredRadius2 = hoveredRadiusValues2['Medium'];
	} 

	var jitterIndex = 0;

	// Update the range of the scales with new width2/height2
	var xMax = d3.max(dataset2, function(d) { return d[valueToDisplay2]; });
	var xMin = d3.min(dataset2, function(d) { return d[valueToDisplay2]; });
	xScale2 = d3.scale.linear().domain([xMin - 0.02, xMax + 0.02]).range([0, width2]);
	yScale2.range([height2, 0]);

	// Update all the existing elements (gridlines, axis text, circles)
	gridXAxis2.scale(xScale2);
	gridYAxis2.scale(yScale2);

	container2.select('#gridY2')
			.attr('transform', 'translate(0, '+height2+')')
			.call(gridXAxis2.tickSize(-height2 - 15, 0, 0));

	container2.select('#gridX2')
			.call(gridYAxis2.tickSize(-width2, 0, 0));

	container2.select('.x.label')
	    .attr('x', width2)
	    .attr('y', height2 + 30)
	    .text(xAxisText);

	container2.select('.y.label')
	    .text(yAxisText);

	container2.selectAll('circle')
		.transition()
		.duration(1000)
		.attr('cx', function(d) {
			if(d3.select(this).classed('multipleArtists')){
				var x_jitter = Math.pow(-1, jitterIndex) * jitter2 - Math.pow(-1, jitterIndex) * (jitter2 / 2);
				jitterIndex++;
				return xScale2(d[valueToDisplay2]) + x_jitter;
			} else {
				return xScale2(d[valueToDisplay2]);
			}
		})
		.attr('cy', function(d) {return yScale2(d['Dominance Max'].value);})
		.attr('r', radius2);
}

function clearGraph2(){
	clearGrids2();
	clearPatterns2();
	clearCircles2();
	clearAxisTitles2();
}

function clearGrids2(){
	container2.select('.grids').selectAll('g').remove();
}

function clearPatterns2(){
	container2.select('.defs').selectAll('pattern').remove();
}

function clearCircles2(){
	container2.select('.circles').selectAll('circle').remove();
}

function clearAxisTitles2(){
	container2.select('.x.axis').selectAll('text').remove();
	container2.select('.y.axis').selectAll('text').remove();
}

// Function which takes a string and return its camelized version (useful for DOM elements ID)
function camelize2(str) {
	return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    	if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    	return index == 0 ? match.toLowerCase() : match.toUpperCase();
  	});
}

// Function which put the current element to the front.
// This is useful as d3 renders the last inserted element on the front.
d3.selection.prototype.moveToFront2 = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

// Function which put the current element to the back
d3.selection.prototype.moveToBack2 = function() { 
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
	}); 
};

// This is a functions that scrolls to #{blah}link
function goToByScroll2(id){
    // Scroll
    $('html,body').animate({
        scrollTop: $("#"+id).offset().top}, 'slow');
}

function setXValues2(valueToDisplay2){
	if(valueToDisplay2 == "Hotttnesss"){
		xAxisValues2 = {'Small': 'Artist Hotttnesss', 'Medium': 'Artist Hotttnesss'};
	} else {
		xAxisValues2 = {'Small': 'Artist Familiarity', 'Medium': 'Artist Familiarity'};
	}
}

/* **************************************************** *
 *                 		   Main                         *
 * **************************************************** */

// Chart info
var margin2 = {top: 40, right: 40, bottom: 40, left: 40},
    width2 = parseInt(d3.select('#chart2').style('width')) - margin2.left - margin2.right,
    height2 = parseInt(d3.select('#chart2').style('height')) - margin2.top - margin2.bottom;

var svg = d3.select('#chart2')
		    .attr('width', width2 + margin2.left + margin2.right)
		    .attr('height', height2 + margin2.top + margin2.bottom);
		  
var container2 = svg.select('g.chart-wrapper')
		    .attr('transform', 'translate(' + margin2.left + ',' + margin2.top + ')');

// Radius details
var radiusValues2 = {'Small': 12, 'Medium': 17, 'Big': 30};
var hoveredRadiusValues2 = {'Small': 22, 'Medium': 30, 'Big': 40};

var radius2 = null;
var hoveredRadius2 = null;
if(((width2 + margin2.left + margin2.right) >= 1500) && ((height2 + margin2.top + margin2.bottom) >= 700)){
	radius2 = radiusValues2['Big'];
	hoveredRadius2 = hoveredRadiusValues2['Big'];
} else if (((width2 + margin2.left + margin2.right) <= 500) && ((height2 + margin2.top + margin2.bottom) <= 400)){
	radius2 = radiusValues2['Small'];
	hoveredRadius2 = hoveredRadiusValues2['Small'];
} 
else {
	radius2 = radiusValues2['Medium'];
	hoveredRadius2 = hoveredRadiusValues2['Medium'];
} 

var jitter2 = 10;

// Scales
var xScale2 = null;
var yScale2 = null;
var radiusScale2 = null;

// Tooltip
var tip2 = null;

// Grid lines
var gridXAxis2 = null;
var gridYAxis2 = null;
var formatPercent2 = d3.format(".0%");

// Axis details
var valueToDisplay2 = d3.select('#hotttnessOrFamiliaritySelector')
						.selectAll('.active')
						.attr('data-val');

var xAxisValues2;
var yAxisValues2 = {'Small': 'Artist Dominance', 'Medium': 'Artist Dominance'};

// Event handlers for the button-group with hotttnesss and familiarity
var grouppedButtonsHotttnessFamiliarity2 = d3.select('#hotttnessOrFamiliaritySelector')
						.selectAll('.btn');

grouppedButtonsHotttnessFamiliarity2.on('click', function(){ 
	grouppedButtonsHotttnessFamiliarity2.classed('active', false);
	
	d3.select(this).classed('active', true);
	resize2();
});

// Event handlers for the button-group
var grouppedButtons2 = d3.select('#numberOfArtistsSelector2')
						.selectAll('.btn');

grouppedButtons2.on('click', function(){ 
	grouppedButtons2.classed('active', false);
	
	d3.select(this).classed('active', true);
	clearGraph2();
	createChart2();
});

// Close button for the artist details area
d3.select('#close2').on('click', function(){
	goToByScroll2('chart2'); 
	d3.select('#artistDetails2').style('display', 'none'); 
});

// Slider 
var sliderDateRange2 = new Slider('#dateRangeSlider');
var dateRange = sliderDateRange2.getValue();

sliderDateRange2.on('slideStop', function(){
	dateRange = sliderDateRange2.getValue();
	clearGraph2();
	createChart2();
});

// Instantiate Spotify wrapper
var spotifyApi2 = new SpotifyWebApi();

// Dataset init and chart creation
var dataset2 = [];
createChart2();

