import {
	remote,
	ipcRenderer
} from 'electron';
var app = remote.app;
var dialog = remote.dialog;
import $ from 'jquery';
import {
	serializer
} from '../serialize';
import {
	driveIO
} from './driveIO';
import {
	localIO
} from './localIO';
import {
	showDialog,
	showNotification
} from '../../dialog';
import {
	loadSettings,
	saveSettings,
	settings
} from '../../settings';
const path = require('path');
import {
	exportFile
} from '../export';
var jetpack = require('fs-jetpack');
import {
	chmodCopy
} from '../chmodCopy';
import {
	colorImport
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
			Local: localIO,
			GoogleDrive: driveIO
		};
		if (!jetpack.exists(app.getPath("userData") + "/data/")) {
			_copyResources().then(() => {
				_load();
			}).catch((err) => {
				showNotification({
					type: "alert-danger",
					content: err
				});
			});
		} else {
			_load();
		}
	}

	static loadFile(data) {
		serializer.deserialize(JSON.parse(data));
		initTinyMCE();
		updateStyle();
		loadViewer();
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
	}

	save(service = globals.service) {
		if (service) {
			services[service].writeFile().then(() => {
				showNotification({
					type: "alert-success",
					content: "File saved!"
				});
			}).catch((err) => {
				showNotification({
					type: "alert-danger",
					content: "Cannot save file! " + err
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
								showNotification({
									type: "alert-success",
									content: "File saved!"
								});
							}).catch((err) => {
								showNotification({
									type: "alert-danger",
									content: "Cannot save file! " + err
								});
							});
						});
				});
		}
	}

	open() {
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

					}).catch((err) => {
						showNotification({
							type: "alert-danger",
							content: "Cannot open file! " + err
						});
						_newFile();
					});
				});
			});
	}

	newFile() {
		_newFile();
	}

	exportFile() {
		const file = exportFile();

		const dir = settings.local.folder + "/" + globals.file.subject;

		jetpack.append(dir + "/" + globals.file.name.replace(".json", ".html"), file).then(() => {
			_copyAssets(dir).then(() => {
				showNotification({
					type: "alert-success",
					content: "File Exported!"
				});
			}).catch((err) => {
				showNotification({
					type: "alert-danger",
					content: "Cannot export file! " + err
				});
			});
		}).catch((err) => {
			showNotification({
				type: "alert-danger",
				content: "Cannot export file! " + err
			});
		});;

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
	colorImport.loadColors();
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
					globals.file.path = null;
					globals.file.name = null;
					resolve();
				} else {
					reject();
					return;
				}
			});
		} else {
			$("#document").html("");
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
