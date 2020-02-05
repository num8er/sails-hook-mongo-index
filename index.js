const async = require('async');

module.exports = function mongoIndexHook(sails) {
  
  function getIndexes() {
    const indexes = [];
    for(const modelName in sails.models) {
      const model = sails.models[modelName];
      if(!sails.config.connections[model.connection]) continue;
      if(sails.config.connections[model.connection].adapter !== 'sails-mongo') continue;
    
      for(const attributeName in model.attributes) {
        const attribute = model.attributes[attributeName];
        if(attribute.primaryKey) continue;
        if(attribute.unique === true) {
          indexes.push({model, attributeName, unique: true});
          continue;
        }
        if(attribute.index === true) {
          indexes.push({model, attributeName, unique: false});
        }
      }
    }
    return indexes;
  }
  
  async function ensureIndexes(indexes, cb) {
    for (const index of indexes) {
      try {
        await ensureIndex(index);
      }
      catch (error) {
        console.error(error.message);
      }
    }
    if (cb) cb();
  }
  
  function ensureIndex(index) {
    return new Promise((resolve, reject) => {
      const {model, attributeName, unique} = index;
  
      model.native(function (error, collection) {
        if (error) return reject(error);
        
        collection.ensureIndex(
          attributeName,
          {unique},
          function (error) {
            if (error) return reject(error);
            resolve();
          });
      });
    });
  }
  
  let hookCalled = false;
  
  return {
    initialize: function (cb) {
      sails.on('hook:orm:loaded', async function () {
        if (!hookCalled) hookCalled = true;
        const indexes = getIndexes();
        try {
          await ensureIndexes(indexes, cb);
        }
        catch (error) {
          console.error(error.message);
        }
      });
    }
  };
};