import fs from 'fs';
import {
	remote,
	ipcRenderer
} from 'electron';
var dialog = remote.dialog;
import {
	showNotification
} from '../../dialog';
import {
	settings
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
	}
	writeFile(createNew = false) {
		return new Promise(function(resolve, reject) {
			if (createNew) {
				globals.file.path = null;
			}

			_saveDialog().then(() => {
				globals.saved = true;
				resolve();
			}).catch((err) => {
				reject(err);
			});
		});
	}
	openFile() {
		return new Promise(function(resolve, reject) {
			_open().then((data) => {
				globals.saved = true;
				resolve(data);
			}).catch((err) => {
				reject(err);
			});
		});
	}
}

function _open() {
	return new Promise(function(resolve, reject) {
		dialog.showOpenDialog({
			title: "Open File",
			filters: [{
				name: 'StudyJS JSON Files',
				extensions: ['json']
			}]
		}, function(fileNames) {
			if (!fileNames || fileNames.length == 0) {
				reject("No file selected!");
				return;
			}

			readFile(fileNames[0], "utf-8").then((data) => {
				globals.file.name = fileNames[0];
				globals.file.path = fileNames[0];
				document.title = globals.title + " - " + globals.file.name;
				AppIO.loadFile(data);
				resolve();
			}).catch((err) => {
				reject(err);
			});
		});
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
			document.title = globals.title + " - " + globals.file.name;
			updateStyle();
			resolve();
		}).catch((err) => {
			reject(err);
		});
	});
}

export {
	LocalIO,
	localIO
};
