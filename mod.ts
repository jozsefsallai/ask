import type { GlobalPromptOpts, PromptOpts } from "./src/core/prompt.ts";
import type { Result } from "./src/core/result.ts";

import Input from "./src/types/input.ts";
import Number, { NumberOpts } from "./src/types/number.ts";
import Confirm, { ConfirmOpts } from "./src/types/confirm.ts";

class Ask {
  private opts: GlobalPromptOpts | PromptOpts | NumberOpts | ConfirmOpts;

  /**
   * Creates an `ask` instance. You can pass global options to it to customize
   * behavior across all questions.
   * @constructor
   * @param opts
   */
  constructor(opts?: GlobalPromptOpts) {
    this.opts = opts || {};
  }

  private mergeOptions(opts: PromptOpts | NumberOpts | ConfirmOpts) {
    return { ...this.opts, ...opts };
  }

  /**
   * Will ask for a string input and will return an object with a single
   * property, which is the name of the question. The value is a string or
   * undefined.
   * @param opts
   */
  input(opts: PromptOpts): Promise<Result<string | undefined>> {
    return new Input(this.mergeOptions(opts) as PromptOpts).run();
  }

  /**
   * Will ask for a number input and will return an object with a single
   * property, which is the name of the question. The value is a number.
   * @param opts
   */
  number(opts: NumberOpts): Promise<Result<number>> {
    return new Number(this.mergeOptions(opts) as NumberOpts).run();
  }

  /**
   * Will ask a yes/no question and return an object with a single property,
   * which is the name of the question. The value is a boolean, depending on the
   * provided answer.
   * @param opts
   */
  confirm(opts: ConfirmOpts): Promise<Result<boolean>> {
    return new Confirm(this.mergeOptions(opts) as ConfirmOpts).run();
  }

  /**
   * Takes an array of prompts, which can be of multiple differing types. Will
   * return an object where each key corresponds to the name of each individual
   * question and the values are results, depending on the type of the question.
   * @param questions
   */
  async prompt(
    questions: Array<PromptOpts | ConfirmOpts | NumberOpts>,
  ): Promise<Result<string | number | boolean | undefined>> {
    const answers = {};
    let cache: PromptOpts;

    for (let i = 0; i < questions.length; i++) {
      cache = questions[i];

      switch (cache.type) {
        case "number":
          Object.assign(answers, await this.number(<NumberOpts> cache));
          break;

        case "confirm":
          Object.assign(answers, await this.confirm(<ConfirmOpts> cache));
          break;

        default:
          Object.assign(answers, await this.input(cache));
          break;
      }
    }

    return answers;
  }
}

export default Ask;
