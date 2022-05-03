const express = require("express");
const { OAuth2Client } = require('google-auth-library');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const sqlQuery = require('./querry');

const CLIENT_ID = "903801528075-8ribbrcup04r0uugmvs6ri4ekpvr5ur0.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);
const app = express();

const PORT = process.env.PORT || 3000;

let bd;
open({
    filename: './db/stepchat.db',
    driver: sqlite3.Database
}).then((rdb) => {
    bd = rdb;
    onDbConnected(rdb);
}).catch((e) => {
    console.error(e);
    process.kill();
});

async function verify(token) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];

    user = await getUser(userid);

    if (!user) {
        insertUser({
            id: userid,
            name: payload['name'],
            email: payload['email'],
            avatarurl: payload['picture'],
            lastfetchtime: 0
        })
    }
    return userid;
}

async function insertUser(user) {
    return await bd.run(sqlQuery.insertuser, user.id, user.avatarurl, user.email, user.name, user.lastfetchtime);
}

async function insertMessage(message) {
    return await bd.run(sqlQuery.insertmessage, message.content, message.userid, message.sendtime);
}

async function getUser(id) {
    return await bd.get(sqlQuery.getuser, id);
}

async function updateFetchTime(id) {
    await bd.run(sqlQuery.updatefetchtimeuser, Date.now(), id);
}

async function fetchMessages(lastFetchTime) {
    return await bd.all(sqlQuery.fetchmessages, lastFetchTime);
}

async function getUsers(id) {
    return await bd.all(sqlQuery.allusers, id);
}

const auth = (req, res, next) => {
    if (req.headers.idtoken) {
        verify(req.headers.idtoken)
            .then((userId) => {
                req.userId = userId;
                next();
            })
            .catch((e) => {
                console.log(e); res.status(401).send({ message: "Token is not valid" })
            });
    }
};

app.use(express.json())
app.use("/user", auth);

app.get('/', async (req, res) => {
    res.status(200).send("<h1>SERVER STARTED</h1>");
});

app.get('/clearusers', async (req, res) => {
    await bd.run(sqlQuery.deleteusers);
    res.status(200).send("<h1>USERS CLEARED</h1>");
});

app.get('/clearmessages', async (req, res) => {
    await bd.run(sqlQuery.deletemessages);
    res.status(200).send("<h1>MESSAGES CLEARED</h1>");
});

app.get('/createuser', async (req, res) => {
    await insertUser({
        id: req.query.id,
        name: req.query.name,
        email: req.query.email,
        avatarurl: req.query.avatarurl,
        lastfetchtime: Date.now()
    });
    res.status(200).send("<h1>USER CREATED</h1>");
});

app.get("/user/active", async function (req, res) {
    user = await getUser(req.userId);
    res.status(200).send(user);
});

app.get("/user/id", async function (req, res) {
    user = await getUser(req.query.userId);
    res.status(200).send(user);
});

app.get("/user/all", async function (req, res) {
    users = await getUsers(req.userId);
    res.status(200).send(users);
});

app.get("/user/fetch", async function (req, res) {
    user = await getUser(req.userId);
    messages = await fetchMessages(user.lastfetchtime);
    await updateFetchTime(user.id);

    res.status(200).send(messages);
});

app.post("/user/send", async function (req, res) {
    message = {
        content: req.body.content,
        userid: req.userId,
        sendtime: Date.now()
    }
    await insertMessage(message);

    res.status(200).send(message);
});

async function onDbConnected(db) {
    await db.migrate({
        force: false,
        migrationsPath: "./migrations"
    })

    db.all(sqlQuery.allusers, -1).then((r) => {
        console.log(r);
    });
    db.all(sqlQuery.fetchmessages, 0).then((r) => {
        console.log(r);
    });
    app.listen(PORT);
}