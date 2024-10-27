// deno-lint-ignore-file no-explicit-any
import iro, { cyan } from "@sallai/iro";
import type { PromptOpts } from "../core/base.ts";
import { ListPrompt } from "../core/list.ts";
import type { Choice } from "../internal/list-io.ts";
import type { Result } from "../core/result.ts";

/**
 * Options for the checkbox prompt.
 */
export type CheckboxOpts = PromptOpts<any> & {
  /**
   * The type of the prompt. This can not be changed but will be used to
   * determine the type of the question.
   */
  type?: "checkbox";

  /**
   * A list of choices for the user to select multiple values from.
   */
  choices: Choice[];

  selectedPrefix?: string;

  unselectedPrefix?: string;

  /**
   * A function that can override the way an unchecked choice is displayed. It
   * receives the `message` field of the `Choice` object as a parameter.
   * @param message The message of the choice.
   */
  inactiveFormatter?: (message: string) => string;

  /**
   * A function that can override the way a checked choice is displayed. It
   * receives the `message` field of the `Choice` object as a parameter.
   * @param message The message of the choice.
   */
  activeFormatter?: (message: string) => string;

  /**
   * A function that can override the way a disabled choice is displayed. It
   * receives the `message` field of the `Choice` object as a parameter.
   * @param message The message of the choice.
   */
  disabledFormatter?: (message: string) => string;
};

/**
 * A prompt for a checkbox list which allows users to select multiple values
 * from the provided choices.
 */
export class CheckboxPrompt<T extends CheckboxOpts> extends ListPrompt {
  constructor(opts: CheckboxOpts) {
    super({
      ...opts,
      selectedPrefix: opts.selectedPrefix ?? iro("◉ ", cyan),
      unselectedPrefix: opts.unselectedPrefix ?? "◯ ",
      multiple: true,
    });
    this.type = "checkbox";
  }

  async run(): Promise<Result<T, any[]>> {
    const answer = await this.questionMultiple();

    const result = {
      [this.name]: answer,
    } as Result<T, any[]>;

    return result;
  }
}
