import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { Worker } from "worker_threads";
import { isValidStep, isValidTask } from "./tasks/taskUtils";
import {
  Key,
  ToServerData,
  AppManifest,
  AppDataInterface,
  AppSettings,
  SEND_TYPES,
  ServerEvent,
  GetTypes,
  AuthScopes,
  SocketData,
  LOGGING_LEVELS,
  Action,
  EventMode,
  Task,
  Step,
  EventPayload,
  SETTING_TYPES,
  SavedData,
} from "@deskthing/types";
import { sanitizeSettings } from "./settings/settingsUtils";
import { ImageHandler } from "./imageUtils/imageHandler"

type Response = {
  data: any;
  status: number;
  statusText: string;
  request: string[];
};

// Type definitions for various listeners, events, and data types = used in the class
type DeskthingListener = (...args: any) => Promise<void> | void

type toServer = (data: ToServerData) => void;
type SysEvents = (
  event: string,
  listener: (...args: any) => void
) => () => void;

type startData = {
  toServer: toServer;
  SysEvents: SysEvents;
};

type ImageReference = {
  [key: string]: string;
};

/**
 * The DeskThing class is the main class for the DeskThing library. This should only be used on the server side of your application
 */
export class DeskThingClass {
  // Singleton
  private static instance: DeskThingClass;
  
  // Context
  private manifest: AppManifest | null = null;
  private appData: AppDataInterface | null = null;
  private settings: AppSettings | null = null;
  
  // Communication with the server
  private toServer: toServer | null = null;
  private SysEvents: SysEvents | null = null;
  public imageUrls: ImageReference = {};
  
  // Listener data
  private Listeners: { [key in string]?: DeskthingListener[] } = {};
  private sysListeners: DeskthingListener[] = [];
  private backgroundTasks: Array<() => void> = [];
  private isDataBeingFetched: boolean = false;
  private dataFetchQueue: Array<(data: AppDataInterface | null) => void> = [];
  public stopRequested: boolean = false;
  
  // stores / classes
  private imageHandler: ImageHandler  
  

