
import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import multer from 'multer';
import lessMiddleware from 'less-middleware';
import browserifyMiddleware from 'browserify-middleware';
import UglifyJS from 'uglify-es';
import config from './config';
import SequelizeStoreFactory from 'connect-sequelize';
const SequelizeStore = SequelizeStoreFactory(session);
import db from './db';
import { initSSE } from './sse';
import cache from './cache';
import apiTokens from './apiTokens';
import index from './views/index';
import about from './views/about';
import browse from './views/browse';
import login from './views/login';
import logout from './views/logout';
import register from './views/register';
import resetPassword from './views/resetPassword';
import editProfile from './views/editProfile';
import search from './views/search';
import advancedSearch from './views/advancedSearch';
import submit from './views/submit';
import manage from './views/manage';
import topLevel from './views/topLevel';
import persistentIdentity from './views/persistentIdentity';
import setup from './views/setup';
import dataIntegration from './views/dataIntegration';
import jobs from './views/jobs';
import sparql from './views/sparql';
import addOwner from './views/addOwner';
import shared from './views/shared';
import visualization from './views/visualization';
import implementation from './views/implementation';
import editProfile from './views/editProfile';
import userProfile from './views/userProfile';
import org from './views/orgProfile';
import general from './views/admin/general';
import status from './views/admin/status';
import graphs from './views/admin/graphs';
import sparql from './views/admin/sparql';
import remotes from './views/admin/remotes';
import users from './views/admin/users';
import newUser from './views/admin/newUser';
import update from './views/admin/update';
import jobs from './views/admin/jobs';
import theme from './views/admin/theme';
import backup from './views/admin/backup';
import backupRestore from './views/admin/backupRestore';
import registries from './views/admin/registries';
import mail from './views/admin/mail';

var views = {
    index,
    about,
    browse,
    login,
    logout,
    register,
    resetPassword,
    editProfile,
    search,
    advancedSearch,
    submit,
    manage,
    topLevel,
    persistentIdentity,
    setup,
    dataIntegration,
    jobs,
    sparql,
    addOwner,
    shared,
    visualization,
    implementation,


    editProfile,

    userProfile,
    org,


    admin: {
        general,
        status,
        graphs,
        sparql,
        remotes,
        users,
        newUser,
        update,
        jobs,
        theme,
        backup,
        backupRestore,
        registries,
        mail
    }
}

console.log(views.implementation)

import search from './api/search';
import sbol from './api/sbol';
import omex from './api/omex';
import persistentIdentity from './api/persistentIdentity';
import summary from './api/summary';
import fasta from './api/fasta';
import genBank from './api/genBank';
import autocomplete from './api/autocomplete';
import count from './api/count';
import rootCollections from './api/rootCollections';
import subCollections from './api/subCollections';
import download from './api/download';
import datatables from './api/datatables';
import sparql from './api/sparql';
import updateWebOfRegistries from './api/updateWebOfRegistries';

var api = {
    search,
    sbol,
    omex,
    persistentIdentity,
    summary,
    fasta,
    genBank,
    autocomplete,
    count,
    rootCollections,
    subCollections,
    download,
    datatables,
    sparql,
    updateWebOfRegistries
}

import makePublic from './actions/makePublic';
import copyFromRemote from './actions/copyFromRemote';
import createBenchlingSequence from './actions/createBenchlingSequence';
import createICEPart from './actions/createICEPart';
import removeCollection from './actions/removeCollection';
import cloneSubmission from './actions/cloneSubmission';
import resetPassword from './actions/resetPassword';
import setNewPassword from './actions/setNewPassword';
import remove from './actions/remove';
import createImplementation from './actions/createImplementation';
import createTest from './actions/createTest';
import updateMutableDescription from './actions/updateMutableDescription';
import updateMutableNotes from './actions/updateMutableNotes';
import updateMutableSource from './actions/updateMutableSource';
import updateCitations from './actions/updateCitations';
import cancelJob from './actions/cancelJob';
import restartJob from './actions/restartJob';
import upload from './actions/upload';
import createSnapshot from './actions/createSnapshot';
import updateCollectionIcon from './actions/updateCollectionIcon';
import removeOwner from './actions/removeOwnedBy';
import createOrg from './actions/createOrg';
import saveRemote from './actions/admin/saveRemote';
import saveRegistry from './actions/admin/saveRegistry';
import deleteRegistry from './actions/admin/deleteRegistry';
import deleteRemote from './actions/admin/deleteRemote';
import updateUser from './actions/admin/updateUser';
import deleteUser from './actions/admin/deleteUser';
import federate from './actions/admin/federate';
import retrieve from './actions/admin/retrieveFromWoR';
import setAdministratorEmail from './actions/admin/updateAdministratorEmail';

