import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const pkgName = 'router'
const umdName = 'ServiceWorkerRouter'
const banner = `
/*!
 * ${pkg.name} v${pkg.version} by ${pkg.author}
 * ${pkg.homepage}
 * @license ${pkg.license}
 */
`.trim()

export default [
  /* router.js and router.mjs */
  {
    input: 'src/router.ts',
    output: [
      { file: `dist/${pkgName}.js`, format: 'cjs', sourcemap: true, banner },
      { file: `dist/${pkgName}.mjs`, format: 'esm', sourcemap: true, banner }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        typescript: require('typescript')
      })
    ],
    external: ['url-pattern']
  },

  /* router.browser.js and router.browser.mjs */
  {
    input: 'src/router.ts',
    output: [
      {
        file: `dist/${pkgName}.browser.js`,
        format: 'umd',
        name: umdName,
        sourcemap: true
      },
      {
        file: `dist/${pkgName}.browser.mjs`,
        format: 'esm',
        sourcemap: true,
        banner
      }
    ],
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        typescript: require('typescript')
      })
    ]
  },

  /* router.min.js */
  {
    input: 'src/router.ts',
    output: [
      {
        file: `dist/${pkgName}.min.js`,
        format: 'umd',
        name: umdName,
        sourcemap: true,
        banner
      }
    ],
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        typescript: require('typescript')
      }),
      terser({
        output: {
          comments: 'some'
          // comments: (_, c) => /@preserve|@license|@cc_on/i.test(c.value)
          // comments: (_, { value }) => /@preserve|@license|@cc_on/i.test(value)
        }
      })
    ]
  }
]
