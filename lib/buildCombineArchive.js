
const java = require('./java');

function buildCombineArchive(sbolFilename, attachments, creatorInfo) {
  let options = {
    sbolFilename: sbolFilename,
    attachments: attachments,
    creatorInfo: creatorInfo,
  };

  return java('buildCombineArchive', options).then((result) => {
    return Promise.resolve(result);
  });
}

module.exports = buildCombineArchive;


