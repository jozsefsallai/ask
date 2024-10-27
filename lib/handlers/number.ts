import type { PromptOpts } from "../core/base.ts";
import type { Result } from "../core/result.ts";
import { TextPrompt } from "../core/text.ts";

/**
 * The type of number that can be entered. This will determine if the input will
 * be parsed as an integer or as a float.
 */
export type NumberType = "integer" | "float";

/**
 * Options for the number prompt.
 */
export type NumberOpts = PromptOpts<number> & {
  /**
   * The type of the prompt. This can not be changed but will be used to
   * determine the type of the question.
   */
  type?: "number";

  /**
   * The minimum value that can be entered. Defaults to negative infinity.
   */
  min?: number;

  /**
   * The maximum value that can be entered. Defaults to positive infinity.
   */
  max?: number;

  /**
   * The type of number that can be entered. This will determine if the input
   * will be parsed as an integer or as a float. Defaults to "integer".
   */
  numberType?: NumberType;
};

/**
 * A prompt for a number input.
 */
export class NumberPrompt<T extends NumberOpts> extends TextPrompt<number> {
  private min: number;
  private max: number;
  private numberType: NumberType;

  constructor(opts: T) {
    super(opts);
    this.type = "number";

    this.min = opts.min === void 1 ? -Infinity : opts.min;
    this.max = opts.max === void 1 ? Infinity : opts.max;
    this.numberType = opts.numberType ?? "integer";

    this.message = this.messageWithRange;

    this.validate = async (val) => {
      const withinRange = this.isWithinRange(val);
      const validInput =
        typeof opts.validate !== "undefined" ? await opts.validate(val) : true;

      return withinRange && validInput;
    };
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

  private isWithinRange(val: number | undefined): boolean {
    if (typeof val === "undefined") {
      return false;
    }

    return val >= this.min && val <= this.max;
  }

  /**
   * Asks the user for a number input and returns the result as an object.
   */
  async run(): Promise<Result<T, number | undefined>> {
    const answer = await this.askUntilValid<number>((val) => {
      switch (this.numberType) {
        case "integer":
          return parseInt(val ?? "", 10);
        case "float":
          return parseFloat(val ?? "");
      }
    });

    const result = {
      [this.name]: answer,
    } as Result<T, number | undefined>;

    return result;
  }
}
