const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const staticAsset = require("static-asset");
const mongoose = require("mongoose");
const config = require("./config");
const routes = require("./routes");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const mocks = require("./mocks");

//database

mongoose.Promise = global.Promise;
mongoose.set("debug", config.IS_PRODUCTION);

mongoose.connection
    .on("error", error => console.log(error))
    .on("close", () => console.log("Database connection closed."))
    .once("open", () => {
        const info = mongoose.connections[0];
        console.log(`Connected to ${info.host}:${info.port}/${info.name}`);
        //mocks();
    });

mongoose.connect(
    config.MONGO_URL, {
        useMongoClient: true
    }
);

//express
const app = express();

app.use(
    session({
        secret: config.SESSION_SECRET,
        resave: true,
        saveUninitialized: false,
        store: new MongoStore({
            mongooseConnection: mongoose.connection
        })
    })
);

//sets and uses
app.set("view engine", "ejs");

app.use(bodyParser.json());

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(staticAsset(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    "/javascripts",
    express.static(path.join(__dirname, "node_modules", "jquery", "dist"))
);




//routers
app.use("/api/auth", routes.auth);
app.use("/post", routes.post);
app.use('/', routes.archive);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.status = 404;
    next(err);
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.render("error", {
        message: error.message,
        error: !config.IS_PRODUCTION ? error : {}
    });
});

app.listen(config.PORT, function () {
    console.log(`Example app listening on port ${config.PORT}!`);
});