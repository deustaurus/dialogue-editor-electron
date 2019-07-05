const { 
  app,
  BrowserWindow,
  shell,
  ipcMain,
  Menu,
  MenuItem,
  TouchBar,
} = require('electron');
const { TouchBarButton, TouchBarLabel, TouchBarSpacer } = TouchBar;

const path = require('path');
const isDev = require('electron-is-dev');

let currentProjectPath = '';
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    backgroundColor: '#F7F7F7',
    minWidth: 700,
    show: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
    },
    height: 860,
    width: 1350,
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`,
  );

  if (isDev) {
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS,
    } = require('electron-devtools-installer');

    installExtension(REACT_DEVELOPER_TOOLS)
      .then(name => {
        console.log(`Added Extension: ${name}`);
      })
      .catch(err => {
        console.log('An error occurred: ', err);
      });

    installExtension(REDUX_DEVTOOLS)
      .then(name => {
        console.log(`Added Extension: ${name}`);
      })
      .catch(err => {
        console.log('An error occurred: ', err);
      });
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    ipcMain.on('open-external-window', (event, arg) => {
      shell.openExternal(arg);
    });
  });
};

function openProject() {
  const dialog = require('electron').dialog;
  const paths = dialog.showOpenDialog({
      title: "Open Project",
      filters: [{ name: "Project", extensions: ['dpr'] }],
      properties: ["openFile"],
    },
  );
  if (paths === undefined) {
    // TODO log no file opened
    return;
  }
  const fs = require('fs');
  currentProjectPath = paths[0];
  fs.readFile(currentProjectPath, 'utf-8', (err, data) => {
    if (err) {
      // TODO log error
      return;
    }
    const convert = require('xml-js');
    const result = convert.xml2js(data, {compact: true});
    mainWindow.webContents.send('tree_change', {msg: result});
  });
}

function requestSave(doSaveAs) {
  mainWindow.webContents.send('get-project-export', {msg: doSaveAs});
}

function saveProject() {
  requestSave(currentProjectPath === '');
}

function saveProjectAs() {
  requestSave(true);
}

function getIndent(indent) {
  let result = '';
  for (let i = 0; i < indent; i++) {
    result += '\t';
  }
  return result;
}

function groupToXmlRecursive(indent, group) {
  let result = `${getIndent(indent)}<group id="${group.id}" mod="${group.mod}">\n`;
  for (let i = 0; i < group.group.length; i++) {
    result += groupToXmlRecursive(indent + 1, group.group[i]);
  }
  for (let g = 0; g < group.entry.length; g++) {
    const entry = group.entry[g];
    result += `${getIndent(indent + 1)}<entry id="${entry.id}" type="${entry.type}" color="${entry.color}" mod="${entry.mod}">\n`;
    for (let r = 0; r < entry.region.length; r++) {
      const region = entry.region[r];
      result += `${getIndent(indent + 2)}<region id="${region.id}">\n`;
      for (let p = 0; p < region.page.length; p++) {
        const page = region.page[p];
        result += `${getIndent(indent + 3)}<page index="${p}"><![CDATA[${page.text}]]></page>\n`;
      }
      result += `${getIndent(indent + 2)}</region>\n`;
    }
    result += `${getIndent(indent + 1)}</entry>\n`;
  }
  result += `${getIndent(indent)}</group>\n`;
  return result;
}

function dataToXml(data) {
  let result = '<?xml version="1.0" encoding="UTF-8" standalone="no" ?>\n\n';

  result += '<data>\n';
  result += '\t<info>\n';
  result += `\t\t<version>${data.info.version}</version>\n`;
  result += `\t\t<activeregion>${data.info.activeregion}</activeregion>\n`;
  result += `\t\t<regions>\n`;
  for (let i = 0; i < data.info.regions.length; i++) {
    result += `\t\t\t<region>${data.info.regions[i]}</region>\n`;
  }
  result += `\t\t</regions>\n`;
  result += `\t\t<name>${data.info.name}</name>\n`;
  result += '\t</info>\n';

  for (let i = 0; i < data.group.length; i++) {
    result += groupToXmlRecursive(1, data.group[i]);
  }

  result += '</data>\n';

  return result;
}

function finishSaveProject(args) {
  const saveDialogue = args[0];
  const data = args[1];
  if (saveDialogue) {
    // Save as if appropriate
    const dialog = require('electron').dialog;
    const paths = dialog.showSaveDialog({
      title: "Save Project As",
      filters: [{ name: "Project", extensions: ['dpr'] }],
      defaultPath: currentProjectPath,
    });
    if (paths === undefined) {
      // No path to save
      return;
    }
    currentProjectPath = "";
    for (let i = 0; i < paths.length; i++) {
      currentProjectPath += paths[i];
    }
  }

  const fs = require('fs');
  fs.writeFile(currentProjectPath, dataToXml(data), callback=(err) => {
    console.log(`Saved Project to: ${currentProjectPath}`);
  });
}

function treeContextMenu() {
  const menu = new Menu();

  menu.append(new MenuItem({
    label: "New Group",
    click: () => {
      mainWindow.webContents.send('context-tree-new-group');
    }
  }));
  menu.append(new MenuItem({
    label: "New Entry",
    click: () => {
      mainWindow.webContents.send('context-tree-new-entry');
    }
  }));
  menu.append(new MenuItem({
    label: "Duplicate Id",
    click: () => {
      mainWindow.webContents.send('context-tree-duplicate-id');
    }
  }));
  menu.append(new MenuItem({
    type: "separator",
  }));
  menu.append(new MenuItem({
    label: "Rename",
    click: () => {
      mainWindow.webContents.send('context-tree-rename');
    }
  }));
  menu.append(new MenuItem({
    type: "separator",
  }));
  menu.append(new MenuItem({
    label: "Delete",
    click: () => {
      mainWindow.webContents.send('context-tree-delete');
    }
  }));

  menu.popup({});
}

function generateMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: "New Project",
        },
        {
          label: "Open Project",
          accelerator: "CmdOrCtrl+O",
          click: openProject,
        },
        {
          label: "Save Project",
          accelerator: "CmdOrCtrl+S",
          click: saveProject,
        },
        {
          label: "Save Project As",
          click: saveProjectAs,
        },
        {
          type: 'separator',
        },
        {
          label: 'Import XML',
        },
        {
          label: 'Export XML',
        },
        { type: 'separator' },
        { role: 'about' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      role: 'help',
      submenu: [
        {
          click() {
            require('electron').shell.openExternal(
              'https://getstream.io/winds',
            );
          },
          label: 'Learn More',
        },
        {
          click() {
            require('electron').shell.openExternal(
              'https://github.com/GetStream/Winds/issues',
            );
          },
          label: 'File Issue on GitHub',
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

app.on('ready', () => {
  createWindow();
  generateMenu();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

ipcMain.on('load-page', (event, arg) => {
  mainWindow.loadURL(arg);
});

ipcMain.on('open-context-right-click', (event, arg) => {
  treeContextMenu();
});

ipcMain.on('receive-project-export', (event, arg) => {
  finishSaveProject(arg);
});
