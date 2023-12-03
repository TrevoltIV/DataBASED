const fs = require('fs').promises
const path = require('path')

const projectDir = process.cwd()
const databasesPath = path.join(projectDir, `./databases`)



/*
        DataBASED v1.0.0

        Developers:
        * TrevoltIV
*/





// query()
async function query(dbName, colName, condition, limit) {
    const dbFilePath = path.join(databasesPath, dbName)
    const colFilePath = path.join(databasesPath, dbName, 'collections', colName)
    const docsFilePath = path.join(databasesPath, dbName, 'collections', colName, 'documents')

    try {
        await fs.stat(dbFilePath)
        await fs.stat(colFilePath)

        const files = await fs.readdir(docsFilePath)

        let i = 0

        const results = await Promise.all(files.map(async fileName => {
            const filePath = path.join(docsFilePath, fileName)
            const fileContent = await fs.readFile(filePath, 'utf8')
            const fileData = JSON.parse(fileContent)

            let result = {}

            if (typeof limit !== null) {
                if (i === limit) return result
            }

            for (let key in fileData) {
                const val = fileData[key]

                if (checkWhereCondition({property: key, value: val}, condition)) {
                    result = fileData
                    i += 1
                    break
                }
            }

            return result
        }))

        return results.filter(result => Object.keys(result).length !== 0)
    } catch (err) {
        if (err.code === 'ENOENT') {
            const errorMessage = err.message.includes(dbName) ?
                `Database '${dbName}' not found. Create a database folder in 'node_modules/DataBASED/databases'.` :
                `Collection '${colName}' not found. Create a collection folder in 'node_modules/DataBASED/databases/${dbName}/collections'.`

            throw new Error(errorMessage)
        } else {
            throw err
        }
    }
}

// **INTERNAL**
// Dynamically return bool to check where() conditions in query()
function checkWhereCondition(doc, condition) {
    const { property, operator, value } = condition

    if (doc.property !== property) return false

    switch (operator) {
        case '==':
            return doc.value === value
        case '!=':
            return doc.value !== value
        case '>':
            return doc.value > value
        case '<':
            return doc.value < value
        case '<=':
            return doc.value <= value
        case '>=':
            return doc.value >= value
        default:
            throw new Error(`DataBASED Query Error: Unsupported operator: ${operator}.`)
    }
}

// where()
function where(property, operator, value) {
    return {
        property: property,
        operator: operator,
        value: value
    }
}

// limit()
function limit(int) {
    if (typeof int === 'number') {
        return int
    }

    throw new Error(`DataBASED Query Error: Invalid data type for limit() argument. Argument must be a number.`)
}

// getDoc()
async function getDoc(dbName, colName, docName) {
    const dbFilePath = path.join(databasesPath, dbName)
    const colFilePath = path.join(databasesPath, dbName, 'collections', colName)
    const docFilePath = path.join(databasesPath, dbName, 'collections', colName, 'documents', docName + '.json')

    try {
        await fs.stat(dbFilePath)
        await fs.stat(colFilePath)
        await fs.stat(docFilePath)

        const file = await fs.readFile(docFilePath)
        const fileData = JSON.parse(file)

        return {
            exists: () => { return true },
            data: () => { return fileData }
        }
    } catch (err) {
        if (err.code === 'ENOENT') {
            let errorMsg = ''

            if (err.path.endsWith(docName + '.json')) {
                return { exists: () => { return false } }
            } else if (err.path.endsWith(dbName)) {
                errorMsg = `Database '${dbName}' not found. Create a database folder in 'node_modules/DataBASED/databases'. ${err.message}`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `Collection '${colName}' not found. Create a collection folder in './databases/${dbName}/collections'.`
            }

            if (errorMsg) {
                throw new Error(errorMsg)
            } else {
                throw err
            }
        } else {
            throw err
        }
    }
}

