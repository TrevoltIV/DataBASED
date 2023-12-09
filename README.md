

# Welcome to DataBASED!

DataBASED is a free, open source database library that aims to provide the same ease of use as some services such as Firebase or Supabase, but all on your own server.
I created this JSON based database system because I felt like API services were the most user-friendly way to interact with a database, however they slow down your project
due to all the external requests that are necessary for an API. With this system, it is all done on your own machine, eliminating external requests completely.
And, on top of that, it's free!

If you'd like to donate to support development of DataBASED, you can do so at the link below:
* no website yet, coming soon!

## ANNOUNCEMENTS
* WARNING: If your database receives traffic over 1 write per 100ms, the current indexing system may end up overwriting some data due to the temporary key-creation protocol.
    As long as your database does not write documents faster than once per 1ms, no data loss should occur. This problem will be fixed in the next version.

## 1.0.4 CHANGE-LOG
* Fixed setDoc() overwriting bug where indexes would not be deleted for prior-existing documents.

### Documentation:


#### Setup
To create your first database, go to the terminal and use this command:
npx create-database {database_name}

Then, you can create your first collection within that database using this command:
npx create-collection {new_collection_name} {database_name}

A new folder called "databased" will be added to your project's root directory. Do not delete or move it.
You can create as many databases, collections, and documents as you need.

If you want to backup your database, you can use 'npx backup-database {db_name}'.
Just make sure to set the 'backup_path' value in './databased/settings.json' to your desired directory for backups.

#### Functions

##### Query()
The query() function takes 4 arguments: databaseName, collectionName, condition, and limit.
All are required except limit.

All main functions (excluding parameter functions, e.g. limit()) are asynchronous, including query().

Example:
const query = await query('db1', 'col1', where('Test1', '==', 'test1'), limit(5))

##### Limit()
The limit() function takes 1 argument of type number.
It simply returns the number, you can also just put the number directly into the main function if readability is not a priority.

##### Where()
The where() function takes 3 arguments: property, operator, and value.
The property argument should be the key of the field you are targeting within a document.
The operator argument should be a comparison operator such as: '==', '>', '<', '<=', or '>='.
The value argument should be the value of the field you want to check.

The function simply returns an object like this: { property: propertyArg, operator: operatorArg, value: valueArg }.
Similar to the limit() function, you can just place an object straight into the main function if readability is not a priority.

##### getDoc()
The getDoc() function takes 3 arguments: databaseName, collectionName, and documentName.
It always returns an object with the exists() method, but only returns the data() method if the document exists.
The getDoc().exists() method will return either true or false depending on if the document was found in the collection specified.
The getDoc().data() method will return the document.

##### setDoc()
The setDoc() function takes 4 arguments: databaseName, collectionName, documentName, and documentObject.
It will either create a new document or overwrite an existing document depending on if one with the name specified already exists in the collection.
The documentObject object should be an object with whatever fields you want to insert.

WARNING: setDoc() will not automatically fill in the fields that you leave out when overwriting a pre-existing document, it will simply overwrite it with the new data.

##### updateDoc()
The updateDoc() function takes 4 arguments, it is the same as the setDoc() function except it will only overwrite the fields you change.
You can simply pass in an object that only contains one field, and the rest of the document will remain the same besides that one field,
which will either be changed or added depending on if it existed prior to calling updateDoc().

##### deleteDoc()
The deleteDoc() function takes 3 arguments: databaseName, collectionName, and documentName.
As the name suggests, it simply deletes the document if it exists in the collection specified.
If there is no document found, it throws an error.

##### getCollection()
The getCollection() function takes 3 arguments: databaseName, collectionName, and limit (optional).
It will return all the documents within the specified collection, unless you use limit() to set the max amount of documents.