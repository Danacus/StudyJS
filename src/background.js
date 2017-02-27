import path from 'path';
import url from 'url';
import {
	app,
	Menu,
	ipcMain
} from 'electron';
import {
	devMenuTemplate
} from './menu/dev_menu_template';
import {
	editMenuTemplate,
	fileMenu,
	GoogleDrive
} from './menu/edit_menu_template';
import createWindow from './helpers/window';
const electronOauth2 = require('electron-oauth2');
import env from './env';

var mainWindow;

var setApplicationMenu = function() {
	var menus = [fileMenu, editMenuTemplate, GoogleDrive];
	if (env.name !== 'production') {
		menus.push(devMenuTemplate);
	}
	Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

if (env.name !== 'production') {
	var userDataPath = app.getPath('userData');
	app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

app.on('ready', function() {
	setApplicationMenu();

	var mainWindow = createWindow('main', {
		width: 1200,
		height: 800
	});

	mainWindow.maximize();

	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'app.html'),
		protocol: 'file:',
		slashes: true
	}));

	if (env.name === 'development') {
		mainWindow.openDevTools();
	}

	ipcMain.on('authorize', (event, props) => {
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
						//ipcMain.send('token', token.access_token);
						mainWindow.webContents.send('token', token.access_token);
					});
			});
	});

});

function authorize() {

}

app.on('window-all-closed', function() {
	app.quit();
});
