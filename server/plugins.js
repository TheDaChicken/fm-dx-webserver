const fs = require('fs');
const path = require('path');
const {logError, logInfo} = require('./console');
const { serverConfig } = require('./server_config');

const pluginsDir = path.join(__dirname, '../plugins');
const webJsPluginsDir = path.join(__dirname, '../web/js/plugins');

// Ensure the web/js/plugins directory exists
if (!fs.existsSync(webJsPluginsDir)) {
    fs.mkdirSync(webJsPluginsDir, { recursive: true });
}

// Function to read all .js files in a directory
function readJSFiles(dir) {
    const files = fs.readdirSync(dir);
    return files.filter(file => file.endsWith('.js'));
}

// Function to parse plugin config from a file
function loadPluginMetadata(filePath) {
    const metadata = {};

    // Assuming pluginConfig is a JavaScript object defined in each .js file
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
    
        const pluginDir = path.dirname(filePath);
        const pluginExports = require(filePath);
        const manifest = pluginExports.pluginConfig;

        if (!manifest.frontEndFile)
            manifest.frontEndFile = manifest.frontEndPath;

        if (!manifest.backEndFile)
        {
            const pluginNameShort = manifest.frontEndFile.slice(0, -3);
            const backendFile = path.join(pluginDir, `${pluginNameShort}_server.js`);

            if (fs.existsSync(backendFile) && fs.statSync(backendFile).isFile()) {
                manifest.backEndFile = backendFile;
            }
        }

        metadata.file = path.resolve(filePath);
        metadata.name = manifest.name;
        metadata.version = manifest.version ?? "unknown";
        metadata.author = manifest.author ?? "";

        metadata.frontend = {};
        metadata.backend = {};

        metadata.frontend.file = manifest.frontEndFile;
        if (metadata.frontend.file)
        {
            metadata.frontend.path = path.resolve(
                pluginsDir,
                metadata.frontend.file
            );
        }

        metadata.backend.file = manifest.backEndFile;
        if (metadata.backend.file)
        {
            metadata.backend.path = path.resolve(
                pluginsDir,
                metadata.backend.file
            );
        }
    } catch (err) {
        logError(`Error parsing plugin config from ${filePath}: ${err.message}`);
        return null;
    }

    return metadata;
}

function loadPlugin(metadata) {
    if (metadata.backend.path) {
        require(metadata.backend.path);
        logInfo(`Plugin Backend ${metadata.name} loaded successfully!`);
    }

    if (metadata.frontend.path)
    {
        createFrontEndLink(metadata.frontend);
        logInfo(`Plugin Frontend ${metadata.name} added!`);
    }
}

// Main function to create symlinks/junctions for frontend part of plugins
function createFrontEndLink(frontend) {
    const destinationDir = path.join(webJsPluginsDir, path.dirname(frontend.file));

    if (!fs.existsSync(destinationDir)) {
        fs.mkdirSync(destinationDir, { recursive: true }); // Create directory recursively
    }

    const destinationFile = path.join(destinationDir, path.basename(frontend.file));

    try {
        if (fs.lstatSync(destinationFile)) {
            fs.rmSync(destinationFile); // Remove existing file/symlink
        }
        fs.symlinkSync(frontend.path, destinationFile);
    } catch (err) {
        console.error(`Error creating symlink at ${destinationFile}: ${err.message}`);
    }
}

// Main function to collect plugin metadata from all .js files in the 'plugins' directory
function loadPluginsMetadata() {
    const jsFiles = readJSFiles(pluginsDir);
    const pluginsMetadata = [];

    jsFiles.forEach(file => {
        const filePath = path.join(pluginsDir, file);
        const metadata = loadPluginMetadata(filePath);
        if (metadata) {
            pluginsMetadata.push(metadata);
        }
    });

    return pluginsMetadata;
}

function resolvePluginMetadata(path) {
    let pluginMeta = null;

    pluginsMetadata.forEach(function(metadata) {
        if (metadata.frontend.file == path || metadata.file == path)
            pluginMeta = metadata;
    })

    return pluginMeta;
}

// Usage example
const pluginsMetadata = loadPluginsMetadata();
//createLinks();

module.exports = {
    pluginsMetadata,
    loadPlugin,
    resolvePluginMetadata
};
