export var fileMenu = {
    label: 'File',
    submenu: [
      {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: function (menuItem, currentWindow) {
            currentWindow.webContents.send('save')
          }
      },
      {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: function (menuItem, currentWindow) {
            currentWindow.webContents.send('open')
          }
      },
      {
          label: 'New File...',
          accelerator: 'CmdOrCtrl+N',
          click: function (menuItem, currentWindow) {
            currentWindow.webContents.send('new')
          }
      },
      {
          label: 'Export...',
          click: function (menuItem, currentWindow) {
            currentWindow.webContents.send('export')
          }
      }
    ]
};

export var editMenuTemplate = {
    label: 'Edit',
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
};
