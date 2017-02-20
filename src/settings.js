var getHomePath = require('home-path');
var appRoot = getHomePath() + "/StudyJS";
import fs from 'fs';
import {
	showNotification
} from './dialog';

var Bluebird = require("bluebird");
var readFile = Bluebird.promisify(fs.readFile);
var writeFile = Bluebird.promisify(fs.writeFile);

var settings = {};

var loadSettings = function() {
	return new Promise(function(resolve, reject) {
		readFile(appRoot + "/settings.json").then(function(data) {
			settings = JSON.parse(data);
			resolve();
		}).catch(function(err) {
			showNotification({
				type: "alert-danger",
				content: "Cannot load settings! " + err
			});
			reject();
		});
	});
}

var saveSettings = function(callback) {
	return new Promise(function(resolve, reject) {
		writeFile(appRoot + "/settings.json", JSON.stringify(settings)).then(function(data) {
			resolve();
		}).catch(function(err) {
			showNotification({
				type: "alert-danger",
				content: "Cannot save settings! " + err
			});
			reject();
		});
	});
}


export {
	loadSettings,
	saveSettings,
	settings
};
