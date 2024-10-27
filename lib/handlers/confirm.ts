import type { PromptOpts } from "../core/base.ts";
import type { Result } from "../core/result.ts";
import { TextPrompt } from "../core/text.ts";

/**
 * The options for a confirm (yes/no) prompt.
 */
export type ConfirmOpts = PromptOpts<boolean> & {
  /**
   * The type of the prompt. This can not be changed but will be used to
   * determine the type of the question.
   */
  type?: "confirm";

  /**
   * The text to display and accept as a positive answer. Defaults to "y".
   */
  accept?: string;

  /**
   * The text to display and accept as a negative answer. Defaults to "n". In
   * practice, anything other than `accept` will be considered a negative
   * response, so this is mostly for display purposes.
   */
  deny?: string;
};

/**
 * A confirm (yes/no) prompt.
 */
export class ConfirmPrompt<T extends ConfirmOpts> extends TextPrompt<boolean> {
  private accept: string;
  private deny: string;

  constructor(opts: T) {
    super(opts);
    this.type = "confirm";

    this.accept = opts.accept ?? "y";
    this.deny = opts.deny ?? "n";

    this.message = `${this.message} [${this.accept}/${this.deny}]`;
  }

  /**
   * Asks the user for a confirmation and returns the result as an object.
   */
  async run(): Promise<Result<T, boolean | undefined>> {
    const answer = await this.askUntilValid<boolean>((val) => {
      if (typeof val === "undefined") {
        return false;
      }

      val = val.toLowerCase();
      return val === this.accept;
    });

    const result = {
      [this.name]: answer,
    } as Result<T, boolean | undefined>;

    return result;
  }
}