// setDoc()
async function setDoc(dbName, colName, docName, doc) {
    const dbFilePath = path.join(databasesPath, dbName)
    const colFilePath = path.join(databasesPath, dbName, 'collections', colName)
    const docsFilePath = path.join(databasesPath, dbName, 'collections', colName, 'documents')
  
    try {
      await fs.stat(dbFilePath)
      await fs.stat(colFilePath)
      await fs.stat(docsFilePath)
    } catch (err) {
        if (err.code === 'ENOENT') {
            let errorMsg = ''
    
            if (err.path.endsWith(dbName)) {
                errorMsg = `Database '${dbName}' not found. Create a database folder in 'node_modules/DataBASED/databases'. ${err.message}`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `Collection '${colName}' not found. Create a collection folder in './databases/${dbName}/collections'.`
            } else if (err.path.endsWith('documents')) {
                try {
                    await fs.mkdir(docsFilePath)
                } catch (err) {
                    throw err
                }
            }
    
            if (errorMsg) {
                throw new Error(errorMsg)
            }
        } else {
            throw err
        }
    }
  
    try {
      const newDocFilePath = path.join(docsFilePath, `${docName}.json`)
      await fs.writeFile(newDocFilePath, JSON.stringify(doc, null, 2))
    } catch (err) {
      throw err
    }
}

// deleteDoc()
async function deleteDoc(dbName, colName, docName) {
    const dbFilePath = path.join(databasesPath, dbName)
    const colFilePath = path.join(databasesPath, dbName, 'collections', colName)
    const docsFilePath = path.join(databasesPath, dbName, 'collections', colName, 'documents')

    try {
        await fs.stat(dbFilePath)
        await fs.stat(colFilePath)
        await fs.stat(docsFilePath)
    } catch (err) {
        if (err.code === 'ENOENT') {
            let errorMsg = ''
    
            if (err.path.endsWith(dbName)) {
                errorMsg = `Database '${dbName}' not found. Create a database folder in your databases directory.`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `Collection '${colName}' not found in DB '${dbName}'. Create a collection folder in './databases/${dbName}/collections'.`
            } else if (err.path.endsWith('documents')) {
                errorMsg = `Document '${docName}' not found in collection '${colName}' (DB: ${dbName}).`
            }
    
            if (errorMsg) {
                throw new Error(errorMsg)
            }
        } else {
            throw err
        }
    }

    try {
        const docFilePath = path.join(docsFilePath, docName + '.json')
        await fs.unlink(docFilePath)
    } catch (err) {
        if (err.code === 'ENOENT') {
            return
        } else {
            throw err
        }
    }
}

// getCollection()
async function getCollection(dbName, colName, limit) {
    const dbFilePath = path.join(databasesPath, dbName)
    const colFilePath = path.join(databasesPath, dbName, 'collections', colName)
    const docsFilePath = path.join(databasesPath, dbName, 'collections', colName, 'documents')

    try {
        await fs.stat(dbFilePath)
        await fs.stat(colFilePath)
        await fs.stat(docsFilePath)
    } catch (err) {
        if (err.code === 'ENOENT') {
            let errorMsg = ''
    
            if (err.path.endsWith(dbName)) {
                errorMsg = `DataBASED getCollection() Error: Database '${dbName}' not found. Create a database folder in your databases directory.`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `DataBASED getCollection() Error: '${colName}' not found in DB '${dbName}'. Create a collection folder in './databases/${dbName}/collections'.`
            } else if (err.path.endsWith('documents')) {
                errorMsg = `DataBASED getCollection() Error: No documents directory found in collection '${colName}'. Add a doc using setDoc() to create one, or add one manually.`
            }
    
            if (errorMsg) {
                throw new Error(errorMsg)
            }
        } else {
            throw err
        }
    }

    try {
        const files = await fs.readdir(docsFilePath)

        let i = 0

        const results = await Promise.all(files.map(async fileName => {
            const filePath = path.join(docsFilePath, fileName)
            const fileContent = await fs.readFile(filePath, 'utf8')
            const fileData = JSON.parse(fileContent)

            if (typeof limit !== null) {
                if (i === limit) return {}
            }

            i += 1
            return fileData
        }))

        return results.filter(result => Object.keys(result).length !== 0)
    } catch (err) {
        if (err.code === 'ENOENT') {
            return
        } else {
            throw err
        }
    }
}





// EXPORT
module.exports = {
    query,
    where,
    limit,
    getDoc,
    setDoc,
    deleteDoc,
    getCollection,
}