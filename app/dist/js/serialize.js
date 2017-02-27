var json = [];

var serializer;

class Serializer {
	constructor() {
		serializer = this;
	}
	serialize() {
		json = [];

		$(".eq-math").each(() => {
			$(this).html($(this).data("formula"));
		});

		$("#document").children("[data-type='container']").each(function() {
			json.push($(this).serialize());
		});

		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

		return JSON.stringify(json);
	}
	deserialize(obj) {
		for (var i = 0; i < obj.length; i++) {
			$("#document").deserialize(obj[i]);
		}
	}
}
/*
export {
	serializer,
	Serializer
};*/

$.fn.deserialize = function(data) {
	var cur = $('<div data-type="container">').appendTo($(this));
	cur.attr("data-depth", cur.parents("div[data-type='container']").length);
	var panel = $('<div class="panel panel-default"></div>').appendTo(cur);
	var h = $('<div class="panel-heading" data-type="editable"></div>').appendTo(panel);
	h.html(data.h);

	if (data.b != "") {
		var b = $('<div class="panel-body" data-type="editable"></div>').appendTo(panel);
		b.html(data.b);
	}

	for (var i = 0; i < data.a.length; i++) {
		cur.deserialize(data.a[i]);
	}
}

$.fn.serialize = function() {
	var cur = {
		h: "",
		b: "",
		a: []
	};

	var panel = $(this).children(".panel").first();

	cur.h = panel.children(".panel-heading").html();
	cur.b = (panel.children(".panel-body").html() || "");

	for (var i = 0; i < $(this).children("[data-type='container']").length; i++) {
		cur.a.push($($(this).children("[data-type='container']")[i]).serialize());
	}

	return cur;
}
