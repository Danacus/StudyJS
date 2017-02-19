import createWindow from '../helpers/window';
export var fileMenu = {
	label: 'File',
	submenu: [{
			label: 'Save',
			accelerator: 'CmdOrCtrl+S',
			click: function(menuItem, currentWindow) {
				currentWindow.webContents.send('save')
			}
		},
		{
			label: 'Save As...',
			click: function(menuItem, currentWindow) {
				currentWindow.webContents.send('saveas')
			}
		},
		{
			label: 'Open File...',
			accelerator: 'CmdOrCtrl+O',
			click: function(menuItem, currentWindow) {
				currentWindow.webContents.send('open')
			}
		},
		{
			label: 'New File...',
			accelerator: 'CmdOrCtrl+N',
			click: function(menuItem, currentWindow) {
				currentWindow.webContents.send('new')
			}
		},
		{
			label: 'Export...',
			click: function(menuItem, currentWindow) {
				currentWindow.webContents.send('export')
			}
		}
	]
};

export var GoogleDrive = {
	label: 'Google Drive',
	submenu: [{
			label: 'Log in',
			click: function(menuItem, currentWindow) {
				const electronOauth2 = require('electron-oauth2');

				var config = {
					clientId: '201706695524-djkbgve14lj7q789aoavb5rpjpruhtgc.apps.googleusercontent.com',
					clientSecret: 'k-YWdpaWFXX4xTiwWMf2oME9',
					authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
					tokenUrl: 'https://accounts.google.com/o/oauth2/token',
					useBasicAuthorizationHeader: false,
					redirectUri: 'http://localhost'
				};

				const windowParams = {
					alwaysOnTop: true,
					autoHideMenuBar: true,
					webPreferences: {
						nodeIntegration: false
					}
				}

				const options = {
					scope: 'https://www.googleapis.com/auth/drive',
					accessType: 'online'
				};

				const myApiOauth = electronOauth2(config, windowParams);

				myApiOauth.getAccessToken(options)
					.then(token => {

						myApiOauth.refreshToken(token.refresh_token)
							.then(newToken => {
								//use your new token
								console.log(token.access_token);
								currentWindow.webContents.send('token', token.access_token);
							});
					});
			}
		},
		{
			label: 'Log out',
			click: function(menuItem, currentWindow) {

				var win = createWindow('logout', {
					width: 800,
					height: 600,
					title: "Logging out...",
					frame: true
				});

				win.loadURL("https://mail.google.com/mail/u/0/?logout&hl=en");
				win.on('page-title-updated', function(e) {
					e.preventDefault();
					currentWindow.webContents.send('logout');
					win.close();
				});
			}
		}
	]
};

export var editMenuTemplate = {
	label: 'Edit',
	submenu: [{
			label: "Undo",
			accelerator: "CmdOrCtrl+Z",
			selector: "undo:"
		},
		{
			label: "Redo",
			accelerator: "Shift+CmdOrCtrl+Z",
			selector: "redo:"
		},
		{
			type: "separator"
		},
		{
			label: "Cut",
			accelerator: "CmdOrCtrl+X",
			selector: "cut:"
		},
		{
			label: "Copy",
			accelerator: "CmdOrCtrl+C",
			selector: "copy:"
		},
		{
			label: "Paste",
			accelerator: "CmdOrCtrl+V",
			selector: "paste:"
		},
		{
			label: "Select All",
			accelerator: "CmdOrCtrl+A",
			selector: "selectAll:"
		}
	]
};
