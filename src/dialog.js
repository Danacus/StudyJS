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

export {
	showDialog,
	showNotification
};
