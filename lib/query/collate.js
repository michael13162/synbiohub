
function collateObjects(objects) {
let res = {};

objects.forEach((obj) => {
res = extend(res, obj);
});

return Promise.resolve(res);
}

function collateArrays(arrays) {
let res = [];

arrays.forEach((arr) => {
Array.prototype.push.apply(res, arr);
});

return Promise.resolve(res);
}

module.exports = {
collateObjects: collateObjects,
collateArrays: collateArrays,
};


