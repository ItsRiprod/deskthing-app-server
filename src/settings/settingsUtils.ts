import { CommonSetting, SETTING_TYPES, SettingsBoolean, SettingsColor, SettingsFile, SettingsList, SettingsMultiSelect, SettingsNumber, SettingsRange, SettingsRanked, SettingsSelect, SettingsString, SettingsType } from "@deskthing/types";

/**
 * Validates a setting.
 * @throws {Error} If the setting is not valid
 * @param setting The setting to validate
 */
export const isValidSettings: (setting: unknown) => asserts setting is SettingsType = (setting) => {
    if (!setting) {
        throw new Error('[isValidSetting] Setting must be a valid object');
    }
    if (typeof setting !== 'object') {
        throw new Error('[isValidSetting] Setting must be an object');
    }
    if ('type' in setting && typeof setting.type !== 'string') {
        throw new Error('[isValidSetting] Setting type must be a string');
    }
    if ('label' in setting && typeof setting.label !== 'string') {
        throw new Error('[isValidSetting] Setting label must be a string');
    }

    const typedSetting = setting as SettingsType;

    switch (typedSetting.type) {
        case SETTING_TYPES.NUMBER:
            if (typeof typedSetting.value !== 'number') throw new Error('[isValidSetting] Number setting value must be a number');
            if (typedSetting.min && typeof typedSetting.min !== 'number') throw new Error('[isValidSetting] Number setting min must be a number');
            if (typedSetting.max && typeof typedSetting.max !== 'number') throw new Error('[isValidSetting] Number setting max must be a number');
            if (typedSetting.step && typeof typedSetting.step !== 'number') throw new Error('[isValidSetting] Number setting max must be a number');
            break;
        case SETTING_TYPES.BOOLEAN:
            if (typeof typedSetting.value !== 'boolean') throw new Error('[isValidSetting] Boolean setting value must be a boolean');
            break;
        case SETTING_TYPES.STRING:
            if (typeof typedSetting.value !== 'string') throw new Error('[isValidSetting] String setting value must be a string');
            if (typedSetting.maxLength && typeof typedSetting.maxLength !== 'number') throw new Error('[isValidSetting] String setting maxLength must be a number');
            break;
        case SETTING_TYPES.SELECT:
        case SETTING_TYPES.MULTISELECT:
        case SETTING_TYPES.RANKED:
        case SETTING_TYPES.LIST:
            if (!Array.isArray(typedSetting.options)) throw new Error(`[isValidSetting] ${typedSetting.type} setting must have options array`);
            typedSetting.options.forEach(option => {
                if (typeof option.label !== 'string') throw new Error('[isValidSetting] Option label must be a string');
                if (typeof option.value !== 'string') throw new Error('[isValidSetting] Option value must be a string');
            });
            break;
        case SETTING_TYPES.RANGE:
            if (typeof typedSetting.value !== 'number') throw new Error('[isValidSetting] Range setting value must be a number');
            if (typedSetting.min && typeof typedSetting.min !== 'number') throw new Error('[isValidSetting] Range setting min must be a number');
            if (typedSetting.max && typeof typedSetting.max !== 'number') throw new Error('[isValidSetting] Range setting max must be a number');
            if (typedSetting.step && typeof typedSetting.step !== 'number') throw new Error('[isValidSetting] Range setting max must be a number');
            break;
        case SETTING_TYPES.COLOR:
            if (typedSetting.value && typeof typedSetting.value !== 'string') throw new Error('[isValidSetting] Color setting value must be a string');
            break;
        case SETTING_TYPES.FILE:
            break; // nothing is needed technically speaking
        default:
            throw new Error(`[isValidSetting] Invalid setting type: ${JSON.stringify(typedSetting)}`);
    }
}

/**
 * Sanitizes the Settings object to ensure it meets the required structure.
 * @throws Error if the settings are invalid.
 * @param setting 
 * @returns 
 */
export const sanitizeSettings: (
    setting: Partial<SettingsType>
) => SettingsType = (setting) => {

    isValidSettings(setting)
    const commonSettings: CommonSetting = {
        ...setting,
        disabled: setting.disabled,
        id: setting.id,
        label: setting.label || setting.id || '',
        value: setting.value,
        source: setting.source,
        description: setting.description || 'No Description',
    }

    switch (setting.type) {
        case SETTING_TYPES.SELECT:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.SELECT,
                value: setting.value,
                label: setting.label,
                description: setting.description || "",
                placeholder: setting.placeholder,
                options: setting.options,
            } as SettingsSelect
            break;
        case SETTING_TYPES.MULTISELECT:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.MULTISELECT,
                value: setting.value,
                label: setting.label,
                description: setting.description || "",
                placeholder: setting.placeholder,
                options: setting.options,
            } as SettingsMultiSelect
            break;
        case SETTING_TYPES.NUMBER:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.NUMBER,
                value: setting.value,
                label: setting.label,
                min: setting.min,
                max: setting.max,
                description: setting.description || "",
            } as SettingsNumber
            break;
        case SETTING_TYPES.BOOLEAN:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.BOOLEAN,
                value: setting.value,
                description: setting.description || "",
                label: setting.label,
            } as SettingsBoolean
            break;
        case SETTING_TYPES.STRING:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.STRING,
                description: setting.description || "",
                value: setting.value,
                label: setting.label,
            } as SettingsString
            break;
        case SETTING_TYPES.RANGE:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.RANGE,
                value: setting.value,
                label: setting.label,
                min: setting.min,
                max: setting.max,
                step: setting.step || 1,
                description: setting.description || "",
            } as SettingsRange
            break;
        case SETTING_TYPES.RANKED:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.RANKED,
                value: setting.value,
                label: setting.label,
                description: setting.description || "",
                options: setting.options,
            } as SettingsRanked
            break;
        case SETTING_TYPES.LIST:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.LIST,
                value: setting.value,
                label: setting.label,
                unique: setting.unique,
                orderable: setting.orderable,
                placeholder: setting.placeholder,
                maxValues: setting.maxValues,
                description: setting.description || "",
                options: setting.options || [],
            } as SettingsList
            break;
        case SETTING_TYPES.COLOR:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.COLOR,
                value: setting.value,
                label: setting.label,
                description: setting.description || "",
            } as SettingsColor
            break;
        case SETTING_TYPES.FILE:
            setting = {
                ...commonSettings,
                type: SETTING_TYPES.FILE,
                value: setting.value,
                label: setting.label,
                fileTypes: setting.fileTypes || [],
                placeholder: setting.placeholder || "",
            } as SettingsFile
            break;
        default:
            throw new Error(`[isValidSetting] Unknown setting type: ${setting}`);
    }
    return setting as SettingsType;
};

export const settingHasOptions: (setting: SettingsType) => asserts setting is SettingsRanked | SettingsList | SettingsSelect | SettingsMultiSelect = (setting) => {
    if (!setting) throw new Error('[settingHasOptions] Setting must be defined');
    if (!setting.type) throw new Error('[settingHasOptions] Setting type must be defined');
    return setting.type === SETTING_TYPES.RANKED || setting.type === SETTING_TYPES.LIST || setting.type === SETTING_TYPES.SELECT || setting.type === SETTING_TYPES.MULTISELECT;
}