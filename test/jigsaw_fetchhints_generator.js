module.exports = {
    /**
     * On client connection (required)
     * @param {client} client connection
     * @param {done} callback function(err) {}
     */
    onConnect : function(client, done) {

        // Socket.io client
        // client.emit('test', { hello: 'world' });

        done();
    },

    /**
     * Send a message (required)
     * @param {client} client connection
     * @param {done} callback function(err) {}
     */
    sendMessage : function(client, done) {
        // Example:
        client.emit("fetchHints", {
            round_id: 210,
            player_name: String('user' + Math.floor(Math.random() * 100)),
            tilesNum: 100
        });
        done();
    },

};