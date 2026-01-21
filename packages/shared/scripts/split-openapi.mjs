#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { dump } from 'js-yaml'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OPENAPI_JSON_PATH = path.join(__dirname, '../src/openapi.json')
const OUTPUT_DIR = path.join(__dirname, '../src/openapi')

// Read the original OpenAPI JSON
const openapiJson = JSON.parse(fs.readFileSync(OPENAPI_JSON_PATH, 'utf8'))

// Extract paths and group by domain
const pathGroups = {}
const paths = openapiJson.paths || {}
Object.entries(paths).forEach(([pathKey, pathValue]) => {
  // Determine the domain from the path
  const segments = pathKey.split('/').filter(Boolean)
  const domain = segments[0] || 'root'

  if (!Object.prototype.hasOwnProperty.call(pathGroups, domain)) {
    Object.assign(pathGroups, { [domain]: {} })
  }
  // eslint-disable-next-line security/detect-object-injection
  const currentGroup = pathGroups[domain]
  Object.assign(currentGroup, { [pathKey]: pathValue })
})

// Write each path group to a separate YAML file
Object.entries(pathGroups).forEach(([domain, domainPaths]) => {
  const filename = path.join(OUTPUT_DIR, 'paths', `${domain}.yaml`)
  const yamlContent = dump(domainPaths, { lineWidth: 120 })
  fs.writeFileSync(filename, yamlContent, 'utf8')
  const pathCount = Object.keys(domainPaths).length
  console.warn(`✓ Created ${domain}.yaml (${pathCount} paths)`)
})

// Write components to separate file
const componentsFilename = path.join(OUTPUT_DIR, 'components.yaml')
const componentsYaml = dump(openapiJson.components || {}, { lineWidth: 120 })
fs.writeFileSync(componentsFilename, componentsYaml, 'utf8')
console.warn(`✓ Created components.yaml`)

// Create main openapi.yaml with references
const mainSpec = {
  openapi: openapiJson.openapi,
  info: openapiJson.info,
  servers: openapiJson.servers,
  security: openapiJson.security,
  tags: openapiJson.tags,
  paths: {},
  components: openapiJson.components || {},
}

// Add path references
Object.keys(pathGroups).forEach((domain) => {
  if (Object.prototype.hasOwnProperty.call(pathGroups, domain)) {
    // eslint-disable-next-line security/detect-object-injection
    const domainGroup = pathGroups[domain]
    Object.keys(domainGroup).forEach((pathKey) => {
      const refPath = `./paths/${domain}.yaml#/${pathKey.replace(/\//g, '~1')}`
      Object.assign(mainSpec.paths, { [pathKey]: { $ref: refPath } })
    })
  }
})

// Write main openapi.yaml
const mainYamlPath = path.join(OUTPUT_DIR, 'openapi.yaml')
const mainYaml = dump(mainSpec, { lineWidth: 120 })
fs.writeFileSync(mainYamlPath, mainYaml, 'utf8')
console.warn(`✓ Created openapi.yaml`)

console.warn(`\n✅ OpenAPI spec split complete!`)
console.warn(`   Main file: src/openapi/openapi.yaml`)
console.warn(`   Paths: src/openapi/paths/`)
console.warn(`   Components: src/openapi/components.yaml`)
