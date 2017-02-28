const jetpack = require('fs-jetpack');
const path = require('path');
import {
	remote,
	ipcRenderer
} from 'electron';
var dialog = remote.dialog;
import {
	showNotification,
	showFilesList
} from '../../dialog';
import {
	settings,
	loadSettings,
	saveSettings
} from '../../settings';
import {
	Serializer
} from '../serialize';
import {
	AppIO
} from './io3';


class LocalIO {
	constructor() {
		loadSettings();
	}
	static writeFile(createNew = false) {
		return new Promise(function(resolve, reject) {
			_checkFolder().then(() => {
				let dir = settings.local.folder + "/" + globals.file.subject + "/";

				jetpack.dir(dir);

				_save(dir + globals.file.name, Serializer.serialize()).then(() => {
					$("#dialog").modal("hide");
					globals.saved = true;
					resolve();
				}).catch((err) => {
					reject(err);
				});
			}).catch((err) => {
				reject(err);
			});
		});
	}
	static openFile() {
		return new Promise(function(resolve, reject) {
			_checkFolder().then(() => {
				_open().then((data) => {
					globals.saved = true;
					resolve(data);
				}).catch((err) => {
					reject(err);
				});
			});
		});
	}
}

function _open() {
	return new Promise(function(resolve, reject) {
		let files = [];

		jetpack.findAsync(settings.local.folder, {
			matching: '*.json'
		}).then((data) => {
			console.log(data.length);
			data.forEach((item) => {
				console.log("lol");

				files.push({
					name: path.basename(item),
					path: item,
					subject: path.dirname(item).split("/")[path.dirname(item).split("/").length - 1]
				});
			});

			showFilesList(files).then((button) => {
				const name = button.data("filename");
				const subject = button.data("filesubject");
				const path = button.data("filepath");
				console.log(button);
				console.log(path);
				jetpack.readAsync(path).then((data) => {
					globals.file.name = name;
					globals.file.subject = subject;
					document.title = globals.title + " - " + globals.file.subject + " - " + globals.file.name;
					AppIO.loadFile(data);
					resolve();
				}).catch((err) => {
					reject(err);
				});
			}).catch(() => {
				reject("No file selected!");
			});
		});
	});
}

document.ondragover = document.ondrop = (ev) => {
	ev.preventDefault();
}

document.body.ondrop = (ev) => {
	let item = ev.dataTransfer.files[0].path;
	console.log(item);
	jetpack.readAsync(item).then((data) => {
		AppIO.close().then(() => {
			globals.service = "Local";
			globals.file.name = path.basename(item);
			globals.file.subject = path.dirname(item).split("/")[path.dirname(item).split("/").length - 1];
			document.title = globals.title + " - " + globals.file.subject + " - " + globals.file.name;
			AppIO.loadFile(data);
			$(".dialog").modal("hide");
		}).catch((err) => {
			console.log(err);
		});
	}).catch((err) => {
		console.log(err);
	});

	ev.preventDefault();
}

function _save(file, content) {
	return new Promise(function(resolve, reject) {
		jetpack.writeAsync(file, content).then(() => {
			MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
			document.title = globals.title + " - " + globals.file.subject + " - " + globals.file.name;
			updateStyle();
			resolve();
		}).catch((err) => {
			reject(err);
		});
	});
}

function _checkFolder() {
	return new Promise(function(resolve, reject) {
		if (settings.local.folder) {
			resolve();
			return;
		}

		_setFolder().then(() => {
			resolve();
		}).catch((err) => {
			reject(err);
		})
	});
}

$(document).ready(function() {
	$(".setFolder").click(function() {
		_setFolder();
	});
});

function _setFolder() {
	return new Promise(function(resolve, reject) {
		dialog.showOpenDialog({
			title: "Select Default Folder",
			properties: ['openDirectory']
		}, function(folders) {
			if (folders === undefined) {
				reject("No folder selected!");
				return;
			}
			settings.local.folder = folders[0];
			$(".settings-input[data-setting='local.folder']").val(settings.local.folder);

			saveSettings().then(() => {
				resolve();
			}).catch((err) => {
				reject(err);
			})
		});
	});
}

export {
	LocalIO
};
