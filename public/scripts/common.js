// This script is used to center each graph on the page for every screen size.

$(document).ready(function(){
	adjustSVGMarginAndPadding();
	$( window ).on('resize', adjustSVGMarginAndPadding);
});

function adjustSVGMarginAndPadding(){
	var marginLeftContainer = parseInt($('.container').offset().left); //$('.container').css('margin-left'));      
	$('.chart-container').css('margin-left', 'calc(5vw - ' + marginLeftContainer + 'px)');
	$('.svg-container').css('margin-left', 'calc(5vw - ' + marginLeftContainer + 'px)');

	var heightChart = $('#chart5').height();
	$('.svg-container').css('padding-top', heightChart);
}