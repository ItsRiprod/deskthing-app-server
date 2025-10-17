export { DeskThing, DeskThingClass, createDeskThing } from './deskthing'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DESKTHING_URL?: string
      /** The name of the current app */
      DESKTHING_APP_NAME?: string
      /** The path to the LIB directory - a persistant directory between installs */
      DESKTHING_LIB_DIR?: string
      /** The path to the root directory */
      DESKTHING_ROOT_DIR?: string
      /** The version of DeskThing */
      DESKTHING_VERSION?: string
    }
  }
}