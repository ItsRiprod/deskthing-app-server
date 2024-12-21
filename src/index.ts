import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
// Type definitions for various listeners, events, and data interfaces used in the class
type DeskthingListener = (...args: any) => void;

// Events coming from the server
export type IncomingEvent =
  | "message"
  | "data"
  | "get"
  | "set"
  | "callback-data"
  | "start"
  | "stop"
  | "purge"
  | "input"
  | "action"
  | "config"
  | "settings";

// Events that can be sent back to the server
// Events that can be sent back to the server
export enum SEND_TYPES {
  /**
   * Default handler for unknown or unspecified data types.
   * Will log a warning message about the unknown data type.
   */
  DEFAULT = 'default',

  /**
   * Retrieves data from the server. Supports multiple request types:
   * - 'data': Gets app-specific stored data
   * - 'config': Gets configuration (deprecated)
   * - 'settings': Gets application settings
   * - 'input': Requests user input via a form
   *
   * @example
   * DeskThing.send(SEND_TYPES.GET, { request: 'settings' })
   */
  GET = 'get',

  /**
   * Sets data inside the server for your app that can be retrieved with DeskThing.getData()
   * Data is stored persistently and can be retrieved later.
   *
   * @example
   * DeskThing.send(SEND_TYPES.SET, { payload: { key: 'value' }})
   */
  SET = 'set',

  /**
   * Opens a URL to a specific address on the server.
   * This gets around any CORS issues that may occur by opening in a new window.
   * Typically used for authentication flows.
   *
   * @example
   * DeskThing.send(SEND_TYPES.OPEN, { payload: 'https://someurl.com' })
   */
  OPEN = 'open',

  /**
   * Sends data to the front end client.
   * Can target specific client components or send general messages.
   * Supports sending to both the main client and specific app clients.
   *
   * @example
   * DeskThing.send(SEND_TYPES.SEND, { type: 'someData', payload: 'value' })
   */
  SEND = 'send',

  /**
   * Sends data to another app in the system.
   * Allows inter-app communication by specifying target app and payload.
   * Messages are logged for debugging purposes.
   *
   * @example
   * DeskThing.send(SEND_TYPES.TOAPP, { request: 'spotify', payload: { type: 'get', data: 'music' }})
   */
  TOAPP = 'toApp',

  /**
   * Logs messages to the system logger.
   * Supports multiple log levels: DEBUG, ERROR, FATAL, LOGGING, MESSAGE, WARNING
   * Messages are tagged with the source app name.
   *
   * @example
   * DeskThing.send(SEND_TYPES.LOG, { request: 'ERROR', payload: 'Something went wrong' })
   */
  LOG = 'log',

  /**
   * Manages key mappings in the system.
   * Supports operations: add, remove, trigger
   * Keys can have multiple modes and are associated with specific apps.
   *
   * @example
   * DeskThing.send(SEND_TYPES.KEY, { request: 'add', payload: { id: 'myKey', modes: ['default'] }})
   */
  KEY = 'key',

  /**
   * Manages actions in the system.
   * Supports operations: add, remove, update, run
   * Actions can have values, icons, and version information.
   *
   * @example
   * DeskThing.send(SEND_TYPES.ACTION, { request: 'add', payload: { id: 'myAction', name: 'My Action' }})
   */
  ACTION = 'action'
}



export enum LOGGING_LEVELS {
  LOG = "log",
  DEBUG = "debug",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
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

// Sub-types for the 'get' event
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
  type:
    | "boolean"
    | "list"
    | "multiselect"
    | "number"
    | "range"
    | "ranked"
    | "select"
    | "string"
    | "color";
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

export type SettingsType =
  | SettingsNumber
  | SettingsBoolean
  | SettingsString
  | SettingsSelect
  | SettingsMultiSelect
  | SettingsRange
  | SettingsRanked
  | SettingsList
  | SettingsColor;

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
  payload?:
    | Array<string>
    | string
    | object
    | number
    | { [key: string]: string | Array<string> }
    | ActionCallback;
}

export interface DataInterface {
  [key: string]: string | AppSettings | undefined | any[];
  settings?: AppSettings;
}

