import iro, { cyan, gray } from "@sallai/iro";
import type { Reader, Closer, ReaderSync, Writer, WriterSync } from "@std/io";

export type Choice<T> = {
  message: string;
  value?: T;
  disabled?: boolean;
};

export class ListItem {
  message: string;
  disabled: boolean;
  selected: boolean;

  inactiveFormatter: (message: string) => string;
  activeFormatter: (message: string) => string;
  disabledFormatter: (message: string) => string;

  constructor({
    message,
    disabled,
    selected,
    inactiveFormatter,
    activeFormatter,
    disabledFormatter,
  }: {
    message: string;
    disabled: boolean;
    selected: boolean;
    inactiveFormatter?: (message: string) => string;
    activeFormatter?: (message: string) => string;
    disabledFormatter?: (message: string) => string;
  }) {
    this.message = message;
    this.disabled = disabled;
    this.selected = selected;
    this.inactiveFormatter = inactiveFormatter ?? this.defaultInactiveFormatter;
    this.activeFormatter = activeFormatter ?? this.defaultActiveFormatter;
    this.disabledFormatter = disabledFormatter ?? this.defaultDisabledFormatter;
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

  format() {
    if (this.disabled) {
      return this.disabledFormatter(this.message);
    }

    if (this.selected) {
      return this.activeFormatter(this.message);
    }

    return this.inactiveFormatter(this.message);
  }
}

export class Separator extends ListItem {
  constructor(message?: string) {
    super({
      message: message ?? iro(" " + "-".repeat(16), gray),
      disabled: true,
      selected: false,
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
