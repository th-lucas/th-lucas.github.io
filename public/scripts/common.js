// This script is used to center each graph on the page for every screen size.

$(document).ready(function(){
	var marginLeftContainer = parseInt($('.container').css('margin-left'));      
	$('.chart-container').css('margin-left', 'calc(5vw - ' + marginLeftContainer + 'px)');
	$('.svg-container').css('margin-left', 'calc(5vw - ' + marginLeftContainer + 'px)');
});