import Text from './core/text.ts';
import type { PromptOpts } from './core/prompt.ts';
import type { Result } from './core/result.ts';

export interface NumberOpts extends PromptOpts {
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
      return this.message + ` (>= ${this.min})`;
    }

    if (this.min === -Infinity && this.max !== Infinity) {
      return this.message + ` (<= ${this.max})`;
    }

    return this.message + ` (${this.min}-${this.max})`;
  }

  private isInputOk(input: number | undefined | string): boolean {
    if (typeof input !== 'number') {
      return false;
    }

    return (input >= this.min && input <= this.max);
  }

  async run(): Promise<Result> {
    const result: Result = {};
    let ok = false;
    let answer;

    try {
      while (!ok) {
        const rawAnswer = await this.question();
        answer = rawAnswer && parseInt(rawAnswer, 10);
        ok = this.isInputOk(answer);
      }

      result[this.name] = answer;
      return result;
    } catch (err) {
      throw err;
    }
  }
}

export default Number;
