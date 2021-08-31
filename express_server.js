const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.post("/urls", (req, res) => {
  // create a key value pair and put them in the urlDatabase (a new short url is generated, longURL is coming from the POST made by a form)
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = req.body.longURL;
  res.redirect(`/urls/${newShortUrl}`);
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// URL REDIRECTS

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL){
    res.status(404).send({ error: 'Short URL not found!' })
  }
  res.redirect(longURL);
});

app.post('/urls/:shortURL/delete', (req, res)=>{
    delete urlDatabase[req.params.shortURL]
    res.redirect('/urls')

});

// UPDATING the database

app.post('/urls/:shortURL', (req, res)=>{
    console.log(req.params.shortURL, req.body);
    urlDatabase[req.params.shortURL] = req.body.longURL
    res.redirect('/urls');
});

// FUNCTIONS

function generateRandomString() {
  //store all alphanumerics in a string
  const alphanumerics =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // use spreader to create an array with 6 empty elements
  // loop through them and generate a random number number each time (use 0 otherwise)
  // store that number and pass it as an index within the alphanumerics string
  // join the characters
  return [...Array(6)]
    .map((i) => alphanumerics[(Math.random() * alphanumerics.length) | 0])
    .join("");
}
