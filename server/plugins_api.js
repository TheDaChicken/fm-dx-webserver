// plugins_api.js
// Shared API for server plugins:
// - Provides privileged/admin command access
// - Exposes server-side hooks for inter-plugin communication
// - Optionally broadcasts events to connected plugin WebSocket clients

const { EventEmitter } = require('events');
const { logInfo, logWarn, logError } = require('./console');

let server_ctx = null;
let output = null;
let ctx = null;

function registerServerContext(server_ctx /* FIXME: Fart */) {
    ctx = {
        server: server_ctx,
        events: new EventEmitter(),
    }

    // prevent possible memory leak warnings
    ctx.events.setMaxListeners(50);
}

function setOutput(newSerial) {
    output = newSerial;
}

function clearOutput() {
    output = null;
}

function getWss() {
    return ctx.server.wss;
}

function getPluginsWss() {
    return ctx.server.pluginsWss;
}

function getHttpServer() {
    return ctx.server.httpServer;
}

function getServerConfig() {
    return ctx.server.serverConfig;
}

function emitPluginEvent(event, payload, opts = {}) {
    ctx.events.emit(event, payload);
}

function onPluginEvent(event, handler) {
    ctx.events.on(event, handler);
}

function offPluginEvent(event, handler) {
    ctx.events.off(event, handler);
}

function emitSerialLine(serial_line) {
    ctx.events.emit("xdrd:line", serial_line);
}

function emitSerialOpen() {
    ctx.events.emit("xdrd:status", {state: "open"});
}

function emitSerialClosed() {
    ctx.events.emit("xdrd:status", {state: "closed"});
}

// ---- TEF serial commands ----

async function sendPrivilegedCommand(command) {

    return false;
}

module.exports = {
    // server registration
    registerServerContext,
    setOutput,
    clearOutput,

    // server context access
    getWss,
    getPluginsWss,
    getHttpServer,
    getServerConfig,

    // privileged control
    sendPrivilegedCommand,

    // inter-plugin hooks
    emitPluginEvent,
    onPluginEvent,
    offPluginEvent,

    emitSerialLine,
    emitSerialClosed,
    emitSerialOpen
};
