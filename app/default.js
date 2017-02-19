var colorSheme = [
	"#50514f", "#f25f5c", "#ffe066", "#247ba0", "#70c1b3"
];

function loadStyle() {
	$(".text").parents(".panel-body").first().css({
		"background-color": ""
	});

	$(".definition, .definitie").parents(".panel-body, .panel-heading").first().css({
		"background-color": colorSheme[1]
	});
}
