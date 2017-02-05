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

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

$(document).ready(function() {
  initTinyMCE();
  loadViewer();
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
