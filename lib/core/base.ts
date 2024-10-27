import type { Reader, ReaderSync, Writer, WriterSync, Closer } from "@std/io";
import iro, { bold, green } from "@sallai/iro";

/**
 * The type of prompt that will be displayed to the user.
 */
export type PromptType =
  | "input"
  | "number"
  | "confirm"
  | "password"
  | "editor"
  | "select"
  | "checkbox";

/**
 * The global options that can be passed to an `Ask` instance.
 */
export type GlobalPromptOpts = {
  /**
   * The prefix that will be displayed before the prompt message. Can be
   * overridden by specifying the `prefix` option in a specific question.
   */
  prefix?: string;

  /**
   * The suffix that will be displayed after the prompt message. Can be
   * overridden by specifying the `suffix` option in a specific question.
   */
  suffix?: string;

  /**
   * The reader interface that will be used to read user input. Please note that
   * certain prompt types (such as `password`) only work with `Deno.stdin`.
   */
  input?: Reader & ReaderSync & Closer;

  /**
   * The writer interface that will be used to write output to the user.
   */
  output?: Writer & WriterSync & Closer;
};

/**
 * The common options that can be passed to a single prompt question.
 */
export type PromptOpts<RetType> = {
  /**
   * The name (identifier) of the question. This will be used as the key of the
   * returned answer object.
   */
  name: string;

  /**
   * The type of the prompt. This determines the behavior and the return type of
   * the question's value.
   */
  type?: PromptType;

  /**
   * The message that will be displayed to the user. If not provided, the `name`
   * will be used instead.
   */
  message?: string;

  /**
   * The default value of the prompt. If the user does not provide an answer,
   * this value will be used.
   */
  default?: RetType;

  /**
   * A validation function that checks if the provided value is valid. `Ask`
   * will keep asking the question until the validation function returns `true`.
   * @param val The value that the user provided.
   * @returns `true` if the value is valid, `false` otherwise.
   */
  validate?: <U extends RetType>(val?: U) => boolean | Promise<boolean>;

  /**
   * The maximum number of times the program will ask the user for input if it
   * doesn't pass validation. After this number is exceeded, the program will
   * call the `onExceededAttempts` function.
   */
  maxAttempts?: number;

  /**
   * The function that will be called when the maximum number of attempts is
   * exceeded.
   * @param lastInput The last invalid input of the user.
   */
  onExceededAttempts?: <U extends RetType>(
    lastInput?: U,
    retryFn?: () => Promise<U | undefined>
  ) => void | Promise<void>;
} & GlobalPromptOpts;

function onExceededAttempts() {
  throw new Error("Maximum attempts exceeded.");
}

/**
 * The base class for all prompt types. This class contains the common logic
 * that is shared between all prompt types.
 */
export class Prompt<T> {
  protected name: string;
  protected type: PromptType;
  protected message: string;
  protected prefix?: string;
  protected suffix?: string;
  protected default?: T;
  protected input: Reader & ReaderSync & Closer;
  protected output: Writer & WriterSync & Closer;
  protected validate: (val?: T | undefined) => boolean | Promise<boolean>;
  protected maxAttempts?: number;
  protected onExceededAttempts?: (
    lastInput?: T,
    retryFn?: () => Promise<T | undefined>
  ) => void | Promise<void>;

  constructor(opts: PromptOpts<T>) {
    this.name = opts.name;
    this.type = opts.type ?? "input";
    this.message = opts.message ?? opts.name;
    this.prefix = opts.prefix ?? iro("?", green);
    this.suffix =
      opts.suffix ?? (!opts.message && opts.suffix === null ? ":" : "");
    this.default = opts.default;
    this.input = opts.input ?? Deno.stdin;
    this.output = opts.output ?? Deno.stdout;
    this.validate = opts.validate ?? (() => true);
    this.maxAttempts = opts.maxAttempts;
    this.onExceededAttempts = opts.onExceededAttempts ?? onExceededAttempts;
  }

  private format(str: string): string {
    return (
      iro(str, bold) + (this.default ? ` (${this.default})` : "") + this.suffix
    );
  }

  protected getPrompt(): string {
    const components: string[] = [];

    if (this.prefix?.length) {
      components.push(this.prefix);
    }

    components.push(this.format(this.message));
    components.push("");

    return components.join(" ");
  }
}
