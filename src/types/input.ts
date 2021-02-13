import Text from "../core/text.ts";
import type { PromptOpts } from "../core/prompt.ts";
import type { Result } from "../core/result.ts";

class Input extends Text {
  constructor(opts: PromptOpts) {
    super(opts);
  }

  async run(): Promise<Result<string | undefined>> {
    const result: Result<string | undefined> = {};

    const answer = await this.question();
    result[this.name] = answer;

    return result;
  }
}

export default Input;
