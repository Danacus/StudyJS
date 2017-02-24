import fs from 'fs';
import {
	remote,
	ipcRenderer
} from 'electron';
var dialog = remote.dialog;
import $ from 'jquery';
import ncp from 'ncp';
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
	showNotification,
	showFilesList
} from '../../dialog';
import {
	EventEmitter
} from 'events'
var getHomePath = require("home-path");
import {
	mkdirp
} from 'mkdirp';
var request = require('request');
var Zip = require('machinepack-zip');
import {
	loadSettings,
	saveSettings,
	settings
} from '../../settings';

import {
	exportFile
} from '../export';

var Promise = require('bluebird');
var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

var appRoot = getHomePath() + "/StudyJS";

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
		if (!fs.existsSync(appRoot + "/app/")) {
			_downloadAssets(function() {
				_load();
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

		writeFile(dir + "/" + globals.file.name.replace(".json", ".html"), file).then(() => {
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

	addColor() {
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

	loadColors() {
		_loadColors();
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
	_loadColors();
	loadViewer();
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

		console.log(name);

		writeFile(appRoot + "/app/colors/" + name + ".json", file).then(() => {
			showNotification({
				type: "alert-success",
				content: "Color added"
			});
			_loadColors();
		});
	});
}

function _addColor() {
	dialog.showOpenDialog(function(fileNames) {
		if (fileNames === undefined) {
			showNotification({
				type: "alert-warning",
				content: "No file selected!"
			});
		} else {
			ncp(fileNames[0], appRoot + "/app/colors/" + fileNames[0].split("/")[fileNames[0].split("/").length - 1], function(err) {
				if (err) {
					showNotification({
						type: "alert-danger",
						content: "Cannot import color! " + err
					});
					return console.error(err);
				}
				showNotification({
					type: "alert-success",
					content: "Color added"
				});
				_loadColors();
			});
		}
	});
}

function _exportDocument() {
	let newDoc = $('<div id="document2"></div>').appendTo($(document.body));
	$(".eq-math").each(() => {
		$(this).html($(this).data("formula"));
	});
	newDoc.html($("#document").html());

	newDoc.find('*').each(function() {
		$(this).removeAttr("id spellcheck contenteditable");
		$(this).removeClass("mce-content-body mce-edit-focus");
	});

	const file = template.replace("<!--replaceme-->", newDoc.html());

	MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

	newDoc.remove();
	return file;
}

function _copyAssets(target) {
	return new Promise(function(resolve, reject) {
		ncp(appRoot + "/app/dist", target, function(err) {
			if (err) {
				reject();
				return console.error(err);
			}
			resolve();
			MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
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

function _downloadAssets(callback) {
	if (!fs.existsSync(appRoot)) {
		fs.mkdirSync(appRoot);
	}

	request('https://github.com/Danacus/StudyJS/raw/master/app/dist/assets.zip')
		.pipe(fs.createWriteStream(appRoot + '/assets.zip'))
		.on('close', function() {
			Zip.unzip({
				source: appRoot + '/assets.zip',
				destination: appRoot,
			}).exec({
				success: function() {
					callback();
				},

				error: function(err) {
					showNotification({
						type: "alert-danger",
						content: "Failed to download assets: " + err
					})
				}
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

function _loadColors() {
	$(".color-item").remove();
	_readDir(appRoot + "/app/colors/").then((colors) => {
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
		console.error(err);
		showNotification({
			type: "alert-danger",
			content: "Cannot load colors! " + err
		});
	});
}

function _readDir(dirname) {
	return new Promise(function(resolve, reject) {
		let files = [];

		fs.readdir(dirname, function(err, filenames) {
			if (err) {
				reject(err);
				return;
			}
			filenames.forEach((filename, index) => {
				files.push({
					name: filename.replace(".json", ""),
					col: JSON.parse(fs.readFileSync(dirname + filename, 'utf-8')).colors
				});

				if (index == filenames.length - 1) {
					resolve(files);
				}
			});
		});
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
