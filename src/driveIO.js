import fs from 'fs';
import {
	showNotification
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

//Singleton reference
var driveIO;
const service = google.drive('v3');

class DriveIO {
	constructor() {
		driveIO = this;
	}
	authorize(token) {
		return new Promise(function(resolve, reject) {
			authorize(token).then((client) => {
				createFolder(client).then(() => {
					authClient = client;
					resolve();
				}).catch((err) => {
					reject(err);
				});
			}).catch((err) => {
				reject(err);
			});
		});
	}
	writeFile(id, content) {
		update(authClient, id, content);
	}
	writeNewFile(id, content) {
		newFile(authClient, id, content);
	}
	openFile(id) {
		return new Promise(function(resolve, reject) {
			read(authClient, id).then((data) => {
				globals.saved = true;
				resolve(data);
			}).catch((err) => {
				reject(err);
			});
		});
	}
	list() {
		return new Promise(function(resolve, reject) {
			getFiles(authClient).then((data) => {
				resolve(data);
			}).catch((err) => {
				reject(err);
			});
		});
	}
}

export {
	DriveIO,
	driveIO
};


function authorize(code) {
	return new Promise(function(resolve) {
		const clientSecret = 'k-YWdpaWFXX4xTiwWMf2oME9';
		const clientId = '201706695524-djkbgve14lj7q789aoavb5rpjpruhtgc.apps.googleusercontent.com';
		const redirectUrl = 'http://localhost';
		const auth = new googleAuth();
		const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

		oauth2Client.credentials.access_token = code;
		resolve(oauth2Client);
	});
}

function getFolder(auth) {
	return new Promise(function(resolve, reject) {
		var id = null;
		service.files.list({
			auth: auth,
			mimeType: 'application/vnd.google-apps.folder',
			fields: "nextPageToken, files(id, name)"
		}, function(err, response) {
			if (err) {
				reject("Cannot authorize Google Drive! Token might be expired!");
				return;
			}
			var files = response.files;
			if (files.length == 0) {
				reject("No files found!");
			} else {
				files.forEach((file) => {
					if (file.name == "StudyJS") {
						id = file.id;
					}
				});
				resolve(id);
			}
		});
	});
}

function getFiles(auth) {
	return new Promise(function(resolve, reject) {
		service.files.list({
			auth: auth,
			parents: [folder],
			mimeType: "application/json",
			fields: "nextPageToken, files(id, name)"
		}, function(err, response) {
			if (err) {
				reject(err);
				return;
			}
			var files = response.files;
			if (files.length == 0) {
				reject("No files found!");
			} else {
				resolve(files);
			}
		});
	});
}

function createFolder(auth) {
	return new Promise(function(resolve, reject) {
		getFolder(auth).then((id) => {
			if (id == null) {
				const fileMetadata = {
					'name': 'StudyJS',
					'mimeType': 'application/vnd.google-apps.folder'
				};
				service.files.create({
					auth: auth,
					resource: fileMetadata,
					fields: 'id'
				}, function(err, file) {
					if (err) {
						reject(err);
					} else {
						folder = file.id;
						resolve();
					}
				});
			} else {
				folder = id;
				resolve();
			}
		}).catch((err) => {
			reject(err);
		});
	});
}

function update(auth, fileName, content) {
	const media = {
		mimeType: 'text/json',
		body: content
	};
	service.files.update({
		auth: auth,
		fileId: fileName,
		media: media,
		resource: fileMetadata,
		addParents: [folder],
		fields: 'id'
	}, function(err, file) {
		if (err) {
			showNotification({
				type: "alert-danger",
				content: "Cannot save file! " + err
			});
		} else {
			showNotification({
				type: "alert-success",
				content: "File saved!"
			});
			globals.currentFile = fileName + " (" + file.id + ")";
			document.title = globals.title + " - " + globals.currentFile;
			globals.saved = true;
		}
	});
}

function newFile(auth, fileName, content) {
	const media = {
		mimeType: 'text/json',
		body: content
	};
	const fileMetadata = {
		'name': fileName,
		'mimeType': 'text/json',
		parents: [folder]
	};
	service.files.create({
		auth: auth,
		media: media,
		resource: fileMetadata,
		fields: 'id'
	}, function(err, file) {
		if (err) {
			showNotification({
				type: "alert-danger",
				content: "Cannot save file! " + err
			});
		} else {
			showNotification({
				type: "alert-success",
				content: "File saved!"
			});
			globals.currentFile = fileName + " (" + file.id + ")";
			document.title = globals.title + " - " + globals.currentFile;
			globals.saved = true;
		}
	});
}

function read(auth, id) {
	return new Promise(function(resolve, reject) {
		const dest = fs.createWriteStream(appRoot + "/" + id + ".json");
		service.files.get({
				fileId: id,
				alt: 'media',
				auth: auth
			})
			.on('error', function(err) {
				reject("Error during download! " + err);
			})
			.pipe(dest).on("finish", function() {
				fs.readFile(appRoot + "/" + id + ".json", "utf-8", function(err, data) {
					if (err) {
						reject("Error reading file! " + err);
					}
					resolve(data);
				});
			});
	});
}
