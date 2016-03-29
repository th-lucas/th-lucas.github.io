/* **************************************************** *
 *                 Private Functions                    *
 * **************************************************** */

 // Populates the dataset3 from a CSV file and creates the chart
 function createChart3(){
 	
	/*// Resize
	d3.select(window).on('resize', resize); 
	resize();*/

	d3.json('/public/json/countries.geo.json', function(err, geojson) {
		countryData = geojson;

		d3.csv('/public/csv/billboard_df-final.csv', function(error, data) {
			if(error){ 
				throw error;
			}
			var d;
			var obj;
			for(var i in data){
				d = data[i];

				if(!(d['Year'] in dataset3)){
					dataset3[+d['Year']] = [];
				}
				obj = {
					'Artist(s)': d['Artist(s)'],
					'Title': d['Title'],
					'Location': d['location'],
					'Coordinates': {
						'Longitude': +d['longitude'],
						'Latitude': +d['latitude']
					},
					'Num': +d['Num'],
					'Year': +d['Year'],
					'Country': d['country']
				};
				dataset3[d['Year']].push(obj);
			}

			// By looking at the data we have noticed that the country with the largest number of songs is the USA
			maxTrackByCountry = 0;
			for(var year in dataset3){
				for(var obj in dataset3[year]){
					if(dataset3[year][obj]['Country'] == 'United States of America'){
						maxTrackByCountry++;
					}
				}
			}

			var legendMax = maxTrackByCountry;
			if(legendMax >= 1000){
				legendMax = Math.floor(legendMax / 1000) * 1000 + 500;
			} else if(legendMax >= 100){
				legendMax = Math.floor(legendMax / 100) * 100 + 50;
			}
			countryColorScale = d3.scale.linear().domain([0, 5, 50, 200, 750, 2000, legendMax])
												.range(["#FFF", "#FFFFD9","#f1b8a6", "#de595c", "#C3272B", "#991f22", "#72171a"]);


			radiusScale3 = d3.scale.sqrt().domain([1, 5, 10]).range([2, 10]);
			
			// Countries creation
			updateCountries();
			// Tooltip creation			
			createToolTip3();
			// Artist cities circles creation	
			updateArtistCities();
			// Legend creation
			createLegend();

			slider3 = chroniton().domain([new Date(startYear3, 1, 1), new Date(endYear3, 1, 1)]) 
							        .labelFormat(function(date) {
							          return Math.ceil(date.getFullYear())  
							        })
							        .width(600) 
							        .on('change', function(date) { 
									  var newYear = Math.ceil(date.getFullYear()); 
									  if (newYear != currentYear3) {
									  	if(newYear >= currentYear3){
									  		previousYear3 = newYear - 1;
									  	} else {
											previousYear3 = currentYear3;
									  	}							  	
									    currentYear3 = newYear;
									    svg3.select('g.map g.cities').selectAll('.cities circle').remove(); 
									    updateCountryCount();
									    updateArtistCities();
									  }
									})
									.playButton(true) 
									.playbackRate(0.08)
									.loop(false);

			d3.select("#slider") 
			    .call(slider3);

			callZoom();

			handleImportantDatesTableClick();

		});
	});

}

function handleImportantDatesTableClick(){
	d3.select('#importantDatesTable')
		.selectAll('tr')
		.on('click', function(){
			var selectedYear = d3.select(this).attr('data-year');
			slider3.setValue(new Date(selectedYear), { duration: 5000, ease: 'linear' });
		});
}

function callZoom(){
	svg3.call(zoom)
		.call(zoom.event);
}

function updateCountries() {
	var geoGenerator = d3.geo.path()
	    .projection(projection);

	svg3.select('g.map g.countries')
		.selectAll('path')
		.data(countryData.features)
		.enter()
		.append('path')
		.attr('class', function(d){
			var countryName = camelize3(d.properties.name); 
			countryDict[countryName] = {};
			return countryName;
		})
		.attr('data-track-count', 0)
		.attr('d', geoGenerator)
		.attr("fill", function(){
	    	return countryColorScale(+d3.select(this).attr('data-track-count'));
	    });
}

