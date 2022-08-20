const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
let db = null;
const startServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

startServer();

////api_1
const validatePassword = (password) => {
  return password.length > 4;
};
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hasedPass = await bcrypt.hash(password, 10);
  const getQuery = `SELECT * FROM user WHERE username='${username}'`;
  const queryGet = await db.get(getQuery);
  if (queryGet === undefined) {
    const inQuery = `
    INSERT INTO 
    user(username,name,password,gender,location)
          VALUES(
              '${username}',
          '${name}',
          '${hasedPass}',
          '${gender}',
          '${location}');`;
    if (validatePassword(password)) {
      await db.run(inQuery);
      response.send("User created successfully ");
    } else {
      response.status(400);
      response.send("Password is too short ");
    }
  } else {
    response.status(400);
    response.send("User already exists ");
  }
});

////api_2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const Query = `SELECT * FROM user WHERE username='${username}'`;
  const finalQuery = await db.get(Query);
  if (finalQuery === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passMatch = await bcrypt.compare(password, finalQuery.password);
    if (passMatch === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//////api_3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const queryPass = `SELECT * FROM user WHERE username='${username}'`;
  const pssQuery = await db.get(queryPass);
  if (pssQuery === undefined) {
    response.send("Invalid user");
    response.status(400);
  } else {
    const hasedPass = await bcrypt.compare(oldPassword, pssQuery.password);
    if (hasedPass === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hasedPassword = await bcrypt.hash(newPassword, 10);
        const updatePass = `UPDATE user SET password='${hasedPassword}' WHERE username='${username}'`;
        await db.run(updatePass);
        response.send("Password updated");
        response.status(400);
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
