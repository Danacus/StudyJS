import fs from 'fs';
import {
	remote,
	ipcRenderer
} from 'electron';
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

var EventEmitter = require('events');
var util = require('util');


var getHomePath = require('home-path');
var dialog = remote.dialog;
var mkdirp = require('mkdirp');
var request = require('request');
var Zip = require('machinepack-zip');

var appRoot = getHomePath() + "/StudyJS";

var template = '<!doctype html> <html> <head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"> <title>StudyJS</title> <link href="css/main.css" rel="stylesheet" type="text/css"> <link rel="stylesheet" href="css/bootstrap.min.css"> <link rel="stylesheet" href="css/mathquill.css"> </head> <body> <script src="js/jquery-3.1.1.min.js"></script> <script> window.jQuery = window.$; $(document).ready(function() { loadViewer(); /* $(".mathquill-rendered-math").children().not(".selectable").remove(); var rem = $(".mathquill-rendered-math").contents().filter(function() { return (this.nodeType === 3); }); rem.remove();*/ }); </script> <script type="text/x-mathjax-config"> MathJax.Hub.Config({ tex2jax: { inlineMath: [["$","$"]] }, CommonHTML: { scale: 80 } }); </script> <script type="text/javascript" async src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_CHTML"> </script> <script src="js/bootstrap.min.js"></script> <script src="js/viewer.js"></script> <script src="js/globals.js"></script> <div id="document"> <!--replaceme--> </div> </body> </html>';

var saving = false,
	opening = false;

var loadAppIO = new Promise(function(resolve, reject) {
	$(document).ready(function() {
		if (!fs.existsSync(appRoot + "/app/")) {
			_downloadAssets(function() {
				_loadColor();
				resolve();
			});
		} else {
			_loadColor();
			resolve();
		}
	});

	return this;
});

