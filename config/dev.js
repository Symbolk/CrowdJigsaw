module.exports = {
    port: 3000,
    session: {
      secret: 'CrowdJigsaw',
      key: 'CrowdJigsaw',
      maxAge: 2592000000
    },
    database: 'mongodb://localhost:27017/CrowdJigsaw',
    url: 'http://localhost:3000/'
  };
  