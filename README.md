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

> [paper.js](http://www.paperjs.org/ "Paper.js offical site") 
> [Express](http://www.expressjs.com.cn/ "Express offical site") 
> [Mongodb](https://www.mongodb.com/ "Mongodb offical site")

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

4, Start it in 1 of the following 3 ways:

```sh
# to test or debug it locally, with nodemon
npm test
# or use nodemon directly
nodemon app.js
# to start it before a release
npm start

```
5, Go http://localhost:3000/ in Chrome to see it.


## Delpoyment(Windows Server)

(Linux and macOS comes soon.)