const { ipcRenderer } = require('electron');
const { getCurrentWindow } = require('@electron/remote');

// Log when the renderer script starts
console.log('Renderer script started');

// Get the current window and its title
const currentWindow = getCurrentWindow();
const windowTitle = currentWindow.getTitle();
console.log(`Current window title: ${windowTitle}`);

// Check if the current window is a break window or the main window
if (windowTitle.includes('Break')) {
    console.log('Break window detected');
} else {
    console.log('Main window detected');
}

// Listen for settings update from the main process
ipcRenderer.on('update-settings', (event, newSettings) => {
    console.log('Settings received from main process:', newSettings);
    settings.useLongBreaks = newSettings.useLongBreaks !== undefined ? newSettings.useLongBreaks : settings.useLongBreaks;
    // Populate the settings form with the received settings
    document.getElementById('short-break-interval-hours').value = Math.floor(newSettings.shortBreak.interval / 3600000);
    document.getElementById('short-break-interval-minutes').value = Math.floor((newSettings.shortBreak.interval % 3600000) / 60000);
    document.getElementById('short-break-interval-seconds').value = Math.floor((newSettings.shortBreak.interval % 60000) / 1000);

    document.getElementById('short-break-duration-hours').value = Math.floor(newSettings.shortBreak.duration / 3600000);
    document.getElementById('short-break-duration-minutes').value = Math.floor((newSettings.shortBreak.duration % 3600000) / 60000);
    document.getElementById('short-break-duration-seconds').value = Math.floor((newSettings.shortBreak.duration % 60000) / 1000);

    document.getElementById('long-break-interval-hours').value = Math.floor(newSettings.longBreak.interval / 3600000);
    document.getElementById('long-break-interval-minutes').value = Math.floor((newSettings.longBreak.interval % 3600000) / 60000);
    document.getElementById('long-break-interval-seconds').value = Math.floor((newSettings.longBreak.interval % 60000) / 1000);

    document.getElementById('long-break-duration-hours').value = Math.floor(newSettings.longBreak.duration / 3600000);
    document.getElementById('long-break-duration-minutes').value = Math.floor((newSettings.longBreak.duration % 3600000) / 60000);
    document.getElementById('long-break-duration-seconds').value = Math.floor((newSettings.longBreak.duration % 60000) / 1000);
});

// Handle the Save Settings button click
document.getElementById('save-settings').addEventListener('click', () => {
    const newSettings = {
        shortBreakHours: parseInt(document.getElementById('short-break-interval-hours').value) || 0,
        shortBreakMinutes: parseInt(document.getElementById('short-break-interval-minutes').value) || 0,
        shortBreakSeconds: parseInt(document.getElementById('short-break-interval-seconds').value) || 0,
        shortBreakDurationHours: parseInt(document.getElementById('short-break-duration-hours').value) || 0,
        shortBreakDurationMinutes: parseInt(document.getElementById('short-break-duration-minutes').value) || 0,
        shortBreakDurationSeconds: parseInt(document.getElementById('short-break-duration-seconds').value) || 0,
        longBreakHours: parseInt(document.getElementById('long-break-interval-hours').value) || 0,
        longBreakMinutes: parseInt(document.getElementById('long-break-interval-minutes').value) || 0,
        longBreakSeconds: parseInt(document.getElementById('long-break-interval-seconds').value) || 0,
        longBreakDurationHours: parseInt(document.getElementById('long-break-duration-hours').value) || 0,
        longBreakDurationMinutes: parseInt(document.getElementById('long-break-duration-minutes').value) || 0,
        longBreakDurationSeconds: parseInt(document.getElementById('long-break-duration-seconds').value) || 0,
    };

    console.log('Sending updated settings to main process:', newSettings);
    ipcRenderer.send('update-settings', newSettings);
});
