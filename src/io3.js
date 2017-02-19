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
} from './serialize';

import {
	driveIO
} from './driveIO';

import {
	bootstrapDialog,
	bootstrapNotification
} from './dialog';
import {
	EventEmitter
} from 'events'
var getHomePath = require("home-path");
import {
	mkdirp
} from 'mkdirp';
import {
	request
} from 'request';
import {
	Zip
} from 'machinepack-zip';
import {
	loadSettings,
	saveSettings,
	settings
} from './settings';

var appRoot = getHomePath() + "/StudyJS";

var template = `
	<!doctype html>
	<html>

	<head>
	    <meta charset="utf-8">
	    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
	    <title>StudyJS</title>
	    <link href="css/main.css" rel="stylesheet" type="text/css">
			<link rel="stylesheet" href="css/bootstrap.min.css">
	    <body>
	        <script src="js/jquery-3.1.1.min.js"></script>
	        <script>
	            window.jQuery = window.$;
	            $(document).ready(function() {
	                loadViewer(); /* $(".mathquill-rendered-math").children().not(".selectable").remove(); var rem = $(".mathquill-rendered-math").contents().filter(function() { return (this.nodeType === 3); }); rem.remove();*/
	            });
	        </script>
	        <script type="text/x-mathjax-config"> MathJax.Hub.Config({ tex2jax: { inlineMath: [["$","$"]] }, CommonHTML: { scale: 100 } }); </script>
	        <script type="text/javascript" async src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_CHTML">
	        </script>
	        <script src="js/bootstrap.min.js"></script>
	        <script src="js/viewer.js"></script>
	        <div id="document">
	            <!--replaceme-->
	        </div>
	    </body>

	</html>
`;

var saving = false,
	opening = false;

class AppIO {
	constructor() {
		if (!fs.existsSync(appRoot + "/app/")) {
			_downloadAssets(function() {
				_loadColors();
				loadViewer();
				loadSettings(function() {
					if (settings.token) {
						driveIO.authorize(settings.token, function() {
							globals.authorized = true;
						});
					}
				});
			});
		} else {
			_loadColors();
			loadViewer();
			loadSettings(function() {
				if (settings.token) {
					driveIO.authorize(settings.token, function() {
						globals.authorized = true;
					});
				}
			});
		}
	}

	save(file, drive = false) {
		if (file) {
			if (drive) {
				driveIO.writeFile(globals.currentFile.split(/[()]/)[1], serializer.serialize());
			} else {
				_save(file, serializer.serialize());
			}
		} else {
			new bootstrapDialog({
					title: "Save File",
					content: "Save local or on Google Drive?",
					buttons: [{
						label: "Local",
					}, {
						label: "Google Drive",
					}]
				})
				.then((button) => {
					if (button.label == "Local") {
						_saveDialog();
					} else if (button.label == "Google Drive") {
						new bootstrapDialog({
								title: "Save Remote File",
								content: '<div class="form-group"><label for="usr">File Name:</label><input type="text" class="form-control" id="fileName"></div>',
								buttons: [{
									label: "Save",
									type: "btn-primary",
								}]
							})
							.then((button) => {
								if (!globals.authorized) {
									saving = true;
									ipcRenderer.send('authorize');
								} else {
									_driveSave();
								}
							});
					}
				});
		}
	}

	open() {
		new bootstrapDialog({
				title: "Open File",
				content: "Open local file or open file on Google Drive?",
				buttons: [{
					label: "Local"
				}, {
					label: "Google Drive"
				}]
			})
			.then((button) => {
				if (button.label == "Local") {
					_close(function() {
						$("#dialog").modal("hide");
						_open();
					});
				} else if (button.label == "Google Drive") {
					_close(function() {
						$("#dialog").modal("hide");
						if (!globals.authorized) {
							opening = true;
							ipcRenderer.send('authorize');
						} else {
							_driveOpen();
						}
					});
				}
			});
	}

	newFile() {
		_close(function() {
			$("#document").html("<div data-type='container' data-depth='0'><div class='panel panel-default'><div class='panel-heading' data-type='editable'></div></div></div>");

			$("#document").find('*').each(function() {
				$(this).removeAttr("id spellcheck contenteditable");
				$(this).removeClass("mce-content-body mce-edit-focus");
			});

			globals.currentFile = null;
			document.title = globals.title + " - " + (globals.currentFile || "New File");
			initTinyMCE();
			updateStyle();
			loadViewer();
		});
	}

