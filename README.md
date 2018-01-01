# Crowd Jigsaw

---

**Crowd Jigsaw is an online game, where multiple players work together to figure out a complex jigsaw puzzle.**

**Designed to be an Application of Crowd Wisdom/Collective Intelligence**

**As a Refactored Version for Experiments of Crowd Jigsaw Puzzle**

_Powered By_

_[@Symbolk](http://www.symbolk.com)_  _[@Yuhan Wei](https://github.com/weiyuhan)_ _[@Xinyue Zhang](https://github.com/ZXinyue)_

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

Platform  | Support  |  Version
------------ | -------------  | -------------
OS | Windows/Linux/iOS/Android | N/A
Browser | Chrome/Safari | ~60.0
Node.js | Node.js | ~6.11.0
Express | Express | ~4.15.0
Mongodb | Mongodb | ~3.4.7

_P.S. See npm dependencies in package.json_
 
---
## Usage

![Home](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/home2.jpg)
![Phone](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/phone2.jpg)
![PhoneDrawer](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/phone_drawer2.jpg)

### Step1 : New a Game Round

![round_wait](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/round_new.jpg)

### Step2 : Wait for Players to Join

![round_new](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/round_wait.jpg)

### Step3 : Puzzle Started Automatically(when players are enough)

![puzzle](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/puzzle.jpg)

**In one round, a crowd of players are playing together to figure out the same jigsaw puzzle(which can be overwhelming for any individual). In this process, explicit communication is not necessary, people just focus on their work but assistance comes to him continually from the crowd.**

### Step4 : Check the Contribution Rank

![round_rank](https://github.com/Symbolk/CrowdJigsaw/blob/master/public/screenshots/round_rank.jpg)

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

2, Edit config.pro.js in the end:

```javascript
    ...
    database: 'mongodb://localhost:27017/CrowdJigsaw',    
    url: 'http://SERVERIP:3000/'
  };
3, Start the server:

```sh
# install forever first
npm install forever -g
# start it
npm start
# or use forever
forever start app.js
```

3, Go http://SERVERIP:3000/ in Chrome to see the client.

## Bugs&Issues
