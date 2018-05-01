
import db from '../../db';
import config from '../../config';

export default async function(req, res) {

    let user = await db.model.User.findById(req.body.id)

    user.username = req.body.username
    user.name = req.body.name
    user.email = req.body.email
    user.affiliation = req.body.affiliation
    user.isMember = req.body.isMember
    user.isCurator = req.body.isCurator
    user.isAdmin = req.body.isAdmin

    await user.save()

    res.status(200).send('saved')
};

