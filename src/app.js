// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import {
	remote,
	ipcRenderer
} from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import {
	greet
} from './hello_world/hello_world'; // code authored by you in this project
import env from './env';
import $ from 'jquery';
import {
	editor
} from './editor';
import {
	AppIO
} from './io3';
import fs from 'fs';
import {
	MQEdit
} from './eqEditor';
import {
	serializer
} from './serialize';
import {
	driveIO
} from './driveIO';
import {
	loadSettings,
	saveSettings,
	settings
} from './settings';

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());
var appIO;

$(document).ready(function() {
	/*
			if (settings.token) {
				driveIO.authorize(settings.token, function() {

				});
			}*/
	appIO = new AppIO();
	MQEdit.load();
	initTinyMCE();
});

$(document).keypress(function() {
	globals.saved = false;
	document.title = globals.title + " - " + (globals.currentFile || "New File") + "*";
});

var listener = new window.keypress.Listener();

listener.simple_combo("ctrl down", function() {
	editor.addContainer(editor.add.after);
});

listener.simple_combo("cmd down", function() {
	editor.addContainer(editor.add.after);
});

listener.simple_combo("ctrl up", function() {
	editor.addContainer(editor.add.before);
});

listener.simple_combo("cmd up", function() {
	editor.addContainer(editor.add.before);
});

listener.simple_combo("ctrl right", function() {
	editor.addContainer(editor.add.child);
});

listener.simple_combo("cmd right", function() {
	editor.addContainer(editor.add.child);
});

listener.simple_combo("alt down", function() {
	console.log("add body");
	editor.addBody();
});

//IPC recievers
ipcRenderer.on('save', function(event, message) {
	var drive = true;

	if ((globals.currentFile || ".json").endsWith(".json")) {
		drive = false;
	}

	appIO.save(globals.currentFile, drive);
});

ipcRenderer.on('saveas', function(event, message) {
	appIO.save();
});

ipcRenderer.on('open', function(event, message) {
	appIO.open();
});

ipcRenderer.on('new', function(event, message) {
	appIO.newFile();
});

ipcRenderer.on('export', function(event, message) {
	appIO.exportFile();
});

ipcRenderer.on('logout', function(event, message) {
	globals.authorized = false;
});

$(document).ready(function() {
	$("#save").click(function() {
		var drive = true;

		if ((globals.currentFile || ".json").endsWith(".json")) {
			drive = false;
		}

		appIO.save(globals.currentFile, drive);
	});

	$("#open").click(function() {
		appIO.open();
	});

	$("#new").click(function() {
		appIO.newFile();
	});

	$("#export").click(function() {
		appIO.exportFile();
	});

	$("#colors").click(function() {
		appIO.addColor();
	});

	/*$("#styles").click(function() {
		appIO.addStyle();
	});*/

	$("#eqedit").click(function() {
		MQEdit.open();
	});

	$("#eq-insert").click(function() {
		MQEdit.insert();
	});

	$("#eq-close").click(function() {
		MQEdit.close();
	});
});
