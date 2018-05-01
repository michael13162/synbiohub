
import pug from 'pug';
import sparql from '../../sparql/sparql';
import config from '../../config';
import isql from '../../isql';
import path from 'path';
import fs from 'mz/fs';
import filesize from 'filesize';



const backupDir = config.get('triplestore').virtuosoDB

export default function(req, res) {

    if(req.method === 'POST') {

        post(req, res)

    } else {

        form(req, res)

    }

};

async function listBackups() {

    let files = await fs.readdir(backupDir)

    const backupFiles = files.filter((filename) => {

        return filename[0] !== '.' && filename.indexOf('.bp') !== -1
        
    })

    const backups = {}

    for(let filename of backupFiles) {

        const date = filename.split('_')[2]

        if(backups[date] === undefined) {
            backups[date] = [ filename ]
        } else {
            backups[date].push(filename)
        }

    }

    return await Promise.all(
        Object.keys(backups).map((backup) => {

            return await (async () => {

                const files = backups[backup]

                const backupInfo = {
                    date: new Date(parseInt(backup)),
                    files: files,
                    prefix: files[0].toString().substring(0, files[0].length - '_.bp'.length)
                }

                let sizes = await Promise.all(files.map((filename) => {

                    return fs.stat(backupDir + '/' + filename).then((stats) => {

                        return Promise.resolve(stats.size)

                    })

                }))

                var totalSize = 0

                sizes.forEach((size) => totalSize += size)

                backupInfo.size = filesize(totalSize)

                return backupInfo
            })
        })
    )

}


async function form(req, res) {

    let backups = await listBackups()

    console.log(JSON.stringify(backups))

    var locals = {
        config: config.get(),
        section: 'admin',
        adminSection: 'backup',
        user: req.user,
        backups: backups
    }

    res.send(pug.renderFile('templates/views/admin/backup.jade', locals))
}


async function post(req, res) {

    const prefix = 'sbh_backup_' + new Date().getTime() + '_'

    let result = await isql([
        'backup_context_clear();',
        'backup_online(\'' + prefix + '\', 1000);'
    ])

    return form(req, res)
}