  constructor() {
    this.loadManifest();
    this.imageHandler = new ImageHandler((level, message) => {
      if (level === "error") this.sendError(message);
      else if (level === "warn") this.sendWarning(message);
      else this.sendLog(message);
    })
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
   * @since 0.10.4
   * @example
   * const deskThing = DeskThing.getInstance();
   * deskThing.start({ toServer, SysEvents });
   */
  private async initializeData() {
    if (this.appData) {
      this.sendData(SEND_TYPES.SET, this.appData);
    } else {
      this.appData = { version: "0.0.0" };
      this.sendData(SEND_TYPES.SET, this.appData, "data");
    }

    if (this.settings) {
      this.sendData(SEND_TYPES.SET, this.settings, "settings");
    } else {
      this.settings = {};
      this.sendData(SEND_TYPES.SET, this.settings, "settings");
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
  private async notifyListeners<T extends ServerEvent | string>(
    event: T,
    data: Extract<EventPayload, { type: T }>
  ): Promise<void> {
    const callbacks = this.Listeners[event];
    if (callbacks) {
      await Promise.all(callbacks.map(async(callback) => {
        try {
          await callback(data)
        } catch (error) {
          this.sendLog("Encountered an error in notifyListeners" + (error instanceof Error  ? error.message : error))
        }
      }))
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
  on<T extends ServerEvent | string>(
    event: T,
    callback: (data: Extract<EventPayload, { type: T }>) => void | Promise<void>
  ): () => void {
    this.sendLog("Registered a new listener for event: " + event);
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
  off(event: ServerEvent | string, callback: DeskthingListener): void {
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
   * @deprecated - Just don't use this lol. It's outdated
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
   * Will destructure the response from the server and just return the "payload" field
   *
   * @since 0.10.0
   * @param event - The event to listen for. This is either the 'type' field of SocketData or special cases like 'get' or 'start'
   * @param callback - Optional callback function. If omitted, returns a promise.
   * @returns A promise that resolves with the event data if no callback is provided.
   *
   * @example
   * DeskThing.once('message').then(data => console.log('Received data:', data)); // prints 'hello'
   *
   * // elsewhere
   * send({ type: 'message', payload: 'hello' });
   * @example
   * const flagType = await DeskThing.once('flagType');
   * console.log('Flag type:', flagType);
   * @example
   * await DeskThing.once('flagType', someFunction);
   */
  async once<T>(
    event: ServerEvent,
    callback?: DeskthingListener,
    request?: string
  ): Promise<T | undefined> {
    try {
      if (callback) {
        const onceWrapper = async (data: SocketData) => {
          if (request && data.request !== request) {
            return;
          }
          this.off(event, onceWrapper);
          await callback(data.payload);
        };

        this.on(event, onceWrapper);
      } else {
        return new Promise<T>((resolve) => {
          const onceWrapper = async (data: SocketData) => {
            if (request && data.request !== request) {
              return;
            }
            this.off(event, onceWrapper);
            resolve(data?.payload || data);
          };

          this.on(event, onceWrapper);
        });
      }
    } catch (error) {
      this.sendWarning("Failed to listen for event: " + event);
      console.error(
        `Error in once() for app ${this.manifest?.id || "unset"}`,
        error
      );
    }
  }

  public fetchData = async <t>(
    type: ServerEvent,
    requestData: ToServerData,
    request?: string
  ): Promise<t | undefined> => {
    const timeout = new Promise<undefined>((_, reject) => {
      setTimeout(() => reject(new Error("FetchData request timed out")), 5000);
    });

    const dataPromise = new Promise<t>((resolve) => {
      this.once(
        type,
        (data) => {
          resolve(data as t);
        },
        request
      );
      this.sendData(requestData.type, requestData.payload, requestData.request);
    });

    return Promise.race([dataPromise, timeout]).catch(() => undefined);
  };

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
  private sendData(
    event: SEND_TYPES | string,
    payload: any,
    request?: string | unknown
  ): void {
    if (this.toServer == null) {
      console.error("\x1b[2m%s\x1b[0m", "toServer is not defined. Unable to send", { event, payload, request }); // cant use deskthing erroring because toServer does not exist
      return;    }
    const ToServerData: ToServerData = {
      type: event,
      request: request || "default",
      payload: payload,
    };

    this.toServer(ToServerData);
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
   * deskThing.on('songData', (data: SocketData) => {
   *   const musicData = data.payload as SongData;
   * });
   */
  send(payload: SocketData): void {
    this.sendData(SEND_TYPES.SEND, payload);
  }

  /**
   *
   */
  log = async (logType: LOGGING_LEVELS, message: string): Promise<void> => {
    this.sendData(SEND_TYPES.LOG, message, logType);
  };

  /**
   * Sends a plain text message to the server. This will display as a gray notification on the DeskThingServer GUI
   *
   * @since 0.8.0
   * @param message - The message to send to the server.
   * @deprecated - Use {@link DeskThing.sendLog} or {@link DeskThing.sendWarning} instead
   * @example
   * deskThing.sendMessage('Hello, Server!');
   */
  sendMessage(message: string): void {
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
  sendLog(log: string): void {
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
  sendWarning(warning: string): void {
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
  sendError(message: string): void {
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
  sendFatal(message: string): void {
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
  sendDebug(message: string): void {
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
  sendDataToOtherApp(appId: string, payload: ToServerData): void {
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
  async getData(): Promise<SavedData | null> {
    if (!this.appData?.data) {
      const data = await this.fetchData<SavedData>(
        ServerEvent.DATA,
        { type: SEND_TYPES.GET, request: "data", payload: "" }
      );
      if (!data) {
        this.sendError("[getData]: Data not available");
        return null;
      }
      return data;
    } else {
      return this.appData.data;
    }
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
  async getAppData(): Promise<AppDataInterface | null> {
    if (!this.appData) {
      const data = await this.fetchData<AppDataInterface>(ServerEvent.APPDATA, {
        type: SEND_TYPES.GET,
        request: "appData",
        payload: "",
      });
      if (!data) {
        this.sendError("[getAppData]: Data not available");
        return null;
      }
      return data;
    } else {
      return this.appData;
    }
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
  async getConfig(name: string) {
    // Request config data from the server
    this.requestData("config", name);

    // Race between the data being received and a timeout
    return await Promise.race([
      this.once(ServerEvent.CONFIG),
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
    if (!this.settings) {
      const settings = await this.fetchData<AppSettings>(ServerEvent.SETTINGS, {
        type: SEND_TYPES.GET,
        payload: "",
        request: "settings",
      });
      if (settings) {
        this.settings = settings;
        return settings;
      } else {
        this.sendLog("Settings are not defined!");
        return null;
      }
    } else {
      return this.settings;
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
      const response = await this.once(ServerEvent.INPUT);

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
   * @param notifyServer - Leave true. Otherwise the settings will not be saved to the server.
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
  addSettings(settings: AppSettings, notifyServer = true): void {
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

        if (!this.settings) return;
        if (!setting.type || !setting.label) {
          throw new Error(`Setting ${id} must have a type and label`);
        }

        if (this.settings[id]) {
          this.sendWarning(
            `Setting with label "${setting.label}" already exists. It will be overwritten.`
          );
        }
        try {
          this.settings[id] = sanitizeSettings(setting);
        } catch (error) {
          if (error instanceof Error) {
            this.sendError(
              `Error sanitizing setting with label "${setting.label}": ${error.message}`
            );
          } else {
            this.sendError(
              `Error sanitizing setting with label "${setting.label}": ${error}`
            );
            // ik its bad but oh well
            console.error(error);
          }
        }
      });

      this.notifyListeners(ServerEvent.SETTINGS, { type: ServerEvent.SETTINGS, payload: this.settings });
      notifyServer && this.sendData(SEND_TYPES.SET, this.settings, "settings");
    }
  }

  /**
   * Initializes the settings and assumes the settings provided by the server are preferred over the passed settings.
   * Should be used for startup settings and only startup settings
   *
   * @param settings The settings object
   */
  async initSettings(settings: AppSettings): Promise<void> {
    if (!this.settings) {
      await this.getSettings(); // ensures an attempt is made to get settings from the server
    }
    const newSettings = Object.fromEntries(
      Object.entries(settings).filter(
        ([key]) => !this.settings || !(key in this.settings)
      )
    ) as AppSettings;

    this.addSettings(newSettings); // only add the new settings
  }

  /**
   * Deletes settings from the server
   *
   * @example
   * // Delete a single setting
   * server.deleteSetting('color');
   */
  async deleteSettings(settingIds: string | string[]) {
    const deleteSettings = Array.isArray(settingIds)
      ? settingIds
      : [settingIds];
    deleteSettings.forEach((settingId) => {
      if (this.settings) {
        delete this.settings[settingId];
      }
    });

    this.settings && this.notifyListeners(ServerEvent.SETTINGS, { type: ServerEvent.SETTINGS, payload: this.settings });
    this.sendData(SEND_TYPES.DELETE, settingIds, "settings");
  }

  /**
   * Deletes data from the server
   *
   * @example
   * // Delete a single data item
   * server.deleteData('client_id');
   *
   */
  async deleteData(dataIds: string | string[]) {
    const deleteSettings = Array.isArray(dataIds) ? dataIds : [dataIds];
    deleteSettings.forEach((dataIds) => {
      if (this.appData?.data) {
        delete this.appData.data[dataIds];
      }
    });

    this.appData?.data && this.notifyListeners(ServerEvent.DATA, { type: ServerEvent.DATA, payload: this.appData.data });
    this.sendData(SEND_TYPES.DELETE, dataIds, "data");
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
  registerAction(action: Action): void {
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
  registerActionObject(action: Action): void {
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
  updateIcon(id: string, icon: string): void {
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
  registerKey(
    id: string,
    description: string,
    modes: EventMode[],
    version: string
  ): void {
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
  registerKeyObject(key: Omit<Key, "source" | "enabled">): void {
    if (!key || typeof key !== "object") {
      throw new Error("Invalid key object");
    }

    if (!key.modes || !Array.isArray(key.modes) || key.modes.length === 0) {
      throw new Error("Key must have valid modes");
    }
    if (typeof key.id !== "string") {
      throw new Error("Key must have a valid id");
    }

    const newKey: Key = {
      ...key,
      source: this.manifest?.id || "unknown",
      enabled: true,
    };

    this.sendData(SEND_TYPES.KEY, key, "add");
  }

  /**
   * Removes an action with the specified identifier.
   *
   * @param id - The unique identifier of the action to be removed.
   */
  removeAction(id: string): void {
    this.sendData(SEND_TYPES.ACTION, { id }, "remove");
  }

  /**
   * Removes a key with the specified identifier.
   *
   * @param id - The unique identifier of the key to be removed.
   */
  removeKey(id: string): void {
    this.sendData(SEND_TYPES.KEY, { id }, "remove");
  }
  public tasks = {
    /**
     * Adds a new task.
     * @param taskData - The data for the new task.
     * @example
     * deskthing.tasks.add({
     *    id: 'task-id',
     *    version: '1.0.0',
     *    available: true,
     *    completed: false,
     *    label: 'Task Name',
     *    started: false,
     *    currentStep: 'step-1',
     *    description: 'Task Description',
     *    steps: {
     *      'step-1': {
     *        id: 'step-1',
     *        type: STEP_TYPES.STEP,
     *        completed: false,
     *        label: 'Step 1',
     *        instructions: 'Step 1 instructions'
     *      }
     *    }
     * });
     */
    add: (taskData: Omit<Task, "source">) => {
      try {
        const newTask = {
          ...taskData,
          source: this.manifest?.id || "unknown",
        };
        isValidTask(newTask);
        this.sendData(SEND_TYPES.TASK, { task: newTask }, "add");
      } catch (error) {
        if (error instanceof Error) {
          this.sendWarning("Invalid task data:" + error.message);
        }
        throw error;
      }
    },
    /**
     * Initializes the tasks
     */
    initTasks: async (
      taskData: Record<string, Omit<Task, "source">>
    ): Promise<void> => {
      try {
        const newTasks = Object.entries(taskData).reduce<Record<string, Task>>(
          (validatedTasks, [_id, task]) => {
            try {
              const newTask = {
                ...task,
                source: this.manifest?.id || "unknown",
              };
              isValidTask(newTask);
              return { ...validatedTasks, [newTask.id]: newTask };
            } catch (error) {
              this.sendWarning(
                `Task ${task.label || task.id} failed to be verified: ` +
                  (error instanceof Error && error.message)
              );
              return validatedTasks;
            }
          },
          {}
        );

        this.sendData(SEND_TYPES.TASK, { tasks: newTasks }, "init");
      } catch (error) {
        this.sendWarning(
          "Invalid task data:" + (error instanceof Error && error.message)
        );
      }
    },
    /**
     * Updates a specific step within a task
     * @param taskId - The ID of the task containing the step
     * @param stepId - The ID of the step to update
     * @param updates - The partial step data to update
     * @example
     * deskthing.tasks.update('task-id', 'step-1', {
     *   completed: true,
     *   label: 'Updated Step Label',
     *   instructions: 'New instructions'
     * });
     */
    update: (taskId: string, task: Partial<Task>) => {
      const validStepFields: (keyof Task)[] = [
        "id",
        "label",
        "completed",
        "currentStep",
        "started",
        "source",
        "version",
        "available",
        "description",
        "steps",
      ];
      const sanitizedUpdates = Object.fromEntries(
        Object.entries(task).filter(([key]) =>
          validStepFields.includes(key as keyof Task)
        )
      );
      this.sendData(
        SEND_TYPES.TASK,
        { taskId, task: { ...sanitizedUpdates, id: taskId } },
        "update"
      );
    },
    /**
     * Deletes a task by its ID
     * @param taskId - The ID of the task to delete
     * @example
     * deskthing.tasks.delete('task-id');
     */
    delete: (taskId: string) => {
      this.sendData(SEND_TYPES.TASK, { taskId }, "delete");
    },

    /**
     * Marks a task as completed
     * @param taskId - The ID of the task to complete
     * @example
     * deskthing.tasks.complete('task-id');
     */
    complete: (taskId: string) => {
      this.sendData(SEND_TYPES.TASK, { taskId }, "complete");
    },

    /**
     * Restarts a task, resetting its progress
     * @param taskId - The ID of the task to restart
     * @example
     * deskthing.tasks.restart('task-id');
     */
    restart: (taskId: string) => {
      this.sendData(SEND_TYPES.TASK, { taskId }, "restart");
    },

    /**
     * Marks a task as started
     * @param taskId - The ID of the task to start
     * @example
     * deskthing.tasks.start('task-id');
     */
    start: (taskId: string) => {
      this.sendData(SEND_TYPES.TASK, { taskId }, "start");
    },

    /**
     * Ends a task without completing it
     * @param taskId - The ID of the task to end
     * @example
     * deskthing.tasks.end('task-id');
     */
    end: (taskId: string) => {
      this.sendData(SEND_TYPES.TASK, { taskId }, "end");
    },

    /**
     * Retrieves task information
     * @param taskId - Optional ID of the specific task to get. If omitted, returns all tasks
     * @example
     * // Get all tasks
     * deskthing.tasks.get();
     *
     * // Later, listen for tasks
     * deskthing.on()
     */
    get: () => {
      this.sendData(SEND_TYPES.TASK, {}, "get");
    },
  };

  public steps = {
    /**
     * Adds a new step to the specified task.
     * @param taskId - The unique identifier of the task to which the step belongs.
     * @param stepData - The data for the new step.
     * @example
     * // Basic step
     * deskthing.steps.add('task-id', {
     *    id: 'step-id',
     *    type: STEP_TYPES.STEP,
     *    label: 'Step Name',
     *    instructions: 'Step Description',
     *    completed: false,
     *    debug: false,
     *    strict: false,
     *    parentId: 'parent-task-id'
     * });
     *
     * // Action step
     * deskthing.steps.add('task-id', {
     *    id: 'action-step',
     *    type: STEP_TYPES.ACTION,
     *    label: 'Run Action',
     *    instructions: 'Execute this action',
     *    completed: false,
     *    action: {
     *      id: 'action-id',
     *      value: 'example-value',
     *      enabled: true,
     *      source: 'system'
     *    } as ActionReference
     * });
     *
     * // External step
     * deskthing.steps.add('task-id', {
     *    id: 'external-step',
     *    type: STEP_TYPES.EXTERNAL,
     *    label: 'External Task',
     *    instructions: 'Complete this external task',
     *    completed: false,
     *    url: 'https://example.com'
     * });
     *
     * // Task step
     * deskthing.steps.add('task-id', {
     *    id: 'task-step',
     *    type: STEP_TYPES.TASK,
     *    label: 'Complete Task',
     *    instructions: 'Complete the referenced task',
     *    completed: false,
     *    taskId: 'referenced-task-id'
     * });
     *
     * // Shortcut step
     * deskthing.steps.add('task-id', {
     *    id: 'shortcut-step',
     *    type: STEP_TYPES.SHORTCUT,
     *    label: 'Navigate',
     *    instructions: 'Go to location',
     *    completed: false,
     *    destination: 'settings/general'
     * });
     *
     * // Setting step
     * deskthing.steps.add('task-id', {
     *    id: 'setting-step',
     *    type: STEP_TYPES.SETTING,
     *    label: 'Configure Setting',
     *    instructions: 'Set up configuration',
     *    completed: false,
     *    setting: {
     *      value: 'example',
     *      type: 'string',
     *      label: 'Example Setting',
     *      description: 'An example string setting'
     *    } as SettingsString
     * });
     * @throws {Error} If the step data is invalid.
     */
    add: (taskId: string, stepData: Step) => {
      try {
        isValidStep(stepData);
        this.sendData(SEND_TYPES.STEP, { taskId, step: stepData }, "add");
      } catch (error) {
        if (error instanceof Error) {
          this.sendWarning("Invalid step data:" + error.message);
        }
      }
    },
    /**
     * Updates an existing step with the provided updates.
     * Only allows updating valid step fields and sanitizes the input.
     *
     * @param taskId - The ID of the task containing the step
     * @param stepId - The ID of the step to update
     * @param updates - Partial Step object containing the fields to update
     */
    update: (taskId: string, stepId: string, updates: Partial<Step>) => {
      const validStepFields: string[] = [
        "parentId",
        "id",
        "debug",
        "strict",
        "type",
        "label",
        "instructions",
        "completed",
        "debugging",
        "action",
        "url",
        "taskId",
        "destination",
        "setting",
      ];
      const sanitizedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([key]) => validStepFields.includes(key))
      );
      this.sendData(
        SEND_TYPES.STEP,
        { taskId, step: { ...sanitizedUpdates, id: stepId } },
        "update"
      );
    },

    /**
     * Deletes a step from a task.
     *
     * @param taskId - The ID of the task containing the step
     * @param stepId - The ID of the step to delete
     */
    delete: (taskId: string, stepId: string) => {
      this.sendData(SEND_TYPES.STEP, { taskId, stepId }, "delete");
    },

    /**
     * Marks a step as completed.
     *
     * @param taskId - The ID of the task containing the step
     * @param stepId - The ID of the step to complete
     */
    complete: (taskId: string, stepId: string) => {
      this.sendData(SEND_TYPES.STEP, { taskId, stepId }, "complete");
    },

    /**
     * Restarts a step by resetting its state.
     *
     * @param taskId - The ID of the task containing the step
     * @param stepId - The ID of the step to restart
     */
    restart: (taskId: string, stepId: string) => {
      this.sendData(SEND_TYPES.STEP, { taskId, stepId }, "restart");
    },

    /**
     * Retrieves a specific step from a task.
     *
     * @param taskId - The ID of the task containing the step
     * @param stepId - The ID of the step to retrieve
     */
    get: (taskId: string, stepId: string) => {
      this.sendData(SEND_TYPES.STEP, { taskId, stepId }, "get");
    },
  };
  /**
   * Saves the provided data by merging it with the existing appdata and updating settings.
   * Sends the updated data to the server and notifies listeners.
   *
   * @param data - The data to be saved and merged with existing data.
   */
  saveAppData(data?: AppDataInterface, sync = true): void {
    if (data) {
      this.appData = {
        ...this.appData,
        ...data,
      };
    }

    if (data?.settings) {
      this.sendError(
        "[saveAppData] ERROR saveAppData() no longer saves settings! use saveSettings() instead!"
      );
    }

    sync && this.sendData(SEND_TYPES.SET, this.appData, "appdata");
    this.appData && this.notifyListeners(ServerEvent.APPDATA, { type: ServerEvent.APPDATA, payload: this.appData });
  }

  /**
   * Saves the provided data by merging it with the existing data and updating settings.
   * Sends the updated data to the server and notifies listeners.
   *
   * @param data - The data to be saved and merged with existing data.
   */
  saveData(data: SavedData, sync = true): void {
    if (data && this.appData) {
      this.appData.data = {
        ...this.appData.data,
        ...data,
      };
    } else {
      this.appData = {
        version: "",
        data: data,
      };
    }

    this.appData.data && this.notifyListeners(ServerEvent.DATA, { type: ServerEvent.DATA, payload: this.appData.data });
    sync && this.sendData(SEND_TYPES.SET, this.appData.data, "data");
  }

  /**
   * Typically redundant - it ensures the settings are saved to the server
   * Triggers DeskThing.on('settings', () => void)
   *
   * @param data - The data to be saved and merged with existing data.
   */
  saveSettings(settings?: AppSettings, sync = true): void {
    if (settings) {
      this.addSettings(settings, sync);
    } else {
      this.appData?.settings && this.notifyListeners(ServerEvent.SETTINGS, { type: ServerEvent.SETTINGS, payload: this.appData.settings });
    }
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
  scheduleTask(
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
   * @deprecated Use {@link DeskThing.scheduleTask} instead for repeated tasks or {@link DeskThing.addThread} for single-use long-running tasks like websockets
   * @param task
   * @param timeout
   * @returns
   */
  addBackgroundTaskLoop(
    task: () => Promise<boolean | void>,
    timeout?: number
  ): () => void {
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
   *    const [ remove, worker ] = DeskThing.addThread('./workers/websocket.js');
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
   * @example // Ex: How to pass data to worker thread
   * import { parentPort, workerData } from 'worker_threads';
   *
   * // Access passed data
   * console.log(workerData.someValue);
   *
   * // Use the data in your worker logic
   * parentPort?.postMessage({
   *     type: 'init',
   *     config: workerData
   * });
   *
   * // Main thread
   * const config = {
   *     interval: 1000,
   *     url: 'wss://example.com'
   * };
   *
   * const [worker, terminate] = DeskThing.addThread('./workers/websocket.js', config);
   */
  addThread(
    workerPath: string,
    workerData?: any
  ): [worker: Worker, terminate: () => void] {
    // Verify file exists
    const resolvedPath = path.resolve(__dirname, workerPath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Worker file not found: ${workerPath}`);
    }

    // Create worker with error handling
    const worker = new Worker(resolvedPath, { workerData });

    // Handle worker errors
    worker.on("error", (error) => {
      this.sendError(`Worker error: ${error.message}`);
    });

    // Handle worker exit
    worker.on("exit", (code) => {
      if (code !== 0) {
        this.sendWarning(`Worker stopped with exit code ${code}`);
      }
      this.sendLog(`Worker terminated`);
    });

    const terminate = () => {
      try {
        worker.terminate();
      } catch (error) {
        if (error instanceof Error) {
          this.sendError(`Failed to terminate worker: ${error.message}`);
        } else {
          this.sendError(`Failed to terminate worker: ${error}`);
          console.error("[addThread - app]: Unknown error: ", error);
        }
      }
    };

    this.backgroundTasks.push(terminate);
    return [worker, terminate];
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
    headers?: SavedData,
    retries = 0
  ): Promise<string> {
    if (!url || typeof url !== "string") {
      throw new Error("Invalid URL provided");
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0",
          ...headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("image")) {
        throw new Error(
          `Invalid content type: ${contentType}. Expected image/*`
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error("Received empty image data");
      }

      const bufferData = Buffer.from(arrayBuffer);
      const imgData = `data:image/${type};base64,${bufferData.toString(
        "base64"
      )}`;
      return imgData;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.sendError(`Error fetching ${type} from ${url}: ${errorMessage}`);
      console.error(`Error fetching ${type}:`, error);

      if (retries > 0) {
        const delay = Math.min(1000 * (4 - retries), 3000); // Exponential backoff
        this.sendWarning(
          `Retrying in ${delay / 1000}s... (${retries} attempts left)`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.encodeImageFromUrl(url, type, headers, retries - 1);
      }

      throw new Error(
        `Failed to fetch image after ${3 - retries} attempts: ${errorMessage}`
      );
    }
  }

  /**
   * Saves an image from a URL to a local directory and tracks the file path
   *
   * @param url - The direct URL to the image or local file path
   * @returns Promise resolving to the saved image's filename
   */
  async saveImageReferenceFromURL(
    url: string,
    headers?: Record<string, string>
  ): Promise<string | null> {

    if (!this.manifest) {
      this.loadManifest();
    }

    return this.imageHandler.saveImageReference(url, this.manifest?.id || '', headers)
  }
  /**
   * -------------------------------------------------------
   * Deskthing Server Functions
   */

  /**
   * Fetches the manifest
   * @returns Manifest | null
   */
  private loadManifest(): AppManifest | null {
    if (this.manifest) {
      return this.manifest;
    }

    const builtManifestPath = path.resolve( process.env.DESKTHING_ROOT_PATH || __dirname, "../manifest.json");
    const devManifestPath = path.resolve(
      process.env.DESKTHING_ROOT_PATH || __dirname,
      "../deskthing/manifest.json"
    );
    console.log(devManifestPath)
    const oldBuiltManifestPath = path.resolve( process.env.DESKTHING_ROOT_PATH || __dirname, "./manifest.json");
    const oldDevManifestPath = path.resolve(
      process.env.DESKTHING_ROOT_PATH || __dirname,
      "../public/manifest.json"
    );

    const errors: unknown[] = [];

    // Try built manifest path first
    if (fs.existsSync(builtManifestPath)) {
      try {
        const manifestData = fs.readFileSync(builtManifestPath, "utf-8");
        this.manifest = JSON.parse(manifestData) as AppManifest | null;
        return this.manifest;
      } catch (error) {
        console.error("Failed to load built manifest:");
        errors.push(error);
      }
    }

    // Try dev manifest path
    if (fs.existsSync(devManifestPath)) {
      try {
        const manifestData = fs.readFileSync(devManifestPath, "utf-8");
        this.manifest = JSON.parse(manifestData) as AppManifest | null;
        return this.manifest;
      } catch (error) {
        console.error("Failed to load dev manifest:");
        errors.push(error);
      }
    }

    // Try old built manifest path
    if (fs.existsSync(oldBuiltManifestPath)) {
      try {
        const manifestData = fs.readFileSync(oldBuiltManifestPath, "utf-8");
        this.manifest = JSON.parse(manifestData) as AppManifest | null;
        return this.manifest;
      } catch (error) {
        console.error("Failed to load old built manifest:");
        errors.push(error);
      }
    }

    // Try old dev manifest path
    if (fs.existsSync(oldDevManifestPath)) {
      try {
        const manifestData = fs.readFileSync(oldDevManifestPath, "utf-8");
        this.manifest = JSON.parse(manifestData) as AppManifest | null;
        return this.manifest;
      } catch (error) {
        console.error("Failed to load old dev manifest:");
        errors.push(error);
      }
    }

    // If all attempts fail, log an error and return null
    console.error(
      "[loadManifest] Failed to load manifest from any location:",
      errors
    );

    console.log("[loadManifest]: Manifest not found in any location");
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
   * @deprecated - Use {@link DeskThing.on}('start', () => startupTasks) instead
   * @returns
   */
  async start({ toServer, SysEvents }: startData): Promise<Response> {
    this.toServer = toServer;
    this.SysEvents = SysEvents;
    this.stopRequested = false;

    try {
      await this.notifyListeners(ServerEvent.START, {
        type: ServerEvent.START
      });
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
   * @deprecated - Use {@link DeskThing.on}('stop', () => {}) instead
   * @returns
   */
  async stop(): Promise<Response> {
    try {
      if (this.appData) {
        this.saveAppData();
      }
      // Notify listeners of the stop event
      await this.notifyListeners(ServerEvent.STOP, {
        type: ServerEvent.STOP,
        request: undefined
      });

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
   * @deprecated - Use {@link DeskThing.on}('purge', () => {}) instead
   * @returns
   */
  async purge(): Promise<Response> {
    try {
      // Notify listeners of the stop event
      await this.notifyListeners(ServerEvent.PURGE, {
        type: ServerEvent.PURGE,
        request: undefined
      });

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
    this.appData = null;
    this.Listeners = {};
    this.manifest = null;
    this.SysEvents = null;
    this.stopRequested = false;
    this.backgroundTasks = [];
    this.sysListeners.forEach((removeListener) => removeListener());
    this.sysListeners = [];
    Promise.all(
      Object.entries(this.imageUrls).map(async ([url, id]) => {
        try {
          const imagePath = path.join(__dirname, id);
          await fs.promises.unlink(imagePath);
          delete this.imageUrls[url];
        } catch (err) {
          console.warn(`Failed to delete image ${id}:`, err);
        }
      })
    );

    this.sendLog("Cache cleared");
    this.toServer = null;
  }

  /**
   * @deprecated - Use {@link DeskThing.on}('data', () => {}) instead
   * @returns
   */
  async toClient(data: EventPayload): Promise<void> {
    try {
      if (!data) return;

      if (process.env.DESKTHING_ENV == 'development') {
        // console.log('toClient:', data);
      }

      switch (data.type) {
        case "appdata":
          if (typeof data.payload === "object" && data !== null) {
            this.saveAppData(data.payload, false); // ensure it only saves locally in cache
          } else {
            this.sendWarning("Received invalid data from server:" + data);
            this.initializeData();
          }
          break;
        case "data":
          if (typeof data.payload === "object" && data !== null) {
            this.saveData(data.payload, false); // ensure it only saves locally in cache
          } else {
            this.sendWarning("Received invalid data from server:" + data);
            this.initializeData();
          }
          break;
        case "message":
          this.sendLog("Received message from server:" + data.payload);
          break;
        case "settings":
          this.sendLog("Received settings from server:" + data.payload);
          if (!data.payload) {
            this.sendLog("Received invalid settings from server:" + data);
          } else {
            const settings: AppSettings = data.payload;
            this.addSettings(settings, false);
            this.appData && this.notifyListeners(ServerEvent.APPDATA, { type: ServerEvent.APPDATA, payload: this.appData });
          }
          break;
        default:
          this.notifyListeners(data.type, data);
          break;
      }
    } catch (error) {
      this.sendLog("Encountered an error in toClient" + (error instanceof Error  ? error.message : error))
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
