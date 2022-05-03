exports.insertuser = `insert or replace into users values (?,?,?,?,?)`
exports.getuser = `select * from users where users.id = ?`
exports.updatefetchtimeuser = `update users set lastfetchtime=? where users.id = ?`
exports.allusers = `select * from users where users.id != ?`

exports.fetchmessages = `select * from messages where messages.sendtime > ?`

exports.insertuser = `insert or replace into users values (?,?,?,?,?)`
exports.insertmessage = `insert into messages (content, userid, sendtime) values (?,?,?)`

exports.deleteusers = `delete from users`
exports.deletemessages = `delete from messages`