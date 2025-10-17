import { Task } from "@deskthing/types";

export const AGENT_MESSAGE_VERSION = '0.11.17';

export const VALID_TASK_FIELDS: (keyof Task)[] = [
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

export const VALID_STEP_FIELDS = [
  "parentId",
  "id",
  "debug",
  "strict",
  "type",
  "label",
  "instructions",
  "completed",
  "debugging",
  "source",
  "action",
  "url",
  "taskId",
  "taskSource",
  "destination",
  "setting",
];