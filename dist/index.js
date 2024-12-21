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
exports.DeskThing = exports.DeskThingClass = exports.EventMode = exports.EventFlavor = exports.LOGGING_LEVELS = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
var LOGGING_LEVELS;
(function (LOGGING_LEVELS) {
    LOGGING_LEVELS["LOG"] = "log";
    LOGGING_LEVELS["DEBUG"] = "debug";
    LOGGING_LEVELS["WARN"] = "warn";
    LOGGING_LEVELS["ERROR"] = "error";
    LOGGING_LEVELS["FATAL"] = "fatal";
})(LOGGING_LEVELS || (exports.LOGGING_LEVELS = LOGGING_LEVELS = {}));
/**
 * @depreciated - use EventModes instead
 */
var EventFlavor;
(function (EventFlavor) {
    EventFlavor[EventFlavor["KeyUp"] = 0] = "KeyUp";
    EventFlavor[EventFlavor["KeyDown"] = 1] = "KeyDown";
    EventFlavor[EventFlavor["ScrollUp"] = 2] = "ScrollUp";
    EventFlavor[EventFlavor["ScrollDown"] = 3] = "ScrollDown";
    EventFlavor[EventFlavor["ScrollLeft"] = 4] = "ScrollLeft";
    EventFlavor[EventFlavor["ScrollRight"] = 5] = "ScrollRight";
    EventFlavor[EventFlavor["SwipeUp"] = 6] = "SwipeUp";
    EventFlavor[EventFlavor["SwipeDown"] = 7] = "SwipeDown";
    EventFlavor[EventFlavor["SwipeLeft"] = 8] = "SwipeLeft";
    EventFlavor[EventFlavor["SwipeRight"] = 9] = "SwipeRight";
    EventFlavor[EventFlavor["PressShort"] = 10] = "PressShort";
    EventFlavor[EventFlavor["PressLong"] = 11] = "PressLong";
})(EventFlavor || (exports.EventFlavor = EventFlavor = {}));
var EventMode;
(function (EventMode) {
    EventMode[EventMode["KeyUp"] = 0] = "KeyUp";
    EventMode[EventMode["KeyDown"] = 1] = "KeyDown";
    EventMode[EventMode["ScrollUp"] = 2] = "ScrollUp";
    EventMode[EventMode["ScrollDown"] = 3] = "ScrollDown";
    EventMode[EventMode["ScrollLeft"] = 4] = "ScrollLeft";
    EventMode[EventMode["ScrollRight"] = 5] = "ScrollRight";
    EventMode[EventMode["SwipeUp"] = 6] = "SwipeUp";
    EventMode[EventMode["SwipeDown"] = 7] = "SwipeDown";
    EventMode[EventMode["SwipeLeft"] = 8] = "SwipeLeft";
    EventMode[EventMode["SwipeRight"] = 9] = "SwipeRight";
    EventMode[EventMode["PressShort"] = 10] = "PressShort";
    EventMode[EventMode["PressLong"] = 11] = "PressLong";
})(EventMode || (exports.EventMode = EventMode = {}));
/**
 * The DeskThing class is the main class for the DeskThing library. This should only be used on the server side of your application
 */
