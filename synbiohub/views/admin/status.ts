
import pug from 'pug';
import os from 'os';
import config from '../../config';

export default function(req, res) {

	var locals = {
        config: config.get(),
        section: 'admin',
        adminSection: 'status',
        user: req.user,
        nodeVersion: process.version,
        architecture: os.arch(),
        platform: os.type(),
        osRelease: os.release(),
        config: config.get()
    }
	
    res.send(pug.renderFile('templates/views/admin/status.jade', locals))
	
};
