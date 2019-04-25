# redmine-resource-calendar
Resource calendar component by react.js using Redmine REST API.

## Settings
```
$ touch .env
$ vi .env

> USERS=[{"id":1, "name":"john"}, {"id":2, "name":"jane"}]
> URL=https://www.example.com/redmine
> API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
> WORKLOAD=8
```

## Deployment
```
$ git clone -b develop ssh://~.git
$ cd redmine-resource-calendar
$ npm install    # Installing frontend dependencies.
$ npm run build  # Building JavaScript & CSS via webpack.
```

## Development
```
# Bulid & Watch JavaScript & CSS on localhost:3000 by webpack via npm.
$ npm run watch

# Build JavaScript & CSS for production by webpack via npm.
$ npm run build
```
