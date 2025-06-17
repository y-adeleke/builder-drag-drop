import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import parseDocxApi from "./routes/parseDocxApi.js";
import extractArticleApi from "./routes/extractArticleApi.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
// app.use(express.json());
app.use(cors());

app.use(parseDocxApi);
app.use(extractArticleApi);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
