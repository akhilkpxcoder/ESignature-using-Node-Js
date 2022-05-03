const createError = require("http-errors");
const express = require("express");
const path = require("path");
const indexRouter = require("./routers/index");
require('dotenv').config();

const app = express();
const PORT = 3001;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// midware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use(function (req, res, next) {
  next(createError(404));
});
app.listen(PORT, () =>
 console.log(`Server running on port: http://localhost:${PORT}`)
);

module.exports = app;
