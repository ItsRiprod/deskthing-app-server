import * as fs from 'fs';
import * as path from 'path';
type DeskthingListener = (...args: any[]) => void

export type IncomingEvent = 'message' | 'data' | 'get' | 'set' | 'callback-data' | 'start' | 'stop' | 'input' | 'action'
export type OutgoingEvent = 'message' | 'data' | 'get' | 'set' | 'add' | 'open' | 'toApp' | 'error' | 'log' | 'action' | 'button'
export type GetTypes = 'data' | 'config' | 'input'
export interface Manifest {
    type: string[]
    requires: Array<string>
    label: string
    version: string
    description?: string
    author?: string
    id: string
    isWebApp: boolean
    isLocalApp: boolean
    platforms: Array<string>
    homepage?: string
    repository?: string
}
export interface AuthScopes {
    [key: string]: {
        instructions: string
        label: string
        value?: string
    }
}
export interface Settings {
    [key: string]: {
        value: string | boolean
        label: string
        options:
        {
            label: string
            value: string | boolean
        }[]
    }
}

export interface InputResponse {
    [key: string]: string | boolean
}

export interface SocketData {
    app: string;
    type: string;
    request?: string;
    data?: Array<string> | string | object | number | { [key: string]: string | Array<string> };
}
export interface DataInterface {
    [key: string]: string | Settings | undefined
    settings?: Settings
}
type toServer = (event: OutgoingEvent, data: any) => void
type SysEvents = (event: string, listener: (...args: any[]) => void) => () => void

type startData = {
    toServer: toServer
    SysEvents: SysEvents
}

type Response = {
    data: any
    status: number
    statusText: string
    request: string[]
}

export class DeskThing {
    private static instance: DeskThing
    private Listeners: { [key in IncomingEvent]?: DeskthingListener[] } = {};
    private manifest: Manifest | null = null;
    private toServer: toServer | null = null
    private SysEvents: SysEvents | null = null
    private sysListeners: DeskthingListener[] = []
    private data: DataInterface = {}
    private settings: Settings = {}
    private backgroundTasks: Array<() => void> = [];
    private isDataBeingFetched: boolean = false
    stopRequested: boolean = false

    constructor() {
        this.loadManifest();
    }

    static getInstance(): DeskThing {
        if (!this.instance) {
            this.instance = new DeskThing()
        }
        return this.instance
    }

    private async initializeData() {
        const data = await this.getData()
        if (data) {
            this.data = data
            if (this.data.settings) {
                this.settings = this.data.settings
            }
        } else {
            if (this.data) {
                this.sendData('set', this.data)
            }
        }
    }

    private async notifyListeners(event: IncomingEvent, ...args: any[]): Promise<void> {
        const callbacks = this.Listeners[event]
        if (callbacks) {
            callbacks.forEach(callback => callback(...args));
        }
    }

    on(event: IncomingEvent, callback: DeskthingListener): () => void {
        if (!this.Listeners[event]) {
            this.Listeners[event] = []
        }
        this.Listeners[event]!.push(callback)

        return () => this.off(event, callback)
    }

    off(event: IncomingEvent, callback: DeskthingListener): void {
        if (!this.Listeners[event]) {
            return
        }
        this.Listeners[event] = this.Listeners[event]!.filter(cb => cb !== callback)
    }

