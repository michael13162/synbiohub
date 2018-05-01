
var jobUtils = require('../jobs/job-utils')

module.exports = function(req, res) {

    const jobId = parseInt(req.body.jobId)

    let job = await jobUtils.findJobById(jobId)

    if (job.userId != req.user.id) {
        res.status(403).send('that job does not belong to you')
        return
    }

    await jobUtils.cancelJob(job)

    res.redirect('/jobs')
};


