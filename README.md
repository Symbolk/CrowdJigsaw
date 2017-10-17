# Crowd Jigsaw

---

**Crowd Jigsaw is an online game, where multiple players work together to figure out a complex jigsaw puzzle.**
**Designed to be an Application of Crowd Wisdom/Collective Intelligence**
**As a Refactored Version of Crowd Jigsaw Puzzle**

_Powered By [@Symbolk](http://www.symbolk.com)_

## Overview

Language : 

> [Javascript/Paperscript/Html5/CSS3]

Based on :

> [Express](http://www.expressjs.com.cn/ "Express offical site") 
> [Mongodb](https://www.mongodb.com/ "Mongodb offical site")

> [paper.js](http://www.paperjs.org/ "Paper.js") 

> [MDL](https://getmdl.io/ "Material Design Lite")
> [FontAwesome](http://fontawesome.dashgame.com/ "FontAwesome")

Requirements :

> Chrome Browser ~59.0

> Node.js ~6.11.0

> Express ~4.15.0

> Mongodb ~3.4.7

_P.S. See npm dependencies in package.json_
 
---
## Usage

![Home](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/home.jpg)
![Phone](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/phone.jpg)
![PhoneDrawer](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/phone_drawer.jpg)
![Puzzle](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/puzzle.jpg)


## Development(Windows)

1, Start mongodb service with the command:

```shell
# Make a new folder as your database, e.g. d:\database
mongod --dbpath d:\database
```
2, Create the database required in another CMD:

```sh
# get into the interactive shell of mongodb
mongo
# create the userinfo database
> use userinfo;
# check the current database
> show dbs;
> db;

```
3, Under the project folder, install the package dependencies:

```sh
cd CrowdJigsaw
npm install
```

4, Start the server:

```sh
# test or debug it locally(automatically restart server once code changed)
npm test
# or use nodemon directly
nodemon app.js
```
5, Go http://localhost:3000/ in Chrome to see the client.


## Delpoyment(Windows Server)

1, Edit app.js in the end:
```javascript
// nodemon or npm test
// app.listen(3000);
// npm start
app.listen(4000);
module.exports = app; 
```
2, Start the server:
```sh
# start it before a release
npm start
# forever will be used later

```

3, Go http://localhost:4000/ in Chrome to see the client.

(Linux and macOS comes soon.)