function updateCountryCount(){
	svg3.select('g.map g.countries')
		.selectAll('path')
		.each(function(){
			var currentCountry = d3.select(this);
			var currentCountryClass = currentCountry.attr('class');
			if(previousYear3 > currentYear3){
				currentCountry.attr('data-track-count', function(){
	    			if(typeof countryDict[currentCountryClass] !== "undefined"){
	    				if(countryDict[currentCountryClass][currentYear3] == 0){
	    					currentCountry.attr('fill', function(){
				    			return countryColorScale(0);
				    		});
	    				}
	    				return countryDict[currentCountryClass][currentYear3];
	    			} else {
	    				return 0;
	    			}
	    		});
	    		
			} else {
				countryDict[currentCountryClass][previousYear3] = +d3.select(this).attr('data-track-count');
			}
		})
}


function updateArtistCities(){
	d3.select("div.yearTitle h6").html("Billboard HOT 100 - Artists location in " + currentYear3);

	// Draw a circle for each location
	var u = svg3.select('g.map g.cities')
				.selectAll('circle')
				.data(dataset3[currentYear3]);

	u.enter()
		.append('circle')
		.attr('data-number', function(d) {
			var allCircles = d3.selectAll('.cities circle');
			var filteredCircles = allCircles.filter(function(x) {
				return (d['Coordinates']['Longitude'] == x['Coordinates']['Longitude']) && (d['Coordinates']['Latitude'] == x['Coordinates']['Latitude']);
			});

			return filteredCircles[0].length;
		});

	u.exit().remove();

	u.attr('cx', function(d) {	
	    	return projection([d['Coordinates']['Longitude'], d['Coordinates']['Latitude']])[0];
	    })
	    .attr('cy', function(d) {
	      	return projection([d['Coordinates']['Longitude'], d['Coordinates']['Latitude']])[1];
	    })
	    .attr('r', function(d) {
	    	if(d['Coordinates']['Longitude'] != "" && d['Coordinates']['Latitude'] != ""){
	    		var dataNumber = d3.select(this).attr('data-number');
	    		return radiusScale3(dataNumber);
	    	} else {
	    		return 0;
	    	}
	    })
	    .attr('fill', function(d){
	    	// Color the country
	    	var currentCountryClass = camelize3(d['Country']);
	    	if(currentCountryClass != null && currentCountryClass != ""){
	    		var currentCountry = d3.select('.' + currentCountryClass);
	    		if(currentYear3 >= previousYear3){
		    		currentCountry.attr('data-track-count', function(){
		    			return +d3.select(this).attr('data-track-count') + 1;
		    		});
		    	}
	    		currentCountry.attr('fill', function(){
	    			return countryColorScale(+d3.select(this).attr('data-track-count'));
	    		});
	    	}

	    	// Color the circle	
	    	return '#081D58'; //'#044B94'
	    })
	    .attr('fill-opacity', '0.4')
	    .attr('stroke', '#081D58')
	    .attr('stroke-width', '0.5')
	    .transition()  //select all the countries and prepare for a transition to new values
			.duration(750);

    u.on('mouseover', function(d) {
		var selectedCircle = d3.select(this);
		var allCircles = d3.selectAll('.cities circle');				

		allCircles.filter(function(x) { return d['Artist(s)'] != x['Artist(s)']; })
		        .style('opacity', 0.2);	

		var filteredCircles = allCircles.filter(function(x) {
				return (d['Coordinates']['Longitude'] == x['Coordinates']['Longitude']) && (d['Coordinates']['Latitude'] == x['Coordinates']['Latitude']);
			});

		selectedCircle.moveToFront3();
		tip3.offset(function() {
			var currentPosition = { x: selectedCircle.attr('cx'), y: selectedCircle.attr('cy'), r: selectedCircle.attr('r') };

			translate0 = [(currentPosition.x - zoom.translate()[0]) / zoom.scale(), (currentPosition.y - zoom.translate()[1]) / zoom.scale()];
			l = [translate0[0] * zoom.scale() + zoom.translate()[0], translate0[1] * zoom.scale() + zoom.translate()[1]];
		  	return [currentPosition.x - l[0] - 5, 
		  				currentPosition.y - l[1]];
		});
		tip3.show(filteredCircles[0], d);

	});

	u.on('mouseout', function(d) {
		var selectedCircle = d3.select(this);
		
		var allCircles = d3.selectAll('.cities circle')
						.style('opacity', 1);
		
		selectedCircle.moveToBack3();
		tip3.hide(d);
			
	});
}

