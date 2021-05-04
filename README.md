# sugar-salt-butter
[![Build Status](https://travis-ci.com/ainhoaL/sugar-salt-butter.svg?branch=master)](https://travis-ci.com/ainhoaL/sugar-salt-butter)

Node.js application to organize (store and search) food recipes, backed by a mongoDB database, that provides a REST API for other applications to use: 
- [sugar-salt-buter-ui](https://github.com/ainhoaL/sugar-salt-butter-ui): front end web application. 
- [recipe-saver-chrome](https://github.com/ainhoaL/recipe-saver-chrome): chrome extension to save recipes.

## Setup
- [Install mongoDB](https://docs.mongodb.com/manual/administration/install-community/).
- Run MongoDB locally.
- Create a database called `ssbrecipes`.
- In `sugar-salt-butter` directory, run `npm i` to install all dependencies.
- If using the web application `sugar-salt-butter-ui`:
   - [Get a Google OAuth ClientID for the web application](https://developers.google.com/identity/sign-in/web/sign-in).
   - Set environment variable `WEBCLIENT_ID` to ClientID obtained in the previous step.
- If using the chrome extension `recipe-saver-chrome`:
   - [Get a Google OAuth ClientID for the chrome extension](https://developer.chrome.com/docs/apps/app_identity/#client_id). This is different from the UI clientId.
   - Set environment variable `CLIENT_ID` to ClientID obtained in the previous step. This is different from WEBCLIENT_ID.

## Start the application
- Run MongoDB locally.
- Make sure `WEBCLIENT_ID` and/or `CLIENT_ID` are set.
- Run command `npm start`.

Note: By default server starts on port 3050.

## Test the application
- Run command `npm test`.

This includes linting with `standard`.

Testing done with test framework `Mocha`, `sinon` and `chai`.

## Architecture
### Data
This application stores the recipe data in a mongoDB database and uses `Mongoose` models to interact with said database.

The [Mongoose models](https://github.com/ainhoaL/sugar-salt-butter/blob/master/models) define the data to be stored for different objects:
- Recipe: defines a recipe (title, website, author, ingredients, instructions,...)
- List: defines a shopping list (title, list items, recipes linked to the list,...)

All data is linked to a user via the userId. We don't store user information (username, password) but instead use the Google user ID to identify users.

### REST API
Provides CRUD operations for recipes and shopping lists (lists), and for adding and removing recipes to shopping lists.
Code:
- [Controllers](https://github.com/ainhoaL/sugar-salt-butter/blob/master/controllers)
- [Routes](https://github.com/ainhoaL/sugar-salt-butter/blob/master/routes.js)

Documentation: [Swagger doc](https://github.com/ainhoaL/sugar-salt-butter/blob/master/docs/swagger.yaml)

### Auth
Authentication is done via Google Oauth with [`google-auth-library`](https://www.npmjs.com/package/google-auth-library), using Bearer token authentication.
Users don't need to register with the app to log in, instead they log in via Google. Every recipe and list in the database is linked to a user via the Google user ID. This way we are avoiding storing any passwords or confidential data.

All requests to this app must have `Bearer <token>` set in the Authorization header. Every request will be authenticated with the GoogleAuth Client.
- A request from the web client sends an IdToken, which is verified with the google-auth-library and the app can extract the Google userId.
- A request from the chrome extension sends an auth token, from which the google-auth-library can get the Google userId directly.

Code: [authentication.js](https://github.com/ainhoaL/sugar-salt-butter/blob/master/utils/authentication.js)

## Project goals
I want to develop this application as a project from start to finish (UX, front and back end development, project management, etc). Some of those areas I know nothing about, so I have decided to keep a blog to keep track of my progress and share the journey, you can check it at http://sugarsaltcode.blogspot.co.uk/

I write about the process and the reasoning behind my choices, as well as any interesting new things I learn while I work on this project.
