type DeskthingListener = (...args: any) => void;
export type IncomingEvent = "message" | "data" | "get" | "set" | "callback-data" | "start" | "stop" | "purge" | "input" | "action" | "config" | "settings";
export type OutgoingEvent = "data" | "get" | "set" | "add" | "open" | "toApp" | "message" | "warn" | "debug" | "fatal" | "error" | "log" | "action" | "button";
export declare enum LOGGING_LEVELS {
    LOG = "log",
    DEBUG = "debug",
    WARN = "warn",
    ERROR = "error",
    FATAL = "fatal"
}
export type SongData = {
    album: string | null;
    artist: string | null;
    playlist: string | null;
    playlist_id: string | null;
    track_name: string;
    shuffle_state: boolean | null;
    repeat_state: "off" | "all" | "track";
    is_playing: boolean;
    can_fast_forward: boolean;
    can_skip: boolean;
    can_like: boolean;
    can_change_volume: boolean;
    can_set_output: boolean;
    track_duration: number | null;
    track_progress: number | null;
    volume: number;
    thumbnail: string | null;
    device: string | null;
    id: string | null;
    device_id: string | null;
    liked?: boolean;
    color?: ThemeColor;
};
export interface ThemeColor {
    value: number[];
    rgb: string;
    rgba: string;
    hex: string;
    hexa: string;
    isDark: boolean;
    isLight: boolean;
    error?: string;
}
export type GetTypes = "data" | "config" | "input";
export interface Manifest {
    type: string[];
    requires: Array<string>;
    label: string;
    version: string;
    description?: string;
    author?: string;
    id: string;
    isWebApp: boolean;
    isLocalApp: boolean;
    platforms: Array<string>;
    homepage?: string;
    repository?: string;
}
export interface AuthScopes {
    [key: string]: {
        instructions: string;
        label: string;
        value?: string;
    };
}
interface SettingsBase {
    type: "boolean" | "list" | "multiselect" | "number" | "range" | "ranked" | "select" | "string" | "color";
    label: string;
    description?: string;
}
export interface SettingsNumber {
    value: number;
    type: "number";
    min: number;
    max: number;
    label: string;
    description?: string;
}
export interface SettingsBoolean {
    value: boolean;
    type: "boolean";
    label: string;
    description?: string;
}
export interface SettingsRange {
    value: number;
    type: "range";
    label: string;
    min: number;
    max: number;
    step?: number;
    description?: string;
}
export interface SettingsString {
    value: string;
    type: "string";
    label: string;
    maxLength?: number;
    description?: string;
}
export interface SettingsSelect {
    value: string;
    type: "select";
    label: string;
    description?: string;
    placeholder?: string;
    options: SettingOption[];
}
export type SettingOption = {
    label: string;
    value: string;
};
export interface SettingsRanked {
    value: string[];
    type: "ranked";
    label: string;
    description?: string;
    options: SettingOption[];
}
/**
 * Not fully implemented yet!
 */
export interface SettingsList {
    value: string[];
    placeholder?: string;
    maxValues?: number;
    orderable?: boolean;
    unique?: boolean;
    type: "list";
    label: string;
    description?: string;
    options: SettingOption[];
}
export interface SettingsMultiSelect {
    value: string[];
    type: "multiselect";
    label: string;
    description?: string;
    placeholder?: string;
    options: SettingOption[];
}
export interface SettingsColor extends SettingsBase {
    type: "color";
    value: string;
    label: string;
    description?: string;
    placeholder?: string;
}
export type SettingsType = SettingsNumber | SettingsBoolean | SettingsString | SettingsSelect | SettingsMultiSelect | SettingsRange | SettingsRanked | SettingsList | SettingsColor;
export interface AppSettings {
    [key: string]: SettingsType;
}
export interface InputResponse {
    [key: string]: string | boolean;
}
export interface SocketData {
    app?: string;
    type: string;
    request?: string;
    payload?: Array<string> | string | object | number | {
        [key: string]: string | Array<string>;
    } | ActionCallback;
}
export interface DataInterface {
    [key: string]: string | AppSettings | undefined | any[];
    settings?: AppSettings;
}
export type OutgoingData = {
    type: OutgoingEvent;
    request: string;
    payload: any;
};
export type IncomingData = {
    type: IncomingEvent;
    request: string;
    payload: any;
};
type toServer = (data: OutgoingData) => void;
type SysEvents = (event: string, listener: (...args: any) => void) => () => void;
type startData = {
    toServer: toServer;
    SysEvents: SysEvents;
};
type valueTypes = string | number | boolean;
/**
 * @depreciated - use EventModes instead
 */
