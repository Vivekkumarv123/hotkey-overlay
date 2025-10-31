// main.js - Electron Main Process
const { app, BrowserWindow, globalShortcut, shell, Tray, Menu, screen } = require("electron");

let isDev;
let path;
import("path").then(mod => {
  path = mod.default;
});
import("electron-is-dev").then(mod => {
  isDev = mod.default;
});

let overlayWindow;
let browserWindow;
let tray;

// Function to create and configure the main overlay window
function createOverlayWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: (width - 800) / 2,
    y: (height - 600) / 2,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    resizable: true,
    movable: true,
    show: false, // Start the window hidden

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,           // ✅ must be true
      sandbox: true
    },
  });

  // By default, the window ignores mouse events and forwards them to windows underneath.
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  if (isDev) {
    overlayWindow.loadURL("http://localhost:5173");
  } else {
    overlayWindow.loadFile(path.join(__dirname, "overlay-ui/dist/index.html"));
  }
}

// Function to create and configure a dedicated browser window
function createBrowserWindow() {
  if (browserWindow) {
    return; // Don't create a new window if one already exists
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  browserWindow = new BrowserWindow({
    width: 800,
    height: 600,
    x: (width - 800) / 2,
    y: (height - 600) / 2,
    alwaysOnTop: true,
    frame: false,
    skipTaskbar: true,
    movable: true,
    show: false, // Start hidden

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      webviewTag: true,
    },
  });

  // Initially set to ignore mouse events so it acts as an overlay
  browserWindow.setIgnoreMouseEvents(true, { forward: true });
  if (isDev) {
    browserWindow.loadURL("http://localhost:5173");  // your Vite dev server URL
  } else {
    browserWindow.loadFile(path.join(__dirname, "dist/index.html")); // built React app location
  }



  browserWindow.on('closed', () => {
    browserWindow = null; // Reset the window reference when it's closed
  });
}

// Function to set up the global keyboard shortcuts
function registerHotkeys() {
  // Use CommandOrControl for cross-platform support (Ctrl on Windows/Linux, Cmd on macOS)

  // Ctrl+Alt+H to toggle the overlay visibility and interactivity
  const toggleOverlayRegistered = globalShortcut.register("CommandOrControl+Alt+H", () => {
    console.log("Ctrl+Alt+H was pressed. Toggling overlay.");
    if (overlayWindow.isVisible()) {
      // If the window is visible, hide it and reset it to be non-interactive
      overlayWindow.hide();
      overlayWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      // If the window is hidden, show it and make it interactive
      overlayWindow.show();
      overlayWindow.setIgnoreMouseEvents(false);
    }
  });

  if (!toggleOverlayRegistered) {
    console.error("Failed to register Ctrl+Alt+H shortcut.");
  }

  // Ctrl+Alt+G to toggle the dedicated browser window
  const toggleBrowserRegistered = globalShortcut.register("CommandOrControl+Alt+G", () => {
    console.log("Ctrl+Alt+G was pressed. Toggling browser window.");
    if (!browserWindow) {
      createBrowserWindow();
      // Wait for the window to be ready to show before showing it
      browserWindow.once('ready-to-show', () => {
        browserWindow.show();
        browserWindow.setIgnoreMouseEvents(false);
      });
    } else if (browserWindow.isVisible()) {
      browserWindow.hide();
      // Reset interactivity when hidden
      browserWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      browserWindow.show();
      // Make it interactive when shown
      browserWindow.setIgnoreMouseEvents(false);
    }
  });

  if (!toggleBrowserRegistered) {
    console.error("Failed to register Ctrl+Alt+G shortcut.");
  }
}

// Function to set up the system tray icon and menu
function createSystemTray() {
  const iconPath = path.join(__dirname, "./assets/icon.png");

  try {
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: "Show Overlay", type: "normal", click: () => overlayWindow.show() },
      { label: "Hide Overlay", type: "normal", click: () => overlayWindow.hide() },
      { type: "separator" },
      { label: "Open Browser", type: "normal", click: () => createBrowserWindow() },
      { type: "separator" },
      { label: "Quit App", type: "normal", click: () => app.quit() },
    ]);
    tray.setToolTip("Hotkey Overlay App");
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      overlayWindow.isVisible() ? overlayWindow.hide() : overlayWindow.show();
    });
  } catch (error) {
    console.error("Failed to create system tray icon:", error);
  }
}

// When the Electron app is ready, create the window and register shortcuts
app.whenReady().then(() => {
  console.log("App ready");
  createOverlayWindow();
  registerHotkeys();
  createSystemTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
