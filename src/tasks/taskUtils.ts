import {
  Task,
  Step,
  STEP_TYPES,
} from "@deskthing/types";
import { isValidAction, isValidActionReference } from "../actions/actionUtils";

export function isValidTask(task: unknown): asserts task is Task {
  if (!task || typeof task !== "object")
    throw new Error("Task must be an object");
  const t = task as Partial<Task>;

  if (!t.id) {
    throw new Error("[ValidateTask] Tasks must have an ID");
  }
  if (!t.source) {
    throw new Error(`[ValidateTask] Task ${t.id} does not have a source`);
  }
  if (!t.version) {
    throw new Error(
      `[ValidateTask] Task ${t.id} from ${t.source} must have a specified version`
    );
  }
  if (
    !t.steps ||
    typeof t.steps !== "object" ||
    Object.values(t.steps).length === 0
  ) {
    throw new Error(
      `[ValidateTask] Task ${t.id} from ${t.source} must have at least one specified step`
    );
  }

  for (const step of Object.values(t.steps)) {
    isValidStep(step);
  }
}

export function isValidStep(step: unknown): asserts step is Step {
  if (!step || typeof step !== "object")
    throw new Error("Step must be an object");
  const s = step as Partial<Step>;

  if (!s.id) {
    throw new Error("[ValidateStep] Step must have an ID");
  }
  if (!s.type) {
    throw new Error(`[ValidateStep] Step ${s.id} does not have a type`);
  }

  switch (s.type) {
    case STEP_TYPES.ACTION:
      isValidTaskAction(s);
      break;
    case STEP_TYPES.SHORTCUT:
      isValidTaskShortcut(s);
      break;
    case STEP_TYPES.SETTING:
      isValidTaskSetting(s);
      break;
    case STEP_TYPES.TASK:
      isValidTaskTask(s);
      break;
    case STEP_TYPES.EXTERNAL:
      isValidTaskExternal(s);
      break;
    case STEP_TYPES.STEP:
      isValidTaskStep(s);
      break;
    default:
      throw new Error(`[ValidateStep] Step ${s.id} has invalid type ${s.type}`);
  }
}

function validateStepBase(
  step: unknown,
  expectedType: (typeof STEP_TYPES)[keyof typeof STEP_TYPES]
): asserts step is Step {
  if (!step || typeof step !== "object")
    throw new Error("Step must be an object");
  const s = step as Partial<Step>;

  if (!s.type) {
    throw new Error("[ValidateStep] Step must have a type");
  }
  if (s.type !== expectedType) {
    throw new Error(`[ValidateStep] Step ${s.id} is not a ${expectedType}`);
  }
}

export function isValidTaskAction(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.ACTION }> {
  validateStepBase(step, STEP_TYPES.ACTION);
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.ACTION }>>;

  if (!s.action) {
    throw new Error(
      `[ValidateTaskAction] Step ${s.id} does not have an action`
    );
  }

  const action = s.action;

  if (typeof action === "string") {
    return; // early break if the action is an ID of an action
  }

  try {

    if (typeof action === "object" && "version" in action) {
      isValidAction(action);
    } else {
      isValidActionReference(action as unknown);
    }
  } catch (error) {
    console.error(`There was an error validating the task action`, error)
  }
}
export function isValidTaskShortcut(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.SHORTCUT }> {
  validateStepBase(step, STEP_TYPES.SHORTCUT);
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.SHORTCUT }>>;

  if (!s.destination) {
    throw new Error(
      `[ValidateTaskShortcut] Step ${s.id} does not have a destination`
    );
  }
}

export function isValidTaskSetting(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.TASK }> {
  validateStepBase(step, STEP_TYPES.SETTING);
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.SETTING }>>;

  if (!s.setting) {
    throw new Error(
      `[ValidateTaskSetting] Step ${s.id} does not have a setting`
    );
  }

  if (!("type" in s.setting)) {

    if (!s.setting.id) throw new Error(`[ValidateTaskSetting] Setting reference does not have an id`);

    return; // early break for string settings
  }

  const validTypes = [
    "boolean",
    "list",
    "multiselect",
    "number",
    "range",
    "ranked",
    "select",
    "string",
    "color",
    "file",
  ] as const;

  if (!s.setting.type || !validTypes.includes(s.setting.type)) {
    throw new Error(
      `[ValidateTaskSetting] Step ${s.id} has invalid setting type`
    );
  }
  if (!s.setting.label) {
    throw new Error(
      `[ValidateTaskSetting] Step ${s.id} setting does not have a label`
    );
  }
}

export function isValidTaskTask(
  step: unknown
): asserts step is Extract<Step, { type: STEP_TYPES.TASK }> {
  validateStepBase(step, STEP_TYPES.TASK);
  const s = step as Partial<Extract<Step, { type: STEP_TYPES.TASK }>>;

  if (!s.taskReference?.id) {
    throw new Error(`[ValidateTaskTask] Step ${s.id} does not have a taskId`);
  }
}

export function isValidTaskExternal(step: unknown): asserts step is Step {
  validateStepBase(step, STEP_TYPES.EXTERNAL);
}

export function isValidTaskStep(step: unknown): asserts step is Step {
  validateStepBase(step, STEP_TYPES.STEP);
}
