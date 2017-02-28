import $ from 'jquery';

function showDialog(properties) {
	return new Promise(function(resolve) {
		_fadeContent(properties).then((button) => {
			if (button) {
				resolve(button);
			} else {
				var dialog = $(".dialog");

				dialog.find(".modal-title").text(properties.title || "Dialog");
				dialog.find(".modal-body").html(properties.content || "");
				dialog.find(".modal-footer").html("");

				if (properties.buttons.length == 0) {
					resolve();
				}

				properties.buttons.forEach((button) => {
					var _button = $(`<button type="button"
					class="btn ${(button.type || "btn-default")}">${button.label}</button>`)
						.appendTo(dialog.find(".modal-footer"));

					_button.click(() => {
						resolve(button);
					});
				});

				dialog.modal("show");
			}
		});
	});
}

function _fadeContent(properties) {
	return new Promise(function(resolve) {
		if (($(".dialog").data('bs.modal') || {}).isShown) {
			let modalContent = $(".dialog").find(".modal-container").first();
			let container = $("<div class='modal-container-new'></div>").appendTo(modalContent.parent());
			console.log(modalContent[0]);
			let content = $(".dialog").find(".modal-container");
			let newTitle = $(`<div class="modal-header"><button type="button" class="close" data-dismiss="modal">&times;</button><h4 class="modal-title"></h4></div>`).appendTo(container);
			newTitle.children(".modal-title").text(properties.title || "Dialog");
			let newBody = $(`<div class="modal-body"></div>`).appendTo(container);
			newBody.html(properties.content || "");
			let newFooter = $(`<div class="modal-footer"></div>`).appendTo(container);
			newFooter.html("");
			if (properties.buttons.length == 0) {
				resolve();
			}
			properties.buttons.forEach((button) => {
				var _button = $(`<button type="button"
				class="btn ${(button.type || "btn-default")}">${button.label}</button>`)
					.appendTo(newFooter);

				_button.click(() => {
					resolve(button);
				});
			});

			content.parent().css({
				"max-height": content.css("height"),
				"overflow-y": "hidden"
			});

			content.parent().animate({
				"max-height": container.height() + 10 + "px"
			}, {
				duration: 500,
				easing: "easeOutQuad"
			});

			content.css({
				"overflow-y": "hidden",
				"overflow-x": "hidden",
				"float": "left",
				"width": "100%"
			});

			container.css({
				"margin-left": "600px",
				"margin-right": "-600px"
			});
			content.animate({
				"padding": "0",
				"margin-left": "-600px",
			}, {
				duration: 500,
				easing: "easeOutQuad",
				complete: () => {
					content.remove();
					container.attr("class", "modal-container");
					content.parent().css({
						"overflow-y": "auto"
					});
				}
			});
			container.animate({
				"margin-left": "0px",
				"margin-right": "0px"
			}, {
				duration: 500,
				easing: "easeOutQuad"
			});
		} else {
			resolve();
		}
	});
}


function showNotification(properties) {
	var notification = $(
		`
		<div class="notification"
					style="
						z-index: 3;
						position: absolute;
						overflow:hidden;
						margin-top: -50px;
						width: 80%;">
				<div class="alert ${properties.type} notification">
					${properties.content}
				</div>
		</div>
		`
	).appendTo(document.body);

	notification.animate({
		"margin-top": "50px"
	}, 800);

	window.setTimeout(() =>
		notification.animate({
			"margin-top": "-50px"
		}, {
			duration: 800,
			complete: () => {
				notification.remove();
			}
		}), 3000);
}

var sort_by = function(field, reverse, primer) {

	var key = primer ?
		function(x) {
			return primer(x[field])
		} :
		function(x) {
			return x[field]
		};

	reverse = !reverse ? 1 : -1;

	return function(a, b) {
		return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
	}
}

function showFilesList(files) {
	return new Promise(function(resolve, reject) {
		files.sort(sort_by('subject', false, function(a) {
			return a.toUpperCase()
		}));

		let list = `<ul class="list-group" id="files-list">`;
		files.forEach((file) => {
			list += `<li
				class="list-group-item files-list-item"
				data-fileid="${(file.id || "")}"
				data-filepath="${(file.path || "")}"
				data-filesubject="${(file.subject || "")}"
				data-filename="${(file.name || "")}">
				<div class="row">
                <div class="col-md-4"><label>${(file.subject || "")}</label></div>
                <div class="col-md-4">${(file.name || "").replace(".json", "")}</div>
              </div></li>`;
		});
		list += `</ul>`

		showDialog({
			title: "Open File",
			content: list,
			buttons: []
		}).then(() => {
			$(".files-list-item").click(function() {
				console.log("click");
				resolve($(this));
			});
		});

		$(".dialog").bind("hidden.bs.modal", function() {
			reject();
		});
	});
}

export {
	showDialog,
	showNotification,
	showFilesList
};
