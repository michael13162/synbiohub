
let config = require('./lib/config');

let App = require('./lib/app');

let db = require('./lib/db');

let fs = require('fs');

let jobUtils = require('./lib/jobs/job-utils');

let sliver = require('./lib/sliver');

let theme = require('./lib/theme');

let java = require('./lib/java');


if (fs.existsSync('synbiohub.sqlite') && config.get('firstLaunch') === true) {
  fs.unlinkSync('synbiohub.sqlite');
}


if (!fs.existsSync('synbiohub.sqlite')) {
  db.sequelize.sync({force: true}).then(startServer);
} else {
  db.umzug.up().then(() => {
    startServer();
  });
}

function startServer() {
  return initSliver()
    .then(() => java.init())
    .then(() => theme.setCurrentThemeFromConfig())
    .then(() => jobUtils.setRunningJobsToQueued())
    .then(() => jobUtils.resumeAllJobs())
    .then(() => {
      let app = new App();

      app.listen(parseInt(config.get('port')));
    });
}


function initSliver() {
  return new Promise((resolve, reject) => {
    // TODO
    resolve();
  });
}

process.on('SIGINT', function() {
  java.shutdown().then(() => process.exit());
});


