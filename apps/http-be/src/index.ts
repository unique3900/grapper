require("dotenv").config();
import express from "express";
import v1Router from "./routes/v1/index";

// --- Fix here: import as a function
import connectSessionKnex from "connect-session-knex";

import session from "express-session";
import passport from "passport";

const server = express();
server.use(express.json());

// // 1) Create a "connect-session-knex" function passing in "session"
// const KnexSessionStore = connectSessionKnex(session);

// // 2) Instantiate the store
// const store = new KnexSessionStore({
//   tablename: "sessions",
//   knex: require("knex")({
//     client: "pg",
//     connection: process.env.DATABASE_URL,
//   }),
// });

// 3) Pass the store into express-session
server.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    // store,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Passport init AFTER session
server.use(passport.initialize());
server.use(passport.session());

server.use("/api/v1", v1Router);

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
