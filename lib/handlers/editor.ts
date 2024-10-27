import iro, { blue, gray } from "@sallai/iro";
import { Prompt, type PromptOpts } from "../core/base.ts";
import type { Result } from "../core/result.ts";
import { getPreferredEditor, unIro } from "../core/utils.ts";

/**
 * Options for the editor prompt.
 */
export type EditorOpts = PromptOpts<string> & {
  /**
   * The type of the prompt. This can not be changed but will be used to
   * determine the type of the question.
   */
  type?: "editor";

  /**
   * A path override or executable name for the editor to use. If not provided,
   * the `VISUAL` or `EDITOR` environment variables will be used, and if those
   * aren't present either, a series of common editors will be searched for in
   * the system `PATH`.
   */
  editorPath?: string;

  /**
   * A custom message to tell the user to press enter to launch their preferred
   * editor. If not provided, a default message will be used.
   */
  editorPromptMessage?: string;
};

/**
 * A prompt that will open a temporary file in the user's preferred editor and
 * will return the contents of the file when the editor is closed.
 */
export class EditorPrompt<T extends EditorOpts> extends Prompt<
  string | undefined
> {
  private editorPathOverride?: string;
  private editorPromptMessage?: string;

  constructor(opts: T) {
    super(opts);
    this.type = "editor";

    this.editorPathOverride = opts.editorPath;
    this.editorPromptMessage = opts.editorPromptMessage;
  }

  private getEditorPrompt(): string {
    if (this.editorPromptMessage) {
      return this.editorPromptMessage;
    }

    return iro(
      `Press ${iro("<enter>", blue)} to launch your preferred editor.`,
      gray
    );
  }

  private async launch(): Promise<string | undefined> {
    if (this.input === Deno.stdin) {
      (this.input as typeof Deno.stdin).setRaw(true);
    }

    while (true) {
      const buffer = new Uint8Array(1);
      await this.input.read(buffer);

      if (buffer[0] === 3) {
        throw new Error("Editor prompt was canceled.");
      }

      if (buffer[0] === 13) {
        break;
      }
    }

    if (this.input === Deno.stdin) {
      (this.input as typeof Deno.stdin).setRaw(false);
    }

    const editorPath = this.editorPathOverride ?? (await getPreferredEditor());

    if (!editorPath) {
      throw new Error(
        "No preferred editor found. Set the VISUAL or EDITOR environment variable."
      );
    }

    const tempFile = await Deno.makeTempFile({ prefix: "ask_" });

    const process = new Deno.Command(editorPath, {
      args: [tempFile],
    });

    const child = process.spawn();
    await child.output();

    const data = await Deno.readTextFile(tempFile);
    await Deno.remove(tempFile);

    return data;
  }

  /**
   * Opens a temporary file in the user's preferred editor and returns the
   * contents of the file when the editor is closed.
   */
  async run(): Promise<Result<T, string | undefined>> {
    const prompt = new TextEncoder().encode(this.getPrompt());
    await this.output.write(prompt);

    const editorPromptStr = this.getEditorPrompt();
    const editorPrompt = new TextEncoder().encode(editorPromptStr);
    const editorPromptLen = unIro(editorPromptStr).length;
    await this.output.write(editorPrompt);

    const data = await this.launch();

    await this.output.write(prompt);
    await this.output.write(
      new TextEncoder().encode(" ".repeat(editorPromptLen))
    );
    await this.output.write(new TextEncoder().encode("\n"));

    const result = {
      [this.name]: data,
    } as Result<T, string | undefined>;

    return result;
  }
}
