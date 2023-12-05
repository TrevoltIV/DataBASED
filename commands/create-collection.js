#!/usr/bin/env node
const fs = require('fs').promises
const path = require('path')


const args = process.argv.slice(2)

function handleCommandLineArgs() {
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`DataBASED create-collection Help: Usage: 'npx create-collection {new_collection_name} {database_name}'`)
  } else {
    const createDatabaseIndex = args.findIndex(arg => arg === 'create-collection')

    if (args.length > createDatabaseIndex + 2) {
      const colName = args[createDatabaseIndex + 1]
      const dbName = args[createDatabaseIndex + 2]
      createCollection(dbName, colName)
    } else {
      console.log('DataBASED create-collection Error: Missing argument(s). Use --help for usage information.')
    }
  }
}

async function createCollection(dbName, colName) {
  const projectDir = process.cwd()
  const collectionPath = path.join(projectDir, 'databased', 'databases', dbName, 'collections', colName, 'documents')

  try {
    await fs.stat(collectionPath)
    console.log(`DataBASED create-collection Error: Collection with name '${colName}' already exists in database '${dbName}'.`)
  } catch (err) {
    if (err.code === 'ENOENT') {

      await fs.mkdir(collectionPath, { recursive: true })
      console.log(`DataBASED: New collection '${colName}' successfully created: '${collectionPath}'`)
    } else {
      throw err
    }
  }

  const indexingPath = path.join(projectDir, 'databased', 'indexing', 'databases', dbName, 'collections', colName)
  try {
    await fs.stat(indexingPath)
  } catch(err) {
    if (err.code === 'ENOENT') {
      await fs.mkdir(indexingPath, { recursive: true })
    } else {
      throw err
    }
  }
}


handleCommandLineArgs()