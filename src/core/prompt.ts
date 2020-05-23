export interface PromptOpts {
  name: string;
  type?: string;
  message?: string;
  prefix?: string;
  default?: string;
  input?: Deno.Reader & Deno.ReaderSync & Deno.Closer;
  output?: Deno.Writer & Deno.WriterSync & Deno.Closer;
}

class Prompt {
  protected name: string;
  protected type?: string;
  protected message: string;
  protected prefix?: string;
  protected default?: string;
  protected input: Deno.Reader & Deno.ReaderSync & Deno.Closer;
  protected output: Deno.Writer & Deno.WriterSync & Deno.Closer;

  constructor(opts: PromptOpts) {
    if (!opts.name || opts.name.trim().length === 0) {
      throw new Error('Please provide the name of the prompt.');
    }

    this.name = opts.name;
    this.type = opts.type || 'text';
    this.message = opts.message || opts.name;
    this.prefix = opts.prefix || '\x1b[32m?\x1b[39m';
    this.default = opts.default
    this.input = opts.input || Deno.stdin;
    this.output = opts.output || Deno.stdout;
  }

  private format(str: string): string {
    return '\x1b[1m' + str + '\x1b[22m' + (this.default ? ` (${this.default}):` : ':');
  }

  protected getPrompt(): string {
    const components: string[] = [];

    if (this.prefix?.length) {
      components.push(this.prefix);
    }

    components.push(this.format(this.message));

    return components.join(' ') + ' ';
  }
}

export default Prompt;
