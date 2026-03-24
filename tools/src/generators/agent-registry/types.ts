/**
 * Type definitions for spec/task generators.
 */

export interface CreateSpecSchema {
  slug: string;
  goal: string;
  [key: string]: unknown;
}

export interface UpdateSpecSchema {
  slug: string;
  status: string;
  [key: string]: unknown;
}

export interface StartTaskSchema {
  slug: string;
}

export interface FinishTaskSchema {
  slug: string;
}

export interface AbortTaskSchema {
  slug: string;
}
