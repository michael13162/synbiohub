
import fs from 'mz/fs';
import config from 'synbiohub/config';

export default function(logoFile) {
    const logoFilename = 'logo_uploaded.' + logoFile.originalname.split('.')[1]

    fs.writeFileSync('public/' + logoFilename, logoFile.buffer)

    config.set('instanceLogo', '/' + logoFilename)
};

