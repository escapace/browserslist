# @escapace/browserslist

Core takeaway: `@escapace/browserslist` resolves a Browserslist query and returns targets for esbuild and lightningcss.

Why it matters: build pipelines often need one auditable browser support policy that can be reused across JavaScript and CSS build steps.

## Install

`browserslist` is a peer dependency.

```sh
pnpm add @escapace/browserslist browserslist
```

## Input

`browserslist(options)` accepts:

- `queries`: a Browserslist query string or query list. This field is optional.
- All upstream Browserslist options via `Options`, including options used with `.browserslistrc` and the `browserslist` field in `package.json`.

When `queries` is omitted, Browserslist applies its normal configuration and defaults.

## Usage

```ts
import { browserslist } from '@escapace/browserslist'

const targets = browserslist({
  queries: ['last 2 versions', 'not dead'],
})

// Audit the resolved policy.
console.log(targets.browsers)

// Derived targets for tool configuration.
console.log(targets.esbuild)
console.log(targets.lightningcss)
```

## Behavior and output

`browserslist(options)` returns:

- `browsers`: the resolved browser/version list from Browserslist. This list is the baseline for audits and debugging.
- `esbuild`: target strings intended for esbuild’s `target` option.
- `lightningcss`: targets object intended for lightningcss’s `targets` option.

Notes:

- `esbuild` and `lightningcss` are tool-specific formats and may omit browser families that cannot be represented for that tool.

# API

## function browserslist [↗](src/index.ts#L199-L251 'browserslist')

Resolves a browser support policy and provides targets for esbuild and lightningcss.

```typescript
browserslist: (options: Options) => {
  browsers: string[];
  esbuild: string[];
  lightningcss: Record<LightningcssTargets, number | undefined>;
}
```

### Parameters

| Parameter | Type                                                          | Description                     |
| --------- | ------------------------------------------------------------- | ------------------------------- |
| `options` | <pre>[Options](#interface-options- 'interface Options')</pre> | Browserslist query and options. |

### Returns

Resolved browsers and tool-specific target formats.

### Remarks

The support policy is expressed as a Browserslist query. The result includes:

- `browsers`: the resolved browser/version list returned by Browserslist.
- `esbuild`: target strings suitable for esbuild’s `target` option.
- `lightningcss`: a targets object suitable for lightningcss’s `targets` option.

## interface LightningcssTargetsOption [↗](src/index.ts#L12-L22 'LightningcssTargetsOption')

Represents lightningcss target constraints keyed by browser family.

```typescript
export interface LightningcssTargetsOption
```

### Remarks

This shape matches the `targets` option accepted by lightningcss. It is returned by [browserslist](#function-browserslist-) under the `lightningcss` field.

## interface Options [↗](src/index.ts#L37-L42 'Options')

Describes the input accepted by [browserslist](#function-browserslist-).

```typescript
export interface Options extends _browserslist.Options
```

### Remarks

This interface extends the upstream Browserslist options and adds an optional `queries` field.

### Options.queries

Browserslist query or query list used to resolve the target browser set.

```typescript
queries?: string | readonly string[] | null;
```

## type LightningcssTargets [↗](src/index.ts#L27 'LightningcssTargets')

Defines the set of browser keys supported by [LightningcssTargetsOption](#interface-lightningcsstargetsoption-).

```typescript
export type LightningcssTargets = keyof LightningcssTargetsOption
```
