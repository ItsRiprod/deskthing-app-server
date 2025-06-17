import { Action, ActionReference } from "@deskthing/types"

/**
 * Validates the required fields of an action
 * @param action - The action to validate
 * @throws Error if any required field is missing or invalid
 */
export const isValidAction: (action: unknown) => asserts action is Action = (action) => {
    if (!action || typeof action !== 'object') throw new Error('Action must be an object')
    const actionObj = action as Action
    if (typeof actionObj.id !== 'string') throw new Error('Action id must be a string')

    if (typeof actionObj.version !== 'string') {
      throw new Error('Action version must be a string')
    }
  
    if (typeof actionObj.enabled !== 'boolean') {
      throw new Error('Action enabled must be a boolean')
    }

    if (typeof actionObj.name !== 'string') {
      throw new Error('Action name must be a string')
    }

    if (typeof actionObj.version_code !== 'number') {
      throw new Error('Action version_code must be a number')
    }
    if (actionObj.description !== undefined && typeof actionObj.description !== 'string') {
      throw new Error('Action description must be a string')
    }

    if (actionObj.value !== undefined && typeof actionObj.value !== 'string') {
      throw new Error('Action value must be a string')
    }

    if (actionObj.value_options !== undefined && !Array.isArray(actionObj.value_options)) {
      throw new Error('Action value_options must be an array of strings')
    }

    if (actionObj.value_instructions !== undefined && typeof actionObj.value_instructions !== 'string') {
      throw new Error('Action value_instructions must be a string')
    }

    if (actionObj.icon !== undefined && typeof actionObj.icon !== 'string') {
      throw new Error('Action icon must be a string')
    }

    if (actionObj.tag !== undefined && !['nav', 'media', 'basic'].includes(actionObj.tag)) {
      throw new Error('Action tag must be one of: nav, media, basic')
    }
}
/**
 * Validates the required fields of an action
 * @param action - The action to validate
 * @throws Error if any required field is missing or invalid
 */
export const isValidActionReference: (action: unknown) => asserts action is ActionReference = (action) => {
    if (typeof action !== 'object' || !action) {
      throw new Error('validateActionReference: action is not a valid object')
    }

    const actionRef = action as ActionReference;

    if (typeof actionRef.id !== 'string') {
      throw new Error('validateActionReference: id is not a valid string')
    }
  
    if (typeof actionRef.enabled !== 'boolean') {
        (action as ActionReference).enabled = true // Default to enabled
      console.warn(
        'validateActionReference: enabled was not set to a boolean value'
      )
    }
}