const express = require("express");
const bodyParser = require("body-parser");
const config = require("./config/config");
const PostRoutes = require("./routes/PostRoutes");

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// routes
// post
app.use("/api/posts", PostRoutes);

// test route
app.get("/test", (req, res) => {
  res.status(200).send({ result: "GET: /test" });
});

app.listen(config.port, () =>
  console.log(`Server running (port: ${config.port})`)
);
