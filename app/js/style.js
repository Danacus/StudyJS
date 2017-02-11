var colors = [];
var array = null;
var styleFile = null;

$(document).ready(function() {
	if (colors != null)
		array = colors;
})

function setColors(a) {
	console.log("set colors");
	array = a;
}

function updateColors() {
	updateStyle();
}

function setStyles(s) {
	styleFile = s;
}

function updateStyle() {
	$(".text").parents(".panel-body, .panel-heading").css({
		"background-color": ""
	});

	if (array != null) {
		for (var i = 0; i < array.length; i++) {
			$("div[data-depth=" + i + "]").find(".panel-heading").css({
				"background-color": array[i]
			});
		}
	}

	if (styleFile != null) {
		for (var i = 0; i < styleFile.colors.length; i++) {
			var old = JSON.stringify(styleFile).replace("@" + i, styleFile.colors[i]);
			styleFile = JSON.parse(old);
		}

		for (var j = 0; j < styleFile.items.length; j++) {
			for (var i = 0; i < styleFile.items[j].name.length; i++) {
				$("." + styleFile.items[j].name[i]).css(styleFile.items[j].style);
				$("." + styleFile.items[j].name[i]).parents(".panel-body, .panel-heading").first().css(styleFile.items[j].panel.style);
			}
		}
	}
}
