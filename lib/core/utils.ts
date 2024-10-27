export function unIro(input: string): string {
  // deno-lint-ignore no-control-regex
  return input.replace(/\u001b\[[0-9;]*m/g, "");
}

export async function getPreferredEditor(): Promise<string | undefined> {
  const env = Deno.env.get("VISUAL") || Deno.env.get("EDITOR");

  if (env) {
    return env;
  }

  const paths = ["code", "subl", "atom", "vim", "emacs", "nano", "pico", "ed"];

  for (const path of paths) {
    try {
      let cmd: Deno.Command;

      if (Deno.build.os === "windows") {
        cmd = new Deno.Command("where", {
          args: [path],
        });
      } else {
        cmd = new Deno.Command("which", {
          args: [path],
        });
      }

      const res = await cmd.output();
      if (res.code === 0) {
        return new TextDecoder().decode(res.stdout).trim();
      }
    } catch {
      continue;
    }
  }

  return undefined;
}
