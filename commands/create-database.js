#!/usr/bin/env node
const fs = require('fs').promises
const path = require('path')


const args = process.argv.slice(2)

function handleCommandLineArgs() {
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`DataBASED create-database Help: Usage: 'npx create-database {new_database_name}'`)
  } else {
    const createDatabaseIndex = args.findIndex(arg => arg === 'create-database')

    if (args.length > createDatabaseIndex + 1) {
      const dbName = args[createDatabaseIndex + 1]
      createDatabase(dbName)
    } else {
      console.log('DataBASED create-database Error: No argument specified. Use --help for usage information.')
    }
  }
}

async function createDatabase(dbName) {
  const projectDir = process.cwd()
  const databasePath = path.join(projectDir, 'databased', 'databases', dbName, 'collections')
  const indexingPath = path.join(projectDir, 'databased', 'indexing', 'databases', dbName, 'collections')

  try {
    await fs.stat(databasePath)
    console.log(`DataBASED create-database Error: Database with name '${dbName}' already exists.`)
  } catch (err) {
    if (err.code === 'ENOENT') {

      await fs.mkdir(databasePath, { recursive: true })
      console.log(`DataBASED: New database '${dbName}' successfully created: '${databasePath}'`)
    } else {
      throw err
    }
  }

  // Create indexing directory
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