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
exports.DeskThing = exports.DeskThingClass = exports.EventMode = exports.EventFlavor = exports.TagTypes = exports.PlatformTypes = exports.LOGGING_LEVELS = exports.SEND_TYPES = exports.ServerEvent = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const worker_threads_1 = require("worker_threads");
/**
 * Enum representing the different types of events that can be emitted by the DeskThing class.
 * @readonly
 * @since 0.10.4
 * @enum {string}
 */
var ServerEvent;
(function (ServerEvent) {
    /**
     * @depreciated - No longer used
     * Raw message event from the server
     */
    ServerEvent["MESSAGE"] = "message";
    /**
     * Data response from getData()
     * Triggered whenever data is updated on the server
     * @remark Does not trigger when settings update. Use {@link ServerEvent.SETTINGS} instead
     * */
    ServerEvent["DATA"] = "data";
    /**
     * Response from get requests (data/config/settings)
     * Only ever triggered by clients
     *
     * Contains requested data from the server based on the get request type
     */
    ServerEvent["GET"] = "get";
    /**
     * Set requests are usually triggered by the client and not the server
     * Use the "request" property to determine the type of data being returned
     */
    ServerEvent["SET"] = "set";
    /**
     * Response data from callback functions
     * Usually from oAuth flows
     */
    ServerEvent["CALLBACK_DATA"] = "callback-data";
    /**
     * Server signals app to start
     * Triggered when the server initializes the app
     */
    ServerEvent["START"] = "start";
    /**
     * Server signals app to stop
     * Triggered when the server needs to shutdown the app
     */
    ServerEvent["STOP"] = "stop";
    /**
     * Server signals to purge app data
     * Triggered when all app data should be deleted
     */
    ServerEvent["PURGE"] = "purge";
    /**
     * User input form response data
     * Contains data submitted by users through forms
     */
    ServerEvent["INPUT"] = "input";
    /**
     * Response from user action/interaction
     * Contains data from user-triggered events or interactions
     * @param data.payload is the triggering {@link Action}. Use the action.id to determine the action
     */
    ServerEvent["ACTION"] = "action";
    /**
     * App configuration data (deprecated)
     * Legacy configuration system, use SETTINGS instead
     * @deprecated - Use {@link ServerEvent.SETTINGS} instead
     */
    ServerEvent["CONFIG"] = "config";
    /**
     * App settings data
     * Contains current application settings and preferences
     * Can sometimes be partial. So be warned.
     */
    ServerEvent["SETTINGS"] = "settings";
})(ServerEvent || (exports.ServerEvent = ServerEvent = {}));
// Events that can be sent back to the server
var SEND_TYPES;
(function (SEND_TYPES) {
    /**
     * Default handler for unknown or unspecified data types.
     * Will log a warning message about the unknown data type.
     */
    SEND_TYPES["DEFAULT"] = "default";
    /**
     * Retrieves data from the server. Supports multiple request types:
     * - 'data': Gets app-specific stored data
     * - 'config': Gets configuration (deprecated)
     * - 'settings': Gets application settings
     * - 'input': Requests user input via a form
     *
     * @remarks Use {@link DeskThing.getData}, {@link DeskThing.getConfig}, {@link DeskThing.getSettings}, or {@link DeskThing.getUserInput} instead
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.GET, { request: 'settings' })
     */
    SEND_TYPES["GET"] = "get";
    /**
     * Sets data inside the server for your app that can be retrieved with DeskThing.getData()
     * Data is stored persistently and can be retrieved later.
     *
     * @remarks Use {@link DeskThing.saveData} instead
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.SET, { payload: { key: 'value' }})
     */
    SEND_TYPES["SET"] = "set";
    /**
     * Deletes data inside the server for your app that can be retrieved with DeskThing.getData()
     *
     * @remarks Use {@link DeskThing.deleteSettings} or {@link DeskThing.deleteData} instead
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.DELETE, { payload: ['key1', 'key2'] }, "settings")
     * DeskThing.sendData(SEND_TYPES.DELETE, { payload: ['key1', 'key2'] }, "data")
     */
    SEND_TYPES["DELETE"] = "delete";
    /**
     * Opens a URL to a specific address on the server.
     * This gets around any CORS issues that may occur by opening in a new window.
     * Typically used for authentication flows.
     *
     * @remarks Use {@link DeskThing.openUrl} instead
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.OPEN, { payload: 'https://someurl.com' })
     */
    SEND_TYPES["OPEN"] = "open";
    /**
     * Sends data to the front end client.
     * Can target specific client components or send general messages.
     * Supports sending to both the main client and specific app clients.
     *
     * @remarks Use {@link DeskThing.send} instead
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.SEND, { type: 'someData', payload: 'value' })
     */
    SEND_TYPES["SEND"] = "send";
    /**
     * Sends data to another app in the system.
     * Allows inter-app communication by specifying target app and payload.
     * Messages are logged for debugging purposes.
     *
     * @remarks Use {@link DeskThing.sendDataToOtherApp} instead
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.TOAPP, { request: 'spotify', payload: { type: 'get', data: 'music' }})
     */
    SEND_TYPES["TOAPP"] = "toApp";
    /**
     * Logs messages to the system logger.
     * Supports multiple log levels: DEBUG, ERROR, FATAL, LOGGING, MESSAGE, WARNING
     * Messages are tagged with the source app name.
     *
     * @remarks Use {@link DeskThing.log} instead
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.LOG, { request: 'ERROR', payload: 'Something went wrong' })
     */
    SEND_TYPES["LOG"] = "log";
    /**
     * Manages key mappings in the system.
     * Supports operations: add, remove, trigger
     * Keys can have multiple modes and are associated with specific apps.
     *
     * @remarks Use {@link DeskThing.registerKeyObject} instead
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.KEY, { request: 'add', payload: { id: 'myKey', modes: ['default'] }})
     */
    SEND_TYPES["KEY"] = "key";
    /**
     * Manages actions in the system.
     * Supports operations: add, remove, update, run
     * Actions can have values, icons, and version information.
     *
     * @remarks
     * It is recommended to use {@link DeskThing.registerAction} instead of sending data directly.
     *
     * @example
     * DeskThing.sendData(SEND_TYPES.ACTION, { request: 'add', payload: { id: 'myAction', name: 'My Action' }})
     */
    SEND_TYPES["ACTION"] = "action";
})(SEND_TYPES || (exports.SEND_TYPES = SEND_TYPES = {}));
var LOGGING_LEVELS;
(function (LOGGING_LEVELS) {
    LOGGING_LEVELS["MESSAGE"] = "message";
    LOGGING_LEVELS["LOG"] = "log";
    LOGGING_LEVELS["WARN"] = "warning";
    LOGGING_LEVELS["ERROR"] = "error";
    LOGGING_LEVELS["DEBUG"] = "debugging";
    LOGGING_LEVELS["FATAL"] = "fatal";
})(LOGGING_LEVELS || (exports.LOGGING_LEVELS = LOGGING_LEVELS = {}));
/**
 * Different supported platforms for the app
 */
