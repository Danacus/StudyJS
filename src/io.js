import fs from 'fs';
import {
	remote
} from 'electron';
import $ from 'jquery';
import ncp from 'ncp';

var getHomePath = require('home-path')
var dialog = remote.dialog;
var mkdirp = require('mkdirp');
var request = require('request');

var template = '<!doctype html> <html> <head> <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"> <title>StudyJS</title> <link href="css/main.css" rel="stylesheet" type="text/css"> <link rel="stylesheet" href="css/bootstrap.min.css"> <link rel="stylesheet" href="css/mathquill.css"> </head> <body> <script src="js/jquery-3.1.1.min.js"></script> <script> window.jQuery = window.$; $(document).ready(function() { loadViewer(); $(".mathquill-rendered-math").children().not(".selectable").remove(); var rem = $(".mathquill-rendered-math").contents().filter(function() { return (this.nodeType === 3); }); rem.remove(); }); </script> <script type="text/x-mathjax-config"> MathJax.Hub.Config({ tex2jax: { inlineMath: [["$","$"], ["\\(","\\)"]] }, CommonHTML: { scale: 100 } }); </script> <script type="text/javascript" async src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS_CHTML"> </script> <script src="js/bootstrap.min.js"></script> <script src="js/viewer.js"></script> <script src="js/globals.js"></script> <div id="document"> <!--replaceme--> </div> </body> </html>  ';

var appRoot = getHomePath() + "/StudyJS";

var appIO = {
	load: function() {
		/*
		mkdirp(appRoot + "/app/colors/");
		mkdirp(appRoot + "/app/style/");
		mkdirp(appRoot + "/app/dist/");*/

		if (fs.existsSync(appRoot + "/app/")) {
			loadCol();
			loadSty();
			return;
		}

		request('https://drive.google.com/uc?export=download&id=0B9SOgaQjC78hYWVZMG03ZFRkTzA')
			.pipe(fs.createWriteStream(appRoot + '/assets.zip'))
			.on('close', function() {
				console.log('File written!');
				var Zip = require('machinepack-zip');
				Zip.unzip({
					source: appRoot + '/assets.zip',
					destination: appRoot,
				}).exec(function() {
					console.log("success!");
					loadCol();
					loadSty();
				}, function() {
					console.log("error!");
				});

			});
	},
	saveFile: function() {
		if (globals.currentFile == null) {
			dialog.showSaveDialog({
				title: "Save File",
				filters: [{
					name: 'StudyJS XML Files',
					extensions: ['xml']
				}]
			}, function(fileName) {
				if (fileName === undefined) {
					return;
				}
				globals.currentFile = fileName;
				write();
			});
		} else {
			write();
		}
	},
	openFile: function() {
		var r = true;
		if (!globals.saved)
			r = confirm("Close without saving?");

		if (r == true) {
			$("#document").html("");
		} else {
			return;
		}

		dialog.showOpenDialog({
			title: "Open File",
			filters: [{
				name: 'StudyJS XML Files',
				extensions: ['xml']
			}]
		}, function(fileNames) {
			if (fileNames === undefined) {
				console.log("No file selected");
			} else {
				fs.readFile(fileNames[0], function(err, data) {
					if (err) {
						return console.error(err);
					}
					globals.currentFile = fileNames[0];
					document.title = globals.projectTitle + " - " + globals.currentFile;
					$("#document").html(data.toString());
					$("#document").find('*').each(function() {
						$(this).removeAttr("id spellcheck contenteditable");
						$(this).removeClass("mce-content-body mce-edit-focus");
					});

					initTinyMCE();
					loadViewer();
					$("div[data-type='open']").each(function() {
						$(this).remove();
					});
					updateColors();
				});
			}
		});
	},
	newFile: function() {
		var r = true;
		if (!globals.saved)
			r = confirm("Close without saving?");

		if (r == true) {
			$("#document").html("<div data-type='container' data-depth='0'><div class='panel panel-default'><div class='panel-heading' data-type='editable'></div></div></div>");
		} else {
			return;
		}

		$("#document").find('*').each(function() {
			$(this).removeAttr("id spellcheck contenteditable");
			$(this).removeClass("mce-content-body mce-edit-focus");
		});

		globals.currentFile = null;
		document.title = globals.title + " - " + (globals.currentFile || "New File");
		initTinyMCE();
		loadViewer();
		updateColors();
	},
	exportFile: function() {
		var newDoc = $('<div id="document2"></div>').appendTo($(document.body));
		newDoc.html($("#document").html());

		newDoc.find('*').each(function() {
			$(this).removeAttr("id spellcheck contenteditable");
			$(this).removeClass("mce-content-body mce-edit-focus");
		});

		var file = template.replace("<!--replaceme-->", newDoc.html());
		//file = file.replace("<!--colors-->", colors.toString());
		newDoc.remove();

		dialog.showSaveDialog({
			title: "Export",
			filters: [{
				name: 'Web Page',
				extensions: ['html']
			}]
		}, function(folderPaths) {
			// folderPaths is an array that contains all the selected paths
			if (folderPaths === undefined) {
				console.log("No destination folder selected");
				return;
			} else {
				console.log(folderPaths);
				//var fileName = folderPaths[0].split("/")[folderPaths[0].split("/").length - 1];
				//console.log(fileName);

				fs.writeFile(folderPaths, file, function(err) {
					if (err) {
						return console.error(err);
					}
					console.log("Data written successfully!");

					ncp(appRoot + "/app/dist", folderPaths.replace(folderPaths.split("/")[folderPaths.split("/").length - 1], ""), function(err) {
						if (err) {
							return console.error(err);
						}
						console.log('done!');
						$("#modal").modal("show");

						window.setTimeout(function() {
							$("#modal").modal("hide");
						}, 2000)
					});
				});
			}
		});
	},
	loadColors: function() {
		loadCol();
		$("#document").find('*').each(function() {
			$(this).removeAttr("id spellcheck contenteditable");
			$(this).removeClass("mce-content-body mce-edit-focus");
		});
		initTinyMCE();
	},
	addColor: function() {
		dialog.showOpenDialog(function(fileNames) {
			if (fileNames === undefined) {
				console.log("No file selected");
			} else {
				fs.readFile(fileNames[0], function(err, data) {
					if (err) {
						return console.error(err);
					}

					console.log(fileNames[0] + " --> " + appRoot + "/app/colors/" + fileNames[0].split("/")[fileNames[0].split("/").length - 1]);

					ncp(fileNames[0], appRoot + "/app/colors/" + fileNames[0].split("/")[fileNames[0].split("/").length - 1], function(err) {
						if (err) {
							return console.error(err);
						}
						console.log('done!');
						loadCol();
					});
				});
			}
		});
	},
	addStyle: function() {
		dialog.showOpenDialog(function(fileNames) {
			if (fileNames === undefined) {
				console.log("No file selected");
			} else {
				fs.readFile(fileNames[0], function(err, data) {
					if (err) {
						return console.error(err);
					}

					ncp(fileNames[0], appRoot + "/app/style/" + fileNames[0].split("/")[fileNames[0].split("/").length - 1], function(err) {
						if (err) {
							return console.error(err);
						}
						console.log('done!');
						loadSty();
					});
				});
			}
		});
	},
	loadStyle: function() {
		loadSty();
		$("#document").find('*').each(function() {
			$(this).removeAttr("id spellcheck contenteditable");
			$(this).removeClass("mce-content-body mce-edit-focus");
		});
		initTinyMCE();
	}
};

