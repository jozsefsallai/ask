import type { PromptOpts } from "../core/base.ts";
import type { Result } from "../core/result.ts";
import { TextPrompt } from "../core/text.ts";

/**
 * Options for the input prompt.
 */
export type InputOpts = PromptOpts<string> & {
  /**
   * The type of the prompt. This can not be changed but will be used to
   * determine the type of the question.
   */
  type?: "input";
};

/**
 * A prompt for a simple text input.
 */
export class InputPrompt<T extends InputOpts> extends TextPrompt {
  constructor(opts: T) {
    super(opts);
    this.type = "input";
  }

  /**
   * Asks the user for a text input and returns the result as an object.
   */
  async run(): Promise<Result<T, string | undefined>> {
    const answer = await this.askUntilValid<string>();

    const result = {
      [this.name]: answer,
    } as Result<T, string | undefined>;

    return result;
  }
}
