import type { PromptOpts } from "../core/base.ts";
import type { Result } from "../core/result.ts";
import { TextPrompt } from "../core/text.ts";

/**
 * Options for the password prompt.
 */
export type PasswordOpts = {
  /**
   * An optional mask character to hide the input. If not provided, the input
   * will be hidden entirely. Only the first character of the mask will be used.
   */
  mask?: string;
} & PromptOpts<string>;

/**
 * A prompt for a password input.
 */
export class PasswordPrompt<T extends PasswordOpts> extends TextPrompt {
  constructor(opts: T) {
    super({
      ...opts,
      hidden: !opts.mask,
      mask: opts.mask?.charAt(0),
    });
  }

  /**
   * Asks the user for a password input and returns the result as an object.
   */
  async run(): Promise<Result<T, string | undefined>> {
    const answer = await this.askUntilValid<string>();

    const result = {
      [this.name]: answer,
    } as Result<T, string | undefined>;

    return result;
  }
}
