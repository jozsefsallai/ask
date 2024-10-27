// deno-lint-ignore-file no-explicit-any
import iro, { gray, italic } from "@sallai/iro";
import {
  ListItem,
  renderList,
  Separator,
  type Choice,
} from "../internal/list-io.ts";
import { Prompt, type PromptOpts } from "./base.ts";

export type ListOpts = PromptOpts<any> & {
  choices: Choice[];
  multiple?: boolean;
  selectedPrefix?: string;
  unselectedPrefix?: string;
  inactiveFormatter?: (message: string) => string;
  activeFormatter?: (message: string) => string;
  disabledFormatter?: (message: string) => string;
};

export class ListPrompt extends Prompt<any> {
  private choices: Choice[];
  private inactiveFormatter?: (message: string) => string;
  private activeFormatter?: (message: string) => string;
  private disabledFormatter?: (message: string) => string;
  private multiple?: boolean;
  private selectedPrefix: string;
  private unselectedPrefix: string;

  private _active: number = 0;
  private _items: ListItem[];
  private _running: boolean = true;

  constructor(opts: ListOpts) {
    super(opts);
    this.choices = opts.choices;
    this.inactiveFormatter = opts.inactiveFormatter;
    this.activeFormatter = opts.activeFormatter;
    this.disabledFormatter = opts.disabledFormatter;
    this.multiple = opts.multiple;
    this.selectedPrefix = opts.selectedPrefix ?? "";
    this.unselectedPrefix = opts.unselectedPrefix ?? "";

    if (this.default) {
      const indexOfDefault = this.choices.findIndex(
        (choice) => choice.value === this.default
      );
      if (indexOfDefault >= 0) {
        this._active = indexOfDefault;
      }
    }

    this._items = this.choices.map((choice, idx) => {
      if (choice instanceof Separator) {
        return choice;
      }

      return new ListItem({
        message: choice.message,
        disabled: choice.disabled ?? false,
        active: idx === this._active,
        selected: false,
        selectedPrefix: this.selectedPrefix,
        unselectedPrefix: this.unselectedPrefix,
        inactiveFormatter: this.inactiveFormatter,
        activeFormatter: this.activeFormatter,
        disabledFormatter: this.disabledFormatter,
      });
    });
  }

  private up(startIndex: number) {
    this._items[this._active].active = false;

    if (this._active === 0) {
      this._active = this.choices.length - 1;
    } else {
      this._active--;
    }

    this._items[this._active].active = true;

    if (this._active === startIndex) {
      return;
    }

    if (this._items[this._active].disabled) {
      this.up(startIndex);
    }
  }

  private down(startIndex: number) {
    this._items[this._active].active = false;

    if (this._active === this.choices.length - 1) {
      this._active = 0;
    } else {
      this._active++;
    }

    this._items[this._active].active = true;

    if (this._active === startIndex) {
      return;
    }

    if (this._items[this._active].disabled) {
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

    this._items[this._active].selected = !this._items[this._active].selected;
  }

  private enter() {
    if (this.multiple) {
      this.finish();
      return;
    }

    this._items[this._active].selected = true;
    this.finish();
  }

  protected async questionMultiple(): Promise<any[] | undefined> {
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

        onEnter: this.enter.bind(this),
        onSpace: this.select.bind(this),
        onUp: () => this.up(this._active),
        onDown: () => this.down(this._active),
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

  async questionSingle(): Promise<any> {
    const result = await this.questionMultiple();
    return result?.[0];
  }
}

export { type Choice, Separator };
