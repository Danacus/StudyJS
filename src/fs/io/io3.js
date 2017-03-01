import {
	remote,
	ipcRenderer
} from 'electron';
var app = remote.app;
var dialog = remote.dialog;
import $ from 'jquery';
import {
	Serializer
} from '../serialize';
import {
	DriveIO
} from './driveIO';
import {
	LocalIO
} from './localIO';
import {
	showDialog
} from '../../dialog';
import {
	loadSettings,
	saveSettings,
	settings
} from '../../settings';
const path = require('path');
const open = require("open");
const glob = require("glob")
import {
	exportFile
} from '../export';
var jetpack = require('fs-jetpack');
import {
	chmodCopy
} from '../chmodCopy';
import {
	ColorImport
} from './colorImport';

const appData = path.join(app.getPath("userData"), "/data/");

var services;
var appIO;

var saving = false,
	opening = false;

class AppIO {
	constructor() {
		appIO = this;
		services = {
			Local: LocalIO,
			GoogleDrive: DriveIO
		};
		if (jetpack.exists(app.getPath("userData") + "/data/dist/") != "dir") {
			_copyResources().then(() => {
				console.log("Resources copied");
				_load();
			}).catch((err) => {
				$.notify({
					message: err
				}, {
					type: 'danger'
				});
			});
		} else {
			_load();
		}
	}

	static loadFile(data) {
		Serializer.deserialize(JSON.parse(data));
		initTinyMCE();
		updateStyle();
		loadViewer();
		$(".dialog").modal("hide");
		menu.close();
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
	}

	static save(service = globals.service) {
		if (service && (globals.file.name || globals.file.id)) {
			services[service].writeFile().then(() => {
				$.notify({
					message: "File Saved!"
				}, {
					type: 'success'
				});
				$(".dialog").modal("hide");
				menu.close();
			}).catch((err) => {
				$.notify({
					message: "Cannot save file! " + err
				}, {
					type: 'danger'
				});
				globals.service = null;
				this.save();
			});
		} else {
			showDialog({
					title: "Save File",
					content: "Save local or on Google Drive?",
					buttons: [{
						label: "Local",
					}, {
						label: "Google Drive",
					}]
				})
				.then((button) => {
					service = button.label.replace(/ /g, '');
					globals.service = service;

					showDialog({
							title: "Save File",
							content: `
							<div class="form-group">
								<label for="usr">Subject:</label>
								<input type="text" class="form-control" id="fileSubject" value="${(globals.file.subject || "")}">
								<label for="usr">File Name:</label>
								<input type="text" class="form-control" id="fileName" value="${(globals.file.name || "")}">
							</div>`,
							buttons: [{
								label: "Save",
								type: "btn-primary",
							}]
						})
						.then((button) => {
							if ($("#fileName").val().endsWith(".json")) {
								globals.file.name = $("#fileName").val();
							} else {
								globals.file.name = $("#fileName").val() + ".json";
							}
							globals.file.subject = $("#fileSubject").val().toLowerCase().capitalizeFirstLetter();

							services[service].writeFile(true).then(() => {
								$.notify({
									message: "File Saved!"
								}, {
									type: 'success'
								});
								$(".dialog").modal("hide");
								menu.close();
							}).catch((err) => {
								$.notify({
									message: "Cannot save file! " + err
								}, {
									type: 'danger'
								});
							});
						});
				});
		}
	}

	static open() {
		showDialog({
				title: "Open File",
				content: "Open local file or open file on Google Drive?",
				buttons: [{
					label: "Local"
				}, {
					label: "Google Drive"
				}]
			})
			.then((button) => {
				_close().then(() => {
					globals.service = button.label.replace(/ /g, '');
					services[globals.service].openFile().then(() => {
						$(".dialog").modal("hide");
					}).catch((err) => {
						$.notify({
							message: "Cannot open file! " + err
						}, {
							type: 'danger'
						});
						_newFile();
					});
				});
			});
	}

	static newFile() {
		_newFile();
	}

	static close() {
		return _close();
	}

