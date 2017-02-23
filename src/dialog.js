function showDialog(properties) {
	return new Promise(function(resolve) {
		var dialog = $(
			`
				<div class="modal dialog fade" role="dialog">
						<div class="modal-dialog">
								<!-- Modal content-->
								<div class="modal-content">
										<div class="modal-header">
												<button type="button" class="close" data-dismiss="modal">&times;</button>
												<h4 class="modal-title"></h4>
										</div>
										<div class="modal-body">
												<p></p>
										</div>
										<div class="modal-footer">
										</div>
								</div>
						</div>
				</div>
			`
		);

		dialog.find(".modal-title").text(properties.title || "Dialog");
		dialog.find(".modal-body").html(properties.content || "");
		dialog.find(".modal-footer").html("");

		properties.buttons.forEach((button) => {
			var _button = $(`<button type="button"
			class="btn ${(button.type || "btn-default")}"
			data-dismiss="modal">${button.label}</button>`)
				.appendTo(dialog.find(".modal-footer"));

			_button.click(() => {
				resolve(button);
			});
		});

		dialog.modal("show");
		dialog.bind('hidden.bs.modal', function() {
			$(this).remove();
		});
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
		$("#drive-list").children().remove();
		$("#drive").bind("hidden.bs.modal", function() {
			reject();
		});
		files.forEach((file) => {
			let item = $(`<li
				class="list-group-item driveListItem"
				data-fileid="${(file.id || "")}"
				data-filepath="${(file.path || "")}"
				data-filesubject="${(file.subject || "")}"
				data-filename="${(file.name || "")}">
				<div class="row">
                <div class="col-md-4"><label>${(file.subject || "")}</label></div>
                <div class="col-md-4">${(file.name || "").replace(".json", "")}</div>
              </div></li>`)
				.appendTo($("#drive-list"));
			item.click(function() {
				resolve($(this));
			});
		});
		$("#drive").modal("show");
	});
}

export {
	showDialog,
	showNotification,
	showFilesList
};
