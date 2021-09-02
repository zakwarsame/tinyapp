const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var bcrypt = require('bcryptjs');


app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "userRandomID"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dish",
  },
};

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

const findUserByEmail = (email) => {
  return Object.values(users).find((userObj) => userObj.email === email);
};

const authenticateUser = (email, password) => {
  // loop through the users db => object
  const user = findUserByEmail(email);
  const hashedPassword = user.password;
  // check that values of email and password if they match
  if (user && bcrypt.compareSync(password, hashedPassword)) {
    // return user id if it matches
    return user.id;
  }

  // default return false
  return false;
};

// Display the register form
app.get("/register", (req, res) => {
  const templateVars = { user : null, message:null};
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  // check that the user is not already in the database
  const user = findUserByEmail(email);
  // check that password and email was provided
  if (!password || !email){
    return res.status(400).render('register', {
      message: 'Please fill out both email and password',
      messageClass: 'alert-danger',
      user:null
  });
  }
  const hashPassword = bcrypt.hashSync(password, 10); 
  // if user is undefined, we can add the user in the db
  if (!user) {
    const userId = addNewUser(name, email, hashPassword);

    // Set cookie in the user's browser
    res.cookie("user_id", userId);
    console.log(users)
    res.redirect("/urls");
  } else {
    res.status(403).render('register', {
      message: 'User already exists',
      messageClass: 'alert-danger',
      user:null
  });
  }
});

// create a key value pair and put them in the urlDatabase (a new short url is generated, longURL is coming from the POST made by a form)
app.post("/urls", (req, res) => {

  const user = req.cookies["user_id"];
  if (!user) {
    return res.redirect(`/urls`);
  }
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = {
    longURL: req.body.longURL,
    userID: newShortUrl
  }
  res.redirect(`/urls/${newShortUrl}`);
});

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
    const currentUser = users[req.cookies['user_id']];
    const urls = urlsForUser(urlDatabase, req.cookies["user_id"]);
    // console.log(urls)

  const templateVars = {
    user : currentUser,
    urls,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {

  const userId = req.cookies["user_id"];
  const currentUser = users[userId];

  if (!userId) {
    return res.redirect(`/urls`);
  }

  const templateVars = {
    user : currentUser,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const currentUser = users[req.cookies['user_id']];


  const templateVars = {
    user: currentUser,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
  };
  
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/login", (req, res) => {
  const templateVars = { user : null, message:null};
  res.render('login', templateVars);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userId = authenticateUser(email, password);

  if (userId) {
    res.cookie('user_id', userId);
    res.redirect('/urls')
  } else {
    res.status(401).render('login', {
      message: 'Wrong credentials',
      messageClass: 'alert-danger',
      user:null
  });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls/');
});

// URL REDIRECTS

app.get("/u/:shortURL", (req, res) => {
  const urlObj = urlDatabase[req.params.shortURL];

  if (!urlObj) {
    return res.status(404).send({ error: "Short URL not found!" });
  }
  res.redirect(urlObj.longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  if (!user || urlDatabase[shortURL].userID !== user) {
    return res.status(403).send('You dont have access to this command');
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// UPDATING the database

app.post("/urls/:shortURL", (req, res) => {
  const user = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  if (!user || urlDatabase[shortURL].userID !== user) {
    return res.status(403).send({ error: 'Unauthorized action' });
  }
  urlDatabase[shortURL].longURL = req.body.longURL
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


//Returns the URLS that belong to users
const urlsForUser = function (urlDatabase, userId) {
  let matchURLs = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userId) {
      matchURLs[url] = urlDatabase[url]
    }
  }
  return matchURLs;
}