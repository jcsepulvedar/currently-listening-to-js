/* eslint-disable require-jsdoc */
const axios = require('axios');
module.exports.convertToBase64 = async (url) => {
    const options = {
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
    };
    const buff = await axios(options);
    return buff;
};
