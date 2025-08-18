import cors from "cors"
import http from "http"
// import pool from "./db"
import { routes } from "./routes"
import express, { Express, type Request, type Response } from "express"

const port = process.env.PORT || 3000
const app: Express = express()
const httpServer = http.createServer(app)

const corsOptions = {
  origin: "http://localhost:5173",
}

app.use(express.json())
app.use(cors(corsOptions))
app.use(express.urlencoded({ extended: false }))

routes(app)

httpServer.listen(port, () => console.log(`listening on port ${port}`))

app.use("/", (req: Request, res: Response) => {
  res.status(400).send({ data: "hello world" })
})

// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

// var app = express();

// app.use(logger('dev'));
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;