var PlatformTypes;
(function (PlatformTypes) {
    PlatformTypes["WINDOWS"] = "windows";
    PlatformTypes["LINUX"] = "linux";
    PlatformTypes["MAC"] = "mac";
    PlatformTypes["MAC64"] = "mac64";
    PlatformTypes["MACARM"] = "macarm";
    PlatformTypes["ANDROID"] = "android";
    PlatformTypes["IOS"] = "ios";
    PlatformTypes["ARM64"] = "arm64";
    PlatformTypes["X64"] = "x64";
})(PlatformTypes || (exports.PlatformTypes = PlatformTypes = {}));
/**
 * For the manifest. Different types of tags that can be used to categorize apps
 */
var TagTypes;
(function (TagTypes) {
    TagTypes["AUDIO_SOURCE"] = "audiosource";
    TagTypes["SCREEN_SAVER"] = "screensaver";
    TagTypes["UTILITY_ONLY"] = "utilityOnly";
    TagTypes["WEB_APP_ONLY"] = "webappOnly";
})(TagTypes || (exports.TagTypes = TagTypes = {}));
/**
 * @deprecated - use {@link EventMode} instead
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
        this.backgroundTasks = [];
        this.isDataBeingFetched = false;
        this.dataFetchQueue = [];
        this.stopRequested = false;
        this.data = null;
        this.settings = null;
        /**
         *
         */
        this.log = (logType, message) => __awaiter(this, void 0, void 0, function* () {
            this.sendData(SEND_TYPES.LOG, message, logType);
        });
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
     * @since 0.10.4
     * @example
     * const deskThing = DeskThing.getInstance();
     * deskThing.start({ toServer, SysEvents });
     */
    initializeData() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.data) {
                this.sendData(SEND_TYPES.SET, this.data);
            }
            else {
                this.data = {};
                this.sendData(SEND_TYPES.SET, this.data, "data");
            }
            if (this.settings) {
                this.sendData(SEND_TYPES.SET, this.settings, "settings");
            }
            else {
                this.settings = {};
                this.sendData(SEND_TYPES.SET, this.settings, "settings");
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
     * const removeListener = deskThing.on('start', () => console.log('App is starting'));
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
     * @deprecated - Just don't use this lol. It's outdated
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
            console.error("toServer is not defined"); // cant use deskthing erroring because toServer does not exist
            return;
        }
        const outgoingData = {
            type: event,
            request: request || "default",
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
        this.sendData(SEND_TYPES.GET, authScopes, request);
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
     * deskThing.on('songData', (data: SocketData) => {
     *   const musicData = data.payload as SongData;
     * });
     */
    send(payload) {
        this.sendData(SEND_TYPES.SEND, payload);
    }
    /**
     * Sends a plain text message to the server. This will display as a gray notification on the DeskThingServer GUI
     *
     * @since 0.8.0
     * @param message - The message to send to the server.
     * @deprecated - Use {@link DeskThing.sendLog} or {@link DeskThing.sendWarning} instead
     * @example
     * deskThing.sendMessage('Hello, Server!');
     */
    sendMessage(message) {
        this.log(LOGGING_LEVELS.MESSAGE, message);
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
        this.log(LOGGING_LEVELS.LOG, log);
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
        this.log(LOGGING_LEVELS.WARN, warning);
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
        this.log(LOGGING_LEVELS.ERROR, message);
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
        this.log(LOGGING_LEVELS.FATAL, message);
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
        this.log(LOGGING_LEVELS.DEBUG, message);
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
        this.sendData(SEND_TYPES.TOAPP, payload, appId);
    }
    /**
     * Sends structured data to the client through the server. This will be received by the webapp client. The "app" field defaults to the current app.
     *
     * @param data - The structured data to send to the client, including app, type, request, and data.
     *
     * @deprecated - Use {@link DeskThing.send} instead!
     *
     * @example
     * deskThing.send({
     *   app: 'client',
     *   type: 'set',
     *   request: 'next',
     *   payload: { key: 'value' }
     * });
     * @example
     * deskThing.send({
     *   type: 'songData',
     *   payload: songData
     * });
     * @example
     * deskThing.send({
     *   type: 'callStatus',
     *   payload: callData
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
        this.sendData(SEND_TYPES.OPEN, url);
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
                    this.sendWarning("Data is already being fetched!!");
                    return new Promise((resolve) => {
                        this.dataFetchQueue.push(resolve);
                    });
                }
                this.isDataBeingFetched = true;
                this.requestData("data");
                try {
                    const data = yield Promise.race([
                        this.once(ServerEvent.DATA),
                        new Promise((resolve) => setTimeout(() => resolve(null), 2000)), // Adjust timeout as needed
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
                    this.sendWarning(`Error fetching data: ${error}`);
                    this.isDataBeingFetched = false;
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
     * @deprecated Does not work anymore. Use settings instead
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
                this.once(ServerEvent.CONFIG),
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
            if (!this.settings) {
                console.error("Settings are not defined!");
                this.requestData("settings");
                const settings = yield Promise.race([
                    this.once(ServerEvent.SETTINGS),
                    new Promise((resolve) => setTimeout(() => {
                        resolve(null);
                        this.sendLog(`Failed to fetch settings`);
                    }, 2000)),
                ]);
                if (settings) {
                    this.settings = settings;
                    return settings;
                }
                else {
                    this.sendLog("Settings are not defined!");
                    return null;
                }
            }
            else {
                return this.settings;
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
                const response = yield this.once(ServerEvent.INPUT);
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
     * @remarks Use {@link DeskThing.initSettings} for the first settings call. Only use this to update settings or add them later.
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
        this.sendLog("Adding settings..." + settings.toString());
        if (!this.settings) {
            this.settings = {};
        }
        if (!settings || typeof settings !== "object") {
            throw new Error("Settings must be a valid object");
        }
        if (this.settings) {
            Object.keys(settings).forEach((id) => {
                const setting = settings[id];
                if (!this.settings)
                    return;
                if (!setting.type || !setting.label) {
                    throw new Error(`Setting ${id} must have a type and label`);
                }
                if (this.settings[id]) {
                    this.sendWarning(`Setting with label "${setting.label}" already exists. It will be overwritten.`);
                }
                switch (setting.type) {
                    case "select":
                        if (!Array.isArray(setting.options)) {
                            throw new Error(`Select setting ${id} must have options array`);
                        }
                        this.settings[id] = {
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
                        this.settings[id] = {
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
                        this.settings[id] = {
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
                        this.settings[id] = {
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
                        this.settings[id] = {
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
                        this.settings[id] = {
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
                        this.settings[id] = {
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
                        this.settings[id] = {
                            type: "list",
                            value: setting.value,
                            label: setting.label,
                            description: setting.description || "",
                            options: setting.options || [],
                        };
                        break;
                    case "color":
                        this.settings[id] = {
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
            this.notifyListeners(ServerEvent.SETTINGS, this.settings);
            this.sendData(SEND_TYPES.SET, this.settings, "settings");
        }
    }
    /**
     * Initializes the settings and assumes the settings provided by the server are preferred over the passed settings.
     * Should be used for startup settings and only startup settings
     *
     * @param settings The settings object
     */
    initSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.settings) {
                yield this.getSettings(); // ensures an attempt is made to get settings from the server
            }
            const newSettings = Object.fromEntries(Object.entries(settings).filter(([key]) => !this.settings || !(key in this.settings)));
            this.addSettings(newSettings); // only add the new settings
        });
    }
    /**
     * Deletes settings from the server
     *
     * @example
     * // Delete a single setting
     * server.deleteSetting('color');
     */
    deleteSettings(settingIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleteSettings = Array.isArray(settingIds) ? settingIds : [settingIds];
            deleteSettings.forEach((settingId) => {
                if (this.settings) {
                    delete this.settings[settingId];
                }
            });
            this.notifyListeners(ServerEvent.SETTINGS, this.settings);
            this.sendData(SEND_TYPES.DELETE, settingIds, "settings");
        });
    }
    /**
     * Deletes data from the server
     *
     * @example
     * // Delete a single data item
     * server.deleteData('client_id');
     *
     */
    deleteData(dataIds) {
        return __awaiter(this, void 0, void 0, function* () {
            const deleteSettings = Array.isArray(dataIds) ? dataIds : [dataIds];
            deleteSettings.forEach((dataIds) => {
                if (this.data) {
                    delete this.data[dataIds];
                }
            });
            this.notifyListeners(ServerEvent.DATA, this.data);
            this.sendData(SEND_TYPES.DELETE, dataIds, "data");
        });
    }
    /**
     * Registers a new action to the server. This can be mapped to any key on the deskthingserver UI.
     *
     * @param action - The action object to register.
     * @throws {Error} If the action object is invalid.
     * @example
     * const action = {
     *      name: 'Like'
     *      description: 'Likes the currently playing song'
     *      id: 'likesong'
     *      value: 'toggle'
     *      value_options: ['like', 'dislike', 'toggle']
     *      value_instructions: 'Determines whether to like, dislike, or toggle the currently liked song'
     *      icon: 'likesongicon' // overrides "id" and instead looks in /public/icons/likesongicon.svg
     *      version: 'v0.10.1'
     *      tag: 'media'
     * }
     * DeskThing.registerAction(action)
     * DeskThing.on('action', (data) => {
     *      if (data.payload.id === 'likesong') {
     *          DeskThing.sendLog('Like Song value is set to: ', data.value)
     *      }
     * })
     * @example
     * // Super minimal action
     * const action = {
     *      id: 'trigger' // looks for icon in /public/icons/trigger.svg
     * }
     * DeskThing.registerAction(action)
     * DeskThing.on('action', (data) => {
     *      if (data.payload.id === 'trigger') {
     *          DeskThing.sendLog('An action was triggered!')
     *      }
     * })
     */
    registerAction(action) {
        if (!action || typeof action !== "object") {
            throw new Error("Invalid action object");
        }
        if (!action.id || typeof action.id !== "string") {
            throw new Error("Action must have a valid id");
        }
        this.sendData(SEND_TYPES.ACTION, action, "add");
    }
    /**
     * Registers a new action to the server. This can be mapped to any key on the deskthingserver UI.
     *
     * @param action - The action object to register.
     * @throws {Error} If the action object is invalid.
     * @deprecated - Use {@link DeskThing.registerAction} instead.
     * @example
     * const action = {
     *      name: 'Like'
     *      description: 'Likes the currently playing song'
     *      id: 'likesong'
     *      value: 'toggle'
     *      value_options: ['like', 'dislike', 'toggle']
     *      value_instructions: 'Determines whether to like, dislike, or toggle the currently liked song'
     *      icon: 'likesong'
     *      version: 'v0.10.1'
     *      tag: 'media'
     * }
     * DeskThing.registerActionObject(action)
     * DeskThing.on('action', (data) => {
     *      if (data.payload.id === 'likesong') {
     *          DeskThing.sendLog('Like Song value is set to: ', data.value)
     *      }
     * })
     */
    registerActionObject(action) {
        this.registerAction(action);
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
        this.sendData(SEND_TYPES.ACTION, { id, icon }, "update");
    }
    /**
     * Registers a new key with the specified identifier. This can be mapped to any action. Use a keycode to map a specific keybind.
     * Possible keycodes can be found at https://www.toptal.com/developers/keycode and is listening for event.code
     *
     * Keys can also be considered "digital" like buttons on the screen.
     * The first number in the key will be passed to the action
     * @deprecated - Use {@link DeskThing.registerKeyObject} instead.
     * @throws {Error} If the key object is invalid.
     * @param id - The unique identifier for the key.
     * @param description - Description for the key.
     */
    registerKey(id, description, modes, version) {
        this.registerKeyObject({ id, description, modes, version });
    }
    /**
     * Registers a new key with the specified identifier. This can be mapped to any action. Use a keycode to map a specific keybind.
     * Possible keycodes can be found at https://www.toptal.com/developers/keycode and is listening for event.code
     *
     * Keys can also be considered "digital" like buttons on the screen.
     * @throws {Error} If the key object is invalid.
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
        this.sendData(SEND_TYPES.KEY, key, "add");
    }
    /**
     * Removes an action with the specified identifier.
     *
     * @param id - The unique identifier of the action to be removed.
     */
    removeAction(id) {
        this.sendData(SEND_TYPES.ACTION, { id }, "remove");
    }
    /**
     * Removes a key with the specified identifier.
     *
     * @param id - The unique identifier of the key to be removed.
     */
    removeKey(id) {
        this.sendData(SEND_TYPES.KEY, { id }, "remove");
    }
    /**
     * Saves the provided data by merging it with the existing data and updating settings.
     * Sends the updated data to the server and notifies listeners.
     *
     * @param data - The data to be saved and merged with existing data.
     */
    saveData(data, sync = true) {
        if (data) {
            this.data = Object.assign(Object.assign({}, this.data), data);
        }
        if (data === null || data === void 0 ? void 0 : data.settings) {
            this.sendError('[saveData] ERROR saveData() no longer saves settings! use saveSettings() instead!');
        }
        sync && this.sendData(SEND_TYPES.SET, this.data, "data");
        this.notifyListeners(ServerEvent.DATA, this.data);
    }
    /**
     * Typically redundant - it ensures the settings are saved to the server
     * Triggers DeskThing.on('settings', () => void)
     *
     * @param data - The data to be saved and merged with existing data.
     */
    saveSettings(settings, sync = true) {
        if (settings) {
            this.addSettings(settings);
        }
        sync && this.sendData(SEND_TYPES.SET, this.data, "settings");
        this.notifyListeners(ServerEvent.SETTINGS, this.data);
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
     * const cancelTask = deskThing.scheduleTask(async () => {
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
     * deskThing.scheduleTask(async () => {
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
     * deskThing.scheduleTask(async () => {
     *   checkForUpdates();
     * }, 1000);
     */
    scheduleTask(task, timeout) {
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
     * @deprecated Use {@link DeskThing.scheduleTask} instead for repeated tasks or {@link DeskThing.addThread} for single-use long-running tasks like websockets
     * @param task
     * @param timeout
     * @returns
     */
    addBackgroundTaskLoop(task, timeout) {
        return this.scheduleTask(task, timeout);
    }
    /**
     * Creates a new worker thread that runs independently and can be force-killed.
     * Thread is automatically terminated when app closes.
     *
     * @param workerPath - Path to the worker file relative to project root
     * @returns Object containing terminate function and worker instance
     *
     * @example
     * // Main thread
     * DeskThing.on('start', async () => {
     *    const { worker } = DeskThing.addThread('./workers/websocket.ts');
     *
     *    worker.on('message', (data) => {
     *      DeskThing.log(LOGGING_LEVELS.LOG, `Received message: ${data}`);
     *    });
     *
     *    worker.postMessage({ type: 'send', payload: 'Hello from the main thread!' });
     * })
     * // workers/websocket.ts
     * import { parentPort } from 'worker_threads'
     * import WebSocket from 'ws'
     *
     * const ws = new WebSocket('wss://your-websocket-server.com')
     *
     * ws.on('open', () => {
     *   parentPort?.postMessage({ type: 'connected' })
     * })
     *
     * ws.on('message', (data) => {
     *   parentPort?.postMessage({ type: 'message', data: data.toString() })
     * })
     *
     * ws.on('error', (error) => {
     *   parentPort?.postMessage({ type: 'error', error: error.message })
     * })
     *
     * ws.on('close', () => {
     *   parentPort?.postMessage({ type: 'disconnected' })
     * })
     *
     * // Handle messages from main thread
     * parentPort?.on('message', (message) => {
     *   if (message.type === 'send') {
     *     ws.send(message.payload) // Send message to WebSocket server with content 'Hello from the main thread!'
     *   }
     * })
     *
     */
    addThread(workerPath) {
        // Verify file exists
        const resolvedPath = path.resolve(__dirname, workerPath);
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Worker file not found: ${workerPath}`);
        }
        // Create worker with error handling
        const worker = new worker_threads_1.Worker(resolvedPath);
        // Handle worker errors
        worker.on('error', (error) => {
            this.sendError(`Worker error: ${error.message}`);
        });
        // Handle worker exit
        worker.on('exit', (code) => {
            if (code !== 0) {
                this.sendError(`Worker stopped with exit code ${code}`);
            }
            this.sendLog(`Worker terminated`);
        });
        const terminate = () => {
            try {
                worker.terminate();
            }
            catch (error) {
                if (error instanceof Error) {
                    this.sendError(`Failed to terminate worker: ${error.message}`);
                }
                else {
                    this.sendError(`Failed to terminate worker: ${error}`);
                    console.error('[addThread - app]: Unknown error: ', error);
                }
            }
        };
        this.backgroundTasks.push(terminate);
        return { terminate, worker };
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
        return __awaiter(this, arguments, void 0, function* (url, type = "jpeg", headers, retries = 0) {
            if (!url || typeof url !== 'string') {
                throw new Error('Invalid URL provided');
            }
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout
                const response = yield fetch(url, {
                    signal: controller.signal,
                    headers: Object.assign({ "User-Agent": "Mozilla/5.0" }, headers),
                });
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                }
                const contentType = response.headers.get('content-type');
                if (!(contentType === null || contentType === void 0 ? void 0 : contentType.includes('image'))) {
                    throw new Error(`Invalid content type: ${contentType}. Expected image/*`);
                }
                const arrayBuffer = yield response.arrayBuffer();
                if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                    throw new Error('Received empty image data');
                }
                const bufferData = Buffer.from(arrayBuffer);
                const imgData = `data:image/${type};base64,${bufferData.toString('base64')}`;
                return imgData;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.sendError(`Error fetching ${type} from ${url}: ${errorMessage}`);
                console.error(`Error fetching ${type}:`, error);
                if (retries > 0) {
                    const delay = Math.min(1000 * (4 - retries), 3000); // Exponential backoff
                    this.sendWarning(`Retrying in ${delay / 1000}s... (${retries} attempts left)`);
                    yield new Promise(resolve => setTimeout(resolve, delay));
                    return this.encodeImageFromUrl(url, type, headers, retries - 1);
                }
                throw new Error(`Failed to fetch image after ${3 - retries} attempts: ${errorMessage}`);
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
            var _a, _b, _c;
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
                // Handle data URLs
                if (url.startsWith('data:')) {
                    const matches = url.match(/^data:([a-z]+\/[a-z0-9-+.]+);base64,(.+)$/i);
                    if (!matches) {
                        throw new Error('Invalid data URL format');
                    }
                    contentType = matches[1];
                    imageBuffer = Buffer.from(matches[2], 'base64');
                }
                // Handle local file path with various formats
                else if (url.startsWith('file://') || url.startsWith('/') || url.match(/^[a-zA-Z]:\\/) || url.startsWith('./') || url.startsWith('../')) {
                    const localPath = url.startsWith('file://') ? url.slice(7) : url;
                    try {
                        imageBuffer = yield fs.promises.readFile(localPath);
                    }
                    catch (err) {
                        throw new Error(`Failed to read local file: ${err instanceof Error ? err.message : String(err)}`);
                    }
                    // Detect file type from magic numbers
                    let type;
                    // Fallback magic number check
                    type = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 ? { mime: 'image/jpeg' }
                        : imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 ? { mime: 'image/png' }
                            : imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 ? { mime: 'image/gif' }
                                : imageBuffer[0] === 0x42 && imageBuffer[1] === 0x4D ? { mime: 'image/bmp' }
                                    : imageBuffer[0] === 0x00 && imageBuffer[1] === 0x00 ? { mime: 'image/webp' }
                                        : { mime: 'image/jpeg' };
                    contentType = (type === null || type === void 0 ? void 0 : type.mime) || 'image/jpeg';
                }
                else {
                    // Handle remote URL with retry mechanism
                    const maxRetries = 3;
                    let attempt = 0;
                    let lastError = null;
                    while (attempt < maxRetries) {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout
                        try {
                            const response = yield fetch(url, {
                                signal: controller.signal,
                                headers: Object.assign({ "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36", "Accept": "image/*,*/*;q=0.8" }, headers),
                            });
                            clearTimeout(timeoutId);
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
                            }
                            contentType = response.headers.get("content-type") || "application/octet-stream";
                            const arrayBuffer = yield response.arrayBuffer();
                            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                                throw new Error('Received empty response');
                            }
                            imageBuffer = Buffer.from(arrayBuffer);
                            break;
                        }
                        catch (err) {
                            lastError = err instanceof Error ? err : new Error(String(err));
                            attempt++;
                            if (attempt < maxRetries) {
                                yield new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                            }
                        }
                        finally {
                            clearTimeout(timeoutId);
                        }
                    }
                    if (!imageBuffer) {
                        throw lastError || new Error('Failed to fetch image after multiple attempts');
                    }
                }
                // Validate image content
                if (!contentType.startsWith('image/')) {
                    // Try to detect image type from buffer
                    const detectedType = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 && imageBuffer[2] === 0xFF ? { mime: 'image/jpeg' }
                        : imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47 ? { mime: 'image/png' }
                            : imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46 ? { mime: 'image/gif' }
                                : imageBuffer[0] === 0x42 && imageBuffer[1] === 0x4D ? { mime: 'image/bmp' }
                                    : imageBuffer[0] === 0x00 && imageBuffer[1] === 0x00 && imageBuffer[2] === 0x01 && imageBuffer[3] === 0x00 ? { mime: 'image/x-icon' }
                                        : null;
                    if ((_a = detectedType === null || detectedType === void 0 ? void 0 : detectedType.mime) === null || _a === void 0 ? void 0 : _a.startsWith('image/')) {
                        contentType = detectedType.mime;
                    }
                    else {
                        throw new Error('Invalid or unsupported content type: ' + contentType);
                    }
                }
                // Determine file extension from MIME type
                let extension = ((_b = contentType.split('/').pop()) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || "jpg";
                // Handle special cases and normalize extensions
                extension = extension === "jpeg" ? "jpg"
                    : extension === "svg+xml" ? "svg"
                        : extension === "x-icon" ? "ico"
                            : extension === "vnd.microsoft.icon" ? "ico"
                                : extension === "unknown" || extension === "octet-stream" ? "jpg"
                                    : extension;
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
                return `http://localhost:8891/app/${((_c = this.manifest) === null || _c === void 0 ? void 0 : _c.id) || ''}/images/${fileName}`;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.sendError(`[saveImageReferenceFromURL]: Failed to process image! ${errorMessage}`);
                console.error('[deskthing-server] Error processing image:', error);
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
     * @deprecated - Use {@link DeskThing.on}('start', () => startupTasks) instead
     * @returns
     */
    start(_a) {
        return __awaiter(this, arguments, void 0, function* ({ toServer, SysEvents }) {
            this.toServer = toServer;
            this.SysEvents = SysEvents;
            this.stopRequested = false;
            try {
                yield this.notifyListeners(ServerEvent.START);
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
     * @deprecated - Use {@link DeskThing.on}('stop', () => {}) instead
     * @returns
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.data) {
                    this.saveData();
                }
                // Notify listeners of the stop event
                yield this.notifyListeners(ServerEvent.STOP);
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
     * @deprecated - Use {@link DeskThing.on}('purge', () => {}) instead
     * @returns
     */
    purge() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Notify listeners of the stop event
                yield this.notifyListeners(ServerEvent.PURGE);
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
     * @deprecated - Use {@link DeskThing.on}('data', () => {}) instead
     * @returns
     */
    toClient(data) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (data.type) {
                case "data":
                    const payload = data.payload;
                    if (typeof payload === "object" && data !== null) {
                        this.saveData(payload, false); // ensure it only saves locally in cache
                    }
                    else {
                        this.sendWarning("Received invalid data from server:" + payload);
                        this.initializeData();
                    }
                    break;
                case "message":
                    this.sendLog("Received message from server:" + data.payload);
                    break;
                case "settings":
                    this.sendLog("Received settings from server:" + data.payload);
                    if (!data.payload) {
                        this.sendLog("Received invalid settings from server:" + data.payload);
                    }
                    else {
                        const settings = data.payload;
                        this.addSettings(settings);
                        this.notifyListeners(ServerEvent.DATA, this.data);
                    }
                    break;
                default:
                    this.notifyListeners(data.type, data);
                    break;
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
