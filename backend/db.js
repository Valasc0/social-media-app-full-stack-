const mariadb = require("mariadb")

const pool = mariadb.createPool({
    host: "localhost",
    user:"root",
    password:"6778",
    database:"main"
});

module.exports = pool;