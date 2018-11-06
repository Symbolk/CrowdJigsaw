var mongoose = require('mongoose');
var options = {
    useMongoClient: true,
    auth: { authdb: 'admin' },
    user: "symbol",
    pass: "Saw@PKU_1726"
};
mongoose.connect('mongodb://162.105.89.243:27017/CrowdJigsaw', options);
const db = mongoose.connection;