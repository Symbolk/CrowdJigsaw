# Crowd Jigsaw

---

**Crowd Jigsaw is an online game, where multiple players work together to figure out a complex jigsaw puzzle.**
**Designed to be an Application of Crowd Wisdom/Collective Intelligence**
**As a Refactored Version of Crowd Jigsaw Puzzle**

_Powered By_

_[@Symbolk](http://www.symbolk.com)_

_[@Yuhan Wei](https://github.com/weiyuhan)_

_[@Xinyue Zhang](https://github.com/ZXinyue)_

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

> OS: Windows or Linux

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
### Level1 : Jagged Pictorial Tiles

![Level1](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/thumbnail_1.jpg)
### Level2 : Square Pictorial Tiles

![Level2](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/thumbnail_2.jpg)
### Level3 : Voronoi Pictorial Tiles

![Level3](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/thumbnail_3.jpg)

### Level4 : Voronoi Non-Pictorial Tiles

![Level4](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/thumbnail_4.jpg)

## Development(Windows)

0, Set the env as development:

```shell
# windows
set NODE_ENV=development
# linux/macOS
export NODE_ENV=development
```

1, Start mongodb service with the command:

```shell
# Make a new folder as your database, e.g. d:\database in Windows
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


## Delpoyment(Aliyun CentOS)

0, Set the env as production:

```shell
# windows
set NODE_ENV=production
# linux/macOS
export NODE_ENV=production
```

1, Start mongodb service with the command:

```shell
# Make a new folder as your database, e.g. /var/www/database
nohup mongod --dbpath /var/www/database &
```

2, Edit app.js in the end:

```javascript
// nodemon or npm test
// app.listen(3000);
// npm start
app.listen(3000);
module.exports = app; 
```
3, Start the server:

```sh
# start it before a release
npm start
# or use forever
forever start app.js
```

3, Go http://YOURDOMAIN:3000/ in Chrome to see the client.

## Bugs&Issues