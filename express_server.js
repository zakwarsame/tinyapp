const express = require("express");
const app = express();
const PORT = 8000; // default port 8080
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { findUserByEmail, generateRandomString } = require("./helpers");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["lemonjuice", "vanillaicecream"],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dish",
  },
};

// ---- FUNCTIONS START ----

// Create a user id ... generate a unique id
// Create a new user object
// Add the user to the database
const addNewUser = (name, email, password) => {
  const userId = generateRandomString();
  const newUser = {
    id: userId,
    name,
    email,
    password,
  };
  users[userId] = newUser;

  return userId;
};

//Returns the URLS that belongs to each user
const urlsForUser = function (urlDatabase, userId) {
  let matchURLs = {};

  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === userId) {
      matchURLs[url] = urlDatabase[url];
    }
  }
  return matchURLs;
};

// User Authentication
// loop through the users db => object
// check uf values of email and password match defaults return false
const authenticateUser = (email, password) => {
  const user = findUserByEmail(email, users);
  if (user) {
    const hashedPassword = user.password;
    if (bcrypt.compareSync(password, hashedPassword)) {
      return user.id;
    }
  }

  return false;
};

// ---- FUNCTIONS END ----

// ------ GET routes START ------

app.get("/", (req, res) => {
  if (req.session.user_id && users[req.session.user_id]) {
    return res.redirect("/urls/");
  }
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const currentUser = users[req.session.user_id];
  const urls = urlsForUser(urlDatabase, req.session.user_id);
  const templateVars = {
    user: currentUser,
    urls,
  };
  return res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const currentUser = users[userId];

  if (!userId) {
    return res.redirect(`/urls`);
  }

  const templateVars = {
    user: currentUser,
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const currentUser = users[userId];
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID !== userId) {
    return res
      .status(400)
      .send("<h3>Unauthorized to access this page</h3>");
  }
  if(!userId || !currentUser){
    return res
    .status(400)
    .send("<h3>Please login before accessing this page</h3>");
  }
  if (!urlDatabase[req.params.shortURL]) {
    return res
      .status(400)
      .send(
        "<h3>Uknown url. Please make sure you have created the URL first.</h3>"
      );
  }
  const templateVars = {
    user: currentUser,
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
  };

  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const urlObj = urlDatabase[req.params.shortURL];

  if (!urlObj) {
    return res.status(404).send("Oops! The Tiny URL provided does not exist");
  }
  res.redirect(urlObj.longURL);
});

// Display the login form, but first check if user is logged
app.get("/login", (req, res) => {
  if (req.session.user_id && users[req.session.user_id]) {
    return res.redirect("/urls/");
  }
  const templateVars = { user: null, message: null };
  res.render("login", templateVars);
});

// Display the register form, but first check if user is logged
app.get("/register", (req, res) => {
  if (req.session.user_id && users[req.session.user_id]) {
    return res.redirect("/urls/");
  }
  const templateVars = { user: null, message: null };
  res.render("register", templateVars);
});

// ------ GET routes END ------

// ------- POST routs START -------

// Create a key value pair and put them in the urlDatabase (a new short url is generated, longURL is coming from the POST made by form)
app.post("/urls", (req, res) => {
  const user = req.session.user_id;
  if (!user) {
    return res.redirect(`/urls`);
  }
  const newShortUrl = generateRandomString();
  urlDatabase[newShortUrl] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
  };
  res.redirect(`/urls/${newShortUrl}`);
});

// Updating the database
app.post("/urls/:shortURL", (req, res) => {
  const user = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!user || urlDatabase[shortURL].userID !== user) {
    return res
      .status(403)
      .send("Unauthorized action. Please login to create your own URL.");
  }
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (!user || urlDatabase[shortURL].userID !== user) {
    return res.status(403).send("You dont have access to this command");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userId = authenticateUser(email, password);

  if (userId) {
    req.session.user_id = userId;
    res.redirect("/urls");
  } else {
    res.status(401).render("login", {
      message: "Wrong credentials",
      messageClass: "alert-danger",
      user: null,
    });
  }
});

app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  // check that the user is not already in the database
  const user = findUserByEmail(email, users);
  // check that password and email was provided
  if (!password || !email) {
    return res.status(400).render("register", {
      message: "Please fill out both email and password",
      messageClass: "alert-danger",
      user: null,
    });
  }
  const hashPassword = bcrypt.hashSync(password, 10);
  // if user is undefined, we can add the user in the db
  if (!user) {
    const userId = addNewUser(name, email, hashPassword);

    // Set cookie session in the user's browser
    req.session.user_id = userId;
    return res.redirect("/urls");
  } else {
    res.status(403).render("register", {
      message: "User already exists",
      messageClass: "alert-danger",
      user: null,
    });
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls/");
});

// ------- POST routs END -------

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
