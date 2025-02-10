const fs = require('fs');
const path = require('path');

// Path to the config file in the project directory
const configPath = path.join(__dirname, 'config.json');

// Default settings
const defaultSettings = {
    shortBreak: {
        interval: (20 * 60000), // 20 minutes 
        duration: (20 * 1000) // 20 seconds
    },
    longBreak: {
        interval: (90 * 60000), // 90 minutes
        duration: (15 * 60000) // 15 minutes
    },
    useLongBreaks: true,
    manualBreak: {
        header: 'Add Header Here',
        body: 'Add Body Here'
    }
};

// Load settings from config.json or use defaults
function loadSettings() {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(data);
        } else {
            saveSettings(defaultSettings); // Save default settings if file doesn't exist
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        return defaultSettings; // Return defaults on error
    }
}

// Save settings to config.json
function saveSettings(settings) {
    try {
        fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf-8');
        console.log('Settings saved successfully');
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

module.exports = {
    loadSettings,
    saveSettings,
};
