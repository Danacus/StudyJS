var EventEmitter = require('events');
var util = require('util');

function bootstrapDialog(properties) {
	EventEmitter.call(this);
	var self = this;
	var d = $("#dialog");

	d.find(".modal-title").text(properties.title || "Dialog");
	d.find(".modal-body").html(properties.content || "");
	d.find(".modal-footer").html("");

	for (var i = 0; i < properties.buttons.length; i++) {
		var b = $('<button type="button" class="btn ' + (properties.buttons[i].type || "btn-default") + '" data-dismiss="modal">' + properties.buttons[i].label + '</button>').appendTo(d.find(".modal-footer"));
		b.click({
			button: properties.buttons[i]
		}, function(e) {
			//e.data.button.onclick();
			self.emit('click', e.data.button);
		});
	}

	d.modal("show");
	//return self;
}

util.inherits(bootstrapDialog, EventEmitter);

var bootstrapNotification = function(properties) {
	var n = $("#notification");

	n.attr("class", "alert " + properties.type);
	n.html(properties.content);

	n.parent().animate({
		"margin-top": "50px"
	}, 800);

	window.setTimeout(function() {
		n.parent().animate({
			"margin-top": "-50px"
		}, 800);
	}, 2500);
}

export {
	bootstrapDialog,
	bootstrapNotification
};
