const pug = require('pug')
const { fetchSBOLSource } = require('../fetch/fetch-sbol-source')
const serializeSBOL = require('../serializeSBOL')
const buildCombineArchive = require('../buildCombineArchive')
const config = require('../config')
const getUrisFromReq = require('../getUrisFromReq')
const fs = require('mz/fs')

module.exports = function (req, res) {

    req.setTimeout(0) // no timeout

    const { graphUri, uri, designId, share } = getUrisFromReq(req, res)

    var archiveName

    let fileName = await fetchSBOLSource(uri, graphUri)

    console.log("sbol file for archive:" + fileName)


    let result = await buildCombineArchive(sbolFilename, []);

    archiveName = result.resultFilename;
    var stat = fs.statSync(archiveName);
    console.log("creating archive:" + archiveName)

    res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': stat.size })

    var readStream = fs.createReadStream(archiveName)

    readStream.pipe(res)
        .on('finish', () => {
            console.log('finish download of combine archive')
        })

    console.log("unlinking:" + fileName)
    await fs.unlink(fileName)
    console.log("unlinking:" + archiveName)
    await fs.unlink(archiveName)
};


