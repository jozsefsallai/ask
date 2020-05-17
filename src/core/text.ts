import Prompt, { PromptOpts } from './prompt.ts';
import { BufReader } from 'https://deno.land/std@0.51.0/io/bufio.ts';

class Text extends Prompt {
  constructor(opts: PromptOpts) {
    super(opts);
  }

  protected getReader(): BufReader {
    return new BufReader(this.input);
  }

  protected async question(): Promise<string | undefined> {
    const reader = this.getReader();
    const prompt = new TextEncoder().encode(this.getPrompt());

    await this.output.write(prompt);

    try {
      const input = await reader.readLine();
      return input?.line && new TextDecoder().decode(input.line);
    } catch (err) {
      throw err;
    }
  }
}

export default Text;
