import _browserslist from 'browserslist'

// import type { Targets as LightningcssTargetsOption } from 'lightningcss'

/**
 * Represents lightningcss target constraints keyed by browser family.
 *
 * @remarks
 * This shape matches the `targets` option accepted by lightningcss.
 * It is returned by {@link browserslist} under the `lightningcss` field.
 */
export interface LightningcssTargetsOption {
  android?: number
  chrome?: number
  edge?: number
  firefox?: number
  ie?: number
  ios_saf?: number
  opera?: number
  safari?: number
  samsung?: number
}

/**
 * Defines the set of browser keys supported by {@link LightningcssTargetsOption}.
 */
export type LightningcssTargets = keyof LightningcssTargetsOption

/**
 * Describes the input accepted by {@link browserslist}.
 *
 * @remarks
 * This interface extends the upstream browserslist options and adds an optional `queries` field.
 *
 * @see https://github.com/browserslist/browserslist#api
 */
export interface Options extends _browserslist.Options {
  /**
   * Browserslist query or query list used to resolve the target browser set.
   */
  queries?: string | readonly string[] | null
}

type BrowserlistTargets =
  | 'and_chr'
  | 'and_ff'
  | 'and_qq'
  | 'and_uc'
  | 'android'
  | 'baidu'
  | 'bb'
  | 'chrome'
  | 'edge'
  | 'firefox'
  | 'ie_mob'
  | 'ie'
  | 'ios_saf'
  | 'kaios'
  | 'node'
  | 'op_mini'
  | 'op_mob'
  | 'opera'
  | 'safari'
  | 'samsung'

type EsbuildTargets =
  | 'chrome'
  | 'deno'
  | 'edge'
  | 'firefox'
  | 'hermes'
  | 'ie'
  | 'ios'
  | 'node'
  | 'opera'
  | 'rhino'
  | 'safari'

// https://github.com/parcel-bundler/lightningcss/blob/master/node/browserslistToTargets.js
// https://github.com/parcel-bundler/lightningcss/blob/master/node/targets.d.ts
const BROWSER_MAPPING_LIGHTNINGCSS: Record<BrowserlistTargets, LightningcssTargets | undefined> = {
  and_chr: 'chrome',
  and_ff: 'firefox',
  and_qq: undefined,
  and_uc: undefined,
  android: 'android',
  baidu: undefined,
  bb: undefined,
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  ie: 'ie',
  ie_mob: undefined,
  ios_saf: 'ios_saf',
  kaios: undefined,
  node: undefined,
  op_mini: undefined,
  op_mob: undefined,
  opera: 'opera',
  safari: 'safari',
  samsung: 'samsung',
}

// https://esbuild.github.io/api/#target
const BROWSER_MAPPING_ESBUILD: Record<BrowserlistTargets, EsbuildTargets | undefined> = {
  and_chr: 'chrome',
  and_ff: 'firefox',
  and_qq: undefined,
  and_uc: undefined,
  android: undefined,
  baidu: undefined,
  bb: undefined,
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  ie: 'ie',
  ie_mob: undefined,
  ios_saf: 'ios',
  kaios: undefined,
  node: undefined,
  op_mini: undefined,
  op_mob: undefined,
  opera: 'opera',
  safari: 'safari',
  samsung: undefined,
}

function parseVersion(version: string): number | undefined {
  const [major, minor = 0, patch = 0] = version
    .split('-')[0]
    .split('.')
    .map((v) => parseInt(v, 10))

  if (Number.isNaN(major) || Number.isNaN(minor) || Number.isNaN(patch)) {
    return undefined
  }

  return (major << 16) | (minor << 8) | patch
}

function fromBrowserlist<
  T extends typeof BROWSER_MAPPING_ESBUILD | typeof BROWSER_MAPPING_LIGHTNINGCSS,
>(browserslist: string[], mapping: T) {
  type MappingValue = Exclude<T extends Record<keyof T, infer X> ? X : undefined, undefined>

  const targets = {} as unknown as Record<MappingValue, number | undefined>

  for (const browser of browserslist) {
    const [name, v] = browser.split(' ') as [keyof T, string]

    const newName = mapping[name] as MappingValue | undefined

    if (newName === undefined) {
      continue
    }

    const version = parseVersion(v)

    if (version === undefined) {
      continue
    }

    const value = targets[newName]

    if (value === undefined || version < value) {
      targets[newName] = version
    }
  }

  return targets
}

const semver = (version: number): number[] => [
  (version >> 16) & 0xff,
  (version >> 8) & 0xff,
  version & 0xff,
]

/**
 * Resolves a browser support policy and provides targets for esbuild and lightningcss.
 *
 * @remarks
 * The support policy is expressed as a browserslist query.
 * The result includes:
 *
 * - `browsers`: the resolved browser/version list returned by browserslist.
 *
 * - `esbuild`: target strings suitable for esbuild’s `target` option.
 *
 * - `lightningcss`: a targets object suitable for lightningcss’s `targets` option.
 *
 * @param options - browserslist query and options.
 * @returns Resolved browsers and tool-specific target formats.
 *
 * @see https://github.com/browserslist/browserslist
 * @see https://esbuild.github.io/api/#target
 * @see https://lightningcss.dev
 */
export const browserslist = (
  options: Options,
): {
  browsers: string[]
  esbuild: string[]
  lightningcss: Record<LightningcssTargets, number | undefined>
} => {
  const { queries, ...browserslistOptions } = options ?? {}

  const browsers = _browserslist(
    queries,
    Object.entries(browserslistOptions).length === 0 ? undefined : browserslistOptions,
  )
  const lightningcssTargets = fromBrowserlist(browsers, BROWSER_MAPPING_LIGHTNINGCSS)

  // A function that receives a single 24-bit number, the number represents a
  // semantic version with one semver component (major, minor, patch) per byte.
  // For example, the number 852480 would represent version 13.2.0. The function
  // returns the major minor and patch components of the semantic version.

  const esbuildTargets = Object.entries(fromBrowserlist(browsers, BROWSER_MAPPING_ESBUILD))
    .map(([key, value]) => {
      const version = typeof value === 'number' ? semver(value) : undefined
      const browser = BROWSER_MAPPING_ESBUILD[key as keyof typeof BROWSER_MAPPING_ESBUILD]

      if (version !== undefined && browser !== undefined) {
        if (version[2] === 0) {
          version.pop()
        }

        if (version[1] === 0) {
          version.pop()
        }

        if (version[0] === 0) {
          version.pop()
        }

        if (version.length !== 0) {
          return `${browser}${version.join('.')}`
        }
      }

      return undefined
    })
    .filter((value): value is string => value !== undefined)

  return {
    browsers,
    esbuild: esbuildTargets,
    lightningcss: lightningcssTargets,
  }
}
