import iro, { cyan, gray } from "@sallai/iro";
import type { Reader, Closer, ReaderSync, Writer, WriterSync } from "@std/io";

/**
 * A single choice in a list.
 */
export type Choice = {
  /**
   * The text that will be displayed as the choice in the terminal UI.
   */
  message: string;

  /**
   * The value that will be returned when the choice is selected.
   */
  // deno-lint-ignore no-explicit-any
  value?: any;

  /**
   * Whether the choice is disabled. A disabled choice can never be selected.
   */
  disabled?: boolean;
};

/**
 * A single item in a list.
 */
export class ListItem {
  /**
   * The text that will be displayed as the item in the terminal UI.
   */
  message: string;

  /**
   * Whether the item is disabled.
   */
  disabled: boolean;

  /**
   * Whether the item is selected.
   */
  selected: boolean;

  /**
   * Whether the item is active. An active item is the one where the cursor is
   * currently located.
   */
  active: boolean;

  /**
   * The prefix that will be displayed in front of the message when the item is
   * selected.
   */
  selectedPrefix: string = "";

  /**
   * The prefix that will be displayed in front of the message when the item is
   * not selected.
   */
  unselectedPrefix: string = "";

  /**
   * A function that formats the message when the item is inactive.
   */
  inactiveFormatter: (message: string) => string;

  /**
   * A function that formats the message when the item is active.
   */
  activeFormatter: (message: string) => string;

  /**
   * A function that formats the message when the item is disabled.
   */
  disabledFormatter: (message: string) => string;

  constructor({
    message,
    disabled,
    selected,
    active,
    selectedPrefix,
    unselectedPrefix,
    inactiveFormatter,
    activeFormatter,
    disabledFormatter,
  }: {
    message: string;
    disabled: boolean;
    selected: boolean;
    active: boolean;
    selectedPrefix?: string;
    unselectedPrefix?: string;
    inactiveFormatter?: (message: string) => string;
    activeFormatter?: (message: string) => string;
    disabledFormatter?: (message: string) => string;
  }) {
    this.message = message;
    this.disabled = disabled;
    this.selected = selected;
    this.active = active;
    this.inactiveFormatter = inactiveFormatter ?? this.defaultInactiveFormatter;
    this.activeFormatter = activeFormatter ?? this.defaultActiveFormatter;
    this.disabledFormatter = disabledFormatter ?? this.defaultDisabledFormatter;

    if (selectedPrefix) {
      this.selectedPrefix = selectedPrefix;
    }

    if (unselectedPrefix) {
      this.unselectedPrefix = unselectedPrefix;
    }
  }

  /**
   * The full message is the message with the selected/unselected prefix at the
   * beginning of the string.
   */
  get fullMessage(): string {
    const prefix = this.selected ? this.selectedPrefix : this.unselectedPrefix;
    return prefix + this.message;
  }

  protected defaultInactiveFormatter(message: string): string {
    return `  ${message}`;
  }

  protected defaultActiveFormatter(message: string): string {
    return iro(`❯ ${message}`, cyan);
  }

  protected defaultDisabledFormatter(message: string): string {
    return iro(`- ${message} (disabled)`, gray);
  }

  /**
   * Will build the format string of the item based on its state.
   */
  format(): string {
    if (this.disabled) {
      return this.disabledFormatter(this.fullMessage);
    }

    if (this.active) {
      return this.activeFormatter(this.fullMessage);
    }

    return this.inactiveFormatter(this.fullMessage);
  }
}

/**
 * A separator in a list. You can use this to visually separate groups of items
 * in a list. The separator is always disabled and cannot be selected.
 *
 * You can change the message of the separator by passing a string to the
 * constructor. If you don't pass a message, the separator will be a line of
 * 16 dashes.
 */
export class Separator extends ListItem {
  constructor(message?: string) {
    super({
      message: message ?? iro(" " + "-".repeat(16), gray),
      disabled: true,
      selected: false,
      active: false,
      disabledFormatter: (message: string) => message,
    });
  }
}

export async function renderList({
  input,
  output,
  items,

  onEnter,
  onSpace,
  onDown,
  onUp,
}: {
  input: Reader & ReaderSync & Closer;
  output: Writer & WriterSync & Closer;
  items: ListItem[];

  onEnter: () => void;
  onSpace?: () => void;
  onUp: () => void;
  onDown: () => void;
}) {
  const lens: number[] = [];

  for (const item of items) {
    const formattedItem = item.format();
    lens.push(formattedItem.length + 1);
    await output.write(new TextEncoder().encode(formattedItem));

    if (item !== items[items.length - 1]) {
      await output.write(new TextEncoder().encode("\n"));
    }
  }

  const data = new Uint8Array(3);
  const n = await input.read(data);

  if (!n) {
    return;
  }

  const str = new TextDecoder().decode(data.slice(0, n));

  switch (str) {
    case "\u0003": // ETX
    case "\u0004": // EOT
      throw new Error("Terminated by user.");

    case "\r": // CR
    case "\n": // LF
      onEnter();
      break;

    case "\u0020": // SPACE
      if (onSpace) {
        onSpace();
      }
      break;

    case "\u001b[A": // UP
      onUp();
      break;

    case "\u001b[B": // DOWN
      onDown();
      break;
  }

  // clear list to rerender it
  for (let i = lens.length - 1; i > 0; --i) {
    // go to beginning of line
    await output.write(new TextEncoder().encode("\r"));
    // clear line
    await output.write(new TextEncoder().encode("\x1b[K"));
    // go up
    await output.write(new TextEncoder().encode("\x1b[A"));
  }
}
