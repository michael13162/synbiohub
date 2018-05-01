
import cache from '../cache';
import ExecutionTimer from '../util/execution-timer';

export default function(req, res) {


    var searchTimer = ExecutionTimer('search autocompletions')

    res.send(JSON.stringify(cache.autocompleteTitle.get(req.params.query)))

    searchTimer()

};