export declare enum EventFlavor {
    KeyUp = 0,
    KeyDown = 1,
    ScrollUp = 2,
    ScrollDown = 3,
    ScrollLeft = 4,
    ScrollRight = 5,
    SwipeUp = 6,
    SwipeDown = 7,
    SwipeLeft = 8,
    SwipeRight = 9,
    PressShort = 10,
    PressLong = 11
}
export type Action = {
    name?: string;
    description?: string;
    id: string;
    value?: string;
    value_options?: string[];
    value_instructions?: string;
    icon?: string;
    source?: string;
    version: string;
    version_code: number;
    enabled: boolean;
    tag?: "nav" | "media" | "basic";
};
export declare enum EventMode {
    KeyUp = 0,
    KeyDown = 1,
    ScrollUp = 2,
    ScrollDown = 3,
    ScrollLeft = 4,
    ScrollRight = 5,
    SwipeUp = 6,
    SwipeDown = 7,
    SwipeLeft = 8,
    SwipeRight = 9,
    PressShort = 10,
    PressLong = 11
}
export type Key = {
    id: string;
    source: string;
    description?: string;
    version: string;
    enabled: boolean;
    version_code?: number;
    modes: EventMode[];
};
export type ActionCallback = {
    id: string;
    value: valueTypes;
};
export type Response = {
    data: any;
    status: number;
    statusText: string;
    request: string[];
};
interface ImageReference {
    [key: string]: string;
}
/**
 * The DeskThing class is the main class for the DeskThing library. This should only be used on the server side of your application
 */
