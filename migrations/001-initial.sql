CREATE TABLE IF NOT EXISTS users
(
    id character varying NOT NULL,
    avatarurl character varying NOT NULL,
    email character varying NOT NULL,
    name character varying NOT NULL,
    lastfetchtime bigint NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS messages
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content text NOT NULL,
    userid character varying NOT NULL,
    sendtime bigint NOT NULL,
    FOREIGN KEY (userid) REFERENCES Users(id)
);