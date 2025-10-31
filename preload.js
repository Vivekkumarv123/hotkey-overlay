// preload.js
const { contextBridge, ipcRenderer } = require("electron");

// Securely expose APIs to the renderer (React/Vite UI)
contextBridge.exposeInMainWorld("electronAPI", {
  // Listen for overlay toggle hotkey (Super+B)
  onToggleOverlay: (callback) => ipcRenderer.on("toggle-overlay", callback),

  // Listen for browser open hotkey (Super+H)
  onOpenBrowser: (callback) => ipcRenderer.on("open-browser", callback),

  // Allow renderer to send messages back if needed
  sendMessage: (channel, data) => {
    ipcRenderer.send(channel, data);
  }
});
