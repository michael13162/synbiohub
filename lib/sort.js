
function byNames(a, b) {
    if (a.name < b.name) {
        return -1
    } else {
        return 1
    }
}

module.exports = {
    byNames: byNames
}