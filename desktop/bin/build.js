'use strict'

let path = require('path')
let fs = require('fs-extra')
let forgePackage = require('electron-forge/dist/api/make').default

function buildForPlatform (dir, outDir, platform) {
  const parts = (platform ? platform.split('/') : [process.platform, process.arch])

  return forgePackage({
    dir,
    interactive: true,
    platform: parts[0],
    arch: parts[1],
    outDir
  })
}

function build (options) {
  const dir = path.resolve(options.dir)
  const outDir = path.resolve(options.dir, 'desktop', 'build')

  const includePath = path.resolve(options.dir, 'node_modules', 'react-electron-chunky', 'include')
  process.env.CPPFLAGS = `-I${path.resolve(includePath)}`

  if (fs.existsSync(outDir)) { fs.removeSync(outDir) }

  if (options.config && options.config.build && options.config.build.platforms) {
    return Promise.all(options.config.build.platforms.map(p => buildForPlatform(dir, outDir, p)))
  }

  return buildForPlatform(dir, outDir)
}

module.exports = build
