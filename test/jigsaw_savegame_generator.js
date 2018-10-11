function generateRandomData() {
    var steps = Math.floor(Math.random()*999);
    var realSteps = Math.floor(Math.random()*steps);
    var selected = Math.floor(Math.random()*99);
    var maxSubGraphSize = Math.floor(Math.random()*99);
    var tiles = new Array();
    for (var i = 0; i < 100; i++){
        var subGraphSize = Math.floor(Math.random()*99);
        var nodesCount = Math.floor(Math.random()*99);
        var x = Math.floor(Math.random()*50);
        var y = Math.floor(Math.random()*50);
        tiles.push({"index":i,"subGraphSize":subGraphSize,"nodesCount":nodesCount,"x":x,"y":y});
    }
    var tileHintedLinks = new Array();
    for(var i=0;i<100;i++){
        var ran = Math.random();
        if(ran<0.5)
            tileHintedLinks.push([-1,-1,-1,-1]);
        else
            tileHintedLinks.push([Math.floor(Math.random()*99), Math.floor(Math.random()*99), Math.floor(Math.random()*99), Math.floor(Math.random()*99)]);
    }
    var totalHintsNum =  Math.floor(Math.random()*99);
    var correctHintsNum = Math.floor(Math.random()*totalHintsNum);
    var param = { round_id: 208,
        player_name: String('user' + Math.floor(Math.random() * 100)),
        steps: steps,
        realSteps: realSteps,
        startTime: 1539235170809,
        maxSubGraphSize: maxSubGraphSize,
        tiles:tiles,
        tileHintedLinks: tileHintedLinks,
        totalHintsNum: totalHintsNum,
        correctHintsNum: correctHintsNum };
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
        client.emit("saveGame", generateRandomData());
        done();
    },

};