const config = require('../lib/config');
const db = require('../lib/db');
const uuid = require('uuid/v4');
const moment = require('moment');

class Trace {
    constructor() {
        this.traceId = uuid();
    }

    tick(eventName) {
        if(!config.get('tracing')) {
            return Promise.resolve();
        }

        let date = new Date();
        let timestamp = date.getTime();

        return db.model.Tick.create({
            traceID: this.traceId,
            time: timestamp,
            eventName: eventName
        });
    }
}

module.exports = {
    Trace
}