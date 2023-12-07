const fs = require('fs').promises
const path = require('path')

const projectDir = process.cwd()
const databasesPath = path.join(projectDir, `databased`, 'databases')



/*
        DataBASED v1.0.5

        Developers:
        * TrevoltIV
        (AKA Karsten Koerner)
*/




// query()
async function query(dbName, colName, condition, limit) {
    const dbFilePath = path.join(databasesPath, dbName)
    const colFilePath = path.join(databasesPath, dbName, 'collections', colName)
    const docsFilePath = path.join(databasesPath, dbName, 'collections', colName, 'documents')
    const indexPath = path.join(projectDir, 'databased', 'indexing', 'databases', dbName, 'collections', colName, `${condition.property}.json`)

    try {
        await fs.stat(dbFilePath)
        await fs.stat(colFilePath)
        await fs.stat(indexPath)

        const file = await fs.readFile(indexPath)
        const fileData = JSON.parse(file)
        const keys = Object.keys(fileData)

        let i = 0

        const results = await Promise.all(keys.map(async (key) => {
            let result = {}

            if (limit) {
                if (i === limit) return result
            }

            if (checkWhereCondition(fileData[key], condition)) {
                const docFilePath = path.join(docsFilePath, `${fileData[key].document}.json`)
                const docFile = await fs.readFile(docFilePath)
                const docData = JSON.parse(docFile)

                result = docData
                i += 1
                return result
            }
            return result
        }))

        return results.filter(result => Object.keys(result).length !== 0)
    } catch (err) {
        if (err.code === 'ENOENT') {
            let errorMsg = ''

                if (err.path.endsWith(dbName)) {
                    errorMsg = `DataBASED Query Error: Database '${dbName}' not found. Create a database with the command 'npx create-database {database_name}'.`
                } else if (err.path.endsWith(colName)) {
                    errorMsg = `DataBASED Query Error: Collection '${colName}' not found. Create a collection with the command 'npx create-collection {collection_name} {database_name}'.`
                } else if (err.path.endsWith('documents')) {
                    errorMsg = `DataBASED Query Error: No documents exist in collection '${colName}'.`
                } else if (err.path.endsWith(`${condition.property}.json`)) {
                    return []
                }

            throw new Error(errorMsg)
        } else {
            throw err
        }
    }
}

// **INTERNAL**
// Dynamically return bool to check where() conditions in query()
function checkWhereCondition(doc, condition) {
    const { property, operator, value } = condition

    if (doc.key !== property) return false

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
            throw new Error(`DataBASED Query Error: Unsupported operator '${operator}' in where().`)
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

    throw new Error(`DataBASED Limit Error: Invalid data type for limit() argument. Argument must be a number.`)
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
                errorMsg = `DataBASED Retrieval Error: Database '${dbName}' not found. Create a database with the command 'npx create-database {database_name}'.`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `DataBASED Retrieval Error: Collection '${colName}' not found. Create a collection with the command 'npx create-collection {collection_name} {database_name}'.`
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
                errorMsg = `DataBASED Document Error: Database '${dbName}' not found. Create a database with the command 'npx create-database {database_name}'.`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `DataBASED Document Error: Collection '${colName}' not found. Create a collection with the command 'npx create-collection {collection_name} {database_name}'.`
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

    const keys = Object.keys(doc);

    // Index properties
    await Promise.all(keys.map(async (key) => {
        const indexPath = path.join(projectDir, 'databased', 'indexing', 'databases', dbName, 'collections', colName, `${key}.json`)

        try {
            await fs.stat(indexPath)

            const file = await fs.readFile(indexPath, 'utf-8')
            let fileData = {}

            // Check if the file content is not empty before parsing
            if (file.trim() !== '') {
                fileData = JSON.parse(file)

                for (let fileKey in fileData) {
                    if (fileData[fileKey].document === docName) {
                        delete fileData[fileKey];
                        await fs.writeFile(indexPath, JSON.stringify(fileData, null, 2))
                        break
                    }
                }
            }

            fileData[Date.now().toString()] = {
                key: key,
                value: doc[key],
                document: docName
            }

            await fs.writeFile(indexPath, JSON.stringify(fileData, null, 2))
        } catch (err) {
            if (err.code === 'ENOENT') {
                const fileData = {
                    [Date.now().toString()]: {
                        key: key,
                        value: doc[key],
                        document: docName
                    }
                }
                await fs.writeFile(indexPath, JSON.stringify(fileData, null, 2))
            } else {
                console.error(`Error processing key ${key}: ${err.message}`)
            }
        }
    }));
}

