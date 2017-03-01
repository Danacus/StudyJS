const jetpack = require('fs-jetpack');
const path = require('path');
import {
	remote,
	ipcRenderer
} from 'electron';
var app = remote.app;
var dialog = remote.dialog;
import {
	showDialog
} from '../../dialog';
const appData = path.join(app.getPath("userData"), "/data/");

class ColorImport {
	static addColor() {
		showDialog({
			title: "Import Color",
			content: "Import from file or from <a href='https://coolors.co/'>coolors.co</a>?",
			buttons: [{
					label: "Local"
				},
				{
					label: "Coolors.co"
				}
			]
		}).then((button) => {
			if (button.label == "Local") {
				_addColor();
			} else if (button.label == "Coolors.co") {
				_importColor();
			}
		});
	}

	static loadColors() {
		_loadColors();
	}
}

function _importColor() {
	showDialog({
		title: "Import Color",
		content: '<div class="form-group"><label for="usr">URL:</label><input type="text" class="form-control" id="coolorsUrl"><label for="usr">Name:</label><input type="text" class="form-control" id="coolorsName"></div>',
		buttons: [{
			label: "Import"
		}]
	}).then((button) => {
		const url = $("#coolorsUrl").val();
		const col = url.split("/")[url.split("/").length - 1];
		let colors = {
			colors: []
		};

		const colSplit = col.split("-");

		colSplit.forEach((color) => {
			colors.colors.push("#" + color);
		});

		const name = $("#coolorsName").val();
		const file = JSON.stringify(colors);

		jetpack.append(path.join(appData, "/colors/", name + ".json"), file).then(() => {
			$.notify({
				message: "Color Added!"
			}, {
				type: 'success'
			});
			_loadColors();
		});
	});
}

function _addColor() {
	dialog.showOpenDialog(function(fileNames) {
		if (fileNames === undefined) {
			$.notify({
				message: "No file selected!"
			}, {
				type: 'warning'
			});
		} else {
			jetpack.copyAsync(fileNames[0], path.join(appData, "/colors/", fileNames[0].split("/")[fileNames[0].split("/").length - 1])).then(() => {
				$.notify({
					message: "Color Added!"
				}, {
					type: 'success'
				});
				_loadColors();
			}).catch((err) => {
				$.notify({
					message: "Cannot import color! " + err
				}, {
					type: 'danger'
				});
			});
		}
	});
}


function _loadColors() {
	$(".color-item").remove();
	_readColorsDir(path.join(appData, "/colors/")).then((colors) => {
		console.log("Load Colors");
		colors.forEach((colorItem, index) => {
			let li = $(`<li
				class='color-item'
				data-index=${index}><a href='#'>${colorItem.name.unCamelCase()}</a></li>`)
				.prependTo($("#col"));

			li.children(":first").click(function() {
				setColors(colors[$(this).parent().data("index")].col);
				updateStyle();
				_resetTinyMCE();
			});
		});
	}).catch((err) => {
		$.notify({
			message: "Cannot load colors! " + err
		}, {
			type: 'danger'
		});
	});
}

function _readColorsDir(dirname) {
	return new Promise(function(resolve, reject) {
		let files = [];

		jetpack.listAsync(dirname).then((filenames) => {
			filenames.forEach((filename, index) => {
				files.push({
					name: filename.replace(".json", ""),
					col: JSON.parse(jetpack.read(dirname + filename, 'utf-8')).colors
				});

				if (index == filenames.length - 1) {
					resolve(files);
				}
			});
		}).catch((err) => {
			reject(err);
		});
	});
}

function _resetTinyMCE() {
	$("#document").find('*').each(function() {
		$(this).removeAttr("id spellcheck contenteditable");
		$(this).removeClass("mce-content-body mce-edit-focus");
	});
	initTinyMCE();
}

export {
	ColorImport
};