export declare class DeskThingClass {
    private static instance;
    private Listeners;
    private manifest;
    private toServer;
    private SysEvents;
    imageUrls: ImageReference;
    private sysListeners;
    private data;
    private backgroundTasks;
    private isDataBeingFetched;
    private dataFetchQueue;
    stopRequested: boolean;
    constructor();
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
    static getInstance(): DeskThingClass;
    /**
     * Initializes data if it is not already set on the server.
     * This method is run internally when there is no data retrieved from the server.
     *
     * @since 0.8.0
     * @example
     * const deskThing = DeskThing.getInstance();
     * deskThing.start({ toServer, SysEvents });
     */
    private initializeData;
    /**
     * Notifies all listeners of a particular event.
     *
     * @since 0.8.0
     * @example
     * deskThing.on('message', (msg) => console.log(msg));
     * deskThing.notifyListeners('message', 'Hello, World!');
     */
    private notifyListeners;
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
    on(event: IncomingEvent, callback: DeskthingListener): () => void;
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
    off(event: IncomingEvent, callback: DeskthingListener): void;
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
    onSystem(event: string, listener: DeskthingListener): () => void;
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
    once(event: IncomingEvent, callback?: DeskthingListener): Promise<any>;
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
    private sendData;
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
    private requestData;
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
    send(payload: SocketData): void;
    /**
     * Sends a plain text message to the server. This will display as a gray notification on the DeskThingServer GUI
     *
     * @since 0.8.0
     * @param message - The message to send to the server.
     * @deprecated - Use sendLog or sendWarning instead
     * @example
     * deskThing.sendMessage('Hello, Server!');
     */
    sendMessage(message: string): void;
    /**
     * Sends a log message to the server. This will be saved to the .logs file and be saved in the Logs on the DeskThingServer GUI
     *
     * @param log - The log message to send.
     * @since 0.8.0
     * @example
     * deskThing.sendLog('[spotify] Fetching data...');
     */
    sendLog(log: string): void;
    /**
     * Sends a warning to the server. This will be saved to the .logs file and be saved in the Logs on the DeskThingServer GUI
     *
     * @param warning - The warning message to send.
     * @since 0.9.3
     * @example
     * deskThing.sendWarning('[spotify] Ensure the API keys are set!');
     */
    sendWarning(warning: string): void;
    /**
     * Sends an error message to the server. This will show up as a red notification
     *
     * @param message - The error message to send.
     * @since 0.8.0
     * @example
     * deskThing.sendError('An error occurred!');
     */
    sendError(message: string): void;
    /**
     * Sends a fatal error message to the server. This will show up as a critical red notification
     *
     * @param message - The fatal error message to send.
     * @since 0.9.3
     * @example
     * deskThing.sendFatal('Critical system failure!');
     */
    sendFatal(message: string): void;
    /**
     * Sends a debug message to the server. This will be saved to the .logs file and only visible in debug mode
     *
     * @param message - The debug message to send.
     * @since 0.9.3
     * @example
     * deskThing.sendDebug('[spotify] Debug info: ' + debugData);
     */
    sendDebug(message: string): void;
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
    sendDataToOtherApp(appId: string, payload: OutgoingData): void;
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
    sendDataToClient(data: SocketData): void;
    /**
     * Requests the server to open a specified URL.
     *
     * @param url - The URL to open.
     *
     * @example
     * deskThing.openUrl('https://example.com');
     */
    openUrl(url: string): void;
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
    getData(): Promise<DataInterface | null>;
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
    getConfig(name: string): Promise<any>;
    /**
     * Asynchronously retrieves the current settings. If settings are not defined, it fetches them from the server.
     *
     * @returns The current settings or undefined if not set.
     *
     * @example
     * const settings = deskThing.getSettings();
     * console.log('Current settings:', settings);
     */
    getSettings(): Promise<AppSettings | null>;
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
    getUserInput(scopes: AuthScopes, callback: DeskthingListener): Promise<void>;
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
    addSettings(settings: AppSettings): void;
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
    registerAction(name: string, id: string, description: string, flair?: string): void;
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
    registerActionObject(action: Action): void;
    /**
     * Updates the flair of a specified action id. This can be used to update the image of the button. Flair is appended to the end of the action name and thus the end of the SVG path as well
     * @param id action id
     * @param flair the updated flair
     * @example
     * // Previously using like.svg
     * deskthing.updateFlair('like', 'active')
     * // Now using likeactive.svg
     */
    updateIcon(id: string, icon: string): void;
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
    registerKey(id: string, description: string, modes: EventMode[], version: string): void;
    /**
     * Registers a new key with the specified identifier. This can be mapped to any action. Use a keycode to map a specific keybind.
     * Possible keycodes can be found at https://www.toptal.com/developers/keycode and is listening for event.code
     *
     * Keys can also be considered "digital" like buttons on the screen.
     * @param key - The key object to register.
     */
    registerKeyObject(key: Key): void;
    /**
     * Removes an action with the specified identifier.
     *
     * @param id - The unique identifier of the action to be removed.
     */
    removeAction(id: string): void;
    /**
     * Removes a key with the specified identifier.
     *
     * @param id - The unique identifier of the key to be removed.
     */
    removeKey(id: string): void;
    /**
     * Saves the provided data by merging it with the existing data and updating settings.
     * Sends the updated data to the server and notifies listeners.
     *
     * @param data - The data to be saved and merged with existing data.
     */
    saveData(data: DataInterface): void;
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
    addBackgroundTaskLoop(task: () => Promise<boolean | void>, timeout?: number): () => void;
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
    encodeImageFromUrl(url: string, type?: "jpeg" | "gif", retries?: number): Promise<string>;
    /**
     * Saves an image from a URL to a local directory and tracks the file path
     *
     * @param url - The direct URL to the image or local file path
     * @returns Promise resolving to the saved image's filename
     */
    saveImageReferenceFromURL(url: string, headers?: Record<string, string>): Promise<string | null>;
    /**
     * -------------------------------------------------------
     * Deskthing Server Functions
     */
    /**
     * Fetches the manifest
     * @returns Manifest | null
     */
    private loadManifest;
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
    getManifest(): Response;
    /**
     * @deprecated - Use DeskThing.on('start', () => {}) instead
     * @returns
     */
    start({ toServer, SysEvents }: startData): Promise<Response>;
    /**
     * @deprecated - Use DeskThing.on('stop', () => {}) instead
     * @returns
     */
    stop(): Promise<Response>;
    /**
     * @deprecated - Use DeskThing.on('purge', () => {}) instead
     * @returns
     */
    purge(): Promise<Response>;
    private clearCache;
    /**
     * @deprecated - Use DeskThing.on('data', () => {}) instead
     * @returns
     */
    toClient(data: IncomingData): Promise<void>;
}
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
export declare const DeskThing: DeskThingClass;
export {};
