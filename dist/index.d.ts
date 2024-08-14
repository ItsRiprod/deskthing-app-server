type DeskthingListener = (...args: any[]) => void;
export type IncomingEvent = 'message' | 'data' | 'get' | 'set' | 'callback-data' | 'start' | 'stop' | 'input';
export type OutgoingEvent = 'message' | 'data' | 'get' | 'set' | 'add' | 'open' | 'toApp' | 'error' | 'log';
export type GetTypes = 'data' | 'config' | 'input';
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
export interface Settings {
    [key: string]: {
        value: string | boolean;
        label: string;
        options: {
            label: string;
            value: string | boolean;
        }[];
    };
}
export interface InputResponse {
    [key: string]: string | boolean;
}
export interface SocketData {
    app: string;
    type: string;
    request?: string;
    data?: Array<string> | string | object | number | {
        [key: string]: string | Array<string>;
    };
}
interface DataInterface {
    [key: string]: string | Settings | undefined;
    settings?: Settings;
}
type toServer = (event: OutgoingEvent, data: any) => void;
type SysEvents = (event: string, listener: (...args: any[]) => void) => () => void;
type startData = {
    toServer: toServer;
    SysEvents: SysEvents;
};
type Response = {
    data: any;
    status: number;
    statusText: string;
    request: string[];
};
export declare class DeskThing {
    private static instance;
    private Listeners;
    private manifest;
    private toServer;
    private SysEvents;
    private sysListeners;
    private data;
    private settings;
    private backgroundTasks;
    stopRequested: boolean;
    constructor();
    static getInstance(): DeskThing;
    private initializeData;
    private notifyListeners;
    on(event: IncomingEvent, callback: DeskthingListener): () => void;
    off(event: IncomingEvent, callback: DeskthingListener): void;
    onSystem(event: string, listener: (...args: any[]) => void): () => void;
    once(event: IncomingEvent): Promise<any>;
    private sendData;
    private requestData;
    send(event: OutgoingEvent, ...args: any[]): void;
    sendMessage(message: string): void;
    sendLog(message: string): void;
    sendError(message: string): void;
    sendDataToOtherApp(appId: string, data: any): void;
    sendDataToClient(data: SocketData): void;
    openUrl(url: string): void;
    getData(): Promise<DataInterface | null>;
    getConfig(name: string): void;
    getSettings(): Promise<Settings | null>;
    getUserInput(scopes: AuthScopes): Promise<InputResponse | null>;
    addSetting(label: string, defaultValue: string | boolean, options: {
        label: string;
        value: string | boolean;
    }[]): void;
    saveData(data: DataInterface): void;
    addBackgroundTask(task: () => Promise<void>): () => void;
    /**
     * Deskthing Server Functions
     */
    private loadManifest;
    getManifest(): Response;
    start({ toServer, SysEvents }: startData): Promise<Response>;
    stop(): Promise<Response>;
    private clearCache;
    toClient(channel: IncomingEvent, ...args: any[]): void;
}
declare const _default: DeskThing;
export default _default;
