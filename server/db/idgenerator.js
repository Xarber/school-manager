const crypto = require('crypto');

module.exports = {
    uuidGenerate: () => {
        return crypto.randomUUID()
    },
    idGenerate: () => {
        return crypto.randomBytes(16).toString('base64url')
    },
    invitationGenerate: () => {
        return crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g).join('-')
    }
}
