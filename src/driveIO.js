import fs from 'fs';
import {
	bootstrapDialog,
	bootstrapNotification
} from './dialog';
import {
	settings
} from './settings';
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var getHomePath = require('home-path');
var appRoot = getHomePath() + "/StudyJS";

var folder;
var authClient;

class driveIO {
	static authorize(token, callback) {
		authorize(token, function(client) {
			createFolder(client, function() {
				authClient = client;
				callback();
			});
		});
	}
	static writeFile(id, content) {
		write(authClient, id, content);
	}
	static writeNewFile(id, content) {
		newFile(authClient, id, content);
	}
	static openFile(id, callback) {
		read(authClient, id, function(data) {
			callback(data);
		});
	}
	static list(callback) {
		getFiles(authClient, function(data) {
			callback(data);
		});
	}
}

export {
	driveIO
};


function authorize(code, callback) {
	var clientSecret = 'k-YWdpaWFXX4xTiwWMf2oME9';
	var clientId = '201706695524-djkbgve14lj7q789aoavb5rpjpruhtgc.apps.googleusercontent.com';
	var redirectUrl = 'http://localhost';
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

	oauth2Client.credentials.access_token = code;
	callback(oauth2Client);
}

function getFolder(auth, callback) {
	var service = google.drive('v3');
	var id = null;
	service.files.list({
		auth: auth,
		mimeType: 'application/vnd.google-apps.folder',
		fields: "nextPageToken, files(id, name)"
	}, function(err, response) {
		if (err) {
			bootstrapNotification({
				type: "alert-danger",
				content: "The API returned an error: " + err
			});
			return;
		}
		var files = response.files;
		if (files.length == 0) {
			bootstrapNotification({
				type: "alert-warning",
				content: "No files found"
			});
		} else {
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				if (file.name == "StudyJS") {
					id = file.id;
				}
			}
			callback(id);
		}
	});
}

function getFiles(auth, callback) {
	var service = google.drive('v3');
	service.files.list({
		auth: auth,
		parents: [folder],
		mimeType: "application/json",
		fields: "nextPageToken, files(id, name)"
	}, function(err, response) {
		if (err) {
			bootstrapNotification({
				type: "alert-danger",
				content: "The API returned an error: " + err
			});
			return;
		}
		var files = response.files;
		if (files.length == 0) {
			bootstrapNotification({
				type: "alert-warning",
				content: "No files found"
			});
		} else {
			callback(files);
		}
	});
}

function createFolder(auth, callback) {
	getFolder(auth, function(id) {
		console.log(id);
		if (id == null) {
			var fileMetadata = {
				'name': 'StudyJS',
				'mimeType': 'application/vnd.google-apps.folder'
			};
			var drive = google.drive('v3');
			drive.files.create({
				auth: auth,
				resource: fileMetadata,
				fields: 'id'
			}, function(err, file) {
				if (err) {
					bootstrapNotification({
						type: "alert-danger",
						content: "The API returned an error: " + err
					});
				} else {
					folder = file.id;
					callback();
				}
			});
		} else {
			folder = id;
			callback();
		}
	});
}

function write(auth, fileName, content) {
	var fileMetadata = {
		//parents: [folder]
	};
	var media = {
		mimeType: 'text/json',
		body: content
	};
	var drive = google.drive('v3');
	drive.files.update({
		auth: auth,
		fileId: fileName,
		media: media,
		resource: fileMetadata,
		addParents: [folder],
		fields: 'id'
	}, function(err, file) {
		if (err) {
			bootstrapNotification({
				type: "alert-danger",
				content: "Cannot save file! " + err
			});
		} else {
			bootstrapNotification({
				type: "alert-success",
				content: "File saved!"
			});
		}
	});
}

function newFile(auth, fileName, content) {
	var media = {
		mimeType: 'text/json',
		body: content
	};
	var fileMetadata = {
		'name': fileName,
		'mimeType': 'text/json',
		parents: [folder]
	};
	var drive = google.drive('v3');
	drive.files.create({
		auth: auth,
		media: media,
		resource: fileMetadata,
		fields: 'id'
	}, function(err, file) {
		if (err) {
			bootstrapNotification({
				type: "alert-danger",
				content: "Cannot save file! " + err
			});
		} else {
			bootstrapNotification({
				type: "alert-success",
				content: "File saved!"
			});
			globals.currentFile = fileName + " (" + file.id + ")";
			document.title = globals.title + " - " + globals.currentFile;
			globals.saved = true;
		}
	});
}

function read(auth, id, callback) {
	var fileId = id;
	var dest = fs.createWriteStream(appRoot + "/" + id + ".json");
	var drive = google.drive('v3');
	drive.files.get({
			fileId: fileId,
			alt: 'media',
			auth: auth
		})
		.on('end', function() {

		})
		.on('error', function(err) {
			bootstrapNotification({
				type: "alert-danger",
				content: "Error during download! " + err
			});
		})
		.pipe(dest).on("finish", function() {
			fs.readFile(appRoot + "/" + id + ".json", "utf-8", function(err, data) {
				if (err) {
					bootstrapNotification({
						type: "alert-danger",
						content: "Error reading file! " + err
					});
					return console.error(err);
				}

				callback(data);
			});
		});
}
