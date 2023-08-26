const keys = require("./keys");

//express server setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(bodyParser.json());

//db connection
const { Pool } = require("pg");
// const pg = require('pg');
const pgClient = new Pool({
  user: keys.pgUser,
  host: keys.pgHost,
  database: keys.pgDatabase,
  password: keys.pgPassword,
  port: keys.pgPort,
  ssl:true,
  onConnect: async (client) => {
    console.log("Connected to postgres");
    await client.query(`CREATE TABLE IF NOT EXISTS values (number INT)`);
  }
});

// pgClient.on("connect", (client) => {
//   client
//     .query("CREATE TABLE IF NOT EXISTS values (number INT)")
//     .catch((err) => console.error(err));
// });


//Redis client setup
const redis = require("redis");
const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,
  retry_strategy: () => 1000,
});
const redisPublisher = redisClient.duplicate();
redisClient.on("connect", () => {
  console.log("Connected to redis");
});

//express route handlers
app.get("/", (req, res) => {
  res.send({
    user: keys.pgUser,
    pass: keys.pgPassword,
    host: keys.pgHost,
    port: keys.pgPort,
    database: keys.pgDatabase,
    keys: keys,
  });
});

app.get("/values/all", async (req, res) => {
  const values = await pgClient.query("SELECT * from values");
  res.send(values.rows);
});

app.get("/values/current", async (req, res) => {
  redisClient.hgetall("values", (err, values) => {
    res.send(values);
  });
});

app.post("/values", async (req, res) => {
  const index = req.body.index;
  if (parseInt(index) > 40) {
    return res.status(422).send("Index too high");
  }
  redisClient.hset("values", index, "Nothing yet");
  redisPublisher.publish("insert", index);
  pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
  res.send({ working: true });
});

app.listen(5000, (err) => {
  console.log("Listening");
});
