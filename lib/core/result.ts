import type { PromptOpts } from "./base.ts";

/**
 * The result of a prompt.
 */
export type Result<O extends PromptOpts<T>, T> = {
  [K in O["name"]]: T;
};
