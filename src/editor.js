import $ from 'jquery';

var container = `
	<div data-type='container' data-depth='0'>
		<div class='panel panel-default'>
			<div class='panel-heading' data-type='editable'>
			</div>
		</div>
	</div>
`;

class Editor {
	constructor() {
		this.add = {
			before: 1,
			after: 2,
			child: 3,
			parent: 4
		}
	}

	addContainer(type, attributes = {}) {
		var div;
		var parent = $(".mce-edit-focus").parents("div[data-type='container']").first();

		switch (type) {
			case 1:
				div = $(container).insertBefore(parent);
				break;
			case 2:
				div = $(container).insertAfter(parent);
				break;
			case 3:
				div = $(container).appendTo(parent);
				break;
			case 4:
				div = $(container).insertAfter(parent);
				div.append(parent);
				$("div[data-type='container']").each(function() {
					$(this).attr("data-depth", $(this).parents("div[data-type='container']").length);
				});
				break;
			default:
				return;
		}

		div.attr("data-depth", div.parents("div[data-type='container']").length);

		div.click(function() {
			autoScroll($(this));
		});

		animateContainer(div);
		autoScroll(div);
	}

	addBody() {
		var parent = $(".mce-edit-focus").parents(".panel").first();
		console.log(parent);
		var div = $("<div class='panel-body' data-type='editable' style='min-height: 0px'></div>").appendTo(parent);
		updateColors();
		div.animate({
			"min-height": "50px"
		}, 100, function() {
			initTinyMCE();
			loadViewer();
			tinymce.get(div.attr("id")).focus();
		});
	}
}

function autoScroll(element) {
	$('html, body').animate({
		scrollTop: element.offset().top - $(window).height() / 2
	}, 100);
}

function animateContainer(div) {
	updateColors();
	div.children(":first").children(".panel-heading").animate({
		"min-height": "50px"
	}, 100, function() {
		initTinyMCE();
		loadViewer();
		tinymce.get(div.find(".mce-content-body").attr("id")).focus();
	});
}

var removeNode = false;
var removeDown = false;

$(window).keyup(function(e) {
	//BACKSPACE / DELETE
	if (e.keyCode == 8 || e.keyCode == 46) {
		if (removeDown) {
			removeNode = true;
		}
	}
});

$(window).keydown(function(e) {
	//BACKSPACE / DELETE
	if (e.keyCode == 8 || e.keyCode == 46) {
		if (removeNode) {
			remove();
			removeNode = false;
		} else {
			removeDown = true;
		}
	} else {
		removeNode = false;
	}

	window.setTimeout(function() {
		setType();
	}, 1)
});

function setType() {
	$(".mce-edit-focus").children().each(function() {
		$(this).attr("class", (getFirstWord($(this).text().toLowerCase()) || "default") + " text");
	});
	updateColors();
}

function getFirstWord(str) {
	if (str.includes(":")) {
		if (!str.split(":")[0].trim().includes(" ")) {
			return str.split(":")[0].trim();
		}
	}

	return null;
}

function remove() {
	console.log("remove");

	var focus = $(".mce-edit-focus");
	var parent = $(".mce-edit-focus").parents("div[data-type='container']").first();

	if (focus.hasClass("panel-body")) {
		if (focus.text() == "") {
			var focus = focus[0];
			var parent = $(focus).parent().children(".panel-heading")[0];
			initTinyMCE();
			updateColors();
			tinymce.get($(parent).attr("id")).focus();
			$(focus).find("*").remove();
			$(focus).slideUp("fast", function() {
				$(focus).remove();
				loadViewer();
			});
		}
	} else if (focus.hasClass("panel-heading") &&
		(parent.data("depth") > 0 ||
			parent.parent().children().length > 1)) {
		if (parent.text() == "") {
			var focus = focus[0];
			$(focus).children().not("div[data-type='container']").remove();
			var parent = getPrev($(focus).parents("div[data-type='container']").first()).first().find(".panel-heading")[0];
			initTinyMCE();
			updateColors();
			tinymce.get($(parent).attr("id")).focus();
			$(focus).find("*").remove();
			$(focus).parents("div[data-type='container']").first().animate({
				"height": "0px"
			}, 100, function() {
				$(focus).parents("div[data-type='container']").first().remove();
				loadViewer();
			});
		}
	}
}

function getPrev(s) {
	if (s.prev("div[data-type='container']")[0] != null) {
		return s.prev("div[data-type='container']");
	} else {
		return s.parents("div[data-type='container']");
	}
}

export {
	Editor
};
