const fs = require('fs').promises
const path = require('path')

const projectDir = process.cwd()
const databasesPath = path.join(projectDir, `./databases`)



/*
        DataBASED v1.0.0

        Developers:
        * TrevoltIV
*/




/*
        Querying
*/


// Query function
// Expects the "where()" function as condition
async function query(dbName, colName, condition, limit) {
    const dbFilePath = path.join(databasesPath, dbName);
    const colFilePath = path.join(databasesPath, dbName, 'collections', colName);
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
                    continue
                }
            }

            return result
        }));

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

// Dynamically return bool to check where() conditions in query()
function checkWhereCondition(document, condition) {
    const { property, operator, value } = condition

    if (document.property !== property) return false

    switch (operator) {
        case '==':
            return document.value === value
        case '!=':
            return document.value !== value
        case '>':
            return document.value > value
        case '<':
            return document.value < value
        case '<=':
            return document.value <= value
        case '>=':
            return document.value >= value
        default:
            throw new Error(`DataBASED Query Error: Unsupported operator: ${operator}.`)
    }
}

// Where function
// Expects 3 arguments (property, operator, value)
// Returns the necessary conditional for query function to use
function where(property, operator, value) {
    return {
        property: property,
        operator: operator,
        value: value
    }
}

// Limit function
// Expects 1 argument of type number and returns it
function limit(int) {
    if (typeof int === 'number') {
        return int
    }

    throw new Error(`DataBASED Query Error: Invalid data type for limit() argument. Argument must be a number.`)
}




// EXPORT
module.exports = {
    query,
    where,
    limit,
}