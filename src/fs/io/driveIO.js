import fs from 'fs';
import {
	ipcRenderer
} from 'electron';
import {
	showNotification,
	showFilesList
} from '../../dialog';
import {
	serializer
} from '../serialize';
import {
	loadSettings,
	saveSettings,
	settings
} from '../../settings';
import {
	AppIO
} from './io3';

var google = require('googleapis');
var googleAuth = require('google-auth-library');
var getHomePath = require('home-path');
var appRoot = getHomePath() + "/StudyJS";

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
		if (!globals.drive.authorized) {
			authorizeCallback = "save";
			requestToken();
			return;
		}

		if (!createNew) {
			return update(authClient, globals.file.id, serializer.serialize());
		} else {
			return newFile(authClient, globals.file.subject, globals.file.name, serializer.serialize());
		}
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
			let fileList = [];

			files.forEach((file) => {
				if (file.name.includes("-")) {
					let name = file.name;
					fileList.push({
						name: name.split("-")[1].trim(),
						id: file.id,
						subject: name.split("-")[0].trim()
					});
				}
			});

			showFilesList(fileList).then((button) => {
				$("#drive").modal("hide");
				const id = button.data("fileid");
				const name = button.data("filename");
				const subject = button.data("filesubject");

				read(authClient, id).then((data) => {
					globals.saved = true;
					globals.file.name = name;
					globals.file.id = id;
					globals.file.subject = subject;
					document.title = globals.title + " - " + globals.file.subject + " - " + globals.file.name;
					AppIO.loadFile(data);
					resolve(data);
				}).catch((err) => {
					reject(err);
				});
			}).catch(() => {
				reject("No file selected!");
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
				open().catch((err) => {
					showNotification({
						type: "alert-danger",
						content: "Cannot export file! " + err
					});
				});
			}

			authorizeCallback = null;
		});
	});
});

function getName(auth, id) {
	return new Promise(function(resolve, reject) {
		service.files.get({
			auth: auth,
			fileId: id
		}, function(err, response) {
			if (err) {
				reject(err);
				return;
			}
			if (!response) {
				reject("File not found!");
			} else {
				resolve(response.name);
			}
		});
	});
}

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
			authClient = client;
			resolve();
		}).catch((err) => {
			requestToken();
			reject(err);
		});
	});
}

function _authorize(code) {
	return new Promise(function(resolve, reject) {
		const clientSecret = 'k-YWdpaWFXX4xTiwWMf2oME9';
		const clientId = '201706695524-djkbgve14lj7q789aoavb5rpjpruhtgc.apps.googleusercontent.com';
		const redirectUrl = 'http://localhost';
		const auth = new googleAuth();
		const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

		oauth2Client.credentials.access_token = code;
		service.files.list({
			auth: oauth2Client,
			fields: "nextPageToken, files(id, name)"
		}, function(err, response) {
			if (err) {
				reject(err);
				return;
			}

			resolve(oauth2Client);
		});
	});
}

function getFolder(auth, name, parent = null) {
	return new Promise(function(resolve, reject) {
		var id = null;
		service.files.list({
			auth: auth,
			mimeType: 'application/vnd.google-apps.folder',
			q: (function() {
				if (parent) {
					return "'" + parent + "' in parents"
				}
			})(),
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
					if (file.name == name) {
						id = file.id;
					}
				});

				if (id) {
					resolve(id);
				} else {
					createFolder(auth, name, parent).then((id) => {
						resolve(id);
					}).catch((err) => {
						reject(err);
					});
				}
			}
		});
	});
}

function getFiles(auth) {
	return new Promise(function(resolve, reject) {
		var files = [];
		getFolder(auth, "StudyJS - Files").then((f) => {
			service.files.list({
				auth: auth,
				q: "mimeType='application/vnd.google-apps.folder' and '" + f + "' in parents",
				fields: "nextPageToken, files(id, name, parents)"
			}, function(err, resp) {
				if (err) {
					reject(err);
					return;
				}

				console.log(resp.files.length);

				resp.files.forEach((folder, index) => {
					service.files.list({
						auth: auth,
						q: "mimeType='text/json' and '" + folder.id + "' in parents",
						fields: "nextPageToken, files(id, name, parents)"
					}, function(err, response) {
						if (err) {
							reject(err);
							return;
						}

						response.files.forEach((file) => {
							files.push(file);
						});

						if (index == resp.files.length - 1) {
							resolve(files);
						}
					});
				});
			});
		});
	});
}

function createFolder(auth, name, parent = null) {
	return new Promise(function(resolve, reject) {
		const fileMetadata = {
			'name': name,
			'mimeType': 'application/vnd.google-apps.folder',
			parents: [parent]
		};
		service.files.create({
			auth: auth,
			resource: fileMetadata,
			fields: 'id'
		}, function(err, file) {
			if (err) {
				reject(err);
			} else {
				resolve(file.id);
			}
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
			fields: 'id'
		}, function(err, file) {
			if (err) {
				reject(err);
			} else {
				resolve();
				globals.file.id = file.id;
				document.title = globals.title + " - " + globals.file.subject + " - " + globals.file.name;
				globals.saved = true;
			}
		});
	});
}

function newFile(auth, subject, fileName, content) {
	return new Promise(function(resolve, reject) {
		getFolder(auth, "StudyJS - Files").then((f) => {
			getFolder(auth, subject, f).then((fol) => {
				const media = {
					mimeType: 'text/json',
					body: content
				};
				const fileMetadata = {
					'name': subject + " - " + fileName,
					'mimeType': 'text/json',
					parents: [fol]
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
						document.title = globals.title + " - " + globals.file.subject + " - " + globals.file.name;
						globals.saved = true;
					}
				});
			});
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
