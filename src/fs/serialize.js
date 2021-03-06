import {
	MQEdit
} from '../editor/eqEditor2';

var json = [];

class Serializer {
	static serialize() {
		MQEdit.unload();
		json = [];

		$("#document").children("[data-type='container']").each(function() {
			json.push($(this).serialize());
		});

		MQEdit.load();
		return JSON.stringify(json);
	}
	static deserialize(obj) {
		for (var i = 0; i < obj.length; i++) {
			$("#document").deserialize(obj[i]);
		}
		MQEdit.load();
	}
}

export {
	serializer,
	Serializer
};

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