var actions = {
    makePublic,
    copyFromRemote,
    createBenchlingSequence,
    createICEPart,
    removeCollection,
    cloneSubmission,
    resetPassword,
    setNewPassword,
    remove,
    createImplementation,
    createTest,
    updateMutableDescription,
    updateMutableNotes,
    updateMutableSource,
    updateCitations,
    cancelJob,
    restartJob,
    upload,
    createSnapshot,
    updateCollectionIcon,
    removeOwner,
    createOrg,
    admin: {
        saveRemote,
        saveRegistry,
        deleteRegistry,
        deleteRemote,
        updateUser,
        deleteUser,
        federate,
        retrieve,
        setAdministratorEmail
    }
}

browserifyMiddleware.settings({
    mode: 'production',
    cache: '1 day',
    // debug: false,
    // minify: true,
    // precompile: true,
    postcompile: function(source) {
        console.log("Compiled!")
        return UglifyJS.minify(source).code
    },
})

function App() {

    var app = express()

    app.get('/bundle.js', browserifyMiddleware(__dirname + '/../browser/synbiohub.js'))


    app.use(lessMiddleware('public', { /*once: true*/ }))

    app.use(express.static('public'))

    app.use(cookieParser())

    app.use(session({
        secret: config.get('sessionSecret'),
        resave: false,
        saveUninitialized: false,
        store: new SequelizeStore(db.sequelize, {}, 'Session')
    }))

    app.use(bodyParser.urlencoded({
        extended: true
    }))

    app.use(bodyParser.json())

    app.use(function (req, res, next) {

        if (req.url !== '/setup' && config.get('firstLaunch') === true) {

            console.log('redirecting')

            res.redirect('/setup')

        } else {

            next()

        }
    })

    app.use(function (req, res, next) {

        var userID = req.session.user

        if (userID !== undefined) {

            db.model.User.findById(userID).then((user) => {

                req.user = user

                next()
            })

        } else if (req.get('X-authorization') && req.get('X-authorization')!='') {

	    let expectedPromise = apiTokens.getUserFromToken(req.get('X-authorization'));

	    if (expectedPromise) {
            apiTokens.getUserFromToken(req.get('X-authorization')).then((user) => {
                req.user = user
                next()
            })
	    } else {
		    next()
	    }
	} else {
            next()
        }
    })

    var uploadToMemory = multer({
        storage: multer.memoryStorage({})
    })

    initSSE(app)

    if (config.get('experimental').dataIntegration) {
        app.get('/jobs', requireUser, views.jobs)
        app.post('/actions/job/cancel', requireUser, actions.cancelJob)
        app.post('/actions/job/restart', requireUser, actions.restartJob)
        app.get('/admin/jobs', requireAdmin, views.admin.jobs);
        app.all('/user/:userId/:collectionId/:displayId/:version([^\\.]+)/integrate', requireUser, views.dataIntegration);
        app.all('/public/:collectionId/:displayId/:version([^\\.]+)/integrate', views.dataIntegration);
    }

    app.get('/', views.index);
    app.get('/about', views.about);

    if (config.get('firstLaunch')) {
        app.get('/setup', views.setup);
        app.post('/setup', uploadToMemory.single('logo'), views.setup);
    }

    app.all('/browse', views.browse);


    function forceNoHTML(req, res, next) {

        req.forceNoHTML = true

        next()

    }

    app.all('/login', views.login);
    app.post('/remoteLogin', forceNoHTML, views.login); // Deprecated
    app.all('/logout', views.logout);
    app.all('/register', views.register);
    app.all('/resetPassword/token/:token', actions.resetPassword);
    app.all('/resetPassword', views.resetPassword);
    app.post('/setNewPassword', actions.setNewPassword);
    app.all('/editProfile', requireUser, views.editProfile);

    app.get('/user/:username', views.userProfile)
    //app.get('/org/:orgID', views.orgProfile)

    app.post('/updateMutableDescription', requireUser, actions.updateMutableDescription);
    app.post('/updateMutableNotes', requireUser, actions.updateMutableNotes);
    app.post('/updateMutableSource', requireUser, actions.updateMutableSource);
    app.post('/updateCitations', requireUser, actions.updateCitations);

    app.get('/submit/', requireUser, views.submit);
    app.post('/submit/', requireUser, views.submit);
    app.post('/remoteSubmit/', forceNoHTML, /*requireUser,*/ views.submit); // Deprecated

    app.get('/autocomplete/:query', api.autocomplete)
    app.get('/manage', requireUser, views.manage);

    app.get('/shared', requireUser, views.shared);

    // app.get('/implementation/', requireUser, views.implementation)
    app.get('/user/:userId/:collectionId/:displayId/:version/implementation', requireUser, views.implementation); //TODO FIX URL

    app.get('/api/datatables', bodyParser.urlencoded({ extended: true }), api.datatables)

    app.get('/admin', requireAdmin, views.admin.status);
    app.get('/admin/search/:query?', views.search);
    app.get('/admin/graphs', requireAdmin, views.admin.graphs);
    app.get('/admin/sparql', requireAdmin, views.admin.sparql);
    app.get('/admin/remotes', requireAdmin, views.admin.remotes);
    app.get('/admin/users', requireAdmin, views.admin.users);
    app.get('/admin/newUser', requireAdmin, views.admin.newUser);
    app.get('/admin/update', requireAdmin, views.admin.update);
    app.get('/admin/theme', requireAdmin, views.admin.theme);
    app.post('/admin/theme', requireAdmin, uploadToMemory.single('logo'), views.admin.theme);
    app.get('/admin/general', requireAdmin, views.admin.general);
    app.post('/admin/general', requireAdmin, bodyParser.urlencoded({ extended: true }), views.admin.general);
    app.get('/admin/backup', requireAdmin, views.admin.backup);
    app.get('/admin/registries', requireAdmin, views.admin.registries);
    app.post('/admin/backup', requireAdmin, bodyParser.urlencoded({ extended: true }), views.admin.backup);
    app.post('/admin/backup/restore/:prefix', requireAdmin, bodyParser.urlencoded({ extended: true }), views.admin.backupRestore);
    app.post('/admin/newUser', requireAdmin, bodyParser.urlencoded({ extended: true }), views.admin.newUser);
    app.post('/admin/updateUser', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.updateUser);
    app.post('/admin/deleteUser', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.deleteUser);
    app.post('/admin/deleteRemote', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.deleteRemote);
    app.post('/admin/saveRemote', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.saveRemote);
    app.post('/admin/saveRegistry', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.saveRegistry);
    app.post('/admin/deleteRegistry', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.deleteRegistry);
    app.get('/admin/mail', requireAdmin, views.admin.mail);
    app.post('/admin/mail', requireAdmin, bodyParser.urlencoded({ extended: true }), views.admin.mail);
    app.post('/admin/setAdministratorEmail', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.setAdministratorEmail);

    app.post('/updateWebOfRegistries', bodyParser.json(), api.updateWebOfRegistries);
    app.post('/admin/federate', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.federate);
    app.post('/admin/retrieveFromWebOfRegistries', requireAdmin, actions.admin.retrieve);

    app.all('/createOrg', requireUser, actions.createOrg)

    app.get('/search/:query?', views.search);
    app.get('/searchCount/:query?', views.search);
    app.get('/remoteSearch/:query?', forceNoHTML, views.search); /// DEPRECATED, use /search
    app.get('/advancedSearch', views.advancedSearch);
    app.post('/advancedSearch', views.advancedSearch);
    app.get('/advancedSearch/:query?', views.search);

    app.get('/createCollection', views.advancedSearch);
    app.post('/createCollection', views.advancedSearch);
    app.get('/createCollection/:query?', views.search);

    app.get('/:type/count', api.count)
    app.get('/rootCollections', api.rootCollections)

    // PersistentIdentity endpoints
    app.get('/public/:collectionId/:displayId', views.persistentIdentity);
    app.get('/public/:collectionId/:displayId/sbol', api.persistentIdentity);
    app.get('/public/:collectionId/:displayId/search/:query?', views.search);

    app.get('/user/:userId/:collectionId/:displayId', views.persistentIdentity);
    app.get('/user/:userId/:collectionId/:displayId/sbol', api.sbol);
    app.get('/user/:userId/:collectionId/:displayId/search/:query?', views.search);

    // TODO: missing share endpoints, perhaps okay

    // Public only endpoints
    app.get('/public/:collectionId/:displayId/:version/copyFromRemote', requireUser, actions.copyFromRemote);
    app.post('/public/:collectionId/:displayId/:version/copyFromRemote', requireUser, uploadToMemory.single('file'), actions.copyFromRemote);
    app.get('/public/:collectionId/:displayId/:version/createSnapshot', actions.createSnapshot);

    // TODO: need to decide if createSnapshot is functional and should be kept or not

    // User only endpoints
    app.get('/user/:userId/:collectionId/:displayId/:version/cloneSubmission/', requireUser, actions.cloneSubmission);
    app.post('/user/:userId/:collectionId/:displayId/:version/cloneSubmission/', requireUser, uploadToMemory.single('file'), actions.cloneSubmission);
    app.get('/user/:userId/:collectionId/:displayId/:version/makePublic', requireUser, actions.makePublic);
    app.post('/user/:userId/:collectionId/:displayId/:version/makePublic', requireUser, uploadToMemory.single('file'), actions.makePublic);

    // TODO: these should NOT be GET!
    app.get('/user/:userId/:collectionId/:displayId/:version/remove', requireUser, actions.remove);
    app.get('/user/:userId/:collectionId/:displayId/:version/createImplementation', requireUser, actions.createImplementation);
    app.post('/user/:userId/:collectionId/:displayId/:version/createImplementation', requireUser, actions.createImplementation);
    app.get('/user/:userId/:collectionId/:displayId/:version/createTest', requireUser, actions.createTest);

    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/remove', actions.remove);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/makePublic', actions.makePublic);
    app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/makePublic', uploadToMemory.single('file'), actions.makePublic);

    // Remote ICE/Benchling endpoints
    app.get('/public/:collectionId/:displayId/:version/createBenchlingSequence', requireUser, actions.createBenchlingSequence);
    app.post('/public/:collectionId/:displayId/:version/createBenchlingSequence', requireUser, uploadToMemory.single('file'), actions.createBenchlingSequence);
    app.get('/public/:collectionId/:displayId/:version/createICEPart', requireUser, actions.createICEPart);
    app.post('/public/:collectionId/:displayId/:version/createICEPart', requireUser, uploadToMemory.single('file'), actions.createICEPart);

    app.get('/user/:userId/:collectionId/:displayId/:version/createBenchlingSequence', requireUser, actions.createBenchlingSequence);
    app.post('/user/:userId/:collectionId/:displayId/:version/createBenchlingSequence', requireUser, uploadToMemory.single('file'), actions.createBenchlingSequence);
    app.get('/user/:userId/:collectionId/:displayId/:version/createICEPart', requireUser, actions.createICEPart);
    app.post('/user/:userId/:collectionId/:displayId/:version/createICEPart', requireUser, uploadToMemory.single('file'), actions.createICEPart);

    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/createBenchlingSequence', actions.createBenchlingSequence);
    app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/createBenchlingSequence', uploadToMemory.single('file'), actions.createBenchlingSequence);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/createICEPart', actions.createICEPart);
    app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/createICEPart', uploadToMemory.single('file'), actions.createICEPart);

    // Endpoints for attachments
    app.post('/public/:collectionId/:displayId/:version/attach', requireUser, actions.upload);
    app.get('/public/:collectionId/:displayId/:version/download', api.download);

    app.post('/user/:userId/:collectionId/:displayId/:version/attach', requireUser, actions.upload);
    app.get('/user/:userId/:collectionId/:displayId/:version/download', requireUser, api.download);

    app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/attach', actions.upload);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/download', api.download);

    // Download data endpoints
    app.get('/public/:collectionId/:displayId/:version/:filename.xml', api.sbol);
    app.get('/public/:collectionId/:displayId/:version/:filename.omex', api.omex);
    app.get('/public/:collectionId/:displayId/:version/:filename.json', api.summary);
    app.get('/public/:collectionId/:displayId/:version/:filename.fasta', api.fasta);
    app.get('/public/:collectionId/:displayId/:version/:filename.gb', api.genBank);
    app.get('/public/:collectionId/:displayId/:version/sbol', api.sbol);

    app.get('/user/:userId/:collectionId/:displayId/:version/:filename.xml', api.sbol);
    app.get('/user/:userId/:collectionId/:displayId/:version/:filename.omex', api.omex);
    app.get('/user/:userId/:collectionId/:displayId/:version/:filename.json', api.summary);
    app.get('/user/:userId/:collectionId/:displayId/:version/:filename.fasta', api.fasta);
    app.get('/user/:userId/:collectionId/:displayId/:version/:filename.gb', api.genBank);
    app.get('/user/:userId/:collectionId/:displayId/:version/sbol', api.sbol);

    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/:filename.xml', api.sbol);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/:filename.omex', api.omex);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/:filename.json', api.summary);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/:filename.fasta', api.fasta);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/:filename.gb', api.genBank);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/sbol', api.sbol);

    // Update submission endpoints
    app.post('/public/:collectionId/:displayId/:version/icon', requireUser, uploadToMemory.single('collectionIcon'), actions.updateCollectionIcon);
    app.get('/public/:collectionId/:displayId/:version/removeCollection', requireAdmin, actions.removeCollection);

    app.get('/user/:userId/:collectionId/:displayId/:version/removeCollection', requireUser, actions.removeCollection);

    // TODO: should perhaps be able to add icon to private collection, but it will be tricky to update on makePublic

    // Search endpoints
    app.get('/public/:collectionId/:displayId/:version/search/:query?', views.search);
    app.get('/public/:collectionId/:displayId/:version/subCollections', api.subCollections);
    app.get('/public/:collectionId/:displayId/:version/twins', views.search);
    app.get('/public/:collectionId/:displayId/:version/uses', views.search);

    app.get('/user/:userId/:collectionId/:displayId/:version/search/:query?', views.search);
    app.get('/user/:userId/:collectionId/:displayId/:version/subCollections', api.subCollections);
    app.get('/user/:userId/:collectionId/:displayId/:version/twins', views.search);
    app.get('/user/:userId/:collectionId/:displayId/:version/uses', views.search);

    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/search/:query?', views.search);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/subCollections', api.subCollections);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/twins', views.search);
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/uses', views.search);

    // Update owner endpoints
    app.get('/public/:collectionId/:displayId/:version/addOwner', requireUser, views.addOwner);
    app.post('/public/:collectionId/:displayId/:version/addOwner', requireUser, views.addOwner);
    app.post('/public/:collectionId/:displayId/:version/removeOwner/:username', requireUser, actions.removeOwner);

    app.get('/user/:userId/:collectionId/:displayId/:version/addOwner', requireUser, views.addOwner);
    app.post('/user/:userId/:collectionId/:displayId/:version/addOwner', requireUser, views.addOwner);
    app.post('/user/:userId/:collectionId/:displayId/:version/removeOwner/:username', requireUser, actions.removeOwner);

    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/addOwner', views.addOwner);
    app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/addOwner', views.addOwner);
    app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/removeOwner/:username', actions.removeOwner);

    // Visualization Endpoints
    app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/visualization', views.visualization);
    app.get('/user/:userId/:collectionId/:displayId/:version([^\\.]+)/visualization', views.visualization);

    app.get('/public/:collectionId/:displayId/:version([^\\.]+)/visualization', views.visualization);

    // View endpoints
    app.get('/user/:userId/:collectionId/:displayId(*)/:version/:hash/share', views.topLevel);

