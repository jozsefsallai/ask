import type { GlobalPromptOpts } from "./core/base.ts";
import type { Result } from "./core/result.ts";

import { InputPrompt, type InputOpts } from "./handlers/input.ts";
import { NumberPrompt, type NumberOpts } from "./handlers/number.ts";
import { ConfirmPrompt, type ConfirmOpts } from "./handlers/confirm.ts";
import { PasswordPrompt, type PasswordOpts } from "./handlers/password.ts";

type SupportedOpts = InputOpts | NumberOpts | ConfirmOpts | PasswordOpts;

type PromptResult<O extends SupportedOpts> = O["type"] extends "input"
  ? Result<O extends InputOpts ? O : never, string>
  : O["type"] extends "number"
  ? Result<O extends NumberOpts ? O : never, number>
  : O["type"] extends "confirm"
  ? Result<O extends ConfirmOpts ? O : never, boolean>
  : O["type"] extends "password"
  ? Result<O extends PasswordOpts ? O : never, string>
  : never;

type PromptResultMap<T extends Array<SupportedOpts>> = {
  [K in T[number] as K["name"]]: PromptResult<K> extends infer R
    ? R extends Record<string, unknown>
      ? R[K["name"]]
      : never
    : never;
};

/**
 * @class
 * Ask is a class that contains methods which allow you to create command-line
 * prompts easily.
 */
export class Ask {
  private opts: GlobalPromptOpts;

  /**
   * @constructor
   * Creates an `ask` instance. You can pass global options to it to customize
   * behavior across all questions that will be asked through this instance.
   * @param opts
   */
  constructor(opts?: GlobalPromptOpts) {
    this.opts = opts ?? {};
  }

  private mergeOptions<T>(opts: SupportedOpts): T {
    return { ...this.opts, ...opts } as T;
  }

  /**
   * Will ask for a string input and will return an object with a single
   * property where the key is the name of the input and the value is a string
   * containing the user's input (can be undefined).
   * @param opts
   * @example
   * ```ts
   * import { Ask } from "@sallai/ask";
   *
   * const ask = new Ask();
   *
   * const { name } = await ask.input({
   *   name: "name",
   *   message: "What is your name?",
   * } as const);
   *
   * console.log(name);
   */
  input<T extends InputOpts>(
    opts: Omit<T, "type">
  ): Promise<Result<T, string | undefined>> {
    return new InputPrompt(
      this.mergeOptions({
        ...opts,
        type: "input",
      }) as T
    ).run();
  }

  /**
   * Will ask for a number input and will return an object with a single
   * property where the key is the name of the input and the value is a number
   * containing the user's input (can be undefined). You can also specify a
   * maximum and a minimum value, which will affect the way the prompt message
   * is displayed and will also validate the user's input.
   * @param opts
   * @example
   * ```ts
   * import { Ask } from "@sallai/ask";
   *
   * const ask = new Ask();
   *
   * const { age } = await ask.number({
   *   name: "age",
   *   message: "What is your age?",
   *   min: 16,
   *   max: 100,
   * } as const);
   *
   * console.log(age);
   */
  number<T extends NumberOpts>(
    opts: Omit<T, "type">
  ): Promise<Result<T, number | undefined>> {
    return new NumberPrompt(
      this.mergeOptions({
        ...opts,
        type: "number",
      }) as T
    ).run();
  }

  /**
   * Will ask a yes/no question and return an object with a single property
   * where the key is the name of the input and the value is a boolean depending
   * on the provided answer. You can override the string that will be used for
   * the confirmation and denial of the question. The default values are "y" and
   * "n" respectively. The prompt message will be displayed with the provided
   * values in square brackets.
   * @param opts
   * @example
   * ```ts
   * import { Ask } from "@sallai/ask";
   *
   * const ask = new Ask();
   *
   * const { canDrive } = await ask.confirm({
   *   name: "canDrive",
   *   message: "Can you drive?",
   * } as const);
   *
   * console.log(canDrive);
   */
  confirm<T extends ConfirmOpts>(
    opts: Omit<T, "type">
  ): Promise<Result<T, boolean | undefined>> {
    return new ConfirmPrompt(
      this.mergeOptions({
        ...opts,
        type: "confirm",
      }) as T
    ).run();
  }

  /**
   * Will ask for a password input and will return an object with a single
   * property where the key is the name of the input and the value is a string
   * containing the user's input (can be undefined). The input will be hidden
   * by default (meaning there will be no feedback when typing the answer), but
   * you can override this behavior by specifying a mask character (such as an
   * asterisk).
   * @param opts
   * @example
   * ```ts
   * import { Ask } from "@sallai/ask";
   *
   * const ask = new Ask();
   *
   * const { password } = await ask.password({
   *   name: "password",
   *   message: "Enter your password:",
   *   mask: "*",
   * } as const);
   *
   * console.log(password);
   */
  password<T extends PasswordOpts>(
    opts: Omit<T, "type">
  ): Promise<Result<T, string | undefined>> {
    return new PasswordPrompt(
      this.mergeOptions({
        ...opts,
        type: "password",
      }) as T
    ).run();
  }

  /**
   * Will ask a series of questions based on an array of prompt options and
   * return a type-safe object where each key is the name of a question and the
   * value is the user's input for that question (the type of the value will be
   * inferred based on the type of the question). This method is useful when you
   * want to ask multiple questions at once.
   * @param questions
   * @example
   * ```ts
   * import { Ask } from "@sallai/ask";
   *
   * const ask = new Ask();
   *
   * const answers = await ask.prompt([
   *   {
   *     type: "input",
   *     name: "name",
   *     message: "What is your name?",
   *   },
   *   {
   *     type: "number",
   *     name: "age",
   *     message: "What is your age?",
   *     min: 16,
   *     max: 100,
   *   },
   *   {
   *    type: "confirm",
   *    name: "canDrive",
   *    message: "Can you drive?",
   *   },
   * ] as const);
   *
   * console.log(answers.name); // will be a string
   * console.log(answers.age); // will be a number
   * console.log(answers.canDrive); // will be a boolean
   */
  async prompt<T extends Array<SupportedOpts>>(
    questions: T
  ): Promise<PromptResultMap<T>> {
    // deno-lint-ignore no-explicit-any
    const answers: PromptResultMap<any> = {};

    for (let i = 0; i < questions.length; ++i) {
      const question = questions[i];

      switch (question.type) {
        case "input": {
          const input = new InputPrompt(question);
          Object.assign(answers, await input.run());
          break;
        }
        case "number": {
          const number = new NumberPrompt(question as NumberOpts);
          Object.assign(answers, await number.run());
          break;
        }
        case "confirm": {
          const confirm = new ConfirmPrompt(question as ConfirmOpts);
          Object.assign(answers, await confirm.run());
          break;
        }
        case "password": {
          const password = new PasswordPrompt(question);
          Object.assign(answers, await password.run());
          break;
        }
      }
    }

    return answers as PromptResultMap<T>;
  }
}