function createLegend() {
	var legend = svg3.selectAll('.legend')
		.data(countryColorScale.domain().slice().reverse())
		.enter().append('g')
		.attr('class', 'legend')
		.attr('transform', function(d, i) { return 'translate(0,' + i * 20 + ')'; });

	legend.append('rect')
		.attr('x', width3 - 18)
		.attr('y', 10)
		.attr('width', 18)
		.attr('height', 18)
		.style('fill', countryColorScale);

	legend.append('text')
		.attr('x', width3 - 24)
		.attr('y', 19)
		.attr('dy', '.35em')
		.style('text-anchor', 'end')
		.text(function(d) { 
			return (d > 1) ? d + ' tracks' : d + ' track'; }
		);


	var legendCircle = svg3.selectAll('.legendCircle')
		.data(radiusScale3.domain().slice().reverse())
		.enter().append('g')
		.attr('class', 'legendCircle')
		.attr('transform', function(d, i) { return 'translate(0,' + ((countryColorScale.domain().length + 2) * 20 + i * 30) + ')'; });

	legendCircle.append('circle')
		.attr('cx', width3 - 9)
		.attr('cy', 10)
		.attr('r', radiusScale3)
		.attr('width', 18)
		.attr('height', 18)
		.style('fill-opacity', '0.4')
	    .style('stroke', '#081D58')
	    .style('stroke-width', '0.5')
	    .style('fill', '#081D58');

	legendCircle.append('text')
		.attr('x', width3 - 30)
		.attr('y', 10)
		.attr('dy', '.35em')
		.style('text-anchor', 'end')
		.text(function(d) { 
			return (d > 1) ? d + ' tracks' : d + ' track'; });
}

// TODO: Resize function which makes the graph responsive
/*function resize() {
	// Find the new window dimensions 
    var width3 = parseInt(d3.select('#chart').style('width3')) - margin3.left - margin3.right,
    	height3 = parseInt(d3.select('#chart').style('height3')) - margin3.top - margin3.bottom;

    var xAxisText = xAxisValues['Medium'];
    var yAxisText = yAxisValues['Medium'];
    if((height3 + margin3.top + margin3.bottom) <= 370){
		yAxisText = yAxisValues['Small'];
	}
    if(((width3 + margin3.left + margin3.right) >= 1500) && ((height3 + margin3.top + margin3.bottom) >= 700)){
		radius = radiusValues['Big'];
		hoveredRadius = hoveredRadiusValues['Big'];
	} else if (((width3 + margin3.left + margin3.right) <= 500) && ((height3 + margin3.top + margin3.bottom) <= 400)){
		radius = radiusValues['Small'];
		hoveredRadius = hoveredRadiusValues['Small'];
		xAxisText = xAxisValues['Small'];
		yAxisText= yAxisValues['Small'];
	} 
	else {
		radius = radiusValues['Medium'];
		hoveredRadius = hoveredRadiusValues['Medium'];
	} 

	var jitterIndex = 0;

	// Update the range of the scales with new width3/height3
	xScale3.range([0, width3]);
	yScale3.range([height3, 0]);

	// Update all the existing elements (gridlines, axis text, circles)
	container3.select('#gridY')
			.attr('transform', 'translate(0, '+height3+')')
			.call(gridXAxis3.tickSize(-height3 - 15, 0, 0));

	container3.select('#gridX')
			.call(gridYAxis3.tickSize(-width3, 0, 0));

	container3.select('.x.label')
	    .attr('x', width3)
	    .attr('y', height3 + 30)
	    .text(xAxisText);

	container3.select('.y.label')
	    .text(yAxisText);

	container3.selectAll('circle')
		.attr('cx', function(d) {
			if(d3.select(this).classed('multipleArtists')){
				var x_jitter = Math.pow(-1, jitterIndex) * jitter3 - Math.pow(-1, jitterIndex) * (jitter3 / 2);
				jitterIndex++;
				return xScale3(d['Counts']) + x_jitter;
			} else {
				return xScale3(d['Counts']);
			}
		})
		.attr('cy', function(d) {return yScale3(d['Years of presence']);})
		.attr('r', radius);
}*/


// Function which takes a string and return its camelized version (useful for DOM elements ID)
function camelize3(str) {
	return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
    	if (+match === 0) return ''; // or if (/\s+/.test(match)) for white spaces
    	return index == 0 ? match.toLowerCase() : match.toUpperCase();
  	});
}

// Function which put the current element to the front.
// This is useful as d3 renders the last inserted element on the front.
d3.selection.prototype.moveToFront3 = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