	exportFile() {
		var file = _exportDocument();

		dialog.showSaveDialog({
			title: "Export",
			filters: [{
				name: 'Web Page',
				extensions: ['html']
			}]
		}, function(folderPaths) {
			if (folderPaths === undefined) {
				return;
			} else {
				writeFile(folderPaths, file, function() {
					_copyAssets(folderPaths.replace(folderPaths.split("/")[folderPaths.split("/").length - 1], ""));
				});
			}
		});
	}

	addColor() {
		new bootstrapDialog({
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

ipcRenderer.on('token', function(event, message) {
	settings.token = message;
	saveSettings(function() {
		driveIO.authorize(message, function() {
			globals.authorized = true;

			if (saving) {
				_driveSave();
				saving = false;
			}

			if (opening) {
				_driveOpen();
				opening = false;
			}
		});
	});
});

function writeFile(path, content, callback) {
	fs.writeFile(path, content, function(err) {
		if (err) {
			new bootstrapNotification({
				type: "alert-danger",
				content: "Cannot write file! " + err
			});
			return console.error(err);
		}
		callback();
	});
}

function readFile(file, callback) {
	fs.readFile(file, function(err, data) {
		if (err) {
			new bootstrapNotification({
				type: "alert-danger",
				content: "Cannot open file! " + err
			});
			return console.error(err);
		}
		callback(data);
	});
}

function _importColor() {
	new bootstrapDialog({
		title: "Import Color",
		content: '<div class="form-group"><label for="usr">URL:</label><input type="text" class="form-control" id="coolorsUrl"><label for="usr">Name:</label><input type="text" class="form-control" id="coolorsName"></div>',
		buttons: [{
			label: "Import"
		}]
	}).then((button) => {
		var url = $("#coolorsUrl").val();
		var col = url.split("/")[url.split("/").length - 1];
		var colors = {
			colors: []
		};

		var colSplit = col.split("-");

		for (var i = 0; i < colSplit.length; i++) {
			colors.colors.push("#" + colSplit[i]);
		}

		var name = $("#coolorsName").val();
		var file = JSON.stringify(colors);

		console.log(name);

		writeFile(appRoot + "/app/colors/" + name + ".json", file, () => {
			new bootstrapNotification({
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
			new bootstrapNotification({
				type: "alert-warning",
				content: "No file selected!"
			});
		} else {
			fs.readFile(fileNames[0], function(err, data) {
				if (err) {
					return console.error(err);
				}

				ncp(fileNames[0], appRoot + "/app/colors/" + fileNames[0].split("/")[fileNames[0].split("/").length - 1], function(err) {
					if (err) {
						new bootstrapNotification({
							type: "alert-danger",
							content: "Cannot import color! " + err
						});
						return console.error(err);
					}
					new bootstrapNotification({
						type: "alert-success",
						content: "Color added"
					});
					_loadColors();
				});
			});
		}
	});
}

function _exportDocument() {
	var newDoc = $('<div id="document2"></div>').appendTo($(document.body));
	$(".eq-math").each(function functionName() {
		$(this).text($(this).data("formula"));
	});
	newDoc.html($("#document").html());

	newDoc.find('*').each(function() {
		$(this).removeAttr("id spellcheck contenteditable");
		$(this).removeClass("mce-content-body mce-edit-focus");
	});

	var file = template.replace("<!--replaceme-->", newDoc.html());

	MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

	newDoc.remove();
	return file;
}

function _copyAssets(target) {
	ncp(appRoot + "/app/dist", target, function(err) {
		if (err) {
			new bootstrapNotification({
				type: "alert-danger",
				content: "Cannot export file! " + err
			});
			return console.error(err);
		}
		new bootstrapNotification({
			type: "alert-success",
			content: "File exported!"
		});
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
	});
}

function _driveOpen() {
	driveIO.list(function(files) {
		$("#drive-list").children().remove();
		for (var i = 0; i < files.length; i++) {
			var item = $('<li class="list-group-item driveListItem" data-fileid="' + files[i].id + '">' + files[i].name + '</li>').appendTo($("#drive-list"));
			item.click(function() {
				$("#drive").modal("hide");
				var id = $(this).data("fileid");
				var name = $(this).text();
				driveIO.openFile(id, function(data) {
					globals.currentFile = name + " (" + id + ")";
					document.title = globals.title + " - " + globals.currentFile;
					serializer.deserialize(JSON.parse(data));

					initTinyMCE();
					updateStyle();
					loadViewer();
					MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
				});
			});
		}
		$("#drive").modal("show");
	});
}

function _driveSave() {
	$(".eq-math").each(function functionName() {
		$(this).html($(this).data("formula"));
	});

	var filename;

	if ($("#fileName").val().endsWith(".json")) {
		filename = $("#fileName").val();
	} else {
		filename = $("#fileName").val() + ".json";
	}

	driveIO.writeNewFile(filename, serializer.serialize());

	$("#dialog").modal("hide");
}

function _close(callback) {
	if (!globals.saved) {
		new bootstrapDialog({
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
				callback();
			} else {
				return;
			}
		});
	} else {
		$("#document").html("");
		callback();
	}
}

function _open(success) {
	dialog.showOpenDialog({
		title: "Open File",
		filters: [{
			name: 'StudyJS XML Files',
			extensions: ['xml', 'json']
		}]
	}, function(fileNames) {
		readFile(fileNames[0], function(data) {
			globals.currentFile = fileNames[0];
			document.title = globals.projectTitle + " - " + globals.currentFile;
			serializer.deserialize(JSON.parse(data));

			initTinyMCE();
			MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
			updateStyle();
			loadViewer();

			if (success) success();
		});
	});
}

function _downloadAssets(callback) {
	request('https://drive.google.com/uc?export=download&id=0B9SOgaQjC78hYWVZMG03ZFRkTzA')
		.pipe(fs.createWriteStream(appRoot + '/assets.zip'))
		.on('close', function() {
			Zip.unzip({
				source: appRoot + '/assets.zip',
				destination: appRoot,
			}).exec(function() {
				callback();
			}, function() {
				new bootstrapNotification({
					type: "alert-danger",
					content: "Failed to download assets"
				})
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
	//var colors = [];
	$(".color-item").remove();
	var col = _readFiles(appRoot + "/app/colors/", function(colors) {
		console.log("Load Colors");
		for (var i = 0; i < colors.length; i++) {
			var li = $("<li class='color-item' data-index=" + i + "><a href='#'>" + colors[i].name.unCamelCase() + "</a></li>").prependTo($("#col"));

			li.children(":first").click(function() {
				setColors(colors[$(this).parent().data("index")].col);
				updateStyle();
				_resetTinyMCE();
			});
		}
	}, function(err) {
		console.error(err);
		new bootstrapNotification({
			type: "alert-danger",
			content: "Cannot load colors! " + err
		});
	});
}

function _saveDialog() {
	dialog.showSaveDialog({
		title: "Save File",
		filters: [{
			name: 'StudyJS JSON Files',
			extensions: ['json']
		}]
	}, function(fileName) {
		if (fileName === undefined) {
			return;
		}
		globals.currentFile = fileName;
		_save(fileName, serializer.serialize());
		$("#dialog").modal("hide");
	});
}

function _save(file, content, success) {
	$(".eq-math").each(function functionName() {
		$(this).html($(this).data("formula"));
	});
	writeFile(file, content, function(err) {
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		console.log("Data written successfully!");
		document.title = globals.title + " - " + globals.currentFile;
		globals.saved = true;
		updateStyle();
		if (success) {
			success();
		} else {
			new bootstrapNotification({
				type: "alert-success",
				content: "File saved!"
			});
		}
	});
}

function _readFiles(dirname, onFileContent, onError) {

	var files = [];

	fs.readdir(dirname, function(err, filenames) {
		if (err) {
			onError(err);
			return;
		}
		for (var i = 0; i < filenames.length; i++) {
			var filename = filenames[i];
			files.push({
				name: filename.replace(".json", ""),
				col: JSON.parse(fs.readFileSync(dirname + filename, 'utf-8')).colors
			});

			if (i == filenames.length - 1) {
				onFileContent(files);
			}
		}
	});

	return files;
}

String.prototype.unCamelCase = function() {
	return this.replace(/(^[a-z]+)|[0-9]+|[A-Z][a-z]+|[A-Z]+(?=[A-Z][a-z]|[0-9])/g, function(match, first) {
		if (first) match = match[0].toUpperCase() + match.substr(1);
		return match + ' ';
	})
}


export {
	AppIO
};