export type OutgoingData = {
  type: SEND_TYPES;
  request: string;
  payload: any;
};
export type IncomingData = {
  type: IncomingEvent;
  request: string;
  payload: any;
};

type toServer = (data: OutgoingData) => void;
type SysEvents = (
  event: string,
  listener: (...args: any) => void
) => () => void;

type startData = {
  toServer: toServer;
  SysEvents: SysEvents;
};

type valueTypes = string | number | boolean;

/**
 * @depreciated - use EventModes instead
 */
export enum EventFlavor {
  KeyUp,
  KeyDown,
  ScrollUp,
  ScrollDown,
  ScrollLeft,
  ScrollRight,
  SwipeUp,
  SwipeDown,
  SwipeLeft,
  SwipeRight,
  PressShort,
  PressLong,
}

export type Action = {
  name?: string; // User Readable name
  description?: string; // User Readable description
  id: string; // System-level ID
  value?: string; // The value to be passed to the action. This is included when the action is triggered
  value_options?: string[]; // The options for the value
  value_instructions?: string; // Instructions for the user to set the value
  icon?: string; // The name of the icon the action uses - if left blank, the action will use the icon's id
  source?: string; // The origin of the action
  version: string; // The version of the action
  version_code: number; // The version of the server the action is compatible with
  enabled: boolean; // Whether or not the app associated with the action is enabled
  tag?: "nav" | "media" | "basic"; // Tags associated with the action
};

export enum EventMode {
  KeyUp,
  KeyDown,
  ScrollUp,
  ScrollDown,
  ScrollLeft,
  ScrollRight,
  SwipeUp,
  SwipeDown,
  SwipeLeft,
  SwipeRight,
  PressShort,
  PressLong,
}

