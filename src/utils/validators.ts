import { Action, AppDataInterface, AppSettings, EventMode, Key } from "@deskthing/types";
import { isValidSettings } from "../settings/settingsUtils";
import { isValidTask } from "../tasks/taskUtils"

export const isValidAppDataInterface: (
  app: Partial<AppDataInterface>
) => asserts app is AppDataInterface = (app) => {
  if (!app) {
    throw new Error("App data interface is undefined");
  }
  if (typeof app !== "object") {
    throw new Error("App data interface is not an object");
  }
  if (!app.version) {
    throw new Error("App data interface version is undefined");
  }
  if (app.settings) {
    isValidAppSettings(app.settings);
  }
  if (app.tasks) {
    Object.values(app.tasks).forEach((task) => {
      isValidTask(task);
    });
  }
  if (app.actions) {
    Object.values(app.actions).forEach((action) => {
      isValidAction(action);
    });
  }
  if (app.keys) {
    Object.values(app.keys).forEach((key) => {
      isValidKey(key);
    });
  }
};

export const isValidAction: (action: unknown) => asserts action is Action = (action) => {
    if (!action || typeof action !== 'object') throw new Error('Action must be an object')
    const actionObj = action as Action
    if (typeof actionObj.id !== 'string') throw new Error('Action id must be a string')
    if (typeof actionObj.source !== 'string') throw new Error('Action source must be a string')
  
    if (typeof actionObj.version !== 'string') {
      actionObj.version = '0.0.0' // Default version
      console.warn('WARNING_MISSING_ACTION_VERSION')
    }
  
    if (typeof actionObj.enabled !== 'boolean') {
      actionObj.enabled = true // Default to enabled
      console.warn('WARNING_MISSING_ACTION_ENABLED')
    }
  }


export const isValidKey: (key: unknown) => asserts key is Key = (key) => {
  if (!key || typeof key !== "object") throw new Error("Key must be an object");
  const keyObj = key as Record<string, unknown>;
  if (typeof keyObj.id !== "string") throw new Error("Key id must be a string");
  if (typeof keyObj.source !== "string")
    throw new Error("Key source must be a string");
  if (typeof keyObj.version !== "string")
    throw new Error("Key version must be a string");
  if (typeof keyObj.enabled !== "boolean")
    throw new Error("Key enabled must be a boolean");
  if (!Array.isArray(keyObj.modes))
    throw new Error("Key modes must be an array");
  if (!keyObj.modes.every((Mode) => Object.values(EventMode).includes(Mode))) {
    throw new Error("Key modes must all be valid EventMode values");
  }
};

export const isValidAppSettings: (
  appSettings: Partial<AppSettings>
) => asserts appSettings is AppSettings = (appSettings) => {
  if (typeof appSettings !== "object") {
    throw new Error("[sanitizeAppSettings] App settings must be an object");
  }
  Object.entries(appSettings).forEach(([key, setting]) => {
    if (typeof setting !== "object") {
      throw new Error("[sanitizeAppSettings] App settings must be an object");
    }
    try {
      isValidSettings(setting);
    } catch (error) {
      console.error(`Failed to validate settings!`, error)
    }
  });
};