// Function which put the current element to the back
d3.selection.prototype.moveToBack3 = function() { 
    return this.each(function() { 
        var firstChild = this.parentNode.firstChild; 
        if (firstChild) { 
            this.parentNode.insertBefore(this, firstChild); 
        } 
	}); 
};


// Zoom functions
function zoomed() {
    container3.attr("transform",
        "translate(" + zoom.translate() + ")" +
        "scale(" + zoom.scale() + ")"
    );
}

function interpolateZoom (translate, scale) {
    var self = this;
    return d3.transition().duration(350).tween("zoom", function () {
        var iTranslate = d3.interpolate(zoom.translate(), translate),
            iScale = d3.interpolate(zoom.scale(), scale);
        return function(t) {
            zoom
                .scale(iScale(t))
                .translate(iTranslate(t));
            zoomed();
        };
    });
}

function clicked(){
	var clicked = d3.event.target,
        direction = 1,
        factor = 0.2,
        target_zoom = 1,
        center = [width3 / 2, height3 / 2],
        extent = zoom.scaleExtent(),
        translate = zoom.translate(),
        translate0 = [],
        l = [],
        view = {x: translate[0], y: translate[1], k: zoom.scale()};

    d3.event.preventDefault();
    direction = +this.getAttribute("data-zoom")
    target_zoom = zoom.scale() * (1 + factor * direction);

    if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

    translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
    view.k = target_zoom;
    l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

    view.x += center[0] - l[0];
    view.y += center[1] - l[1];

    interpolateZoom([view.x, view.y], view.k);
}

// Tooltip creation (uses the .tip3() function from the d3-tip3 js library)
function createToolTip3(){
	tip3 = d3.tip()
	    .attr('class', 'd3-tip')
	    .offset([-10, 0])
	    .html(function(filteredCircles, d) {
	    	var tooltipString = "<div><span class='tooltipTitle'>" + d['Location'] + "</span></div>";

	    	var artists = [];
	    	var trackCount;
	    	var artistObj;
	    	for(var i = 0; i < filteredCircles.length; i++){
	    		var artistName = filteredCircles[i]['__data__']['Artist(s)'];
	    		if(artists.length == 0){
					artistObj = {
		    			"name": artistName,
		    			"count": 1
	    			};
	    			artists.push(artistObj);
	    		} else {
	    			var inArray = false;
		    		for(var j = 0; j < artists.length; j++){
		    			if(artistName == artists[j].name){
		    				artists[j].count += 1;
		    				inArray = true;
		    				break;
		    			} 
		    		}
		    		if(!inArray){
	    				artistObj = {
		    				"name": artistName,
		    				"count": 1
	    				};
		    			artists.push(artistObj);
		    		}	
	    		}	
	    	}

			for(var k = 0; k < artists.length; k++){
				tooltipString += "<div><span>Artist:</span> <span class='tooltipContents'>" + artists[k].name + " x" +  artists[k].count + "</span></div>";
			}
    		
			return tooltipString;
			     
		});

	container3.call(tip3);
}

/* **************************************************** *
 *                 		   Main                         *
 * **************************************************** */

// Chart info
var margin3 = {top: 40, right: 40, bottom: 40, left: 40},
    width3 = parseInt(d3.select('#chart3').style('width')) - margin3.left - margin3.right,
    height3 = parseInt(d3.select('#chart3').style('height')) - margin3.top - margin3.bottom;

var svg3 = d3.select('#chart3')
		    .attr('width', width3 + margin3.left + margin3.right)
		    .attr('height', height3 + margin3.top + margin3.bottom);

// Zoom definition
var zoom = d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoomed);
d3.selectAll('.button-zoom').on('click', clicked);

var container3 = svg3.select('g.map')
		    .attr('transform', 'translate(' + margin3.left + ',' + margin3.top + ')')
		    .call(zoom);

var countryData, cityData;
var maxTrackByCountry = 0;

var startYear3 = 1960;
var endYear3 = 2015;
var currentYear3 = startYear3;
var previousYear3 = null;

// Projection function
var projection = d3.geo.mercator()
    .center([0, 0])
    .scale(140)
    .translate([480, 325]);    

var jitter3 = 10;

// Scales
var xScale3 = null;
var yScale3 = null;
var radiusScale3 = null;
var countryColorScale = null;

// Tooltip
var tip3 = null;

// Grid lines
var gridXAxis3 = null;
var gridYAxis3 = null;

// Slider 
var slider3;

// Dataset init and chart creation
var dataset3 = [];
var countryDict = {};
createChart3();