function loadSty() {
	var sty = [];

	readFiles(appRoot + "/app/style/", function(fileName, content) {
		sty.push({
			name: fileName.replace(".json", ""),
			style: JSON.parse(content)
		});

		$(".style-item").remove();

		for (var i = 0; i < sty.length; i++) {
			var li = $("<li class='style-item' data-index=" + i + "><a href='#'>" + sty[i].name.unCamelCase() + "</a></li>").prependTo("#sty");
			li.children(":first").click(function() {
				setStyles(sty[$(this).parent().data("index")].style);
				updateStyle();
				$("#document").find('*').each(function() {
					$(this).removeAttr("id spellcheck contenteditable");
					$(this).removeClass("mce-content-body mce-edit-focus");
				});
				initTinyMCE();
			});
		}
	}, function(err) {
		console.error(err);
	});
}

function loadCol() {
	colors = [];

	readFiles(appRoot + "/app/colors/", function(fileName, content) {
		colors.push({
			name: fileName.replace(".json", ""),
			col: JSON.parse(content).colors
		});

		$(".color-item").remove();

		for (var i = 0; i < colors.length; i++) {
			var li = $("<li class='color-item' data-index=" + i + "><a href='#'>" + colors[i].name.unCamelCase() + "</a></li>").prependTo("#col");
			li.children(":first").click(function() {
				setColors(colors[$(this).parent().data("index")].col);
				updateColors();
				$("#document").find('*').each(function() {
					$(this).removeAttr("id spellcheck contenteditable");
					$(this).removeClass("mce-content-body mce-edit-focus");
				});
				initTinyMCE();
			});
		}
	}, function(err) {
		console.error(err);
	});
}

String.prototype.unCamelCase = function() {
	return this.replace(/(^[a-z]+)|[0-9]+|[A-Z][a-z]+|[A-Z]+(?=[A-Z][a-z]|[0-9])/g, function(match, first) {
		if (first) match = match[0].toUpperCase() + match.substr(1);
		return match + ' ';
	})
}

function readFiles(dirname, onFileContent, onError) {
	fs.readdir(dirname, function(err, filenames) {
		if (err) {
			onError(err);
			return;
		}
		filenames.forEach(function(filename) {
			fs.readFile(dirname + filename, 'utf-8', function(err, content) {
				if (err) {
					onError(err);
					return;
				}
				onFileContent(filename, content);
			});
		});
	});
}

function write() {
	tinymce.remove('div[data-type="editable"]');
	fs.writeFile(globals.currentFile, $("#document")[0].innerHTML, function(err) {
		if (err) {
			return console.error(err);
		}

		console.log("Data written successfully!");
		document.title = globals.title + " - " + globals.currentFile;
		globals.saved = true;
	});
	initTinyMCE();
	updateColors();
}

export {
	appIO
};