    onSystem(event: string, listener: (...args: any[]) => void): () => void {
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

    async once(event: IncomingEvent, callback?: DeskthingListener): Promise<any> {
        if (callback) {
            const onceWrapper = (...args: any[]) => {
                this.off(event, onceWrapper);
                callback(...args);
            };
    
            this.on(event, onceWrapper);
        } else {
            return new Promise<any>((resolve) => {
                const onceWrapper = (...args: any[]) => {
                    this.off(event, onceWrapper);
                    resolve(args.length === 1 ? args[0] : args);
                };
    
                this.on(event, onceWrapper);
            });
        }
    }

    private sendData(event: OutgoingEvent, ...data: any): void {
        if (this.toServer == null) {
            console.error('toServer is not defined')
            return
        }

        this.toServer(event, data)
    }
    private requestData(event: GetTypes, scopes?: AuthScopes | string): void {
        const authScopes = scopes || {};
        this.sendData('get', event, authScopes)
    }

    send(event: OutgoingEvent, ...args: any[]): void {
        this.sendData(event, args)
    }

    sendMessage(message: string): void {
        this.send('message', message)
    }
    sendLog(message: string): void {
        this.send('log', message)
    }
    sendError(message: string): void {
        this.send('error', message)
    }
    sendDataToOtherApp(appId: string, data: any): void {
        this.send('toApp', { appId, data })
    }
    sendDataToClient(data: SocketData): void {
        this.send('data', data)
    }
    openUrl(url: string): void {
        this.send('open', url)
    }
    async getData(): Promise<DataInterface | null> {
        if (!this.data) {

            if (this.isDataBeingFetched) {
                return null; // Or consider queuing the request
            }
            this.isDataBeingFetched = true;
            this.requestData('data')
            try {
                const data = await Promise.race([
                    this.once('data'),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Data retrieval timed out')), 5000)) // Adjust timeout as needed
                ]);
    
                if (data) {
                    this.isDataBeingFetched = false;
                    return data;
                } else {
                    this.sendError('Data is not defined! Try restarting the app');
                    this.isDataBeingFetched = false;
                    return null;
                }
            } catch (error) {
                this.sendLog(`Error fetching data: ${error}`);
                this.isDataBeingFetched = false;
                return null;
            }
        } else {
            return this.data
        }
    }
    getConfig(name: string) {
        this.requestData('config', name)
    }
    async getSettings(): Promise<Settings | null> {
        if (!this.settings) {
            console.error('Settings are not defined!');
            const data = await this.getData()
            if (data && data.settings) {
                return data.settings;
            } else {
                this.sendLog('Settings are not defined!');
                return null
            }
        } else {
            return this.settings
        }
    }

    async getUserInput(scopes: AuthScopes, callback: DeskthingListener): Promise<void> {
        if (!scopes) {
            this.sendError('Scopes not defined in getUserInput!')
            return
        }
        try {
            // Wait for the 'input' event and pass the response to the callback
            const response = await this.once('input');
            
            if (callback && typeof callback === 'function') {
                callback(response);
            }
        } catch (error) {
            this.sendError(`Error occurred while waiting for input: ${error}`);
        }
    }

    addSetting(id: string, label: string, defaultValue: string | boolean, options: { label: string, value: string | boolean }[]): void {
        if (this.settings[id]) {
            console.warn(`Setting with label "${label}" already exists. It will be overwritten.`);
            this.sendLog(`Setting with label "${label}" already exists. It will be overwritten.`)
        }

        const setting = {
            value: defaultValue,
            label,
            options
        }

        this.settings[id] = setting
        this.sendData('add', { settings: this.settings })
    }

    registerAction(name: string, id: string, description: string, flair: string = ''): void {
        this.sendData('action', 'add', { name, id, description, flair })
    }

    registerKey(id: string): void {
        this.sendData('button', 'add', { id })
    }

    removeAction(id: string): void {
        this.sendData('action', 'remove', { id })
    }
    removeKey(id: string): void {
        this.sendData('button', 'remove', { id })
    }

    saveData(data: DataInterface): void {
        this.data = {
            ...this.data,
            ...data,
        };

        if (data.settings) {
            this.settings = {
                ...this.settings,
                ...data.settings,
            };
        }

        this.sendData('add', this.data)
        this.notifyListeners('data', this.data);
    }

    addBackgroundTaskKLoop(task: () => Promise<void>): () => void {
        const cancelToken = { cancelled: false };
    
        const wrappedTask = async (): Promise<void> => {
            while (!cancelToken.cancelled) {
                await task();
            }
        };
    
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
    private loadManifest(): void {
        const manifestPath = path.resolve(__dirname, './manifest.json');
        try {
            const manifestData = fs.readFileSync(manifestPath, 'utf-8');
            this.manifest = JSON.parse(manifestData);
        } catch (error) {
            console.error('Failed to load manifest:', error);
        }
    }

    getManifest(): Response {
        if (!this.manifest) {
            console.log('Manifest Not Found - trying to load manually...')
            this.loadManifest()
            if (!this.manifest) {
                return {
                    data: { message: 'Manifest not found or failed to load after 2nd attempt' },
                    status: 500,
                    statusText: 'Internal Server Error',
                    request: []
                };
            } else {
                console.log('Manifest loaded!') 
            }
        }

        return {
            data: this.manifest,
            status: 200,
            statusText: 'OK',
            request: []
        };
    }

    async start({ toServer, SysEvents }: startData): Promise<Response> {
        this.toServer = toServer
        this.SysEvents = SysEvents
        await this.initializeData()

        try {
            await this.notifyListeners('start')
        } catch (error) {
            console.error('Error in start:', error)
            return {
                data: { message: `Error in start: ${error}` },
                status: 500,
                statusText: 'Internal Server Error',
                request: []
            }
        }

        return {
            data: { message: 'App started successfully!' },
            status: 200,
            statusText: 'OK',
            request: []
        }
    }

    async stop(): Promise<Response> {
        try {
            // Notify listeners of the stop event
            await this.notifyListeners('stop');

            // Set flag to indicate stop request
            this.stopRequested = true;

            // Stop all background tasks
            this.backgroundTasks.forEach(cancel => cancel());
            this.sendLog('Background tasks stopped');

            // Clear cached data
            this.clearCache();
            this.sendLog('Cache cleared');

        } catch (error) {
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
    }

    // Method to clear cached data
    private clearCache(): void {
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

    toClient(channel: IncomingEvent, ...args: any[]): void {
        
        if (channel === 'data' && args.length > 0) {
            const [data] = args; // Extract the first argument as data
            if (typeof data === 'object' && data !== null) {
                this.saveData(data);
            } else {
                console.warn('Received invalid data from server:', data);
                this.sendLog('Received invalid data from server:' + data);
            }
        } else if (channel === 'message') {
            this.sendLog('Received message from server:' + args[0]);
        } else if (channel === 'set' && args[0] == 'settings' && args[1]) {
            const {id, value} = args[1]
            if (this.settings[id]) {
                this.sendLog(`Setting with label "${id}" changing from ${this.settings[id].value} to ${value}`)

                this.settings[id].value = value
                this.sendData('add', { settings: this.settings })
                this.notifyListeners('data', this.data);
            } else {
                this.sendLog(`Setting with label "${id}" not found`)
            }

        } else {
            this.notifyListeners(channel, ...args);
        }
    }
}

export default DeskThing.getInstance()