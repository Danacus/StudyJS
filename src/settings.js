var getHomePath = require('home-path');
var appRoot = getHomePath() + "/StudyJS";
import fs from 'fs';
import {
	showNotification
} from './dialog';

var Bluebird = require("bluebird");
var readFile = Bluebird.promisify(fs.readFile);
var writeFile = Bluebird.promisify(fs.writeFile);

var settings = {
	drive: {
		token: null,
		folder: "StudyJS - Files"
	},
	local: {
		folder: getHomePath()
	}
};

$(document).ready(function() {
	$(".settings-page").click(function() {
		$("#settings-dialog").find(".page").each(function() {
			$(this).removeClass("active");
		});

		$(".settings-page").each(function() {
			$(this).removeClass("active");
		});

		$(this).addClass("active");

		$("#settings-dialog").find("." + $(this).data("target")).addClass("active");
	});

	$("#settings-button").click(function() {
		showSettingsDialog();
	});

	$("#settings-dialog").find(".apply").click(function() {
		saveSettings();
	});
});

function showSettingsDialog() {
	$("#settings-dialog").modal("show");
}

var loadSettings = function() {
	return new Promise(function(resolve, reject) {
		readFile(appRoot + "/settings.json").then(function(data) {
			settings = JSON.parse(data);

			$(".settings-input").each(function() {
				let setting = $(this).data("setting").split(".");
				$(this).val(settings[setting[0]][setting[1]]);
			});

			resolve();
		}).catch(function(err) {
			$(".settings-input").each(function() {
				let setting = $(this).data("setting").split(".");
				$(this).val(settings[setting[0]][setting[1]]);
			});

			saveSettings();

			resolve();
		});
	});
}

var saveSettings = function(callback) {
	return new Promise(function(resolve, reject) {
		$(".settings-input").each(function() {
			let setting = $(this).data("setting").split(".");
			settings[setting[0]][setting[1]] = $(this).val();
		});
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
