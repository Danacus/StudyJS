import fs from 'fs';
import {
	ipcRenderer
} from 'electron';
import {
	showNotification,
	showFilesList
} from './dialog';
import {
	serializer
} from './serialize';
import {
	loadSettings,
	saveSettings,
	settings
} from './settings';

var google = require('googleapis');
var googleAuth = require('google-auth-library');
var getHomePath = require('home-path');
var appRoot = getHomePath() + "/StudyJS";

var folder;
var authClient;

var authorizeCallback;

//Singleton reference
var driveIO;
const service = google.drive('v3');

class DriveIO {
	constructor() {
		driveIO = this;

		loadSettings().then(() => {
			if (settings.drive.token) {
				authorizeDrive(settings.drive.token).then(() => {
					globals.drive.authorized = true;
				}).catch((err) => {
					showNotification({
						type: 'alert-warning',
						content: err
					})
				});
			}
		});
	}
	writeFile(createNew) {
		return new Promise(function(resolve, reject) {
			if (!globals.drive.authorized) {
				authorizeCallback = "save";
				requestToken();
				return;
			}

			if (!createNew) {
				update(authClient, globals.file.id, serializer.serialize()).then(() => {
					resolve();
				}).catch((err) => {
					reject(err);
				});
			} else {
				newFile(authClient, globals.file.name, serializer.serialize()).then(() => {
					resolve();
				}).catch((err) => {
					reject(err);
				});
			}
		});
	}
	openFile() {
		return new Promise(function(resolve, reject) {
			if (!globals.drive.authorized) {
				authorizeCallback = "open";
				requestToken();
				return;
			}

			open().then(() => {
				resolve();
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

function open() {
	return new Promise(function(resolve, reject) {
		list().then((files) => {
			showFilesList(files).then((button) => {
				$("#drive").modal("hide");
				const id = button.data("fileid");
				const name = button.text();

				read(authClient, id).then((data) => {
					globals.saved = true;
					globals.file.name = name;
					globals.file.id = id;
					document.title = globals.title + " - " + globals.file.name;
					serializer.deserialize(JSON.parse(data));

					initTinyMCE();
					updateStyle();
					loadViewer();
					MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
					resolve(data);
				}).catch((err) => {
					reject(err);
				});
			});
		});
	});
}

function requestToken() {
	ipcRenderer.send('authorize');
}

ipcRenderer.on('token', function(event, message) {
	settings.drive.token = message;
	saveSettings().then(() => {
		authorizeDrive(message).then(() => {
			globals.drive.authorized = true;

			if (authorizeCallback == "save") {
				driveIO.writeFile();
			}

			if (authorizeCallback == "open") {
				open().then(() => {
					resolve();
				}).catch((err) => {
					reject(err);
				});
			}

			authorizeCallback = null;
		});
	});
});

function list() {
	return new Promise(function(resolve, reject) {
		getFiles(authClient).then((data) => {
			resolve(data);
		}).catch((err) => {
			reject(err);
		});
	});
}

function authorizeDrive(token) {
	return new Promise(function(resolve, reject) {
		_authorize(token).then((client) => {
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

function _authorize(code) {
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
	return new Promise(function(resolve, reject) {
		const media = {
			mimeType: 'text/json',
			body: content
		};
		service.files.update({
			auth: auth,
			fileId: fileName,
			media: media,
			addParents: [folder],
			fields: 'id'
		}, function(err, file) {
			if (err) {
				reject(err);
			} else {
				resolve();
				globals.file.id = file.id;
				document.title = globals.title + " - " + globals.file.name;
				globals.saved = true;
			}
		});
	});
}

function newFile(auth, fileName, content) {
	return new Promise(function(resolve, reject) {
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
				reject(err);
			} else {
				resolve();
				globals.file.name = fileName;
				globals.file.id = file.id;
				document.title = globals.title + " - " + globals.file.name;
				globals.saved = true;
			}
		});
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
