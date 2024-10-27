import iro, { red } from "@sallai/iro";

import { Prompt, type PromptOpts } from "./base.ts";
import { readLine } from "../internal/text-io.ts";

/**
 * Common options for text prompts.
 */
export type TextOpts<T = string> = {
  hidden?: boolean;
  mask?: string;
} & PromptOpts<T>;

/**
 * A text prompt.
 */
export class TextPrompt<T = string> extends Prompt<T> {
  private hidden?: boolean;
  private mask?: string;

  private _attempts: number = 0;

  constructor(opts: TextOpts<T>) {
    super(opts);
    this.hidden = opts.hidden;
    this.mask = opts.mask;
  }

  protected async printError(message: string) {
    await this.output.write(
      new TextEncoder().encode(`${iro(">>", red)} ${message}\n`)
    );
  }

  protected printErrorSync(message: string) {
    this.output.writeSync(
      new TextEncoder().encode(`${iro(">>", red)} ${message}\n`)
    );
  }

  protected async question(): Promise<string | undefined> {
    const prompt = new TextEncoder().encode(this.getPrompt());

    await this.output.write(prompt);

    if ((this.hidden || this.mask) && this.input === Deno.stdin) {
      (this.input as typeof Deno.stdin).setRaw(true);
    }

    const input = await readLine({
      input: this.input,
      output: this.output,
      mask: this.mask,
      hidden: this.hidden,
    });

    return input;
  }

  protected async askUntilValid<T>(
    preprocess?: (val: string | undefined) => T
  ): Promise<T | undefined> {
    let answer = await this.question();
    let pass = true;

    if (!answer && this.default) {
      answer = String(this.default);
    }

    let preprocessedAnswer: T | undefined;

    try {
      if (preprocess) {
        preprocessedAnswer = preprocess(answer);
      } else {
        // deno-lint-ignore no-explicit-any
        preprocessedAnswer = answer as any;
      }

      // deno-lint-ignore no-explicit-any
      pass = await Promise.resolve(this.validate(preprocessedAnswer as any));
      // deno-lint-ignore no-explicit-any
    } catch (err: any) {
      pass = false;
      await this.printError(typeof err === "string" ? err : err.message);
    }

    if (!pass) {
      if (typeof this.maxAttempts === "number") {
        this._attempts++;

        if (this._attempts >= this.maxAttempts) {
          // deno-lint-ignore no-explicit-any
          await this.onExceededAttempts?.(preprocessedAnswer as any, () => {
            // deno-lint-ignore no-explicit-any
            return this.askUntilValid(preprocess) as any;
          });

          return;
        }
      }

      return this.askUntilValid(preprocess);
    }

    return preprocessedAnswer;
  }
}
