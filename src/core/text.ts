import Prompt, { PromptOpts } from "./prompt.ts";
import { BufReader } from "https://deno.land/std@0.87.0/io/bufio.ts";
import iro, { red } from "https://deno.land/x/iro@1.0.3/mod.ts";

class Text extends Prompt {
  constructor(opts: PromptOpts) {
    super(opts);
  }

  protected getReader(): BufReader {
    return new BufReader(this.input);
  }

  protected async printError(msg: string) {
    await this.output.write(
      new TextEncoder().encode(`${iro(">>", red)} ${msg}\n`),
    );
  }

  protected printErrorSync(msg: string) {
    this.output.writeSync(
      new TextEncoder().encode(`${iro(">>", red)} ${msg}\n`),
    );
  }

  protected async question(): Promise<string | undefined> {
    const reader = this.getReader();
    const prompt = new TextEncoder().encode(this.getPrompt());

    await this.output.write(prompt);

    const input = await reader.readLine();
    let result = input?.line && new TextDecoder().decode(input.line);
    let pass = true;

    if (!result && this.default) {
      result = this.default;
    }

    try {
      pass = await Promise.resolve(this.validate(result));
    } catch (e) {
      pass = false;
      await this.printError(typeof e === "string" ? e : e.message);
    }

    if (!pass) {
      return this.question();
    }

    return result;
  }
}

export default Text;
