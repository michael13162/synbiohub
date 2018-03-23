
const cache = require('../cache');

const executionTimer = require('../util/execution-timer');

module.exports = function(req, res) {
  let searchTimer = executionTimer('search autocompletions');

  res.send(JSON.stringify(cache.autocompleteTitle.get(req.params.query)));

  searchTimer();
};

