# B36: ACME Auth Store

## TO DO:
- authenticate(): check username + password / DONE
- findUserByToken uses ID, change to TOKEN / DONE
- route: get favorites (GET api/users/id/favorites) DONE
- route: add favorite (POST api/users/id/favorites) DONE
- route: remove favorite (DELETE api/users/userid/favorites/id) DONE
- (+) ability to register / DONE
- (+) display error on registration + login / DONE




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
