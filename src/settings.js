var getHomePath = require('home-path');
var appRoot = getHomePath() + "/StudyJS";
import fs from 'fs';
import {
	bootstrapDialog,
	bootstrapNotification
} from './dialog';
var Promise = require("promise");
var Bluebird = require("bluebird");
var readFile = Bluebird.promisify(fs.readFile);
var writeFile = Bluebird.promisify(fs.writeFile);

var settings = {};

var loadSettings = function(callback) {
	readFile(appRoot + "/settings.json").then(function(data) {
		settings = JSON.parse(data);
		callback();
	}).catch(function(err) {
		bootstrapNotification({
			type: "alert-danger",
			content: "Cannot load settings! " + err
		});
	});
}

var saveSettings = function(callback) {
	writeFile(appRoot + "/settings.json", JSON.stringify(settings)).then(function(data) {
		callback();
	}).catch(function(err) {
		bootstrapNotification({
			type: "alert-danger",
			content: "Cannot save settings! " + err
		});
	});
}


export {
	loadSettings,
	saveSettings,
	settings
};
