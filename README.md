# ask

Interactive command-line prompts for Deno.

## Table of Contents

- [Description](#description)
- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Options](#options)
  - [General Options](#general-options)
  - [Global Options](#global-options)
  - [Confirm](#confirm)
  - [Number](#number)
- [TODOs](#todos)
- [License](#license)

## Description

`ask` is a slick and dependency-free Deno module that allows you to create interactive command-line applications, similar to what you'd achieve with [inquirer](https://www.npmjs.com/package/inquirer) in Node.js. **Right now this module is very early in development**, so please don't expect it to support everything inquirer does.

## Overview

- **Supported prompts:** input (text), confirm (yes/no response), number... and more to come!
- Elegant output
- Familiar, inquirer-like syntax
- Easily configurable
- Dependency-free

## Basic Usage

It's very easy to get started. Just create an `Ask` instance and use the `prompt()` method to enumerate your questions.

```ts
import Ask from 'https://deno.land/x/ask/mod.ts';

const ask = new Ask(); // global options are also supported! (see below)

const answers = await ask.prompt([
  {
    name: 'name',
    type: 'input',
    message: 'Name:'
  },
  {
    name: 'age',
    type: 'number',
    message: 'Age:'
  }
]);

console.log(answers); // { name: "Joe", age: 19 }
```

You can also just ask a single question:

```ts
const { name } = await ask.input({
  name: 'name',
  message: 'Name:'
});

console.log(name); // Joe
```

## Options

`ask` has options that you can pass to individual prompts.

### General Options

These options are available for all question types.

- `name` **(string, required)** - the name of the key in the returned object file that will contain the response to the question
- `type` **(string)** - one of the supported types, defaults to `"input"`
- `message` **(string)** - the message that will be displayed in the prompt. If not provided, the value of the `name` option will be displayed.
- `prefix` **(string)** - the prefix that will be displayed before the question. Defaults to a green question mark.
- `suffix` **(string)** - the suffix that will be displayed after the question. If no `message` is provided, it defaults to a colon `:`. Otherwise it defaults to an empty string.
- `input` **(Deno.Reader & Deno.ReaderSync & Deno.Closer)** - the input buffer to accept answers. Defaults to `Deno.stdin`.
- `output` **(Deno.Writer & Deno.WriterSync & Deno.Closer)** - the output buffer used to display the questions. Defaults to `Deno.stdout`.
- `validate` **(val?: any) => Promise<boolean> | boolean** - a function that can be used to validate the user input. Defaults to a function that always returns `true`.

### Global Options

These options will apply to every prompt in a given `Ask` instance, unless overwritten:

- `prefix` **(string)**
- `suffix` **(string)**
- `input` **(Deno.Reader & Deno.ReaderSync & Deno.Closer)**
- `output` **(Deno.Writer & Deno.WriterSync & Deno.Closer)**

**Example:**

```ts
import Ask from 'https://deno.land/x/ask';

const ask = new Ask({
  prefix: '>'
});

const answers = await ask.prompt([
  {
    name: 'name',
    message: 'Your name:',
    type: 'input'
  },
  {
    name: 'age',
    message: 'Your age:',
    type: 'number',
    prefix: '?'
  }
]);

// > Your name:
// ? Your age:
```

### Confirm

- `accept` **(string)** - the character/sequence used as the "yes" answer. This will also be the default value. The function will only return true if the user entered this string or nothing at all. Defaults to `"Y"`.
- `deny` **(string)** - the character/sequence used as the "no" answer. Doesn't really matter what you put here, it's mainly there for stylistic reasons. Defaults to `"n"`.

### Number

- `min` **(number)** - the minimum value that the user can enter. Defaults to `-Infinity`.
- `max` **(number)** - the maximum value that the user can enter. Defaults to `Infinity`.

Depending on which of these parameters are provided, the function will print different output:

```js
// if none are provided:
'message'

// if `min` is provided, but `max` is not:
'message (>= min)'

// if `max` is provided, but `min` is not:
'message (<= max)'

// if both are provided:
'message [min-max]'
```

Right now, this behavior is not configurable, but if there's popular demand for it, I could add it as a configuration option.

## TODOs

- [x] Global configuration
- [ ] `hidden` type
- [ ] `masked` type
- [ ] `list` type
- [ ] Unit tests

## License

MIT.
