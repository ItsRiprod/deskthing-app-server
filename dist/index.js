"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeskThing = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DeskThing {
    constructor() {
        this.Listeners = {};
        this.manifest = null;
        this.toServer = null;
        this.SysEvents = null;
        this.sysListeners = [];
        this.data = {};
        this.settings = {};
        this.backgroundTasks = [];
        this.isDataBeingFetched = false;
        this.stopRequested = false;
        this.loadManifest();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new DeskThing();
        }
        return this.instance;
    }
    initializeData() {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield this.getData();
            if (data) {
                this.data = data;
                if (this.data.settings) {
                    this.settings = this.data.settings;
                }
            }
            else {
                if (this.data) {
                    this.sendData('set', this.data);
                }
            }
        });
    }
    notifyListeners(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const callbacks = this.Listeners[event];
            if (callbacks) {
                callbacks.forEach(callback => callback(...args));
            }
        });
    }
    on(event, callback) {
        if (!this.Listeners[event]) {
            this.Listeners[event] = [];
        }
        this.Listeners[event].push(callback);
        return () => this.off(event, callback);
    }
    off(event, callback) {
        if (!this.Listeners[event]) {
            return;
        }
        this.Listeners[event] = this.Listeners[event].filter(cb => cb !== callback);
    }
    onSystem(event, listener) {
        if (this.SysEvents) {
            const removeListener = this.SysEvents(event, listener);
            this.sysListeners.push(removeListener);
            return () => {
                const index = this.sysListeners.indexOf(removeListener);
                if (index !== -1) {
                    this.sysListeners[index](); // Call the removal function
                    this.sysListeners.splice(index, 1); // Remove it from the array
                }
            };
        }
        return () => { }; // Return a no-op function if SysEvents is not defined
    }
    once(event, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (callback) {
                const onceWrapper = (...args) => {
                    this.off(event, onceWrapper);
                    callback(...args);
                };
                this.on(event, onceWrapper);
            }
            else {
                return new Promise((resolve) => {
                    const onceWrapper = (...args) => {
                        this.off(event, onceWrapper);
                        resolve(args.length === 1 ? args[0] : args);
                    };
                    this.on(event, onceWrapper);
                });
            }
        });
    }
    sendData(event, ...data) {
        if (this.toServer == null) {
            console.error('toServer is not defined');
            return;
        }
        this.toServer(event, data);
    }
    requestData(event, scopes) {
        const authScopes = scopes || {};
        this.sendData('get', event, authScopes);
    }
    send(event, ...args) {
        this.sendData(event, args);
    }
    sendMessage(message) {
        this.send('message', message);
    }
    sendLog(message) {
        this.send('log', message);
    }
    sendError(message) {
        this.send('error', message);
    }
    sendDataToOtherApp(appId, data) {
        this.send('toApp', { appId, data });
    }
    sendDataToClient(data) {
        this.send('data', data);
    }
    openUrl(url) {
        this.send('open', url);
    }
    getData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data) {
                if (this.isDataBeingFetched) {
                    return null; // Or consider queuing the request
                }
                this.isDataBeingFetched = true;
                this.requestData('data');
                try {
                    const data = yield Promise.race([
                        this.once('data'),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Data retrieval timed out')), 5000)) // Adjust timeout as needed
                    ]);
                    if (data) {
                        this.isDataBeingFetched = false;
                        return data;
                    }
                    else {
                        this.sendError('Data is not defined! Try restarting the app');
                        this.isDataBeingFetched = false;
                        return null;
                    }
                }
                catch (error) {
                    this.sendLog(`Error fetching data: ${error}`);
                    this.isDataBeingFetched = false;
                    return null;
                }
            }
            else {
                return this.data;
            }
        });
    }
    getConfig(name) {
        this.requestData('config', name);
    }
    getSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.settings) {
                console.error('Settings are not defined!');
                const data = yield this.getData();
                if (data && data.settings) {
                    return data.settings;
                }
                else {
                    this.sendLog('Settings are not defined!');
                    return null;
                }
            }
            else {
                return this.settings;
            }
        });
    }
    getUserInput(scopes, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!scopes) {
                this.sendError('Scopes not defined in getUserInput!');
                return;
            }
            try {
                // Wait for the 'input' event and pass the response to the callback
                const response = yield this.once('input');
                if (callback && typeof callback === 'function') {
                    callback(response);
                }
            }
            catch (error) {
                this.sendError(`Error occurred while waiting for input: ${error}`);
            }
        });
    }
    addSetting(id, label, defaultValue, options) {
        if (this.settings[id]) {
            console.warn(`Setting with label "${label}" already exists. It will be overwritten.`);
            this.sendLog(`Setting with label "${label}" already exists. It will be overwritten.`);
        }
        const setting = {
            value: defaultValue,
            label,
            options
        };
        this.settings[id] = setting;
        this.sendData('add', { settings: this.settings });
    }
    registerAction(name, id, description, flair = '') {
        this.sendData('action', 'add', { name, id, description, flair });
    }
    registerKey(id) {
        this.sendData('button', 'add', { id });
    }
    removeAction(id) {
        this.sendData('action', 'remove', { id });
    }
    removeKey(id) {
        this.sendData('button', 'remove', { id });
    }
    saveData(data) {
        this.data = Object.assign(Object.assign({}, this.data), data);
        if (data.settings) {
            this.settings = Object.assign(Object.assign({}, this.settings), data.settings);
        }
        this.sendData('add', this.data);
        this.notifyListeners('data', this.data);
    }
    addBackgroundTaskKLoop(task) {
        const cancelToken = { cancelled: false };
        const wrappedTask = () => __awaiter(this, void 0, void 0, function* () {
            while (!cancelToken.cancelled) {
                yield task();
            }
        });
        this.backgroundTasks.push(() => {
            cancelToken.cancelled = true;
        });
        wrappedTask(); // Start the task immediately
        return () => {
            cancelToken.cancelled = true;
        };
    }
    /**
     * Deskthing Server Functions
     */
    loadManifest() {
        const manifestPath = path.resolve(__dirname, './manifest.json');
        try {
            const manifestData = fs.readFileSync(manifestPath, 'utf-8');
            this.manifest = JSON.parse(manifestData);
        }
        catch (error) {
            console.error('Failed to load manifest:', error);
        }
    }
    getManifest() {
        if (!this.manifest) {
            console.log('Manifest Not Found - trying to load manually...');
            this.loadManifest();
            if (!this.manifest) {
                return {
                    data: { message: 'Manifest not found or failed to load after 2nd attempt' },
                    status: 500,
                    statusText: 'Internal Server Error',
                    request: []
                };
            }
            else {
                console.log('Manifest loaded!');
            }
        }
        return {
            data: this.manifest,
            status: 200,
            statusText: 'OK',
            request: []
        };
    }
    start(_a) {
        return __awaiter(this, arguments, void 0, function* ({ toServer, SysEvents }) {
            this.toServer = toServer;
            this.SysEvents = SysEvents;
            yield this.initializeData();
            try {
                yield this.notifyListeners('start');
            }
            catch (error) {
                console.error('Error in start:', error);
                return {
                    data: { message: `Error in start: ${error}` },
                    status: 500,
                    statusText: 'Internal Server Error',
                    request: []
                };
            }
            return {
                data: { message: 'App started successfully!' },
                status: 200,
                statusText: 'OK',
                request: []
            };
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Notify listeners of the stop event
                yield this.notifyListeners('stop');
                // Set flag to indicate stop request
                this.stopRequested = true;
                // Stop all background tasks
                this.backgroundTasks.forEach(cancel => cancel());
                this.sendLog('Background tasks stopped');
                // Clear cached data
                this.clearCache();
                this.sendLog('Cache cleared');
            }
            catch (error) {
                console.error('Error in stop:', error);
                return {
                    data: { message: `Error in stop: ${error}` },
                    status: 500,
                    statusText: 'Internal Server Error',
                    request: []
                };
            }
            return {
                data: { message: 'App stopped successfully!' },
                status: 200,
                statusText: 'OK',
                request: []
            };
        });
    }
    // Method to clear cached data
    clearCache() {
        this.data = {};
        this.settings = {};
        this.Listeners = {};
        this.manifest = null;
        this.SysEvents = null;
        this.stopRequested = false;
        this.backgroundTasks = [];
        this.sysListeners.forEach(removeListener => removeListener());
        this.sysListeners = [];
        this.sendLog('Cache cleared');
        this.toServer = null;
    }
    toClient(channel, ...args) {
        if (channel === 'data' && args.length > 0) {
            const [data] = args; // Extract the first argument as data
            if (typeof data === 'object' && data !== null) {
                this.saveData(data);
            }
            else {
                console.warn('Received invalid data from server:', data);
                this.sendLog('Received invalid data from server:' + data);
            }
        }
        else if (channel === 'message') {
            this.sendLog('Received message from server:' + args[0]);
        }
        else if (channel === 'set' && args[0] == 'settings' && args[1]) {
            const { id, value } = args[1];
            if (this.settings[id]) {
                this.sendLog(`Setting with label "${id}" changing from ${this.settings[id].value} to ${value}`);
                this.settings[id].value = value;
                this.sendData('add', { settings: this.settings });
                this.notifyListeners('data', this.data);
            }
            else {
                this.sendLog(`Setting with label "${id}" not found`);
            }
        }
        else {
            this.notifyListeners(channel, ...args);
        }
    }
}
exports.DeskThing = DeskThing;
exports.default = DeskThing.getInstance();
