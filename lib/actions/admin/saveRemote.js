const config = require('../../config');

module.exports = function(req, res) {
  let remotes = config.get('remotes');
  let remote = reqToRemote(req);

  remotes[remote.id] = remote;

  config.set('remotes', remotes);

  res.redirect('/admin/remotes');
};

function reqToRemote(req) {
  console.log(req.body);
  if (req.body.type == 'ice') {
    console.log(reqToIce(req));
    return reqToIce(req);
  } else if (req.body.type == 'benchling') {
    console.log(reqToIce(req));
    return reqToBenchling(req);
  }
}

function reqToBenchling(req) {
  return {
    'id': req.body.id,
    'type': req.body.type,
    'url': req.body.url,
    'X-BENCHLING-API-Token': req.body.benchlingApiToken,
    'rejectUnauthorized': req.body.rejectUnauthorized,
    'folderPrefix': req.body.folderPrefix,
    'sequenceSuffix': req.body.sequenceSuffix,
    'defaultFolderId': req.body.defaultFolderId,
    'rejectUnauthorized': req.body.rejectUnauthorized != undefined && req.body.rejectUnauthorized === 'on',
    'public': req.body.isPublic != undefined && req.body.isPublic === 'on',
    'rootCollection': {
      'displayId': req.body.rootCollectionDisplayId,
      'name': req.body.rootCollectionName,
      'description': req.body.rootCollectionDescription,
    },
  };
}

function reqToIce(req) {
  return {
    'id': req.body.id,
    'type': req.body.type,
    'url': req.body.url,
    'rejectUnauthorized': req.body.rejectUnauthorized,
    'folderPrefix': req.body.folderPrefix,
    'sequenceSuffix': req.body.sequenceSuffix,
    'defaultFolderId': req.body.defaultFolderId,
    'groupId': req.body.groupId,
    'PI': req.body.pi,
    'PIemail': req.body.piEmail,
    'X-ICE-API-Token-Client': req.body.iceApiTokenClient,
    'X-ICE-API-Token': req.body.iceApiToken,
    'X-ICE-API-Token-Owner': req.body.iceApiTokenOwner,
    'iceCollection': req.body.iceCollection,
    'rejectUnauthorized': req.body.rejectUnauthorized != undefined && req.body.rejectUnauthorized === 'on',
    'public': req.body.isPublic != undefined && req.body.isPublic === 'on',
    'partNumberPrefix': req.body.partNumberPrefix,
    'rootCollection': {
      'displayId': req.body.rootCollectionDisplayId,
      'name': req.body.rootCollectionName,
      'description': req.body.rootCollectionDescription,
    },
  };
}
