
function collateObjects(objects) {

    var res = {}

    objects.forEach((obj) => {

        res = extend(res, obj)

    })

    return res

}

function collateArrays(arrays) {

    var res = []

    arrays.forEach((arr) => {

        Array.prototype.push.apply(res, arr)

    })

    return res
}

module.exports = {
    collateObjects: collateObjects,
    collateArrays: collateArrays
}