// updateDoc()
async function updateDoc(dbName, colName, docName, doc) {
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
                errorMsg = `DataBASED Document Error: Database '${dbName}' not found. Create a database with the command 'npx create-database {database_name}'.`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `DataBASED Document Error: Collection '${colName}' not found. Create a collection with the command 'npx create-collection {collection_name} {database_name}'.`
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

    const newDocFilePath = path.join(docsFilePath, `${docName}.json`)
  
    try {
        await fs.stat(newDocFilePath)

        const file = await fs.readFile(newDocFilePath)
        const fileData = JSON.parse(file)
        const updatedDoc = {
            ...fileData,
            ...doc
        }

        await fs.writeFile(newDocFilePath, JSON.stringify(updatedDoc, null, 2))
    } catch (err) {
        if (err.code === 'ENOENT' && err.path.endsWith(`${docName}.json`)) {
            await fs.writeFile(newDocFilePath, JSON.stringify(doc, null, 2))
        } else {
            throw err
        }
    }

    const keys = Object.keys(doc)

    // Index properties
    await Promise.all(keys.map(async (key) => {
        const indexPath = path.join(projectDir, 'databased', 'indexing', 'databases', dbName, 'collections', colName, `${key}.json`)
        try {
            await fs.stat(indexPath)

            const file = await fs.readFile(indexPath, 'utf-8')
            let fileData = {}

            // Check if the file content is not empty before parsing
            if (file.trim() !== '') {
                fileData = JSON.parse(file)

                for (let fileKey in fileData) {
                    if (fileData[fileKey].document === docName) {
                        delete fileData[fileKey];
                        await fs.writeFile(indexPath, JSON.stringify(fileData, null, 2))
                        break
                    }
                }
            }

            fileData[Date.now().toString()] = {
                key: key,
                value: doc[key],
                document: docName
            }

            await fs.writeFile(indexPath, JSON.stringify(fileData, null, 2))

            return
        } catch (err) {
            if (err.code === 'ENOENT') {

                const fileData = {
                    [Date.now().toString()]: {
                        key: key,
                        value: doc[key],
                        document: docName
                    }
                }

                await fs.writeFile(indexPath, JSON.stringify(fileData, null, 2))
            }

            throw err
        }
    }))
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
                errorMsg = `DataBASED Deletion Error: Database '${dbName}' not found. Create a database with the command 'npx create-database {database_name}'.`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `DataBASED Deletion Error: Collection '${colName}' not found in DB '${dbName}'. Create a collection with the command 'npx create-collection {collection_name} {database_name}'.`
            } else if (err.path.endsWith('documents')) {
                errorMsg = `DataBASED Deletion Error: Document '${docName}' not found in collection '${colName}' (DB: ${dbName}).`
            }
    
            if (errorMsg) {
                throw new Error(errorMsg)
            }
        } else {
            throw err
        }
    }

    const docFilePath = path.join(docsFilePath, docName + '.json')
    const docFile = await fs.readFile(docFilePath, 'utf-8')
    let doc = {}

    if (docFile.trim() !== '') {
        doc = JSON.parse(docFile)
    } else {
        throw new Error(`DataBASED Deletion Error: Document '${docName}' not found in collection '${colName}'.`)
    }

    try {
        await fs.unlink(docFilePath)
    } catch (err) {
        if (err.code === 'ENOENT') {
            return
        } else {
            throw err
        }
    }

    const keys = Object.keys(doc)

    // Delete index reference
    await Promise.all(keys.map(async (key) => {
        const indexPath = path.join(projectDir, 'databased', 'indexing', 'databases', dbName, 'collections', colName, `${key}.json`)
        try {
            await fs.stat(indexPath)

            const file = await fs.readFile(indexPath, 'utf-8')
            let fileData = {}

            // Check if the file content is not empty before parsing
            if (file.trim() !== '') {
                fileData = JSON.parse(file)

                for (let fileKey in fileData) {
                    if (fileData[fileKey].document === docName) {
                        delete fileData[fileKey];
                        await fs.writeFile(indexPath, JSON.stringify(fileData, null, 2))
                        break
                    }
                }
            }

            return
        } catch (err) {
            if (err.code === 'ENOENT') {
                throw new Error(`DataBASED Deletion Error: No index reference found for field '${key}' in collection '${colName}'.`)
            }

            throw err
        }
    }))
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
                errorMsg = `DataBASED Retrieval Error: Database '${dbName}' not found. Create a database with the command 'npx create-database {database_name}'`
            } else if (err.path.endsWith(colName)) {
                errorMsg = `DataBASED Retrieval Error: Collection '${colName}' not found in DB '${dbName}'. Create a collection with the command 'npx create-collection {collection_name} {database_name}'.`
            } else if (err.path.endsWith('documents')) {
                errorMsg = `DataBASED Retrieval Error: No documents directory found in collection '${colName}'. Add a doc using setDoc() to create one, or add one manually.`
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
            if (typeof limit !== null) {
                if (i === limit) return {}
            }

            const filePath = path.join(docsFilePath, fileName)
            const fileContent = await fs.readFile(filePath, 'utf8')
            const fileData = JSON.parse(fileContent)

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



// TODO (later): Add a carrying functionality to updateDoc() which will replace fields of an object or array and leave the other fields
// For example: posts[7].comments[4].replies[0] = "test"


// EXPORT
module.exports = {
    query,
    where,
    limit,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getCollection,
}