// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { greet } from './hello_world/hello_world'; // code authored by you in this project
import env from './env';
import $ from 'jquery';
import { editor } from './editor';
import { appIO } from './io';

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

$(document).ready(function() {
  initTinyMCE();
  //loadViewer();
});

$(document).keypress(function(){
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
require('electron').ipcRenderer.on('save', function(event, message) {
  appIO.saveFile();
});

require('electron').ipcRenderer.on('open', function(event, message) {
  appIO.openFile();
});

require('electron').ipcRenderer.on('new', function(event, message) {
  appIO.newFile();
});

require('electron').ipcRenderer.on('export', function(event, message) {
  appIO.exportFile();
});

$(document).ready(function () {
  $("#save").click(function() {
    appIO.saveFile();
  });

  $("#open").click(function() {
    appIO.openFile();
  });

  $("#new").click(function() {
    appIO.newFile();
  });

  $("#export").click(function() {
    appIO.exportFile();
  });
});
