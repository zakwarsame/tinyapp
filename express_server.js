const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = { 
    "userRandomID": {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    },
   "user2RandomID": {
      id: "user2RandomID", 
      email: "user2@example.com", 
      password: "dishwasher-funk"
    }
  }
  



  const addNewUser = (name, email, password) => {
    // Create a user id ... generate a unique id
    const userId = generateRandomString();
    // Create a new user object
    const newUser = {
      id: userId,
      name,
      email,
      password,
    };
    // Add the user to the database
    users[userId] = newUser;
  
    return userId;
  };

  

// User Authentication

// Display the register form
app.get('/register', (req, res) => {
    const templateVars = { username: req.cookies["username"], };
    res.render('register', templateVars);
});

app.post('/register', (req, res) => {

    const {name, email, password} = req.body
    console.log(name, email, password)
  
  })

  


app.post("/urls", (req, res) => {
  // create a key value pair and put them in the urlDatabase (a new short url is generated, longURL is coming from the POST made by a form)
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = req.body.longURL;
  res.redirect(`/urls/${newShortUrl}`);
});

app.get("/", (req, res) => {
  res.redirect('/urls');
});

app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    urls: urlDatabase,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect(`/urls/`);
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect(`/urls/`);
});

// URL REDIRECTS

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  if (!longURL) {
    res.status(404).send({ error: "Short URL not found!" });
  }
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// UPDATING the database

app.post("/urls/:shortURL", (req, res) => {
  console.log(req.params.shortURL, req.body);
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
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