//    app.get('/public/:collectionId/:displayId/:version/:query?', views.topLevel);
    app.get('/public/:collectionId/:displayId(*)/:version', views.topLevel);

//    app.get('/user/:userId/:collectionId/:displayId/:version/:query?', views.topLevel);
    app.get('/user/:userId/:collectionId/:displayId(*)/:version', views.topLevel);

    app.get('/sparql', sparql)
    app.post('/sparql', bodyParser.urlencoded({ extended: true }), sparql)

    function sparql(req, res) {
        // jena sends accept: */* and then complains when we send HTML
        // back. so only send html if the literal string text/html is present
        // in the accept header.

        let accept = req.header('accept');
        if (accept && accept.indexOf('text/html') !== -1) {
            views.sparql(req, res)
        } else {
            api.sparql(req, res)
        }
    }

    function requireUser(req, res, next) {

        if (req.user === undefined) {
            if (!req.accepts('text/html')) {
		res.status(401).send('Login required')
            } else {
		res.redirect('/login?next=' + encodeURIComponent(req.url))
            }
        } else
            next()
    }

    function requireAdmin(req, res, next) {

        if (req.user === undefined || !req.user.isAdmin)
            if (!req.accepts('text/html')) {
		res.status(401).send('Administrator login required')
            } else {
		res.redirect('/login?next=' + encodeURIComponent(req.url))
            }
        else
            next()
    }

    cache.update()

    return app
}

export default App;