export type Key = {
  id: string; // System-level ID
  source: string; // The origin of the key
  description?: string; // User Readable description
  version: string; //  The version of the key
  enabled: boolean; // Whether or not the app associated with the key is enabled
  version_code?: number; // The version of the server the action is compatible with
  modes: EventMode[]; // The Modes of the key
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

interface ImageReference { [key: string]: string }

/**
 * The DeskThing class is the main class for the DeskThing library. This should only be used on the server side of your application
 */
export class DeskThingClass {
  private static instance: DeskThingClass;
  private Listeners: { [key in IncomingEvent]?: DeskthingListener[] } = {};
  private manifest: Manifest | null = null;
  private toServer: toServer | null = null;
  private SysEvents: SysEvents | null = null;
  public imageUrls: ImageReference = {};
  private sysListeners: DeskthingListener[] = [];
  private data: DataInterface | null = null;
  private backgroundTasks: Array<() => void> = [];
  private isDataBeingFetched: boolean = false;
  private dataFetchQueue: Array<(data: DataInterface | null) => void> = [];
  stopRequested: boolean = false;

  constructor() {
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
  static getInstance(): DeskThingClass {
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
  private async initializeData() {
    if (this.data) {
      if (!this.data.settings) {
        this.data.settings = {};
      }
      this.sendData(SEND_TYPES.set, this.data);
    } else {
      this.data = {
        settings: {},
      };
      this.sendData("set", this.data);
    }
  }

  /**
   * Notifies all listeners of a particular event.
   *
   * @since 0.8.0
   * @example
   * deskThing.on('message', (msg) => console.log(msg));
   * deskThing.notifyListeners('message', 'Hello, World!');
   */
  private async notifyListeners(
    event: IncomingEvent,
    ...args: any
  ): Promise<void> {
    const callbacks = this.Listeners[event];
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
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
  on(event: IncomingEvent, callback: DeskthingListener): () => void {
    if (!this.Listeners[event]) {
      this.Listeners[event] = [];
    }
    this.Listeners[event]!.push(callback);

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
  off(event: IncomingEvent, callback: DeskthingListener): void {
    if (!this.Listeners[event]) {
      return;
    }
    this.Listeners[event] = this.Listeners[event]!.filter(
      (cb) => cb !== callback
    );
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
  onSystem(event: string, listener: DeskthingListener): () => void {
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
    return () => {}; // Return a no-op function if SysEvents is not defined
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
  async once(event: IncomingEvent, callback?: DeskthingListener): Promise<any> {
    if (callback) {
      const onceWrapper = (...args: any) => {
        this.off(event, onceWrapper);
        callback(...args);
      };

      this.on(event, onceWrapper);
    } else {
      return new Promise<any>((resolve) => {
        const onceWrapper = (...args: any) => {
          this.off(event, onceWrapper);
          resolve(args.length === 1 ? args[0] : args);
        };

        this.on(event, onceWrapper);
      });
    }
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
  private sendData(event: SEND_TYPES, payload: any, request?: string): void {
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
  private requestData(request: GetTypes, scopes?: AuthScopes | string): void {
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
   * deskThing.once('songData', (data: SocketData) => {
   *   const musicData = data.payload as SongData;
   * });
   */
  send(payload: SocketData): void {
    this.sendData(SEND_TYPES.SEND, payload);
  }

  /**
   * 
   */
  log = async (logType: LOGGING_LEVELS, message: string) => {

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
  sendMessage(message: string): void {
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
  sendLog(log: string): void {
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
  sendWarning(warning: string): void {
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
  sendError(message: string): void {
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
  sendFatal(message: string): void {
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
  sendDebug(message: string): void {
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
  sendDataToOtherApp(appId: string, payload: OutgoingData): void {
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
  sendDataToClient(data: SocketData): void {
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
  openUrl(url: string): void {
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
  async getData(): Promise<DataInterface | null> {
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
        const data = await Promise.race([
          this.once("data"),
          new Promise((resolve) => setTimeout(() => resolve(null), 5000)), // Adjust timeout as needed
        ]);

        this.isDataBeingFetched = false;

        if (data) {
          this.dataFetchQueue.forEach((resolve) => resolve(data));
          this.dataFetchQueue = [];
          return data;
        } else {
          if (this.data) {
            this.sendLog("Failed to fetch data, but data was found");
            this.dataFetchQueue.forEach((resolve) => resolve(this.data));
            this.dataFetchQueue = [];
            return this.data;
          } else {
            this.dataFetchQueue.forEach((resolve) => resolve(null));
            this.dataFetchQueue = [];
            this.sendError("Data is not defined! Try restarting the app");
            return null;
          }
        }
      } catch (error) {
        this.sendLog(`Error fetching data: ${error}`);
        this.isDataBeingFetched = false;

        this.dataFetchQueue.forEach((resolve) => resolve(this.data));
        this.dataFetchQueue = [];
        return this.data;
      }
    } else {
      //console.log('Returning ', this.data)
      return this.data;
    }
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
  async getConfig(name: string) {
    // Request config data from the server
    this.requestData("config", name);

    // Race between the data being received and a timeout
    return await Promise.race([
      this.once("config"),
      new Promise((resolve) =>
        setTimeout(() => {
          resolve(null);
          this.sendLog(`Failed to fetch config: ${name}`);
        }, 5000)
      ),
    ]);
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
  async getSettings(): Promise<AppSettings | null> {
    if (!this.data?.settings) {
      console.error("Settings are not defined!");
      const data = await this.getData();
      if (data && data.settings) {
        return data.settings;
      } else {
        this.sendLog("Settings are not defined!");
        return null;
      }
    } else {
      return this.data.settings;
    }
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
  async getUserInput(
    scopes: AuthScopes,
    callback: DeskthingListener
  ): Promise<void> {
    if (!scopes) {
      this.sendError("Scopes not defined in getUserInput!");
      return;
    }

    // Send the request to the server
    this.requestData("input", scopes);

    try {
      // Wait for the 'input' event and pass the response to the callback
      const response = await this.once("input");

      if (callback && typeof callback === "function") {
        callback(response);
      }
    } catch (error) {
      this.sendError(`Error occurred while waiting for input: ${error}`);
    }
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
  addSettings(settings: AppSettings): void {
    this.sendLog("Adding settings..." + settings.toString());
    if (!this.data) {
      this.data = { settings: {} };
    } else if (!this.data.settings) {
      this.data.settings = {};
    }

    if (!settings || typeof settings !== "object") {
      throw new Error("Settings must be a valid object");
    }

    if (this.data?.settings) {
      Object.keys(settings).forEach((id) => {
        const setting = settings[id];

        if (!this.data?.settings) return;
        if (!setting.type || !setting.label) {
          throw new Error(`Setting ${id} must have a type and label`);
        }

        if (this.data.settings[id]) {
          console.warn(
            `Setting with label "${setting.label}" already exists. It will be overwritten.`
          );
          this.sendLog(
            `Setting with label "${setting.label}" already exists. It will be overwritten.`
          );
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
              throw new Error(
                `Multiselect setting ${id} must have options array`
              );
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
            if (
              typeof setting.min !== "number" ||
              typeof setting.max !== "number"
            ) {
              throw new Error(
                `Number setting ${id} must have min and max values`
              );
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
              throw new Error(
                `Boolean setting ${id} must have a boolean value`
              );
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
            if (
              typeof setting.min !== "number" ||
              typeof setting.max !== "number"
            ) {
              throw new Error(
                `Range setting ${id} must have min and max values`
              );
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
            if (
              !Array.isArray(setting.options) ||
              !Array.isArray(setting.value)
            ) {
              this.sendError(
                `Ranked setting ${id} must have options and value arrays`
              );
              throw new Error(
                `Ranked setting ${id} must have options and value arrays`
              );
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
            this.sendError(
              `Unknown setting type: ${setting} for setting ${id}.`
            );
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
   *      version_code: 10.1
   *      tag: 'media' 
   * }
   * DeskThing.addActionObject(action)
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
   * DeskThing.addActionObject(action)
   * DeskThing.on('action', (data) => {
   *      if (data.payload.id === 'trigger') {
   *          DeskThing.sendLog('An action was triggered!')
   *      }
   * })
   */
  registerAction(action: Action): void {
    if (!action || typeof action !== "object") {
      throw new Error("Invalid action object");
    }

    if (!action.id || typeof action.id !== "string") {
      throw new Error("Action must have a valid id");
    }
    this.sendData("action", action, "add");
  }
  /**
   * Registers a new action to the server. This can be mapped to any key on the deskthingserver UI.
   *
   * @param action - The action object to register.
   * @throws {Error} If the action object is invalid.
   * @deprecated - Use registerAction instead.
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
   *      version_code: 10.1
   *      tag: 'media' 
   * }
   * DeskThing.addActionObject(action)
   * DeskThing.on('action', (data) => {
   *      if (data.payload.id === 'likesong') {
   *          DeskThing.sendLog('Like Song value is set to: ', data.value)
   *      }
   * })
   */
  registerActionObject(action: Action): void {
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
  updateIcon(id: string, icon: string): void {
    this.sendData("action", { id, icon }, "update");
  }

  /**
   * Registers a new key with the specified identifier. This can be mapped to any action. Use a keycode to map a specific keybind.
   * Possible keycodes can be found at https://www.toptal.com/developers/keycode and is listening for event.code
   *
   * Keys can also be considered "digital" like buttons on the screen.
   * The first number in the key will be passed to the action (e.g. customAction13 with action SwitchView will switch to the 13th view )
   * @deprecated - Use registerKey instead.
   * @param id - The unique identifier for the key.
   * @param description - Description for the key.
   */
  registerKey(
    id: string,
    description: string,
    modes: EventMode[],
    version: string
  ): void {
    this.sendData("key", { id, description, modes, version }, "add");
  }

  /**
   * Registers a new key with the specified identifier. This can be mapped to any action. Use a keycode to map a specific keybind.
   * Possible keycodes can be found at https://www.toptal.com/developers/keycode and is listening for event.code
   *
   * Keys can also be considered "digital" like buttons on the screen.
   * @param key - The key object to register.
   */
  registerKeyObject(key: Key): void {
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
  removeAction(id: string): void {
    this.sendData("action", { id }, "remove");
  }

  /**
   * Removes a key with the specified identifier.
   *
   * @param id - The unique identifier of the key to be removed.
   */
  removeKey(id: string): void {
    this.sendData("button", { id }, "remove");
  }

  /**
   * Saves the provided data by merging it with the existing data and updating settings.
   * Sends the updated data to the server and notifies listeners.
   *
   * @param data - The data to be saved and merged with existing data.
   */
  saveData(data: DataInterface): void {
    this.data = {
      ...this.data,
      ...data,
      settings: {
        ...this.data?.settings,
        ...data.settings,
      },
    };

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
  addBackgroundTaskLoop(
    task: () => Promise<boolean | void>,
    timeout?: number
  ): () => void {
    const cancelToken = { cancelled: false };

    const wrappedTask = async (): Promise<void> => {
      let endToken = false;
      while (!cancelToken.cancelled && !endToken) {
        endToken = (await task()) || false;
        if (timeout) {
          await new Promise((resolve) => setTimeout(resolve, timeout));
        }
      }
    };

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
   async encodeImageFromUrl(
    url: string,
    type: "jpeg" | "gif" = "jpeg",
    retries = 3
  ): Promise<string> {
    try {
      console.log(`Fetching ${type} data...`);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const bufferData = Buffer.from(arrayBuffer);
      const imgData = `data:image/${type};base64,${bufferData.toString('base64')}`;
      console.log(`Sending ${type} data`);
      return imgData;

    } catch (error) {
      this.sendError(`Error fetching ${type}: ${url}`)
      console.error(`Error fetching ${type}:`, error);
      if (retries > 0) {
        this.sendWarning(`Retrying... (${retries} attempts left)`);
        return this.encodeImageFromUrl(url, type, retries - 1);
      }
      throw error;
    }
  }
  /**
   * Saves an image from a URL to a local directory and tracks the file path
   *
   * @param url - The direct URL to the image or local file path
   * @returns Promise resolving to the saved image's filename
   */
    async saveImageReferenceFromURL(url: string, headers?: Record<string, string>): Promise<string | null> {
      // Validate URL
      if (!url || typeof url !== "string") {
        throw new Error("Invalid URL provided");
      }

      if (this.imageUrls[url]) {
        return this.imageUrls[url]
      }

      try {
        let imageBuffer: Buffer;
        let contentType: string;

        // Handle local file path
        if (url.startsWith('file://') || url.startsWith('/') || url.match(/^[a-zA-Z]:\\/)) {
          const localPath = url.startsWith('file://') ? url.slice(7) : url;
          imageBuffer = await fs.promises.readFile(localPath);
          const mimeType = imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 ? 'image/jpeg'
            : imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 ? 'image/png'
            : imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 ? 'image/gif'
            : 'image/jpeg';
          const type = { mime: mimeType };
          contentType = type?.mime || 'image/jpeg';
        } else {
          // Handle remote URL
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

          try {
            const response = await fetch(url, {
              signal: controller.signal,
              headers: {
                "User-Agent": "Mozilla/5.0", // Prevent potential 403 errors
                ...headers
              },
            });

            clearTimeout(timeoutId);

            // Check response
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            contentType = response.headers.get("content-type") || "application/octet-stream";
            imageBuffer = Buffer.from(await response.arrayBuffer());
          } finally {
            clearTimeout(timeoutId);
          }
        }

        if (!contentType.startsWith('image/')) {
          throw new Error('Invalid content type: ' + contentType);
        }

        // Determine file extension from MIME type
        let extension = contentType.split('/').pop()?.toLowerCase() || "jpg";
        
        // Default to jpg for unknown content types
        if (extension === "unknown" || extension === "octet-stream") {
          extension = "jpg";
        }

        // Generate unique filename
        const uniqueId = crypto.randomUUID();
        const fileName = `${uniqueId}.${extension}`;
        const imagePath = path.join(__dirname, "images", fileName);

        // Ensure images directory exists
        await fs.promises.mkdir(path.join(__dirname, "images"), { recursive: true });

        // Write file
        await fs.promises.writeFile(imagePath, imageBuffer);

        // Track the image URL for cleanup
        if (!this.imageUrls) {
          this.imageUrls = {};
        }
        const relativeImagePath = path.join("images", fileName);
        this.imageUrls[url] = relativeImagePath;

        if (!this.manifest) {
          this.loadManifest()
        }

        // Return the filename for further use
        return `http://localhost:8891/app/${this.manifest?.id || ''}/images/${fileName}`;
      } catch (error) {
        if (error instanceof Error) {
          this.sendError('encodeImageFromURL: Failed to download image! ' + error.message)
        } else {
          console.log('[deskthing-server] Error encoding image: ', error)
        }
        return null
      }
    }  
  
  /**
   * -------------------------------------------------------
   * Deskthing Server Functions
   */

  /**
   * Fetches the manifest
   * @returns Manifest | null
   */
  private loadManifest(): Manifest | null {
    if (this.manifest) {
      return this.manifest;
    }

    const manifestPath = path.resolve(__dirname, "./manifest.json");
    try {
      const manifestData = fs.readFileSync(manifestPath, "utf-8");
      this.manifest = JSON.parse(manifestData) as Manifest | null;
      return this.manifest;
    } catch (error) {
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
  getManifest(): Response {
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
      } else {
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
  async start({ toServer, SysEvents }: startData): Promise<Response> {
    this.toServer = toServer;
    this.SysEvents = SysEvents;
    this.stopRequested = false;

    try {
      await this.notifyListeners("start");
    } catch (error) {
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
  }

  /**
   * @deprecated - Use DeskThing.on('stop', () => {}) instead
   * @returns
   */
  async stop(): Promise<Response> {
    try {
      if (this.data) {
        this.sendData("set", this.data);
      }
      // Notify listeners of the stop event
      await this.notifyListeners("stop");

      // Set flag to indicate stop request
      this.stopRequested = true;

      // Stop all background tasks
      this.backgroundTasks.forEach((cancel) => cancel());
      this.backgroundTasks = [];
      this.sendLog("Background tasks stopped and removed");
    } catch (error) {
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
  }

  /**
   * @deprecated - Use DeskThing.on('purge', () => {}) instead
   * @returns
   */
  async purge(): Promise<Response> {
    try {
      // Notify listeners of the stop event
      await this.notifyListeners("purge");

      // Set flag to indicate stop request
      this.stopRequested = true;

      // Stop all background tasks
      this.backgroundTasks.forEach((cancel) => cancel());
      this.sendLog("Background tasks stopped");

      // Clear cached data
      this.clearCache();
      this.sendLog("Cache cleared");
    } catch (error) {
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
  }

  // Method to clear cached data
  private clearCache(): void {
    this.data = null;
    this.Listeners = {};
    this.manifest = null;
    this.SysEvents = null;
    this.stopRequested = false;
    this.backgroundTasks = [];
    this.sysListeners.forEach((removeListener) => removeListener());
    this.sysListeners = [];
    Promise.all(Object.entries(this.imageUrls).map(async ([url, id]) => {
      try {
        const imagePath = path.join(__dirname, id)
        await fs.promises.unlink(imagePath)
        delete this.imageUrls[url]
      } catch (err) {
        console.warn(`Failed to delete image ${id}:`, err)
      }
    }))
    
    this.sendLog("Cache cleared");
    this.toServer = null;
  }

  /**
   * @deprecated - Use DeskThing.on('data', () => {}) instead
   * @returns
   */
  async toClient(data: IncomingData): Promise<void> {
    if (data.type === "data" && data) {
      const payload = data.payload; // Extract the first argument as data
      if (typeof payload === "object" && data !== null) {
        this.saveData(payload);
      } else {
        console.warn("Received invalid data from server:", payload);
        this.sendLog("Received invalid data from server:" + payload);
        this.initializeData();
      }
    } else if (data.type === "message") {
      this.sendLog("Received message from server:" + data.payload);
    } else if (
      data.type === "set" &&
      data.request === "settings" &&
      data.payload
    ) {
      const { id, value } = data.payload;

      if (this.data && this.data.settings && this.data.settings[id]) {
        this.sendLog(
          `Setting with label "${id}" changing from ${this.data.settings[id].value} to ${value}`
        );

        this.data.settings[id].value = value;
        this.sendData("add", { settings: this.data.settings });
        this.notifyListeners("settings", this.data.settings);
        this.notifyListeners("data", this.data);
      } else {
        this.sendLog(`Setting with label "${id}" not found`);
      }
    } else {
      this.notifyListeners(data.type, data);
    }
  }
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
export const DeskThing = DeskThingClass.getInstance();
