const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_auth_store_db"
);
const uuid = require("uuid");
const bcrypt = require("bcrypt");

// JWT
const JWT = process.env.JWT || "1234";
const jwt = require("jsonwebtoken");

const createTables = async () => {
  const SQL = `
    DROP TABLE IF EXISTS favorites CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
    CREATE TABLE users(
      id UUID PRIMARY KEY,
      username VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
    CREATE TABLE products(
      id UUID PRIMARY KEY,
      name VARCHAR(20)
    );
    CREATE TABLE favorites(
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL,
      product_id UUID NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE,
      CONSTRAINT unique_user_id_and_product_id UNIQUE (user_id, product_id) 
    );
  `;
  await client.query(SQL);
};

const createUser = async ({ username, password }) => {
  console.log('***********');
  console.log('DB createUser username ', username );
  console.log('DB createUser password', password );
  
  const SQL = `
    INSERT INTO users(id, username, password) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), username, password]);
  return response.rows[0];
};

const createProduct = async ({ name }) => {
  const SQL = `
    INSERT INTO products(id, name) VALUES($1, $2) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};

const createFavorite = async ({ user_id, product_id }) => {
  const SQL = `
    INSERT INTO favorites(id, user_id, product_id) VALUES($1, $2, $3) RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, product_id]);
  return response.rows[0];
};

const destroyFavorite = async ({ user_id, id }) => {
  const SQL = `
    DELETE FROM favorites WHERE user_id=$1 AND id=$2
  `;
  await client.query(SQL, [user_id, id]);
};

// register
const register = async ({ username, password }) => {
  console.log("DB register");
  // const SQL = `INSERT username, password FROM users`;
};

const authenticate = async ({ username, password }) => {
  const SQL = `
    SELECT id, password FROM users WHERE username=$1;
  `;
  const response = await client.query(SQL, [username]);
  const hash = response?.rows[0].password;
  const match = await bcrypt.compare(password, hash);

  if (
    // !response.rows.length){
    !response.rows.length ||
    (await bcrypt.compare(password, response.rows[0].password)) === false
  ) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }

  // NEW token with user-id in payload, using SECRET (JWT).
  const token = await jwt.sign({ id: response.rows[0].id }, JWT);

  return { token };
};

// const findUserWithToken = async(id)=> {
const findUserWithToken = async (token) => {
  console.log("Express: FIND USER (id, username) BY TOKEN", `${token}`);

  // init id
  let id;

  try {
    // checks token validity with SECRET(JWT) + extracts payload (id) from token; else throws error.
    const payload = await jwt.verify(token, JWT);
    id = payload.id;
  } catch (error) {
    const err = Error("not authorized");
    err.status = 401;
    throw err;
  }
  const SQL = `
    SELECT id, username FROM users WHERE id=$1;
  `;
  const response = await client.query(SQL, [id]);
  if (!response.rows.length) {
    const error = Error("not authorized");
    error.status = 401;
    throw error;
  }
  // return user info (id, username)
  return response.rows[0];
};

const fetchUsers = async () => {
  const SQL = `
    SELECT id, username FROM users;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchProducts = async () => {
  const SQL = `
    SELECT * FROM products;
  `;
  const response = await client.query(SQL);
  return response.rows;
};

const fetchFavorites = async (user_id) => {
  const SQL = `
    SELECT * FROM favorites where user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};

const fetchAllFavorites = async () => {
  const SQL = `SELECT * FROM favorites`;
  const response = await client.query(SQL);
  return response.rows;
}

module.exports = {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  fetchFavorites,
  createFavorite,
  destroyFavorite,
  authenticate,
  findUserWithToken,
  fetchAllFavorites,
};
