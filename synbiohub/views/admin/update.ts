import gitFactory from 'simple-git';
const git = gitFactory();

export default async function (req, res) {

    await git.pull(function (err, update) {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Update failed: ' + err);
        } else if (update && update.summary.changes) {
            console.log("restarting!");
        } else {
            console.log("No changes detected.");
        }
    })

};