	static exportFile() {
		if (!globals.file.name || !globals.file.subject) {
			return;
		}

		const file = Serializer.serialize();

		const dir = settings.local.folder + "/" + globals.file.subject;

		const viewerDir = settings.local.folder + "/viewer/";

		jetpack.dir(viewerDir);

		jetpack.writeAsync(dir + "/" + globals.file.name, file).then(() => {
			_copyAssets(viewerDir).then(() => {
				if (globals.service == "Local") {
					document.title = globals.title + " - " + globals.file.subject + " - " + globals.file.name;
				}

				let index = jetpack.read(viewerDir + "/index.html");

				glob(settings.local.folder + "/**/*.json", {}, function(err, files) {
					if (err) {
						$.notify({
							message: "Cannot export file! " + err
						}, {
							type: 'danger'
						});
						return;
					}

					let data = [];

					files.forEach((file) => {
						data.push({
							name: file.replace(".json", "").split(/[/]+/).pop(),
							subject: path.dirname(file).split(/[/]+/).pop(),
							path: file
						});
					});

					index = index.replace("<!--folderdata-->", `<script>var files = '${JSON.stringify(data)}'</script>`);

					console.log(index);

					jetpack.write(viewerDir + "/index.html", index);

					open(viewerDir + "/index.html");

					$.notify({
						message: "File Exported!"
					}, {
						type: 'success'
					});
				});
			}).catch((err) => {
				$.notify({
					message: "Cannot export file! " + err
				}, {
					type: 'danger'
				});
			});
		}).catch((err) => {
			$.notify({
				message: "Cannot export file! " + err
			}, {
				type: 'danger'
			});
		});

		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		updateStyle();
	}
}

function _newFile() {
	_close().then(() => {
		$("#document").html("<div data-type='container' data-depth='0'><div class='panel panel-default'><div class='panel-heading' data-type='editable'></div></div></div>");

		$("#document").find('*').each(function() {
			$(this).removeAttr("id spellcheck contenteditable");
			$(this).removeClass("mce-content-body mce-edit-focus");
		});

		document.title = globals.title + " - " + (globals.file.name || "New File");
		initTinyMCE();
		updateStyle();
		loadViewer();
	});
}

function _load() {
	ColorImport.loadColors();
	loadViewer();
}

function _copyAssets(target) {
	return new Promise(function(resolve, reject) {
		jetpack.copyAsync(path.join(appData, "/dist"), target, {
			overwrite: true
		}).then(() => {
			resolve();
			MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		}).catch((err) => {
			reject(err);
		});
	});
}

function _close() {
	return new Promise(function(resolve, reject) {
		if (!globals.saved) {
			showDialog({
				title: "Close without saving?",
				content: "All changes since the last save will be lost.<br>Are you sure you want to continue?",
				buttons: [{
						label: "Yes",
					},
					{
						label: "No",
						type: "btn-primary",
					}
				]
			}).then((button) => {
				if (button.label == "Yes") {
					$("#document").html("");
					globals.file.id = null;
					globals.file.name = null;
					globals.file.subject = null;
					resolve();
				} else {
					reject();
					return;
				}
			});
		} else {
			$("#document").html("");
			globals.file.id = null;
			globals.file.name = null;
			globals.file.subject = null;
			resolve();
		}
	});
}

function _copyResources() {
	return new Promise(function(resolve, reject) {
		chmodCopy(path.join(app.getAppPath(), "/app/dist"), path.join(app.getPath("userData"), "/data/dist/"));
		chmodCopy(path.join(app.getAppPath(), "/app/colors"), path.join(app.getPath("userData"), "/data/colors/"));
		resolve();
	});
}

String.prototype.unCamelCase = function() {
	return this.replace(/(^[a-z]+)|[0-9]+|[A-Z][a-z]+|[A-Z]+(?=[A-Z][a-z]|[0-9])/g, function(match, first) {
		if (first) match = match[0].toUpperCase() + match.substr(1);
		return match + ' ';
	})
}

String.prototype.capitalizeFirstLetter = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

export {
	AppIO,
	appIO
};
