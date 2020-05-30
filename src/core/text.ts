import Prompt, { PromptOpts } from './prompt.ts';
import { BufReader } from 'https://deno.land/std@0.51.0/io/bufio.ts';

class Text extends Prompt {
  constructor(opts: PromptOpts) {
    super(opts);
  }

  protected getReader(): BufReader {
    return new BufReader(this.input);
  }

  protected async printError(msg: string) {
    await this.output.write(new TextEncoder().encode(`\x1b[31m>>\x1b[0m ${msg}\n`));
  }

  protected async question(): Promise<string | undefined> {
    const reader = this.getReader();
    const prompt = new TextEncoder().encode(this.getPrompt());

    await this.output.write(prompt);

    try {
      const input = await reader.readLine();
      let result = input?.line && new TextDecoder().decode(input.line);
      let pass = true;

      result = result || this.default || result;

      try {
        pass = await Promise.resolve(this.validate(result));
      }
      catch (e) {
        pass = false;
        await this.printError(typeof e === 'string' ? e : e.message);
      }

      if (!pass) {
        return this.question();
      }

      return result;
    } catch (err) {
      throw err;
    }
  }
}

export default Text;
