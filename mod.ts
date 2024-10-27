/**
 * @module
 * `ask` is a slick Deno module that allows you to create interactive
 * command-line applications. It provides a simple and intuitive API for
 * creating prompts and validating user input.
 */

export * from "./lib/ask.ts";

export * from "./lib/core/base.ts";
export * from "./lib/core/list.ts";
export * from "./lib/core/result.ts";
export * from "./lib/core/text.ts";

export * from "./lib/handlers/checkbox.ts";
export * from "./lib/handlers/confirm.ts";
export * from "./lib/handlers/editor.ts";
export * from "./lib/handlers/input.ts";
export * from "./lib/handlers/number.ts";
export * from "./lib/handlers/password.ts";
export * from "./lib/handlers/select.ts";
