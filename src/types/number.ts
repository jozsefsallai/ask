import { PromptOpts } from "../core/prompt.ts";
import { Result } from "../core/result.ts";
import Text from "../core/text.ts";

export interface NumberOpts extends PromptOpts {
  type: "number";
  min?: number;
  max?: number;
}

class Number extends Text {
  private min: number;
  private max: number;

  constructor(opts: NumberOpts) {
    super(opts);

    this.min = opts.min === void 1 ? -Infinity : opts.min;
    this.max = opts.max === void 1 ? Infinity : opts.max;

    this.message = this.messageWithRange;
  }

  get messageWithRange(): string {
    if (this.min === -Infinity && this.max === Infinity) {
      return this.message;
    }

    if (this.min !== -Infinity && this.max === Infinity) {
      return `${this.message} (>= ${this.min})`;
    }

    if (this.min === -Infinity && this.max !== Infinity) {
      return `${this.message} (<= ${this.max})`;
    }

    return `${this.message} (${this.min}-${this.max})`;
  }

  private isInputOk(input: number | string | undefined): boolean {
    if (typeof input !== "number") {
      return false;
    }

    return (input >= this.min && input <= this.max);
  }

  async run(): Promise<Result<number>> {
    const result: Result<number> = {};
    let ok = false;
    let answer;

    while (!ok) {
      const raw = await this.question();
      answer = raw && parseInt(raw, 10);
      ok = this.isInputOk(answer);
    }

    result[this.name] = <number> answer;
    return result;
  }
}

export default Number;
