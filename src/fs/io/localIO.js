import fs from 'fs';
var readdirp = require('readdirp'),
	path = require('path'),
	es = require('event-stream');

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
	serializer
} from '../serialize';
import {
	AppIO
} from './io3';

var getHomePath = require("home-path");
var appRoot = getHomePath() + "/StudyJS";

var Promise = require('bluebird');
var readFile = Promise.promisify(fs.readFile);
var writeFile = Promise.promisify(fs.writeFile);

//Singleton reference
var localIO;

class LocalIO {
	constructor() {
		localIO = this;

		loadSettings();
	}
	writeFile(createNew = false) {
		return new Promise(function(resolve, reject) {
			_checkFolder().then(() => {
				if (createNew) {
					globals.file.path = null;
				}

				let dir = settings.folder + "/" + globals.file.subject + "/";

				if (!fs.existsSync(dir)) {
					fs.mkdirSync(dir);
				}

				_save(dir + globals.file.name, serializer.serialize()).then(() => {
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
	openFile() {
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

		var stream = readdirp({
			root: settings.folder,
			fileFilter: '*.json'
		});
		stream
			.on('warn', function(err) {
				reject(err);
				// optionally call stream.destroy() here in order to abort and cause 'close' to be emitted
			})
			.on('error', function(err) {
				reject(err);
			})
			.pipe(es.mapSync(function(entry) {
				files.push({
					name: entry.name,
					path: entry.fullPath,
					subject: path.dirname(entry.path).split("/")[path.dirname(entry.path).split("/").length - 1]
				});

				showFilesList(files).then((button) => {
					const name = button.data("filename");
					const subject = button.data("filesubject");
					const path = button.data("filepath");
					console.log(button);
					console.log(path);
					readFile(path, "utf-8").then((data) => {
						globals.file.name = name;
						globals.file.path = path;
						globals.file.subject = subject;
						document.title = globals.title + " - " + globals.file.subject + " - " + globals.file.name;
						AppIO.loadFile(data);
						$("#drive").modal("hide");
						resolve();
					}).catch((err) => {
						reject(err);
					});
				}).catch(() => {
					reject("No file selected!");
				});
			})).pipe(es.stringify())
			.pipe(process.stdout);
	});
}

function _saveDialog() {
	return new Promise(function(resolve, reject) {
		if (!globals.file.path) {
			dialog.showOpenDialog({
				title: "Select Folder",
				properties: ['openDirectory']
			}, function(folders) {
				if (folders === undefined) {
					reject("No folder selected!");
					return;
				}
				_save(folders[0] + "/" + globals.file.name, serializer.serialize()).then(() => {
					$("#dialog").modal("hide");
					resolve();
				}).catch((err) => {
					reject(err);
				});
			});
		} else {
			resolve();
		}
	});
}

function _save(file, content) {
	return new Promise(function(resolve, reject) {
		$(".eq-math").each(() => {
			$(this).html($(this).data("formula"));
		});
		writeFile(file, content).then(() => {
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
		if (settings.folder) {
			resolve();
			return;
		}

		dialog.showOpenDialog({
			title: "Select Default Folder",
			properties: ['openDirectory']
		}, function(folders) {
			if (folders === undefined) {
				reject("No folder selected!");
				return;
			}
			settings.folder = folders[0];

			saveSettings().then(() => {
				resolve();
			}).catch((err) => {
				reject(err);
			})
		});
	});
}

export {
	LocalIO,
	localIO
};
