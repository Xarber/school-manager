module.exports = {
    uuidGenerate: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        })
    },
    idGenerate: () => {
        return `${Date.now().toString(36)}${Math.random().toString(36).substring(2)}`
    },
    invitationGenerate: () => {
        return ('xxxx-xxxx-yxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        })).toUpperCase()
    }
}