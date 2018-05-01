
import Sequelize from 'sequelize';
import sha1 from 'sha1';
import util from './util';
import config from './config';
import db from './db';

function createUser(info) {

    var graphUri = 
        config.get('databasePrefix') + util.createTriplestoreID(info.username)

    return db.model.User.findOrCreate({

        where: Sequelize.or({
            email: info.email,
        }, {
	    username: info.username
	}),

        defaults: {
            name: info.name,
            email: info.email,
            username: info.username,
            affiliation: info.affiliation,
            password: sha1(config.get('passwordSalt') + sha1(info.password)),
            graphUri: graphUri,
            isAdmin: info.isAdmin !== undefined ? info.isAdmin : false,
            isCurator: info.isCurator !== undefined ? info.isCurator : false,
            isMember: info.isMember !== undefined ? info.isMember : false
        }
    
    }).then((res) => {

        const user = res[0]
        const created = res[1]

        if(!created) {
            return Promise.reject(new Error('E-mail address or username already in use'))
        } else {
            return Promise.resolve(user)
        }

    })


}

export default createUser;


