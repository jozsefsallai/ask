import type { Reader, ReaderSync, Writer, WriterSync, Closer } from "@std/io";

export async function readLine({
  input,
  output,
  hidden,
  mask,
}: {
  input: Reader & ReaderSync & Closer;
  output: Writer & WriterSync & Closer;
  hidden?: boolean;
  mask?: string;
}): Promise<string | undefined> {
  let isRaw = false;
  if ((hidden || mask) && input === Deno.stdin) {
    (input as typeof Deno.stdin).setRaw(true);
    isRaw = true;
  }

  let inputStr = "";
  let pos = 0;
  let esc = false;

  while (true) {
    const data = new Uint8Array(1);
    const n = await input.read(data);

    if (!n) {
      break;
    }

    const str = new TextDecoder().decode(data.slice(0, n));

    for (const char of str) {
      switch (char) {
        // end of text control characters
        case "\u0003": // ETX
        case "\u0004": // EOT
          if (isRaw) {
            (input as typeof Deno.stdin).setRaw(false);
          }
          return undefined;

        // newline control characters
        case "\r": // CR
        case "\n": // LF
          if (isRaw) {
            (input as typeof Deno.stdin).setRaw(false);
          }

          if (hidden || mask) {
            await output.write(new TextEncoder().encode("\n"));
          }

          return inputStr;

        // delete control characters
        case "\u0008": // BS
        case "\u007f": // DEL
          if (pos === 0) {
            break;
          }

          inputStr = inputStr.slice(0, pos - 1) + inputStr.slice(pos);

          if (mask) {
            if (pos <= inputStr.length) {
              const maskStr = mask.repeat(Math.max(1, inputStr.length - pos));
              await output.write(new TextEncoder().encode(maskStr + " "));

              const backStr = "\u0008".repeat(maskStr.length + 2);
              await output.write(new TextEncoder().encode(backStr));
            } else {
              await output.write(new TextEncoder().encode("\u0008 \u0008"));
            }
          }

          pos = Math.max(0, pos - 1);

          break;

        // escape control characters
        case "\u001b": // ESC
          esc = true;
          break;

        case "[":
          if (esc) {
            esc = false;
            const data = new Uint8Array(1);
            await input.read(data);

            switch (new TextDecoder().decode(data)) {
              case "D": // left
                pos = Math.max(0, pos - 1);

                if (mask) {
                  await output.write(new TextEncoder().encode("\u0008"));
                }

                break;
              case "C": // right
                pos = Math.min(inputStr.length, pos + 1);

                if (mask) {
                  await output.write(new TextEncoder().encode(mask));
                }

                break;
              case "3": {
                // delete
                const data = new Uint8Array(1);
                await input.read(data);

                if (new TextDecoder().decode(data) === "~") {
                  if (pos === inputStr.length) {
                    break;
                  }

                  inputStr = inputStr.slice(0, pos) + inputStr.slice(pos + 1);

                  if (mask) {
                    const maskStr = mask.repeat(
                      Math.max(1, inputStr.length - pos)
                    );
                    await output.write(new TextEncoder().encode(maskStr + " "));
                    const backStr = "\u0008".repeat(maskStr.length + 1);
                    await output.write(new TextEncoder().encode(backStr));
                  }
                }

                break;
              }
              default:
                break;
            }

            break;
          }

        // falls through

        default:
          inputStr = inputStr.slice(0, pos) + char + inputStr.slice(pos);
          pos += 1;

          if (mask) {
            if (pos === inputStr.length) {
              await output.write(new TextEncoder().encode(mask));
            } else {
              const maskStr = mask.repeat(
                Math.max(1, inputStr.length - pos + 1)
              );
              await output.write(new TextEncoder().encode(maskStr));

              const backStr = "\u0008".repeat(maskStr.length - 1);
              await output.write(new TextEncoder().encode(backStr));
            }
          }

          break;
      }
    }
  }

  return undefined;
}