class DeskThingClass {
    constructor() {
        this.Listeners = {};
        this.manifest = null;
        this.toServer = null;
        this.SysEvents = null;
        this.imageUrls = {};
        this.sysListeners = [];
        this.data = null;
        this.backgroundTasks = [];
        this.isDataBeingFetched = false;
        this.dataFetchQueue = [];
        this.stopRequested = false;
        this.loadManifest();
    }
    /**
     * Singleton pattern: Ensures only one instance of DeskThing exists.
     *
     * @since 0.8.0
     * @example
     * const deskThing = DeskThing.getInstance();
     * deskthing.on('start', () => {
     *   // Your code here
     * });
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new DeskThingClass();
        }
        return this.instance;
    }
    /**
     * Initializes data if it is not already set on the server.
     * This method is run internally when there is no data retrieved from the server.
     *
     * @since 0.8.0
     * @example
     * const deskThing = DeskThing.getInstance();
     * deskThing.start({ toServer, SysEvents });
     */
    initializeData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data) {
                if (!this.data.settings) {
                    this.data.settings = {};
                }
                this.sendData("set", this.data);
            }
            else {
                this.data = {
                    settings: {},
                };
                this.sendData("set", this.data);
            }
        });
    }
    /**
     * Notifies all listeners of a particular event.
     *
     * @since 0.8.0
     * @example
     * deskThing.on('message', (msg) => console.log(msg));
     * deskThing.notifyListeners('message', 'Hello, World!');
     */
    notifyListeners(event, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const callbacks = this.Listeners[event];
            if (callbacks) {
                callbacks.forEach((callback) => callback(...args));
            }
        });
    }
    /**
     * Registers an event listener for a specific incoming event. Events are either the "type" value of the incoming SocketData object or a special event like "start", "stop", or "data".
     *
     * @since 0.8.0
     * @param event - The event type to listen for.
     * @param callback - The function to call when the event occurs.
     * @returns A function to remove the listener.
     *
     * @example
     * const removeListener = deskThing.on('data', (data) => console.log(data));
     * removeListener(); // To remove the listener
     *
     * @example
     * const removeListener = deskThing.on('start', () => console.log('App is starting));
     * removeListener(); // To remove the listener
     *
     * @example
     * // When {type: 'get'} is received from the server
     * const removeListener = deskThing.on('get', (socketData) => console.log(socketData.payload));
     * removeListener(); // To remove the listener
     *
     * @example
     * // When a setting is updated. Passes the updated settings object
     * const removeListener = deskThing.on('settings', (settings) => console.log(settings.some_setting.value));
     * removeListener(); // To remove the listener
     *
     * @example
     * // Listening to data from the client
     * // server
     * deskThing.on('set', async (socketData) => {
     *    if (socketData.request === 'loremIpsum') {
     *      handleData(socketData.payload);
     *    }
     * })
     *
     * // client
     * deskThing.send({ type: 'set', request: 'loremIpsum', payload: 'lorem ipsum' });
     *
     * @example
     * // Listening to data from the client
     * // server
     * deskThing.on('doSomething', async (socketData) => {
     *    doSomething()
     * })
     *
     * // client
     * deskThing.send({ type: 'doSomething' });
     */
    on(event, callback) {
        if (!this.Listeners[event]) {
            this.Listeners[event] = [];
        }
        this.Listeners[event].push(callback);
        return () => this.off(event, callback);
    }
    /**
     * Removes a specific event listener for a particular incoming event.
     *
     * @since 0.8.0
     * @param event - The event for which to remove the listener.
     * @param callback - The listener function to remove.
     *
     * @example
     * const dataListener = () => console.log('Data received');
     * deskthing.on('data', dataListener);
     * deskthing.off('data', dataListener);
     */
    off(event, callback) {
        if (!this.Listeners[event]) {
            return;
        }
        this.Listeners[event] = this.Listeners[event].filter((cb) => cb !== callback);
    }
    /**
     * Registers a system event listener. This feature is somewhat limited but allows for detecting when there are new audiosources or button mappings registered to the server.
     * Eg 'config' is emitted when the server has new button mappings or audio sources registered.
     *
     * @since 0.8.0
     * @param event - The system event to listen for.
     * @param listener - The function to call when the event occurs.
     * @deprecated - Just dont use this lol. Its outdated
     * @returns A function to remove the listener.
     *
     * @example
     * const removeSysListener = deskThing.onSystem('config', (config) => console.log('Config changed', config));
     * removeSysListener(); // To remove the system event listener
     */
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
    /**
     * Registers a one-time listener for an incoming event. The listener will be automatically removed after the first occurrence of the event.
     *
     * @since 0.8.0
     * @param event - The event to listen for. This is either the 'type' field of SocketData or special cases like 'get' or 'start'
     * @param callback - Optional callback function. If omitted, returns a promise.
     * @returns A promise that resolves with the event data if no callback is provided.
     *
     * @example
     * deskThing.once('data').then(data => console.log('Received data:', data));
     * @example
     * const flagType = await deskThing.once('flagType');
     * console.log('Flag type:', flagType);
     * @example
     * await deskThing.once('flagType', someFunction);
     */
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
    /**
     * Sends data to the server with a specified event type.
     *
     * @since 0.8.0
     * @param event - The event type to send.
     * @param payload - The data to send.
     * @param request - Optional request string.
     *
     * @example
     * deskThing.sendData('log', { message: 'Logging an event' });
     */
    sendData(event, payload, request) {
        if (this.toServer == null) {
            console.error("toServer is not defined");
            return;
        }
        const outgoingData = {
            type: event,
            request: request || "",
            payload: payload,
        };
        this.toServer(outgoingData);
    }
    /**
     * Requests data from the server with optional scopes.
     *
     * @since 0.8.0
     * @param request - The type of data to request ('data', 'config', or 'input').
     * @param scopes - Optional scopes to request specific data.
     *
     * @example
     * deskThing.requestData('data');
     *
     * @example
     * const scopes: AuthScopes = {
     *    user_input: {
     *         value: "",
     *         label: "Placeholder User Data",
     *         instructions:
     *           'You can make the instructions whatever you want. You can also include HTML inline styling like <a href="https://deskthing.app/" target="_blank" style="color: lightblue;">Making Clickable Links</a>.',
     *     },
     * }
     * deskThing.requestData('data');
     */
    requestData(request, scopes) {
        const authScopes = scopes || {};
        this.sendData("get", authScopes, request);
    }
    /**
     * Sends data to the client for the client to listen to
     *
     * @since 0.10.0
     * @param payload - { type: string, payload: any, request?: string }
     *
     * @example
     * // Server
     * deskThing.send({ type: 'message', payload: 'Hello from the Server!' });
     *
     * // Client
     * deskThing.on('message', (data: SocketData) => {
     *   console.log('Received message:', data.payload); // prints 'Hello from the Server!'
     * });
     * @example
     * // Server
     * deskThing.send({ type: 'someFancyData', payload: someDataObject });
     *
     * // Client
     * deskThing.on('someFancyData', (data: SocketData) => {
     *   const someData = data.payload;
     * });
     *
     * @example
     * // Server
     * deskThing.send({type: 'songData', payload: musicData });
     *
     * // Client
     * deskThing.once('songData', (data: SocketData) => {
     *   const musicData = data.payload as SongData;
     * });
     */
    send(payload) {
        this.sendData("data", payload);
    }
    /**
     * Sends a plain text message to the server. This will display as a gray notification on the DeskThingServer GUI
     *
     * @since 0.8.0
     * @param message - The message to send to the server.
     * @deprecated - Use sendLog or sendWarning instead
     * @example
     * deskThing.sendMessage('Hello, Server!');
     */
    sendMessage(message) {
        this.sendData("message", message);
    }
    /**
     * Sends a log message to the server. This will be saved to the .logs file and be saved in the Logs on the DeskThingServer GUI
     *
     * @param log - The log message to send.
     * @since 0.8.0
     * @example
     * deskThing.sendLog('[spotify] Fetching data...');
     */
    sendLog(log) {
        this.sendData(LOGGING_LEVELS.LOG, log);
    }
    /**
     * Sends a warning to the server. This will be saved to the .logs file and be saved in the Logs on the DeskThingServer GUI
     *
     * @param warning - The warning message to send.
     * @since 0.9.3
     * @example
     * deskThing.sendWarning('[spotify] Ensure the API keys are set!');
     */
    sendWarning(warning) {
        this.sendData(LOGGING_LEVELS.WARN, warning);
    }
    /**
     * Sends an error message to the server. This will show up as a red notification
     *
     * @param message - The error message to send.
     * @since 0.8.0
     * @example
     * deskThing.sendError('An error occurred!');
     */
    sendError(message) {
        this.sendData(LOGGING_LEVELS.ERROR, message);
    }
    /**
     * Sends a fatal error message to the server. This will show up as a critical red notification
     *
     * @param message - The fatal error message to send.
     * @since 0.9.3
     * @example
     * deskThing.sendFatal('Critical system failure!');
     */
    sendFatal(message) {
        this.sendData(LOGGING_LEVELS.FATAL, message);
    }
    /**
     * Sends a debug message to the server. This will be saved to the .logs file and only visible in debug mode
     *
     * @param message - The debug message to send.
     * @since 0.9.3
     * @example
     * deskThing.sendDebug('[spotify] Debug info: ' + debugData);
     */
    sendDebug(message) {
        this.sendData(LOGGING_LEVELS.DEBUG, message);
    }
    /**
     * Routes request to another app running on the server.
     * Ensure that the app you are requesting data from is in your dependency array!
     *
     * @param appId - The ID of the target app.
     * @param data - The data to send to the target app.
     * @since 0.8.0
     * @example
     * deskThing.sendDataToOtherApp('utility', { type: 'set', request: 'next', payload: { id: '' } });
     * @example
     * deskThing.sendDataToOtherApp('spotify', { type: 'get', request: 'music' });
     */
    sendDataToOtherApp(appId, payload) {
        this.sendData("toApp", payload, appId);
    }
    /**
     * Sends structured data to the client through the server. This will be received by the webapp client. The "app" field defaults to the current app.
     *
     * @param data - The structured data to send to the client, including app, type, request, and data.
     *
     * @deprecated - Use DeskThing.send({ }) instead!
     *
     * @example
     * deskThing.sendDataToClient({
     *   app: 'client',
     *   type: 'set',
     *   request: 'next',
     *   data: { key: 'value' }
     * });
     * @example
     * deskThing.sendDataToClient({
     *   type: 'songData',
     *   data: songData
     * });
     * @example
     * deskThing.sendDataToClient({
     *   type: 'callStatus',
     *   data: callData
     * });
     */
    sendDataToClient(data) {
        this.send(data);
    }
    /**
     * Requests the server to open a specified URL.
     *
     * @param url - The URL to open.
     *
     * @example
     * deskThing.openUrl('https://example.com');
     */
    openUrl(url) {
        this.sendData("open", url);
    }
    /**
     * Fetches data from the server if not already retrieved, otherwise returns the cached data.
     * This method also handles queuing requests while data is being fetched.
     *
     * @returns A promise that resolves with the data fetched or the cached data, or null if data is not available.
     *
     * @example
     * const data = await deskThing.getData();
     * console.log('Fetched data:', data);
     */
    getData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.data) {
                if (this.isDataBeingFetched) {
                    console.warn("Data is already being fetched!!");
                    return new Promise((resolve) => {
                        this.dataFetchQueue.push(resolve);
                    });
                }
                this.isDataBeingFetched = true;
                this.requestData("data");
                try {
                    const data = yield Promise.race([
                        this.once("data"),
                        new Promise((resolve) => setTimeout(() => resolve(null), 5000)), // Adjust timeout as needed
                    ]);
                    this.isDataBeingFetched = false;
                    if (data) {
                        this.dataFetchQueue.forEach((resolve) => resolve(data));
                        this.dataFetchQueue = [];
                        return data;
                    }
                    else {
                        if (this.data) {
                            this.sendLog("Failed to fetch data, but data was found");
                            this.dataFetchQueue.forEach((resolve) => resolve(this.data));
                            this.dataFetchQueue = [];
                            return this.data;
                        }
                        else {
                            this.dataFetchQueue.forEach((resolve) => resolve(null));
                            this.dataFetchQueue = [];
                            this.sendError("Data is not defined! Try restarting the app");
                            return null;
                        }
                    }
                }
                catch (error) {
                    this.sendLog(`Error fetching data: ${error}`);
                    this.isDataBeingFetched = false;
                    this.dataFetchQueue.forEach((resolve) => resolve(this.data));
                    this.dataFetchQueue = [];
                    return this.data;
                }
            }
            else {
                //console.log('Returning ', this.data)
                return this.data;
            }
        });
    }
    /**
     * Requests a specific configuration from the server by name.
     *
     * @param name - The name of the configuration to request.
     * @returns A promise that resolves with the requested configuration or null if not found.
     *
     * @example
     * deskThing.getConfig('myConfig');
     * @example
     * const someValue = await deskThing.getConfig('superSpecificConfig');
     * console.log('Some value:', someValue);
     */
    getConfig(name) {
        return __awaiter(this, void 0, void 0, function* () {
            // Request config data from the server
            this.requestData("config", name);
            // Race between the data being received and a timeout
            return yield Promise.race([
                this.once("config"),
                new Promise((resolve) => setTimeout(() => {
                    resolve(null);
                    this.sendLog(`Failed to fetch config: ${name}`);
                }, 5000)),
            ]);
        });
    }
    /**
     * Asynchronously retrieves the current settings. If settings are not defined, it fetches them from the server.
     *
     * @returns The current settings or undefined if not set.
     *
     * @example
     * const settings = deskThing.getSettings();
     * console.log('Current settings:', settings);
     */
    getSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.settings)) {
                console.error("Settings are not defined!");
                const data = yield this.getData();
                if (data && data.settings) {
                    return data.settings;
                }
                else {
                    this.sendLog("Settings are not defined!");
                    return null;
                }
            }
            else {
                return this.data.settings;
            }
        });
    }
    /**
     * Requests user input for the specified scopes and triggers the provided callback with the input response.
     * Commonly used for settings keys, secrets, and other user-specific data. Callback data will be a json object with keys matching the scope ids and values of the answers.
     *
     * @param scopes - The scopes to request input for, defining the type and details of the input needed.
     * @param callback - The function to call with the input response once received.
     * @deprecated This will be removed in future release and replaced with tasks.
     * @example
     * deskThing.getUserInput(
     *   {
     *     username: { instructions: 'Enter your username', label: 'Username' },
     *     password: { instructions: 'Enter your password', label: 'Password' },
     *     status: { instructions: 'Enter status', label: 'Status', value: 'active' }
     *   },
     *   (response) => console.log('User input received:', response.username, response.password, response.status)
     * );
     */
    getUserInput(scopes, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!scopes) {
                this.sendError("Scopes not defined in getUserInput!");
                return;
            }
            // Send the request to the server
            this.requestData("input", scopes);
            try {
                // Wait for the 'input' event and pass the response to the callback
                const response = yield this.once("input");
                if (callback && typeof callback === "function") {
                    callback(response);
                }
            }
            catch (error) {
                this.sendError(`Error occurred while waiting for input: ${error}`);
            }
        });
    }
    /**
     * Adds a new setting or overwrites an existing one. Automatically saves the new setting to the server to be persisted.
     *
     * @param settings - An object containing the settings to add or update.
     *
     * @example
     * // Adding a boolean setting
     * deskThing.addSettings({
     *   darkMode: {
     *     type: 'boolean',
     *     label: 'Dark Mode',
     *     value: false,
     *     description: 'Enable dark mode theme'
     *   }
     * })
     * @example
     * // Adding a select setting
     * deskThing.addSettings({
     *   theme: {
     *     type: 'select',
     *     label: 'Theme',
     *     value: 'light',
     *     description: 'Choose your theme',
     *     options: [
     *       { label: 'Light', value: 'light' },
     *       { label: 'Dark', value: 'dark' },
     *       { label: 'System', value: 'system' }
     *     ]
     *   }
     * })
     * @example
     * // Adding a multiselect setting
     * deskThing.addSettings({
     *   notifications: {
     *     type: 'multiselect',
     *     label: 'Notifications',
     *     value: ['email'],
     *     description: 'Choose notification methods',
     *     options: [
     *       { label: 'Email', value: 'email' },
     *       { label: 'SMS', value: 'sms' },
     *       { label: 'Push', value: 'push' }
     *     ]
     *   }
     * })
     * @example
     * // Adding a number setting
     * deskThing.addSettings({
     *   fontSize: {
     *     type: 'number',
     *     label: 'Font Size',
     *     value: 16,
     *     description: 'Set the font size in pixels',
     *     min: 12,
     *     max: 24
     *   }
     * })
     * @example
     * // Adding a string setting
     * deskThing.addSettings({
     *   username: {
     *     type: 'string',
     *     label: 'Username',
     *     value: '',
     *     description: 'Enter your username'
     *   }
     * })
     * @example
     * // Adding a range setting
     * deskThing.addSettings({
     *   volume: {
     *     type: 'range',
     *     label: 'Volume',
     *     value: 50,
     *     description: 'Adjust the volume level',
     *     min: 0,
     *     max: 100,
     *     step: 1
     *   }
     * })
     * @example
     * // Adding an order setting
     * deskThing.addSettings({
     *   displayOrder: {
     *     type: 'order',
     *     label: 'Display Order',
     *     value: ['section1', 'section2', 'section3'],
     *     description: 'Arrange the display order of sections',
     *     options: [
     *       { label: 'Section 1', value: 'section1' },
     *       { label: 'Section 2', value: 'section2' },
     *       { label: 'Section 3', value: 'section3' }
     *     ]
     *   }
     * })
     * @example
     * // Adding a list setting
     * deskThing.addSettings({
     *   settingsList: {
     *      label: "Settings List",
     *      description: "Select multiple items from the list",
     *      type: 'list',
     *      value: ['item1', 'item2'],
     *      options: [
     *          { label: 'Item1', value: 'item1' },
     *          { label: 'Item2', value: 'item2' },
     *          { label: 'Item3', value: 'item3' },
     *          { label: 'Item4', value: 'item4' }
     *      ]
     *    }
     * })
     * @example
     * // Adding a color setting
     * deskThing.addSettings({
     *   settingsColor: {
     *      label: "Settings Color",
     *      description: "Prompt the user to select a color",
     *      type: 'color',
     *      value: '#1ed760'
     *    }
     * })
     */
    addSettings(settings) {
        var _a;
        this.sendLog("Adding settings..." + settings.toString());
        if (!this.data) {
            this.data = { settings: {} };
        }
        else if (!this.data.settings) {
            this.data.settings = {};
        }
        if (!settings || typeof settings !== "object") {
            throw new Error("Settings must be a valid object");
        }
        if ((_a = this.data) === null || _a === void 0 ? void 0 : _a.settings) {
            Object.keys(settings).forEach((id) => {
                var _a;
                const setting = settings[id];
                if (!((_a = this.data) === null || _a === void 0 ? void 0 : _a.settings))
                    return;
                if (!setting.type || !setting.label) {
                    throw new Error(`Setting ${id} must have a type and label`);
                }
                if (this.data.settings[id]) {
                    console.warn(`Setting with label "${setting.label}" already exists. It will be overwritten.`);
                    this.sendLog(`Setting with label "${setting.label}" already exists. It will be overwritten.`);
                }
                switch (setting.type) {
                    case "select":
                        if (!Array.isArray(setting.options)) {
                            throw new Error(`Select setting ${id} must have options array`);
                        }
                        this.data.settings[id] = {
                            type: "select",
                            value: setting.value,
                            label: setting.label,
                            description: setting.description || "",
                            options: setting.options,
                        };
                        break;
                    case "multiselect":
                        if (!Array.isArray(setting.options)) {
                            throw new Error(`Multiselect setting ${id} must have options array`);
                        }
                        this.data.settings[id] = {
                            type: "multiselect",
                            value: setting.value,
                            label: setting.label,
                            description: setting.description || "",
                            options: setting.options,
                        };
                        break;
                    case "number":
                        if (typeof setting.min !== "number" ||
                            typeof setting.max !== "number") {
                            throw new Error(`Number setting ${id} must have min and max values`);
                        }
                        this.data.settings[id] = {
                            type: "number",
                            value: setting.value,
                            label: setting.label,
                            min: setting.min,
                            max: setting.max,
                            description: setting.description || "",
                        };
                        break;
                    case "boolean":
                        if (typeof setting.value !== "boolean") {
                            throw new Error(`Boolean setting ${id} must have a boolean value`);
                        }
                        this.data.settings[id] = {
                            type: "boolean",
                            value: setting.value,
                            description: setting.description || "",
                            label: setting.label,
                        };
                        break;
                    case "string":
                        if (typeof setting.value !== "string") {
                            throw new Error(`String setting ${id} must have a string value`);
                        }
                        this.data.settings[id] = {
                            type: "string",
                            description: setting.description || "",
                            value: setting.value,
                            label: setting.label,
                        };
                        break;
                    case "range":
                        if (typeof setting.min !== "number" ||
                            typeof setting.max !== "number") {
                            throw new Error(`Range setting ${id} must have min and max values`);
                        }
                        this.data.settings[id] = {
                            type: "range",
                            value: setting.value,
                            label: setting.label,
                            min: setting.min,
                            max: setting.max,
                            step: setting.step || 1,
                            description: setting.description || "",
                        };
                        break;
                    case "ranked":
                        if (!Array.isArray(setting.options) ||
                            !Array.isArray(setting.value)) {
                            this.sendError(`Ranked setting ${id} must have options and value arrays`);
                            throw new Error(`Ranked setting ${id} must have options and value arrays`);
                        }
                        this.data.settings[id] = {
                            type: "ranked",
                            value: setting.value,
                            label: setting.label,
                            description: setting.description || "",
                            options: setting.options,
                        };
                        break;
                    case "list":
                        if (!Array.isArray(setting.options)) {
                            throw new Error(`List setting ${id} must have an options array`);
                        }
                        this.data.settings[id] = {
                            type: "list",
                            value: setting.value,
                            label: setting.label,
                            description: setting.description || "",
                            options: setting.options || [],
                        };
                        break;
                    case "color":
                        this.data.settings[id] = {
                            type: "color",
                            value: setting.value,
                            label: setting.label,
                            description: setting.description || "",
                        };
                        break;
                    default:
                        this.sendError(`Unknown setting type: ${setting} for setting ${id}.`);
                        throw new Error(`Unknown setting type: ${setting}`);
                }
            });
            console.log("sending settings", this.data.settings);
            this.sendData("add", { settings: this.data.settings });
        }
    }
    /**
     * Registers a new action to the server. This can be mapped to any key on the deskthingserver UI.
     *
     * @param name - The name of the action.
     * @param id - The unique identifier for the action. This is what will be used when it is triggered
     * @param description - A description of the action.
     * @param flair - Optional flair for the action (default is an empty string).
     *
     * @example
     * deskthing.addAction('Print Hello', 'printHello', 'Prints Hello to the console', '')
     * deskthing.on('button', (data) => {
     *      if (data.payload.id === 'printHello') {
     *          console.log('Hello')
     *      }
     * })
     */
    registerAction(name, id, description, flair = "") {
        this.sendData("action", { name, id, description, flair }, "add");
    }
    /**
     * Registers a new action to the server. This can be mapped to any key on the deskthingserver UI.
     *
     * @param action - The action object to register.
     * @throws {Error} If the action object is invalid.
     * @example
     * const action = {
     *      name: 'Print Hello',
     *      id: 'printHello',
     *      description: 'Prints Hello to the console',
     *      flair: ''
     * }
     * deskthing.addActionObject(action)
     * deskthing.on('button', (data) => {
     *      if (data.payload.id === 'printHello') {
     *          console.log('Hello')
     *      }
     * })
     */
    registerActionObject(action) {
        if (!action || typeof action !== "object") {
            throw new Error("Invalid action object");
        }
        if (!action.id || typeof action.id !== "string") {
            throw new Error("Action must have a valid id");
        }
        this.sendData("action", action, "add");
    }
    /**
     * Updates the flair of a specified action id. This can be used to update the image of the button. Flair is appended to the end of the action name and thus the end of the SVG path as well
     * @param id action id
     * @param flair the updated flair
     * @example
     * // Previously using like.svg
     * deskthing.updateFlair('like', 'active')
     * // Now using likeactive.svg
     */
    updateIcon(id, icon) {
        this.sendData("action", { id, icon }, "update");
    }
    /**
     * Registers a new key with the specified identifier. This can be mapped to any action. Use a keycode to map a specific keybind.
     * Possible keycodes can be found at https://www.toptal.com/developers/keycode and is listening for event.code
     *
     * Keys can also be considered "digital" like buttons on the screen.
     * The first number in the key will be passed to the action (e.g. customAction13 with action SwitchView will switch to the 13th view )
     *
     * @param id - The unique identifier for the key.
     * @param description - Description for the key.
     */
    registerKey(id, description, modes, version) {
        this.sendData("button", { id, description, modes, version }, "add");
    }
    /**
     * Registers a new key with the specified identifier. This can be mapped to any action. Use a keycode to map a specific keybind.
     * Possible keycodes can be found at https://www.toptal.com/developers/keycode and is listening for event.code
     *
     * Keys can also be considered "digital" like buttons on the screen.
     * @param key - The key object to register.
     */
    registerKeyObject(key) {
        if (!key || typeof key !== "object") {
            throw new Error("Invalid key object");
        }
        if (!key.modes || !Array.isArray(key.modes) || key.modes.length === 0) {
            throw new Error("Key must have valid modes");
        }
        if (typeof key.id !== "string") {
            throw new Error("Key must have a valid id");
        }
        this.sendData("button", key, "add");
    }
    /**
     * Removes an action with the specified identifier.
     *
     * @param id - The unique identifier of the action to be removed.
     */
    removeAction(id) {
        this.sendData("action", { id }, "remove");
    }
    /**
     * Removes a key with the specified identifier.
     *
     * @param id - The unique identifier of the key to be removed.
     */
    removeKey(id) {
        this.sendData("button", { id }, "remove");
    }
    /**
     * Saves the provided data by merging it with the existing data and updating settings.
     * Sends the updated data to the server and notifies listeners.
     *
     * @param data - The data to be saved and merged with existing data.
     */
    saveData(data) {
        var _a;
        this.data = Object.assign(Object.assign(Object.assign({}, this.data), data), { settings: Object.assign(Object.assign({}, (_a = this.data) === null || _a === void 0 ? void 0 : _a.settings), data.settings) });
        this.sendData("add", this.data);
        this.notifyListeners("data", this.data);
    }
    /**
     * Adds a background task that will loop until either the task is cancelled or the task function returns false.
     * This is useful for tasks that need to run periodically or continuously in the background.
     *
     * @param task - The background task function to add. This function should return a Promise that resolves to a boolean or void.
     * @param timeout - Optional timeout in milliseconds between task iterations.
     * @returns A function to cancel the background task.
     *
     * @example
     * // Add a background task that logs a message every 5 seconds
     * const cancelTask = deskThing.addBackgroundTaskLoop(async () => {
     *   console.log('Performing periodic task...');
     *   await new Promise(resolve => setTimeout(resolve, 5000));
     *   return false; // Return false to continue the loop
     * });
     *
     * // Later, to stop the task:
     * cancelTask();
     *
     * @example
     * // Add a background task that runs until a condition is met
     * let count = 0;
     * deskThing.addBackgroundTaskLoop(async () => {
     *   console.log(`Task iteration ${++count}`);
     *   if (count >= 10) {
     *     console.log('Task completed');
     *     return true; // Return true to end the loop
     *   }
     *   return false; // Continue the loop
     * });
     *
     * @example
     * // Add a background task that runs every second
     * deskThing.addBackgroundTaskLoop(async () => {
     *   checkForUpdates();
     * }, 1000);
     */
    addBackgroundTaskLoop(task, timeout) {
        const cancelToken = { cancelled: false };
        const wrappedTask = () => __awaiter(this, void 0, void 0, function* () {
            let endToken = false;
            while (!cancelToken.cancelled && !endToken) {
                endToken = (yield task()) || false;
                if (timeout) {
                    yield new Promise((resolve) => setTimeout(resolve, timeout));
                }
            }
        });
        // Pushes the 'remove task' task to the background tasks array
        this.backgroundTasks.push(() => {
            cancelToken.cancelled = true;
        });
        wrappedTask(); // Start the task immediately
        return () => {
            cancelToken.cancelled = true;
        };
    }
    /**
    * Encodes an image from a URL and returns a Promise that resolves to a base64 encoded string.
    *
    *
    * @param url - The url that points directly to the image
    * @param type - The type of image to return (jpeg for static and gif for animated)
    * @param retries - The number of times to retry the request in case of failure. Defaults to 3.
    * @returns Promise string that has the base64 encoded image
    *
    * @example
    * // Getting encoded spotify image data
    * const encodedImage = await deskThing.encodeImageFromUrl(https://i.scdn.co/image/ab67616d0000b273bd7401ecb7477f3f6cdda060, 'jpeg')
    *
    * deskThing.send({app: 'client', type: 'song', payload: { thumbnail: encodedImage } })
    */
    encodeImageFromUrl(url_1) {
        return __awaiter(this, arguments, void 0, function* (url, type = "jpeg", retries = 3) {
            try {
                console.log(`Fetching ${type} data...`);
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const arrayBuffer = yield response.arrayBuffer();
                const bufferData = Buffer.from(arrayBuffer);
                const imgData = `data:image/${type};base64,${bufferData.toString('base64')}`;
                console.log(`Sending ${type} data`);
                return imgData;
            }
            catch (error) {
                this.sendError(`Error fetching ${type}: ${url}`);
                console.error(`Error fetching ${type}:`, error);
                if (retries > 0) {
                    this.sendWarning(`Retrying... (${retries} attempts left)`);
                    return this.encodeImageFromUrl(url, type, retries - 1);
                }
                throw error;
            }
        });
    }
    /**
     * Saves an image from a URL to a local directory and tracks the file path
     *
     * @param url - The direct URL to the image or local file path
     * @returns Promise resolving to the saved image's filename
     */
    saveImageReferenceFromURL(url, headers) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            // Validate URL
            if (!url || typeof url !== "string") {
                throw new Error("Invalid URL provided");
            }
            if (this.imageUrls[url]) {
                return this.imageUrls[url];
            }
            try {
                let imageBuffer;
                let contentType;
                // Handle local file path
                if (url.startsWith('file://') || url.startsWith('/') || url.match(/^[a-zA-Z]:\\/)) {
                    const localPath = url.startsWith('file://') ? url.slice(7) : url;
                    imageBuffer = yield fs.promises.readFile(localPath);
                    const mimeType = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 ? 'image/jpeg'
                        : imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 ? 'image/png'
                            : imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 ? 'image/gif'
                                : 'image/jpeg';
                    const type = { mime: mimeType };
                    contentType = (type === null || type === void 0 ? void 0 : type.mime) || 'image/jpeg';
                }
                else {
                    // Handle remote URL
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
                    try {
                        const response = yield fetch(url, {
                            signal: controller.signal,
                            headers: Object.assign({ "User-Agent": "Mozilla/5.0" }, headers),
                        });
                        clearTimeout(timeoutId);
                        // Check response
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        contentType = response.headers.get("content-type") || "application/octet-stream";
                        imageBuffer = Buffer.from(yield response.arrayBuffer());
                    }
                    finally {
                        clearTimeout(timeoutId);
                    }
                }
                if (!contentType.startsWith('image/')) {
                    throw new Error('Invalid content type: ' + contentType);
                }
                // Determine file extension from MIME type
                let extension = ((_a = contentType.split('/').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || "jpg";
                // Default to jpg for unknown content types
                if (extension === "unknown" || extension === "octet-stream") {
                    extension = "jpg";
                }
                // Generate unique filename
                const uniqueId = crypto.randomUUID();
                const fileName = `${uniqueId}.${extension}`;
                const imagePath = path.join(__dirname, "images", fileName);
                // Ensure images directory exists
                yield fs.promises.mkdir(path.join(__dirname, "images"), { recursive: true });
                // Write file
                yield fs.promises.writeFile(imagePath, imageBuffer);
                // Track the image URL for cleanup
                if (!this.imageUrls) {
                    this.imageUrls = {};
                }
                const relativeImagePath = path.join("images", fileName);
                this.imageUrls[url] = relativeImagePath;
                if (!this.manifest) {
                    this.loadManifest();
                }
                // Return the filename for further use
                return `http://localhost:8891/app/${((_b = this.manifest) === null || _b === void 0 ? void 0 : _b.id) || ''}/images/${fileName}`;
            }
            catch (error) {
                if (error instanceof Error) {
                    this.sendError('encodeImageFromURL: Failed to download image! ' + error.message);
                }
                else {
                    console.log('[deskthing-server] Error encoding image: ', error);
                }
                return null;
            }
        });
    }
    /**
     * -------------------------------------------------------
     * Deskthing Server Functions
     */
    /**
     * Fetches the manifest
     * @returns Manifest | null
     */
    loadManifest() {
        if (this.manifest) {
            return this.manifest;
        }
        const manifestPath = path.resolve(__dirname, "./manifest.json");
        try {
            const manifestData = fs.readFileSync(manifestPath, "utf-8");
            this.manifest = JSON.parse(manifestData);
            return this.manifest;
        }
        catch (error) {
            console.error("Failed to load manifest:", error);
        }
        return null;
    }
    /**
     * Returns the manifest in a Response structure
     * If the manifest is not found or fails to load, it returns a 500 status code.
     * It will attempt to read the manifest from file if the manifest does not exist in cache
     *
     * !! This method is not intended for use in client code.
     *
     * @example
     * const manifest = deskThing.getManifest();
     * console.log(manifest);
     */
    getManifest() {
        if (!this.manifest) {
            console.warn("Manifest Not Found - trying to load manually...");
            this.loadManifest();
            if (!this.manifest) {
                return {
                    data: {
                        message: "Manifest not found or failed to load after 2nd attempt",
                    },
                    status: 500,
                    statusText: "Internal Server Error",
                    request: [],
                };
            }
            else {
                //console.log('Manifest loaded!')
            }
        }
        return {
            data: this.manifest,
            status: 200,
            statusText: "OK",
            request: [],
        };
    }
    /**
     * @deprecated - Use DeskThing.on('start', () => {}) instead
     * @returns
     */
    start(_a) {
        return __awaiter(this, arguments, void 0, function* ({ toServer, SysEvents }) {
            this.toServer = toServer;
            this.SysEvents = SysEvents;
            this.stopRequested = false;
            try {
                yield this.notifyListeners("start");
            }
            catch (error) {
                console.error("Error in start:", error);
                return {
                    data: { message: `Error starting the app: ${error}` },
                    status: 500,
                    statusText: "Internal Server Error",
                    request: [],
                };
            }
            return {
                data: { message: "Started successfully!" },
                status: 200,
                statusText: "OK",
                request: [],
            };
        });
    }
    /**
     * @deprecated - Use DeskThing.on('stop', () => {}) instead
     * @returns
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.data) {
                    this.sendData("set", this.data);
                }
                // Notify listeners of the stop event
                yield this.notifyListeners("stop");
                // Set flag to indicate stop request
                this.stopRequested = true;
                // Stop all background tasks
                this.backgroundTasks.forEach((cancel) => cancel());
                this.backgroundTasks = [];
                this.sendLog("Background tasks stopped and removed");
            }
            catch (error) {
                console.error("Error in stop:", error);
                return {
                    data: { message: `Error in stop: ${error}` },
                    status: 500,
                    statusText: "Internal Server Error",
                    request: [],
                };
            }
            return {
                data: { message: "App stopped successfully!" },
                status: 200,
                statusText: "OK",
                request: [],
            };
        });
    }
    /**
     * @deprecated - Use DeskThing.on('purge', () => {}) instead
     * @returns
     */
    purge() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Notify listeners of the stop event
                yield this.notifyListeners("purge");
                // Set flag to indicate stop request
                this.stopRequested = true;
                // Stop all background tasks
                this.backgroundTasks.forEach((cancel) => cancel());
                this.sendLog("Background tasks stopped");
                // Clear cached data
                this.clearCache();
                this.sendLog("Cache cleared");
            }
            catch (error) {
                console.error("Error in Purge:", error);
                return {
                    data: { message: `Error in Purge: ${error}` },
                    status: 500,
                    statusText: "Internal Server Error",
                    request: [],
                };
            }
            return {
                data: { message: "App purged successfully!" },
                status: 200,
                statusText: "OK",
                request: [],
            };
        });
    }
    // Method to clear cached data
    clearCache() {
        this.data = null;
        this.Listeners = {};
        this.manifest = null;
        this.SysEvents = null;
        this.stopRequested = false;
        this.backgroundTasks = [];
        this.sysListeners.forEach((removeListener) => removeListener());
        this.sysListeners = [];
        Promise.all(Object.entries(this.imageUrls).map((_a) => __awaiter(this, [_a], void 0, function* ([url, id]) {
            try {
                const imagePath = path.join(__dirname, id);
                yield fs.promises.unlink(imagePath);
                delete this.imageUrls[url];
            }
            catch (err) {
                console.warn(`Failed to delete image ${id}:`, err);
            }
        })));
        this.sendLog("Cache cleared");
        this.toServer = null;
    }
    /**
     * @deprecated - Use DeskThing.on('data', () => {}) instead
     * @returns
     */
    toClient(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data.type === "data" && data) {
                const payload = data.payload; // Extract the first argument as data
                if (typeof payload === "object" && data !== null) {
                    this.saveData(payload);
                }
                else {
                    console.warn("Received invalid data from server:", payload);
                    this.sendLog("Received invalid data from server:" + payload);
                    this.initializeData();
                }
            }
            else if (data.type === "message") {
                this.sendLog("Received message from server:" + data.payload);
            }
            else if (data.type === "set" &&
                data.request === "settings" &&
                data.payload) {
                const { id, value } = data.payload;
                if (this.data && this.data.settings && this.data.settings[id]) {
                    this.sendLog(`Setting with label "${id}" changing from ${this.data.settings[id].value} to ${value}`);
                    this.data.settings[id].value = value;
                    this.sendData("add", { settings: this.data.settings });
                    this.notifyListeners("settings", this.data.settings);
                    this.notifyListeners("data", this.data);
                }
                else {
                    this.sendLog(`Setting with label "${id}" not found`);
                }
            }
            else {
                this.notifyListeners(data.type, data);
            }
        });
    }
}
exports.DeskThingClass = DeskThingClass;
/**
 * The main DeskThing class. Use this for all of your data and event handling.
 *
 * @example
 * import DeskThing from 'deskthing-server';
 * export { DeskThing }
 *
 * const handleStart = async () => {
 *    // Your startup code here
 * }
 *
 * DeskThing.on('start', handleStart);
 */
exports.DeskThing = DeskThingClass.getInstance();
