import iro, { gray, italic } from "@sallai/iro";
import {
  ListItem,
  renderList,
  Separator,
  type Choice,
} from "../internal/list-io.ts";
import { Prompt, type PromptOpts } from "./base.ts";

export type ListOpts<T> = PromptOpts<T> & {
  choices: Choice<T>[];
  multiple?: boolean;
  inactiveFormatter?: (message: string) => string;
  activeFormatter?: (message: string) => string;
  disabledFormatter?: (message: string) => string;
};

export class ListPrompt<T> extends Prompt<T> {
  private choices: Choice<T>[];
  private inactiveFormatter?: (message: string) => string;
  private activeFormatter?: (message: string) => string;
  private disabledFormatter?: (message: string) => string;
  private multiple?: boolean;

  private _selected: number = 0;
  private _items: ListItem[];
  private _running: boolean = true;

  constructor(opts: ListOpts<T>) {
    super(opts);
    this.choices = opts.choices;
    this.inactiveFormatter = opts.inactiveFormatter;
    this.activeFormatter = opts.activeFormatter;
    this.disabledFormatter = opts.disabledFormatter;
    this.multiple = opts.multiple;

    if (this.default) {
      const indexOfDefault = this.choices.findIndex(
        (choice) => choice.value === this.default
      );
      if (indexOfDefault >= 0) {
        this._selected = indexOfDefault;
      }
    }

    this._items = this.choices.map((choice, idx) => {
      if (choice instanceof Separator) {
        return choice;
      }

      return new ListItem({
        message: choice.message,
        disabled: choice.disabled ?? false,
        selected: idx === this._selected,
        inactiveFormatter: this.inactiveFormatter,
        activeFormatter: this.activeFormatter,
        disabledFormatter: this.disabledFormatter,
      });
    });
  }

  private up(startIndex: number) {
    this._items[this._selected].selected = false;

    if (this._selected === 0) {
      this._selected = this.choices.length - 1;
    } else {
      this._selected--;
    }

    this._items[this._selected].selected = true;

    if (this._selected === startIndex) {
      return;
    }

    if (this._items[this._selected].disabled) {
      this.up(startIndex);
    }
  }

  private down(startIndex: number) {
    this._items[this._selected].selected = false;

    if (this._selected === this.choices.length - 1) {
      this._selected = 0;
    } else {
      this._selected++;
    }

    this._items[this._selected].selected = true;

    if (this._selected === startIndex) {
      return;
    }

    if (this._items[this._selected].disabled) {
      this.down(startIndex);
    }
  }

  private finish() {
    this._running = false;
  }

  private select() {
    if (!this.multiple) {
      return;
    }

    this._items[this._selected].selected =
      !this._items[this._selected].selected;
  }

  protected async questionMultiple(): Promise<(T | undefined)[] | undefined> {
    const prompt = new TextEncoder().encode(this.getPrompt());
    await this.output.write(prompt);
    await this.output.write(new TextEncoder().encode("\n"));

    if (this.input === Deno.stdin) {
      (this.input as typeof Deno.stdin).setRaw(true);
    }

    while (this._running) {
      await renderList({
        input: this.input,
        output: this.output,
        items: this._items,

        onEnter: this.finish.bind(this),
        onSpace: this.select.bind(this),
        onUp: () => this.up(this._selected),
        onDown: () => this.down(this._selected),
      });
    }

    await this.output.write(new TextEncoder().encode("\r"));
    await this.output.write(new TextEncoder().encode("\x1b[K"));
    await this.output.write(new TextEncoder().encode("\x1b[A"));
    await this.output.write(new TextEncoder().encode("\r"));
    await this.output.write(new TextEncoder().encode("\x1b[K"));
    await this.output.write(prompt);

    const selectedItems = this._items.filter((item) => item.selected);

    if (selectedItems.length === 1) {
      const selected = selectedItems[0];
      const choice = this.choices.find(
        (choice) => choice.message === selected.message
      );

      if (choice) {
        await this.output.write(
          new TextEncoder().encode(choice.message + "\n")
        );
      }
    } else {
      await this.output.write(
        new TextEncoder().encode(iro("<list>", gray, italic) + "\n")
      );
    }

    if (this.input === Deno.stdin) {
      (this.input as typeof Deno.stdin).setRaw(false);
    }

    return selectedItems.map(
      (item) =>
        this.choices.find((choice) => choice.message === item.message)?.value
    );
  }

  async questionSingle(): Promise<T | undefined> {
    const result = await this.questionMultiple();
    return result?.[0];
  }
}

export { type Choice, Separator };
