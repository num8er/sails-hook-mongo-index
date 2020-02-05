# sails-hook-mongo-index

By default sails.js does not create mongo indexes indexes defined in models.
  
This hook ensures that indexes created if they does not exist.

## Install
````bash
npm install --save sails-hook-mongo-index
````

## How To
Simply install the package.

Example how to add indexes:

````js
name: {
  type: 'string',
  index: true
}
````

for unique:
````js
name: {
  type: 'string',
  unique: true
}
````