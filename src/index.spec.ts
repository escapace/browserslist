import { build } from 'esbuild'
import { type Targets, transform } from 'lightningcss'
import { transformSync as transformOxcSync } from 'oxc-transform'
import { assert, describe, it } from 'vitest'
import { browserslist } from '.'

export const minify = (value: string, targets: Targets) => {
  const { code } = transform({
    code: Buffer.from(value),
    filename: 'style.css',
    minify: true,
    targets,
  })

  return code.toString()
}

describe('./src/index.spec.ts', () => {
  it('baseline', () => {
    const { browsers, esbuild, lightningcss, oxc } = browserslist({
      queries: 'baseline widely available or last 2 versions and not dead',
    })

    assert.isNotEmpty(esbuild)
    assert.isNotEmpty(lightningcss)
    assert.isNotEmpty(oxc)
    assert.isNotEmpty(browsers)

    esbuild.forEach((value) => assert.isString(value))
    Object.entries(lightningcss).forEach(([_, value]) => assert.isNumber(value))
    oxc.forEach((value) => assert.isString(value))
    Object.entries(browsers).forEach(([_, value]) => assert.isString(value))
  })

  it('type checks', () => {
    const { browsers, esbuild, lightningcss, oxc } = browserslist({
      queries: '> 0.00001%',
    })

    assert.isArray(esbuild)
    assert.isArray(browsers)
    assert.isObject(lightningcss)
    assert.isArray(oxc)

    esbuild.forEach((value) => assert.isString(value))
    Object.entries(lightningcss).forEach(([_, value]) => assert.isNumber(value))
    oxc.forEach((value) => assert.isString(value))
    Object.entries(browsers).forEach(([_, value]) => assert.isString(value))
  })

  it('lightningcss', () => {
    const targets = browserslist({
      queries: '>= 0.25%',
    })

    const string = minify(
      `
.logo {
  background: image-set(url(logo.png) 2x, url(logo.png) 1x);
}
`,
      targets.lightningcss,
    )

    assert.isString(string)
  })

  it('maps iOS Safari to esbuild and Oxc targets', () => {
    const { esbuild, oxc } = browserslist({
      queries: 'ios_saf >= 13.4',
    })

    assert.include(esbuild, 'ios13.4')
    assert.include(oxc, 'ios13.4')
  })

  it('maps Samsung Internet to an Oxc target', () => {
    const { esbuild, oxc } = browserslist({
      queries: 'samsung >= 14',
    })

    assert.notInclude(esbuild, 'samsung14')
    assert.include(oxc, 'samsung14')
  })

  it('oxc', () => {
    const targets = browserslist({
      queries: 'last 2 versions and not dead and fully supports es6-module',
    })

    const result = transformOxcSync(
      'imaginary-file.ts',
      `
export function parseVersion(version: string): number | undefined {
  const [major, minor = 0, patch = 0] = version
    .split('-')[0]
    .split('.')
    .map((v) => parseInt(v, 10))

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return undefined
  }

  return (major << 16) | (minor << 8) | patch
}
`,
      {
        target: targets.oxc,
      },
    )

    assert.isEmpty(result.errors)
    assert.isString(result.code)
  })

  it('esbuild', async () => {
    const targets = browserslist({
      queries: 'last 2 versions and not dead and fully supports es6-module',
    })

    const result = await build({
      format: 'esm',
      stdin: {
        contents: `
export function parseVersion(version: string): number | undefined {
  const [major, minor = 0, patch = 0] = version
    .split('-')[0]
    .split('.')
    .map((v) => parseInt(v, 10))

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    return undefined
  }

  return (major << 16) | (minor << 8) | patch
}
`,
        loader: 'ts',
        resolveDir: './src',
        sourcefile: 'imaginary-file.ts',
      },
      target: targets.esbuild,
      write: false,
    })

    assert.isString(result.outputFiles[0].text)
  })
})
