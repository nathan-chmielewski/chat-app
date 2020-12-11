// Functions to generate message objects

const generateMessage = (text, username = 'admin') => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, position) => {
    return {
        username,
        url: `https://www.google.com/maps?q=${position.lat},${position.long}`,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}