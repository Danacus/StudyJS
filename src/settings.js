const jetpack = require('fs-jetpack');
const path = require('path');
import {
	remote
} from 'electron';
var app = remote.app;
const appData = path.join(app.getPath("userData"), "/data/");
const getHomePath = require("home-path");
import {
	showNotification
} from './dialog';

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
		jetpack.file(appData + "/settings.json");
		jetpack.readAsync(appData + "/settings.json").then(function(data) {
			if (data != "") {
				settings = JSON.parse(data);
			}

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
		jetpack.writeAsync(appData + "/settings.json", JSON.stringify(settings)).then(function(data) {
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
