function generateRandomData() {
    var selected = Math.floor(Math.random()*99);
    var selectedTileIndexes = [selected];
    var getHintsIndex = new Array();
    getHintsIndex.push(selected);
    getHintsIndex.push(Math.floor(Math.random()*99));
    var currentStep = Math.floor(Math.random()*999);
    var param = {
        "round_id": 208,
        "selectedTileIndexes": selectedTileIndexes,
        "indexes": getHintsIndex,
        "currentStep": currentStep,
    };
    return param;
}

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
        client.emit("getHintsAround", generateRandomData());
        done();
    },

};