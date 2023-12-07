#!/usr/bin/env node
const fsp = require('fs').promises
const fs = require('fs')
const path = require('path')


const args = process.argv.slice(2)

async function handleCommandLineArgs() {
  if (args.includes('-h') || args.includes('--help')) {
    console.log(`DataBASED backup-database Help: Usage: 'npx backup-database {database_name}'. Make sure you change the 'backup_path' field in './databased/settings.json' to your desired directory for backups.`)
  } else {
    const backupDatabaseIndex = args.findIndex(arg => arg === 'backup-database')

    if (args.length > backupDatabaseIndex + 1) {
      const dbName = args[backupDatabaseIndex + 1]
      backupDatabase(dbName)
    } else {
      console.log('DataBASED backup-database Error: No argument specified. Use --help for usage information.')
    }
  }
}

async function backupDatabase(dbName) {
    const projectDir = process.cwd()
    const databasePath = path.join(projectDir, 'databased', 'databases', dbName, 'collections')
    const indexingPath = path.join(projectDir, 'databased', 'indexing', 'databases', dbName, 'collections')

    async function copyDirectory(source, destination) {

        try {
            await fsp.stat(destination)
        } catch (err) {
            if (err.code === 'ENOENT') {
                await fsp.mkdir(destination, { recursive: true })
            }
        }

        const files = fs.readdirSync(source)

        files.forEach((file) => {
            const sourcePath = path.join(source, file)
            const destPath = path.join(destination, file)

            if (fs.statSync(sourcePath).isDirectory()) {
                copyDirectory(sourcePath, destPath)
            } else {
                fs.copyFileSync(sourcePath, destPath)
            }
        })
    }

    try {
        const settingsFilePath = path.join(projectDir, 'databased', 'settings.json')
        const settingsFile = await fsp.readFile(settingsFilePath, 'utf-8')
        const settings = JSON.parse(settingsFile)

        if (settings.backup_path) {
            const sourceDir = path.join(projectDir, 'databased')
            const destinationDir = path.join(settings.backup_path, `${dbName}-${Date.now().toString()}`)

            if (fs.statSync(sourceDir)) {
                copyDirectory(sourceDir, destinationDir)
            } else {
                console.log(`DataBASED backup-database Error: You have no databases! Create one with 'npx create-database {database_name}'.`)
            }
            console.log(`DataBASED: Successfully backed up database '${dbName}' to '${destinationDir}'.`)
        } else {
            console.log(`DataBASED backup-database Error: Missing backup directory path in settings.json. Set 'backup_path' to your desired backup directory in './databased/settings.json'.`)
        }
    } catch (err) {
        if (err.code === 'ENOENT' && err.path.endsWith('settings.json')) {
            console.log(`DataBASED backup-database Error: Missing settings.json file in './databased/'. Add one, and set a field 'backup_path' to your desired directory for backups.`)
        } else {
            console.log(err)
        }
    }
}


handleCommandLineArgs()