import type { GlobalPromptOpts } from "./core/base.ts";
import type { Result } from "./core/result.ts";

import { InputPrompt, type InputOpts } from "./handlers/input.ts";
import { NumberPrompt, type NumberOpts } from "./handlers/number.ts";
import { ConfirmPrompt, type ConfirmOpts } from "./handlers/confirm.ts";
import { PasswordPrompt, type PasswordOpts } from "./handlers/password.ts";
import { EditorPrompt, type EditorOpts } from "./handlers/editor.ts";
import { SelectPrompt, type SelectOpts } from "./handlers/select.ts";
import { CheckboxPrompt, type CheckboxOpts } from "./handlers/checkbox.ts";

type SupportedOpts =
  | InputOpts
  | NumberOpts
  | ConfirmOpts
  | PasswordOpts
  | EditorOpts
  | SelectOpts
  | CheckboxOpts;

type PromptResult<O extends SupportedOpts> = O["type"] extends "input"
  ? Result<O extends InputOpts ? O : never, string>
  : O["type"] extends "number"
  ? Result<O extends NumberOpts ? O : never, number>
  : O["type"] extends "confirm"
  ? Result<O extends ConfirmOpts ? O : never, boolean>
  : O["type"] extends "password"
  ? Result<O extends PasswordOpts ? O : never, string>
  : O["type"] extends "editor"
  ? Result<O extends EditorOpts ? O : never, string>
  : O["type"] extends "select"
  ? // deno-lint-ignore no-explicit-any
    Result<O extends SelectOpts ? O : never, any>
  : O["type"] extends "checkbox"
  ? // deno-lint-ignore no-explicit-any
    Result<O extends CheckboxOpts ? O : never, any[]>
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

  private mergeOptions<T>(opts: Omit<SupportedOpts, "type">): T {
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
  input<T extends InputOpts>(opts: T): Promise<Result<T, string | undefined>> {
    return new InputPrompt(this.mergeOptions(opts) as T).run();
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
    opts: T
  ): Promise<Result<T, number | undefined>> {
    return new NumberPrompt(this.mergeOptions(opts) as T).run();
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
    opts: T
  ): Promise<Result<T, boolean | undefined>> {
    return new ConfirmPrompt(this.mergeOptions(opts) as T).run();
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
    opts: T
  ): Promise<Result<T, string | undefined>> {
    return new PasswordPrompt(this.mergeOptions(opts) as T).run();
  }

  /**
   * Will open a temporary file in the user's preferred editor and will return
   * the contents of the file when the editor is closed. You can specify a path
   * override or an executable name for the editor to use. If not provided, the
   * `VISUAL` or `EDITOR` environment variables will be used, and if those
   * aren't present either, a series of common editors will be searched for in
   * the system `PATH`. You can also provide a custom message to tell the user
   * to press enter to launch their preferred editor.
   * @param opts
   * @example
   * ```ts
   * import { Ask } from "@sallai/ask";
   *
   * const ask = new Ask();
   *
   * const { content } = await ask.editor({
   *   name: "bio",
   *   message: "Write a short bio about yourself:",
   *   editorPath: "nano",
   *   editorPromptMessage: "Press enter to open the nano editor",
   * } as const);
   *
   * console.log(content);
   */
  editor<T extends EditorOpts>(
    opts: T
  ): Promise<Result<T, string | undefined>> {
    return new EditorPrompt(this.mergeOptions(opts) as T).run();
  }

  /**
   * Will display a list of choices to the user. The user can select one of the
   * choices by using the `up` and `down` arrow keys. The user can confirm their
   * selection by pressing the `enter` key. The selected choice will be returned
   * as an object. You can also provide a function that can override the way the
   * choices are displayed based on their status (active, inactive, disabled).
   * You can also use the `Separator` class to add a separator between choices.
   * @param opts
   * @example
   * ```ts
   * import { Ask, Separator } from "@sallai/ask";
   *
   * const ask = new Ask();
   *
   * const { topping } = await ask.select({
   *   name: "topping",
   *   message: "Select a pizza topping:",
   *   choices: [
   *     { message: "Pepperoni", value: "pepperoni" },
   *     { message: "Mushrooms", value: "mushrooms" },
   *     new Separator(),
   *     { message: "Pineapple", value: "pineapple" },
   *  ],
   * } as const);
   *
   * console.log(topping);
   * ```
   */
  // deno-lint-ignore no-explicit-any
  select<T extends SelectOpts>(opts: T): Promise<Result<T, any>> {
    return new SelectPrompt(this.mergeOptions(opts) as T).run();
  }

  /**
   * Will display a list of choices to the user. The user can select several of
   * choices by using the `up` and `down` arrow keys. The user can mark an
   * option as selected by pressing the `space` key and can finalize their
   * selections using the `enter` key. The selected choices will be returned as
   * as an object. You can also provide a function that can override the way the
   * choices are displayed based on their status (active, inactive, disabled),
   * as well as prefixes for selected and unselected choices. You can also use
   * the `Separator` class to add a separator between choices.
   * @param opts
   * @example
   * ```ts
   * import { Ask, Separator } from "@sallai/ask";
   *
   * const ask = new Ask();
   *
   * const { toppings } = await ask.checkbox({
   *   name: "toppings",
   *   message: "Select pizza toppings:",
   *   choices: [
   *     { message: "Pepperoni", value: "pepperoni" },
   *     { message: "Mushrooms", value: "mushrooms" },
   *     new Separator(),
   *     { message: "Pineapple", value: "pineapple" },
   *   ],
   * } as const);
   *
   * console.log(toppings);
   * ```
   */
  // deno-lint-ignore no-explicit-any
  checkbox<T extends CheckboxOpts>(opts: T): Promise<Result<T, any[]>> {
    return new CheckboxPrompt(this.mergeOptions(opts) as CheckboxOpts).run();
  }

  /**
   * Will ask a series of questions based on an array of prompt options and
   * return a type-safe object where each key is the name of a question and the
   * value is the user's input for that question (the type of the value will be
   * inferred based on the type of the question).
   * **For most use cases, it's recommended to use the individual methods.**
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
        case "editor": {
          const editor = new EditorPrompt(question as EditorOpts);
          Object.assign(answers, await editor.run());
          break;
        }
        case "select": {
          const select = new SelectPrompt(question as SelectOpts);
          Object.assign(answers, await select.run());
          break;
        }
        case "checkbox": {
          const checkbox = new CheckboxPrompt(question as CheckboxOpts);
          Object.assign(answers, await checkbox.run());
          break;
        }
      }
    }

    return answers as PromptResultMap<T>;
  }
}
