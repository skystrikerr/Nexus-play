const { app, BrowserWindow, shell } = require('electron');
const https = require('https');

const APP_URL = 'https://nexusplay-r4w6.onrender.com';

let mainWindow = null;

// Splash shown while the free-tier server wakes from sleep (can take ~60s)
const SPLASH_HTML = `data:text/html;charset=utf-8,` + encodeURIComponent(`
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>NexusPlay</title>
<style>
  html, body { height: 100%; margin: 0; }
  body {
    background: #0F172A;
    color: #94A3B8;
    font-family: 'Segoe UI', sans-serif;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 18px;
  }
  .logo {
    font-size: 34px; font-weight: 800; letter-spacing: -0.5px; color: #fff;
  }
  .logo span {
    background: linear-gradient(135deg, #14B8A6, #8B5CF6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .spinner {
    width: 36px; height: 36px; border-radius: 50%;
    border: 4px solid rgba(148,163,184,0.2); border-top-color: #14B8A6;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .hint { font-size: 13px; }
</style></head>
<body>
  <div class="logo">Nexus<span>Play</span></div>
  <div class="spinner"></div>
  <div class="hint">Waking up the server… first launch can take up to a minute.</div>
</body>
</html>`);

function pingServer() {
  return new Promise((resolve) => {
    const req = https.get(APP_URL, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(maxSeconds = 120) {
  const deadline = Date.now() + maxSeconds * 1000;
  while (Date.now() < deadline) {
    if (await pingServer()) return true;
    await new Promise((r) => setTimeout(r, 2500));
  }
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 380,
    minHeight: 600,
    backgroundColor: '#0F172A',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // External links (Steam, RAWG, etc.) open in the real browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(SPLASH_HTML);

  const up = await waitForServer();
  if (!mainWindow) return;
  if (up) {
    mainWindow.loadURL(APP_URL);
  } else {
    mainWindow.loadURL(
      `data:text/html;charset=utf-8,` +
        encodeURIComponent(
          `<body style="background:#0F172A;color:#94A3B8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:#fff">Can't reach NexusPlay</h2><p>Check your internet connection, then reopen the app.</p></div></body>`
        )
    );
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
