
import sha1 from 'sha1';
import config from './config';

export const createTriplestoreID = function createTriplestoreID(username) {
    return 'user/'+username
};


