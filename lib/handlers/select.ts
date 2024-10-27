// deno-lint-ignore-file no-explicit-any
import type { PromptOpts } from "../core/base.ts";
import { ListPrompt } from "../core/list.ts";
import type { Result } from "../core/result.ts";
import type { Choice } from "../internal/list-io.ts";

/**
 * Options for the select prompt.
 */
export type SelectOpts = PromptOpts<any> & {
  /**
   * The type of the prompt. This can not be changed but will be used to
   * determine the type of the question.
   */
  type?: "select";

  /**
   * A list of choices for the user to select from.
   */
  choices: Choice[];

  /**
   * A function that can override the way an inactive (non-selected) choice is
   * displayed. It receives the `message` field of the `Choice` object as a
   * parameter.
   * @param message The message of the choice.
   */
  inactiveFormatter?: (message: string) => string;

  /**
   * A function that can override the way an active (selected) choice is
   * displayed. It receives the `message` field of the `Choice` object as a
   * parameter.
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
 * A prompt for a select list which allows users to select one of the provided
 * choices.
 */
export class SelectPrompt<T extends SelectOpts> extends ListPrompt {
  constructor(opts: SelectOpts) {
    super(opts);
    this.type = "select";
  }

  /**
   * Displays a list of choices to the user. The user can select one of the
   * choices by using the `up` and `down` arrow keys. The user can confirm their
   * selection by pressing the `enter` key. The selected choice will be returned
   * as an object.
   */
  async run(): Promise<Result<T, any>> {
    const answer = await this.questionSingle();

    const result = {
      [this.name]: answer,
    } as Result<T, any>;

    return result;
  }
}
