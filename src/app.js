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
var appIO;
var driveIO;
var editor;
var mqEdit;

$(document).ready(function() {
	new DriveIO();
	new LocalIO();
	appIO = new AppIO();
	editor = new Editor();
	mqEdit = new MQEdit();
	new Serializer();
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

listener.simple_combo("ctrl left", function() {
	editor.addContainer(editor.add.parent);
});

listener.simple_combo("cmd left", function() {
	editor.addContainer(editor.add.parent);
});

listener.simple_combo("alt down", function() {
	editor.addBody();
});

//IPC recievers
ipcRenderer.on('save', function(event, message) {
	appIO.save();
});

ipcRenderer.on('saveas', function(event, message) {
	appIO.save(null);
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
	settings.drive.token = null;
	saveSettings().then(() => {
		globals.drive.authorized = false;
	});
});

$(document).ready(function() {
	$("#save").click(function() {
		appIO.save();
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

	$("#eqedit").click(function() {
		mqEdit.open();
	});

	$("#eq-insert").click(function() {
		mqEdit.insert();
	});

	$("#eq-close").click(function() {
		mqEdit.close();
	});
});
