
let fs = require('fs');
let extend = require('xtend');
let deepmerge = require('deepmerge');

let path = 'config.json';
let localPath = 'config.local.json';

let config = JSON.parse(fs.readFileSync(path) + '');

let localConfig = fs.existsSync(localPath) ?
JSON.parse(fs.readFileSync(localPath) + '') : {};

let mergedConfig;

mergeConfigs();

module.exports = {

get: function configGet(key) {
if (arguments.length === 0) {
return mergedConfig;
}

return mergedConfig[key];
},

getLocal: function configGetLocal() {
return clone(localConfig);
},

set: function configSet(key, value) {
if (arguments.length === 1) {
localConfig = clone(arguments[0]);

mergeConfigs();
saveLocalConfig();

return;
}

console.log('config: set ' + key + ' => ' + value);

localConfig = extend(localConfig, {

[key]: clone(value),

});

mergeConfigs();
saveLocalConfig();
},

delete: function configDelete(key) {
if (arguments.length === 1) {
if (localConfig[key] !== undefined) {
delete localConfig[key];
}

mergeConfigs();
saveLocalConfig();
}
},

merge: function configMerge(newConfig) {
localConfig = deepmerge(localConfig, newConfig, {
arrayMerge: (dest, src) => src,
});

mergeConfigs();
saveLocalConfig();
},

};


function clone(val) {
return JSON.parse(JSON.stringify(val));
}

function mergeConfigs() {
mergedConfig = deepmerge(config, localConfig, {
arrayMerge: (dest, src) => src,
});
}

function saveLocalConfig() {
fs.writeFileSync(localPath, JSON.stringify(localConfig, null, 2));
}


