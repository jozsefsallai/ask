import Text from './core/text.ts';
import type { PromptOpts } from './core/prompt.ts';
import type { Result } from './core/result.ts';

export interface ConfirmOpts extends PromptOpts {
  accept?: string;
  deny?: string;
}

class Confirm extends Text {
  private accept: string;
  private deny: string;

  constructor(opts: ConfirmOpts) {
    super(opts);

    this.accept = opts.accept || 'Y';
    this.deny = opts.deny || 'n';

    this.message = this.message + ` [${this.accept}/${this.deny}]`;
  }

  async run(): Promise<Result> {
    const result: Result = {};

    try {
      const answer = await this.question();

      if (answer?.length === 0) {
        result[this.name] = true;
        return result;
      }

      result[this.name] = answer?.toLowerCase() === this.accept.toLowerCase();
      return result;
    } catch (err) {
      throw err;
    }
  }
}

export default Confirm;
