import Text from './core/text.ts';
import type { PromptOpts } from './core/prompt.ts';
import type { Result } from './core/result.ts';

class Input extends Text {
  constructor(opts: PromptOpts) {
    super(opts);
  }

  async run(): Promise<Result> {
    const result: Result = {};

    try {
      const answer = await this.question();
      result[this.name] = answer;

      return result;
    } catch (err) {
      throw err;
    }
  }
}

export default Input;
