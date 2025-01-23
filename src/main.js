const { app, BrowserWindow, ipcMain, globalShortcut, Notification, Tray, Menu } = require('electron');
const remoteMain = require('@electron/remote/main');
const path = require('path');
const { loadSettings, saveSettings } = require('./settings'); 

remoteMain.initialize();

// Break type constants
const BREAK_TYPES = {
  SHORT: 'short',
  LONG: 'long'
};

let mainWindow;
let breakWindow;
let shortBreakIntervalId;
let longBreakIntervalId;
let tray;

// Default settings for break intervals and durations
let settings = loadSettings(); 
settings.useLongBreaks = settings.useLongBreaks !== undefined ? settings.useLongBreaks : true; // Default to true

// Create the main application window
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true // Enable remote module
    },
    show: false, // Start hidden
    title: 'Ultradi and Simple Settings'
  });

  remoteMain.enable(mainWindow.webContents);
  mainWindow.loadFile('src/index.html');
  console.log('Main window created');

  // Register local shortcuts for the main window
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.key.toLowerCase() === 's') {
      console.log('Skip break triggered');
      skipBreak();
      event.preventDefault();
    } else if (input.control && input.key.toLowerCase() === 'x') {
      console.log('Postpone break triggered');
      postponeBreak();
      event.preventDefault();
    } else if (input.control && input.alt && input.key.toLowerCase() === 'v') {
      console.log('Manual short break triggered');
      showBreakNotification(BREAK_TYPES.SHORT);
      setTimeout(() => createBreakWindow(BREAK_TYPES.SHORT), 10000);
      event.preventDefault();
    } else if (input.control && input.alt && input.key.toLowerCase() === 'b') {
      console.log('Manual long break triggered');
      showBreakNotification(BREAK_TYPES.LONG);
      setTimeout(() => createBreakWindow(BREAK_TYPES.LONG), 10000);
      event.preventDefault();
    }
  });

  // Hide the window instead of closing it
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Create tray icon and menu
  tray = new Tray(path.join(__dirname, 'icon.png')); // Ensure you have an icon.png in your project directory
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => mainWindow.show() },
    { label: 'Quit', click: () => {
      app.isQuiting = true;
      app.quit();
    }}
  ]);
  tray.setToolTip('Ultradi and Simple');
  tray.setContextMenu(contextMenu);

  // Show the main window when the tray icon is clicked
  tray.on('click', () => {
    mainWindow.show();
  });
}

// Create a break window based on the break type
function createBreakWindow(breakType) {
  try {
    console.log(`Creating ${breakType} break window`);

    // Create new break window first
    breakWindow = new BrowserWindow({
      width: 800,
      height: 600,
      frame: false,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      title: `${breakType.charAt(0).toUpperCase() + breakType.slice(1)} Break`
    });

    breakWindow.breakType = breakType;
    remoteMain.enable(breakWindow.webContents);
    breakWindow.loadFile('src/break.html');

    // Now safely access 'webContents'
    breakWindow.webContents.on('did-finish-load', () => {
      breakWindow.webContents.send('start-timer', settings[`${breakType}Break`].duration);
    });

    // Handle existing break window
    if (breakWindow) {
      if (breakWindow.breakType === BREAK_TYPES.LONG) {
        console.log('Long break in progress, skipping new break');
        return;
      }
      if (breakType === BREAK_TYPES.LONG) {
        console.log('Closing short break for long break');
        breakWindow.close();
        breakWindow = null;
      }
    }

    // Register global shortcuts for the break window
    globalShortcut.register('Control+S', () => {
      console.log('Skip break triggered');
      skipBreak();
    });

    globalShortcut.register('Control+X', () => {
      console.log('Postpone break triggered');
      postponeBreak();
    });

    // Unregister global shortcuts when the break window is closed
    breakWindow.on('closed', () => {
      globalShortcut.unregister('Control+S');
      globalShortcut.unregister('Control+X');
      breakWindow = null;
    });

    // Auto-close after duration
    setTimeout(() => {
      if (breakWindow) {
        breakWindow.close();
      }
    }, settings[`${breakType}Break`].duration);

  } catch (error) {
    console.error(`Failed to create ${breakType} break window:`, error);
  }
}

// Show a notification for an upcoming break
function showBreakNotification(breakType) {
  new Notification({
    title: `${breakType.charAt(0).toUpperCase() + breakType.slice(1)} Break Coming Up!`,
    body: 'Break window will appear in 10 seconds',
    silent: false
  }).show();
}

