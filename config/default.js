module.exports = {
    port: 3000,
    session: {
      secret: 'CrowdJigsaw',
      key: 'CrowdJigsaw',
      maxAge: 2592000000
    },
    mongodb: 'mongodb://localhost:27017/userinfo'
  };
  