var appIO = {
	save: function(file, drive = false) {
		if (file) {
			if (drive) {
				driveIO.writeFile(globals.currentFile.split(/[()]/)[1], serializer.serialize());
			} else {
				_save(file, serializer.serialize());
			}
		} else {
			var saveDialog = new bootstrapDialog({
					title: "Save File",
					content: "Save local or on Google Drive?",
					buttons: [{
						label: "Local",
					}, {
						label: "Google Drive",
					}]
				})
				.on('click', function(button) {
					if (button.label == "Local") {
						_saveDialog();
					} else if (button.label == "Google Drive") {
						var saveRemoteDialog = new bootstrapDialog({
								title: "Save Remote File",
								content: '<div class="form-group"><label for="usr">File Name:</label><input type="text" class="form-control" id="fileName"></div>',
								buttons: [{
									label: "Save",
									type: "btn-primary",
								}]
							})
							.on("click", function() {
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
	},
	open: function() {
		new bootstrapDialog({
			title: "Open File",
			content: "Open local file or open file on Google Drive?",
			buttons: [{
				label: "Local"
			}, {
				label: "Google Drive"
			}]
		}).on('click', function(button) {
			if (button.label == "Open File") {
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
	},
	newFile: function() {
		_close(function() {
			$("#document").find('*').each(function() {
				$(this).removeAttr("id spellcheck contenteditable");
				$(this).removeClass("mce-content-body mce-edit-focus");
			});

			globals.currentFile = null;
			document.title = globals.title + " - " + (globals.currentFile || "New File");
			initTinyMCE();
			updateStyle();
		});
	},
	exportFile: function() {
		var file = _exportDocument();

		dialog.showSaveDialog({
			title: "Export",
			filters: [{
				name: 'Web Page',
				extensions: ['html']
			}]
		}, function(folderPaths) {
			if (folderPaths === undefined) {
				console.log("No destination folder selected");

				return;
			} else {
				console.log(folderPaths);

				fs.writeFile(folderPaths, file, function(err) {
					if (err) {
						bootstrapNotification({
							type: "alert-danger",
							content: "Cannot export file! " + err
						});
						return console.error(err);
					}
					console.log("Data written successfully!");
					_copyAssets(folderPaths.replace(folderPaths.split("/")[folderPaths.split("/").length - 1], ""));
				});
			}
		});
	},
	addColor: function() {
		dialog.showOpenDialog(function(fileNames) {
			if (fileNames === undefined) {
				console.log("No file selected");
				bootstrapNotification({
					type: "alert-warning",
					content: "No file selected!"
				});
			} else {
				fs.readFile(fileNames[0], function(err, data) {
					if (err) {
						return console.error(err);
					}

					console.log(fileNames[0] + " --> " + appRoot + "/app/colors/" + fileNames[0].split("/")[fileNames[0].split("/").length - 1]);

					ncp(fileNames[0], appRoot + "/app/colors/" + fileNames[0].split("/")[fileNames[0].split("/").length - 1], function(err) {
						if (err) {
							bootstrapNotification({
								type: "alert-danger",
								content: "Cannot import color! " + err
							});
							return console.error(err);
						}
						console.log('done!');
						bootstrapNotification({
							type: "alert-success",
							content: "Color added"
						});
						_loadColor();
					});
				});
			}
		});
	},
	loadColors: function() {
		_loadColor();
	}
};

export {
	appIO,
	loadAppIO
};

ipcRenderer.on('token', function(event, message) {
	settings.token = message;
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

function _exportDocument() {
	var newDoc = $('<div id="document2"></div>').appendTo($(document.body));
	$(".eq-math").each(function functionName() {
		$(this).html($(this).data("formula"));
	});
	newDoc.html($("#document").html());

	newDoc.find('*').each(function() {
		$(this).removeAttr("id spellcheck contenteditable");
		$(this).removeClass("mce-content-body mce-edit-focus");
	});

	var file = template.replace("<!--replaceme-->", newDoc.html());

	newDoc.remove();
	return file;
}

function _copyAssets(target) {
	ncp(appRoot + "/app/dist", target, function(err) {
		if (err) {
			bootstrapNotification({
				type: "alert-danger",
				content: "Cannot export file! " + err
			});
			return console.error(err);
		}
		console.log('done!');
		bootstrapNotification({
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
			var item = $('<li class="list-group-item" data-fileid="' + files[i].id + '">' + files[i].name + '</li>').appendTo($("#drive-list"));
			item.click(function() {
				$("#drive").modal("hide");
				var id = $(this).data("fileid");
				var name = $(this).text();
				driveIO.openFile(id, function(data) {
					globals.currentFile = name + " (" + id + ")";
					document.title = globals.title + " - " + globals.currentFile;
					serializer.deserialize(JSON.parse(data));

					initTinyMCE();
					MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
					updateStyle();
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
		bootstrapDialog({
			title: "Close without saving?",
			content: "All changes since the last save will be lost.<br>Are you sure you want to continue?",
			buttons: [{
					label: "Yes",
					onclick: function() {
						$("#document").html("");
						callback();
					}
				},
				{
					label: "No",
					type: "btn-primary",
					onclick: function() {
						return;
					}
				}
			]
		});
	} else {
		callback();
	}
}

function _open(success, error) {
	fs.readFile(fileNames[0], function(err, data) {
		if (err) {
			if (error) error();
			else {
				bootstrapNotification({
					type: "alert-danger",
					content: "Cannot open file! " + err
				});
			}

			return console.error(err);
		}
		globals.currentFile = fileNames[0];
		document.title = globals.projectTitle + " - " + globals.currentFile;
		serializer.deserialize(JSON.parse(data));

		initTinyMCE();
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		updateStyle();

		if (success) success();
	});
}

function _downloadAssets(callback) {
	request('https://drive.google.com/uc?export=download&id=0B9SOgaQjC78hYWVZMG03ZFRkTzA')
		.pipe(fs.createWriteStream(appRoot + '/assets.zip'))
		.on('close', function() {
			console.log('File written!');

			Zip.unzip({
				source: appRoot + '/assets.zip',
				destination: appRoot,
			}).exec(function() {
				console.log("success!");
				callback();
			}, function() {
				console.log("error!");
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

function _loadColor() {
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
		bootstrapNotification({
			type: "alert-danger",
			content: "Cannot load colors! " + err
		});
	});
}

function _createColorsList() {

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

function _save(file, content, success, error) {
	$(".eq-math").each(function functionName() {
		$(this).html($(this).data("formula"));
	});
	fs.writeFile(file, content, function(err) {
		if (err) {
			if (error) {
				error();
			} else {
				bootstrapNotification({
					type: "alert-danger",
					content: "Cannot save file! " + err
				});
			}
			return console.error(err);
		}
		MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
		console.log("Data written successfully!");
		document.title = globals.title + " - " + globals.currentFile;
		globals.saved = true;
		updateStyle();
		if (success) {
			success();
		} else {
			bootstrapNotification({
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
