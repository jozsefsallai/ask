import { PromptOpts } from "../core/prompt.ts";
import { Result } from "../core/result.ts";
import Text from "../core/text.ts";

export interface ConfirmOpts extends PromptOpts {
  type: "confirm";
  accept?: string;
  deny?: string;
}

class Confirm extends Text {
  private accept: string;
  private deny: string;

  constructor(opts: ConfirmOpts) {
    super(opts);

    this.accept = opts.accept ?? "Y";
    this.deny = opts.deny ?? "n";

    this.message = `${this.message} [${this.accept}/${this.deny}]`;
  }

  async run(): Promise<Result<boolean>> {
    const result: Result<boolean> = {};

    const answer = await this.question();

    if (answer?.length === 0) {
      result[this.name] = true;
      return result;
    }

    result[this.name] = answer?.toLowerCase() === this.accept.toLowerCase();
    return result;
  }
}

export default Confirm;
