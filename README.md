# B36: ACME Auth Store

## TO DO:
- authenticate(): check username + password / DONE
- findUserByToken uses ID, change to TOKEN / DONE
- GET api/users/:id/userSkills not secure (use auth.id) / DONE
- POST api/users/:id/userSkills not secure (use auth.id) / DONE
- DELETE api/users/:id/userSkills not secure / DONE
- authenticate(): bcrypt.compare() login password with encrypted DB pw / DONE
- GET api/auth/me JWT / DONE
- GET api/users/:id/favorites JWT / DONE
- POST api/users/:id/favorites JWT / DONE
- DELETE api/users/:id/favorites JWT / DONE
- (+) ability to register
- (+) display error on registration + login.




# Setup

- create database

```
createdb acme_auth_store_db
```

- install dependencies

```
npm install && cd client && npm install
```

- start server in root directory of repository
```
npm run start:dev
```

- start vite server in client directory

```
npm run dev
```

# to test deployment
```
cd client && npm run build
```

browse to localhost:3000 (or whatever server port is being used for your express application)

# to deploy
- build script for deploy

```
npm install && cd client && npm install && npm run build

```
- start script for deploy 

```
node server/index.js

```

- environment variables for deploy

```
JWT for jwt secret
DATABASE_URL for postgres database
```
