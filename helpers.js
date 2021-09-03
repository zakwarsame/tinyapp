// User Authentication

const findUserByEmail = (email, database) => {
  return Object.values(database).find((userObj) => userObj.email === email);
};

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
module.exports = { findUserByEmail, generateRandomString };
