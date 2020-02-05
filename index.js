const async = require('async');

module.exports = function mongoIndexHook(sails) {
  
  function getIndexes() {
    const indexes = [];
    for(const modelName in sails.models) {
      const model = sails.models[modelName];
      if (!model) {
        console.log('Model:', modelName, 'not initialized');
        continue;
      }
      
      const connectionName = Array.isArray(model.connection) ? model.connection[0] : model.connection;
      if(!sails.config.connections[connectionName]) continue;
      if(sails.config.connections[connectionName].adapter !== 'sails-mongo') continue;
      
      
      for(const attributeName in model.attributes) {
        const attribute = model.attributes[attributeName];
        if(attribute.primaryKey) continue;
        if(attribute.unique === true) {
          indexes.push({modelName, model, attributeName, unique: true});
          continue;
        }
        if(attribute.index === true) {
          indexes.push({modelName, model, attributeName, unique: false});
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
      const {modelName, model, attributeName, unique} = index;
      
      model.native(function (error, collection) {
        if (error) return reject(error);
        
        if (process.env.NODE_ENV !== 'production'
          || process.env.DEBUG === 'true'
          || process.env.VERBOSE === 'true') {
          console.log('Ensuring index for:', modelName+'.'+attributeName);
        }
        
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
    defaults: {
      __configKey__: {
        _hookTimeout: 30000
      }
    },
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
