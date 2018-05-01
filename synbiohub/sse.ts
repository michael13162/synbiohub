

import SSE from 'express-sse';
import Multimap from 'multimap';

const connections = new Multimap()

function initSSE(app) {

    app.get('/sse/*', (req, res, next) => {

        const sse = new SSE([])
        const path = req.url.slice('/sse/'.length)

        sse.init(req, res)

        connections.set(path, sse)

    })
}

function push(path, eventName, data) {

    connections.get(path).forEach((sse) => {
        sse.send(data || {}, eventName)
    })

}

export default {
    initSSE: initSSE,
    push: push
};

