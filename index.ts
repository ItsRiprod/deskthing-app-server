import * as fs from 'fs';
import * as path from 'path';
type DeskthingListener = (...args: any[]) => void

export type IncomingEvent = 'message' | 'data' | 'get' | 'set' | 'callback-data' | 'start' | 'stop' | 'input' | 'action'
export type OutgoingEvent = 'message' | 'data' | 'get' | 'set' | 'add' | 'open' | 'toApp' | 'error' | 'log'
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
interface DataInterface {
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
    private backgroundTasks: Array<() => Promise<void>> = [];
    stopRequested: boolean = false

    constructor() {
        this.loadManifest();
        this.initializeData()
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

    async once(event: IncomingEvent): Promise<any> {
        return new Promise<any>((resolve) => {
            const onceWrapper = (...args: any[]) => {
                this.off(event, onceWrapper);
                resolve(args.length === 1 ? args[0] : args);
            };

            this.on(event, onceWrapper);
        });
    }

    private sendData(event: OutgoingEvent, ...data: any): void {
        //this.notifyListeners(event, data)
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
            console.error('Data is not defined.');
            this.requestData('data')
            const data = await this.once('data') // waits for the data response from the server
            if (data) {
                return data;
            } else {
                this.sendLog('Data is not defined!');
                return null
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

    async getUserInput(scopes: AuthScopes): Promise<InputResponse | null> {
        if (!scopes) {
            this.sendError('Scopes not defined in getUserInput!')
            return null
        }
        this.requestData('input', scopes)
        const response = await this.once('input')
        return response
    }

    addSetting(label: string, defaultValue: string | boolean, options: { label: string, value: string | boolean }[]): void {
        if (this.settings[label]) {
            console.warn(`Setting with label "${label}" already exists. It will be overwritten.`);
            this.sendLog(`Setting with label "${label}" already exists. It will be overwritten.`)
        }

        const setting = {
            value: defaultValue,
            label,
            options
        }

        this.settings[label] = setting
        this.sendData('add', { settings: this.settings })
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
    }

    addBackgroundTask(task: () => Promise<void>): () => void {
        const cancelToken = { cancelled: false };

        const wrappedTask = async () => {
            if (!cancelToken.cancelled) {
                await task();
            }
        };

        this.backgroundTasks.push(wrappedTask);

        return () => {
            cancelToken.cancelled = true;
            this.backgroundTasks = this.backgroundTasks.filter(t => t !== wrappedTask);
        };
    }



    /**
     * Deskthing Server Functions
     */
    private loadManifest(): void {
        let manifestPath: string;

        if (process.env.NODE_ENV === 'development') {
            manifestPath = path.resolve(__dirname, '../public/manifest.json');
        } else {
            manifestPath = path.resolve(__dirname, './manifest.json');
        }

        try {
            const manifestData = fs.readFileSync(manifestPath, 'utf-8');
            this.manifest = JSON.parse(manifestData);
        } catch (error) {
            console.error('Failed to load manifest:', error);
        }
    }

    getManifest(): Response {
        if (!this.manifest) {
            return {
                data: { message: 'Manifest not found or failed to load' },
                status: 500,
                statusText: 'Internal Server Error',
                request: []
            };
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
            this.backgroundTasks.forEach(task => task());
            console.log('Background tasks stopped');

            // Clear cached data
            this.clearCache();
            console.log('Cache cleared');

            // Optionally, force stop the Node.js process (if needed)
            // process.exit(0); // Uncomment if you want to forcefully exit

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
        this.notifyListeners(channel, ...args);

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
        }
    }
}

export default DeskThing.getInstance()