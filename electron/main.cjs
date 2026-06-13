const { app, BrowserWindow, dialog } = require('electron');
const { fork } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 5000;
let serverProcess = null;
let mainWindow = null;

function getServerPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app', 'dist', 'index.js');
  }
  return path.join(__dirname, '..', 'dist', 'index.js');
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();
    const fs = require('fs');
    if (!fs.existsSync(serverPath)) {
      reject(new Error(`Server not found at ${serverPath}. Run 'npm run build' first.`));
      return;
    }

    serverProcess = fork(serverPath, [], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: 'pipe',
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`[server] ${data.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[server] ${data.toString().trim()}`);
    });

    serverProcess.on('error', (err) => {
      reject(err);
    });

    serverProcess.on('exit', (code) => {
      console.log(`Server process exited with code ${code}`);
      serverProcess = null;
    });

    let retries = 0;
    const maxRetries = 30;
    const check = () => {
      retries++;
      const req = http.get(`http://localhost:${PORT}`, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (retries >= maxRetries) {
          reject(new Error('Server failed to start'));
        } else {
          setTimeout(check, 500);
        }
      });
      req.setTimeout(1000, () => {
        req.destroy();
        if (retries >= maxRetries) {
          reject(new Error('Server timed out'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (err) {
    dialog.showErrorBox('Startup Error', err.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
