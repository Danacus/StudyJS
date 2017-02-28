import os from 'os';
import {
	remote,
	ipcRenderer
} from 'electron';
import $ from 'jquery';
import {
	Editor
} from './editor/editor';
import {
	AppIO
} from './fs/io/io3';
import {
	ColorImport
} from './fs/io/colorImport';
import fs from 'fs';
import {
	MQEdit
} from './editor/eqEditor';
import {
	Serializer
} from './fs/serialize';
import {
	DriveIO
} from './fs/io/driveIO';
import {
	LocalIO
} from './fs/io/localIO';
import {
	loadSettings,
	saveSettings,
	settings
} from './settings';

var app = remote.app;

$(document).ready(function() {
	new DriveIO();
	new LocalIO();
	new AppIO();
	new MQEdit();
	initTinyMCE();
});

$(document).keypress(function(e) {
	if (
		e.which !== 0 && !e.ctrlKey && !e.metaKey && !e.altKey
	) {
		globals.saved = false;
		document.title = globals.title + " - " + (globals.file.subject || "") + " - " + (globals.file.name || "New File") + "*";
	}
});

var listener = new window.keypress.Listener();

listener.simple_combo("ctrl down", function() {
	Editor.addContainer(Editor.add.after);
});

listener.simple_combo("ctrl up", function() {
	Editor.addContainer(Editor.add.before);
});

listener.simple_combo("ctrl right", function() {
	Editor.addContainer(Editor.add.child);
});

listener.simple_combo("ctrl left", function() {
	Editor.addContainer(Editor.add.parent);
});

listener.simple_combo("alt down", function() {
	Editor.addBody();
});

//IPC recievers
ipcRenderer.on('save', function(event, message) {
	AppIO.save();
});

ipcRenderer.on('saveas', function(event, message) {
	AppIO.save(null);
});

ipcRenderer.on('open', function(event, message) {
	AppIO.open();
});

ipcRenderer.on('new', function(event, message) {
	AppIO.newFile();
});

ipcRenderer.on('export', function(event, message) {
	AppIO.exportFile();
});

ipcRenderer.on('logout', function(event, message) {
	settings.drive.token = null;
	saveSettings().then(() => {
		globals.drive.authorized = false;
	});
});

$(document).ready(function() {
	$("#save").click(function() {
		AppIO.save();
	});

	$("#open").click(function() {
		AppIO.open();
	});

	$("#new").click(function() {
		AppIO.newFile();
	});

	$("#export").click(function() {
		AppIO.exportFile();
	});

	$("#colors").click(function() {
		ColorImport.addColor();
	});

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