// Skip the current break
function skipBreak() {
  if (breakWindow) {
    console.log(`Skipping ${breakWindow.breakType} break`);
    breakWindow.close();
    breakWindow = null;
  }
}

// Postpone the current break by one minute
function postponeBreak() {
  if (breakWindow) {
    console.log(`Postponing ${breakWindow.breakType} break by one minute`);
    let bIsShortBreak = breakWindow.breakType === "short";
    breakWindow.close();
    breakWindow = null;
    setTimeout(() => {
        if (bIsShortBreak && !breakWindow) {            
                showBreakNotification(BREAK_TYPES.SHORT);
                setTimeout(() => createBreakWindow(BREAK_TYPES.SHORT), 10000);
        }
        else if (!bIsShortBreak && !breakWindow) {            
            showBreakNotification(BREAK_TYPES.LONG);
            setTimeout(() => createBreakWindow(BREAK_TYPES.LONG), 10000);
        }
    }, 50000); // 50 seconds to account for the 10 second notification
  }
}

// Set intervals for short and long breaks
function setBreakIntervals() {
  // Clear existing intervals
  if (shortBreakIntervalId) clearInterval(shortBreakIntervalId);
  if (longBreakIntervalId) clearInterval(longBreakIntervalId);

  // Set short break interval
  shortBreakIntervalId = setInterval(() => {
    if (!breakWindow) {
      showBreakNotification(BREAK_TYPES.SHORT);
      setTimeout(() => createBreakWindow(BREAK_TYPES.SHORT), 10000);
    }
  }, settings.shortBreak.interval);

  // Set long break interval
  if (settings.useLongBreaks) {
    longBreakIntervalId = setInterval(() => {
      showBreakNotification(BREAK_TYPES.LONG);
      setTimeout(() => createBreakWindow(BREAK_TYPES.LONG), 10000);
    }, settings.longBreak.interval);
  }

  console.log('Break intervals set:', settings);
}

// Update settings from the renderer process
ipcMain.on('update-settings', (event, newSettings) => {

  settings.useLongBreaks = newSettings.useLongBreaks !== undefined ? newSettings.useLongBreaks : settings.useLongBreaks;

  // Calculate intervals and durations
  let shortInterval = (newSettings.shortBreakHours * 3600000) +
                      (newSettings.shortBreakMinutes * 60000) +
                      (newSettings.shortBreakSeconds * 1000);

  let longInterval = (newSettings.longBreakHours * 3600000) +
                     (newSettings.longBreakMinutes * 60000) +
                     (newSettings.longBreakSeconds * 1000);

  let shortDuration = (newSettings.shortBreakDurationHours * 3600000) +
                      (newSettings.shortBreakDurationMinutes * 60000) +
                      (newSettings.shortBreakDurationSeconds * 1000);

  let longDuration = (newSettings.longBreakDurationHours * 3600000) +
                     (newSettings.longBreakDurationMinutes * 60000) +
                     (newSettings.longBreakDurationSeconds * 1000);

  // Apply minimum constraints
  if (shortInterval < 60000) {
    console.log('Short break interval is less than 1 minute. Setting to 1 minute.');
    shortInterval = 60000; // 1 minute
  }

  if (longInterval < 120000) {
    console.log('Long break interval is less than 2 minutes. Setting to 2 minutes.');
    longInterval = 120000; // 2 minutes
  }

  if (shortDuration < 1000) {
    console.log('Short break duration is less than 1 second. Setting to 1 second.');
    shortDuration = 1000; // 1 second 
  }
  
  if (longDuration < 1000) {
    console.log('Long break duration is less than 1 second. Setting to 1 second.');
    longDuration = 1000; // 1 second
  }

  // Update the settings object
  settings.shortBreak.interval = shortInterval;
  settings.shortBreak.duration = shortDuration;
  settings.longBreak.interval = longInterval;
  settings.longBreak.duration = longDuration;

  // Save updated settings
  saveSettings(settings);
  console.log('Settings updated:', settings);

  // Update break intervals with the new settings
  setBreakIntervals();
});

ipcMain.handle('get-settings', () => {
  return settings; // Return the current settings object
});

// Initialize the application
app.on('ready', () => {
  createMainWindow();
  setBreakIntervals();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});