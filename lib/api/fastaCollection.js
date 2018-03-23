const {fetchCollectionFASTA} = require('../fetch/fetch-collection-fasta');
let getUrisFromReq = require('../getUrisFromReq');

module.exports = function(req, res) {
  const uri = getUrisFromReq(req, res).uri;

  return fetchCollectionFASTA(uri).then((fasta) => {
    res.send(fasta);
  }).catch((err) => {
    res.status(500).send(err.stack);
  });
};


