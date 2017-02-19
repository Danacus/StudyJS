class bootstrapDialog {
	constructor(properties) {
		return new Promise(function(resolve) {
			var d = $(
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

			d.find(".modal-title").text(properties.title || "Dialog");
			d.find(".modal-body").html(properties.content || "");
			d.find(".modal-footer").html("");

			for (var i = 0; i < properties.buttons.length; i++) {
				var b = $(`<button type="button" class="btn ${(properties.buttons[i].type || "btn-default")}" data-dismiss="modal">${properties.buttons[i].label}</button>`).appendTo(d.find(".modal-footer"));
				b.click({
					button: properties.buttons[i]
				}, function(e) {
					resolve(e.data.button);
				});
			}

			d.modal("show");
			d.bind('hidden.bs.modal', function() {
				$(this).remove();
			});
		});
	}
}



class bootstrapNotification {
	constructor(properties) {
		this.c = $(
			`
			<div class="container" style="z-index: 3; position: absolute; overflow:hidden; margin-top: -50px">
					<div class="alert ${properties.type} notification">
						${properties.content}
					</div>
			</div>
			`
		).appendTo(document.body);

		this.n = this.c.children(".notification").first();

		this.n.parent().animate({
			"margin-top": "50px"
		}, 800);

		window.setTimeout(() =>
			this.n.parent().animate({
				"margin-top": "-50px"
			}, {
				duration: 800,
				complete: () => {
					this.c.remove();
				}
			}), 3000);
	}
}


export {
	bootstrapDialog,
	bootstrapNotification
};
