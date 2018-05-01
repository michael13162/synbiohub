
import uuid from 'uuid/v4';
import db from './db';


const tokens = Object.create(null)


function createToken(user) {

    const token = uuid()

    tokens[token] = user.id

    return token

}

function getUserFromToken(token) {

    const uid = tokens[token]

    if(uid === undefined)
        return null

    return db.model.User.findById(uid).then((user) => {

        return Promise.resolve(user)

    })
}

export default {
    createToken: createToken,
    getUserFromToken: getUserFromToken
};


