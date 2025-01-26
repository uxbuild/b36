const {
  client,
  createTables,
  createUser,
  createProduct,
  createFavorite,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  destroyFavorite,
  authenticate,
  findUserWithToken,
  fetchAllFavorites,
} = require("./db");

// express
const express = require("express");
const app = express();
app.use(express.json());

//bcrypt
const bcrypt = require("bcrypt");
// const salt = bcrypt.genSalt(10);

//for deployment only
const path = require("path");
// app.get("/", (req, res) =>
//   res.sendFile(path.join(__dirname, "../client/dist/index.html"))
// );
// app.use(
//   "/assets",
//   express.static(path.join(__dirname, "../client/dist/assets"))
// );

//ISLOG
const isLoggedIn = async (req, res, next) => {
  console.log("*******");
  console.log("IsLoggedIn ");

  // const headerAuth = req.headers.authorization;
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  console.log("AUTHORIZATION header", authHeader);
  console.log("TOKEN", token);

  if (!token) {
    console.log("no token..");
    return next();
  }

  try {
    req.user = await findUserWithToken(token);
    console.log("req.user", req.user);
    next();
  } catch (ex) {
    next(ex);
  }
};

//call by App react component <Login /> if no token is found, (also, auth.id is undefined).
app.post("/api/auth/login", async (req, res, next) => {
  console.log("************");
  console.log("POST api/auth/login");

  // res.send(req.body);
  // console.log("POST /api/auth/login", req.body);

  try {
    // console.log('API auth login');
    // res.send('POST api auth login');
    // authenticate: throws error if (body.username) not found, or (body.password) not match (bcrypt.compare to encrypted pw in DB).
    // authenticate returns a NEW token, or error: 401.
    res.send(await authenticate(req.body));
  } catch (ex) {
    // console.log("api/auth/login ERROR");
    next(ex);
  }
});

// register new user
app.post("/api/auth/register", async (req, res, next) => {
  // console.log("*******");
  // console.log("POST api/auth/register");
  // console.log('req.body', req.body);
  

  try {
    // console.log('creating credentials before DB..');
    const username = req.body.username;
    const password = req.body.password; // hash this.
    // console.log('we received username + password', `${username}, ${password}`);
    
    const salt = await bcrypt.genSalt(10);
    const hashPass = await bcrypt.hash(password, salt);
    // console.log('sending to DB credentials', `${username}, ${hashPass}`);
    const user = await createUser({username, password:hashPass});
    //what response?
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// app.get('/api/auth/me', async(req, res, next)=> {
app.get("/api/auth/me", isLoggedIn, async (req, res, next) => {
  console.log("********");
  console.log("GET api/auth/me");

  try {
    // res.send(await findUserWithToken(req.headers.authorization));
    // req.user is added by isLoggedIn middleware if token validated or throws 401 error.
    console.log("req.user: ", req.user);
    res.send(req.user);
  } catch (ex) {
    next(ex);
  }
});

app.get("/api/users", async (req, res, next) => {
  console.log("*******");
  console.log("GET api/users");

  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

//GETFAV
app.get("/api/users/:id/favorites", isLoggedIn, async (req, res, next) => {
  console.log("********");
  console.log("GET api/users/:id/favorites");
  console.log("req.params.id: ", req.params.id);
  console.log("req.user", req.user);

  try {
    // res.send(await fetchFavorites(req.params.id));
    // isLoggedIn validates token + sets req.user, or throws error.
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    //if no error, grab user info..
    res.send(await fetchFavorites(req.params.id));
  } catch (ex) {
    next(ex);
  }
});

app.post("/api/users/:id/favorites", isLoggedIn, async (req, res, next) => {
  console.log("********");
  console.log("POST api/users/:id/favorites");
  console.log("req.params.id: ", req.params.id);
  console.log("req.user", req.user);

  try {
    // isLoggedIn validates token + req.user, or error 401.
    if (req.params.id !== req.user.id) {
      const error = Error("not authorized");
      error.status = 401;
      throw error;
    }
    // add new fav if no error thrown.
    res.status(201).send(
      await createFavorite({
        user_id: req.params.id,
        product_id: req.body.product_id,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.delete(
  "/api/users/:user_id/favorites/:id",
  isLoggedIn,
  async (req, res, next) => {
    console.log("*******");
    console.log("DELETE api/users/:user_id/favorites/:id");
    console.log("req.params.user_id: ", req.params.user_id);
    console.log("req.params.id(favorites:/id): ", req.params.id);
    console.log("req.user", req.user);

    try {
      // isLoggedIn validates token, appends req.user, or throws error.
      if (req.params.user_id !== req.user.id) {
        const error = Error("not authorized");
        error.status = 401;
        throw error;
      }
      // if no error, complete request..
      await destroyFavorite({ user_id: req.params.user_id, id: req.params.id });
      res.sendStatus(204);
    } catch (ex) {
      next(ex);
    }
  }
);

app.get("/api/products", async (req, res, next) => {
  console.log("********");
  console.log("GET api/products");
  console.log("********");

  try {
    res.send(await fetchProducts());
  } catch (ex) {
    next(ex);
  }
});

// error handling middleware..
app.use((err, req, res, next) => {
  console.log(err);
  res
    .status(err.status || 500)
    .send({ error: err.message ? err.message : err });
});

const init = async () => {
  const port = process.env.PORT || 3000;
  await client.connect();
  console.log("connected to database");

  await createTables();
  console.log("tables created");
  // console.log('SALT // ', salt);
  const salt = await bcrypt.genSalt(10);
  // console.log("TEST SALT", JSON.stringify(salt));
  const newPass = await bcrypt.hash("password", salt);

  const [moe, lucy, ethyl, curly, foo, bar, bazz, quq, fip] = await Promise.all(
    [
      createUser({
        username: "moe",
        password: newPass,
      }),
      createUser({
        username: "lucy",
        password: newPass,
      }),
      createUser({
        username: "ethyl",
        password: newPass,
      }),
      createUser({
        username: "curly",
        password: newPass,
      }),

      createProduct({ name: "product A" }),
      createProduct({ name: "product B" }),
      createProduct({ name: "product C" }),
      createProduct({ name: "product D" }),
      createProduct({ name: "product E" }),
    ]
  );

  console.log("*** Users ***");
  console.log(await fetchUsers());
  console.log("*** Products ***");
  console.log(await fetchProducts());
  console.log("*** ALL Favorites ***");
  console.log(await fetchAllFavorites());
  console.log("*****************");

  // const favorite = await createFavorite({
  //   user_id: moe.id,
  //   product_id: foo.id,
  // });
  app.listen(port, () => console.log(`listening on port ${port}`));
};

init();
