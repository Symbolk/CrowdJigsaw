function generateRandomData(size) {
    var nodes = size * size;
    var links = 2 * size * size - 2 * size;

    var randomDataSize = Math.floor(Math.random() * links); 
    var edges = new Array();
    for (var i = 0; i < randomDataSize - 1; i++) {
        var x = Math.floor(Math.random() * nodes);
        var y = Math.floor(Math.random() * nodes);
        if(x == y){
            continue;
        }
        var tag = 'T-B';
        if(Math.random() > 0.5){
            tag = 'L-R';
        }
        var beHinted = false;
        if(Math.random() > 0.5){
            beHinted = true;
        }
        var size = Math.floor(Math.random() * randomDataSize);
        var nodes = Math.floor(Math.random() * nodes);
        edges.push({
            x: x,
            y: y,
            tag: tag,
            beHinted: beHinted,
            size: size,
            nodes: nodes
        });
    }

    var param = {
        player_name: String('user' + Math.floor(Math.random() * 100)),
        round_id: 4,
        edges: edges
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
        client.emit('upload', generateRandomData(10));
        /*
        client.emit('upload', { player_name: 'wyh',
            round_id: 4,
            edges: 
            [ { x: 20, y: 0, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 78, y: 20, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 53, y: 78, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 47, y: 53, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 47, y: 77, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 77, y: 22, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 22, y: 80, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 80, y: 2, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 2, y: 38, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 38, y: 93, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 93, y: 74, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 74, y: 60, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 31, y: 60, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 30, y: 31, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 13, y: 30, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 65, y: 13, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 80, y: 65, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 65, y: 38, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 8, y: 65, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 22, y: 8, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 8, y: 52, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 52, y: 13, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 52, y: 10, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 10, y: 30, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 10, y: 98, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 98, y: 31, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 5, y: 98, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 27, y: 5, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 68, y: 27, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 64, y: 68, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 77, y: 64, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 64, y: 8, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 53, y: 64, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 68, y: 52, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 78, y: 68, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 27, y: 10, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 20, y: 27, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 0, y: 5, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 13, y: 93, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 30, y: 74, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 81, y: 47, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 81, y: 18, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 18, y: 53, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 18, y: 86, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 86, y: 78, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 86, y: 35, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 35, y: 20, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 35, y: 16, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 16, y: 0, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 24, y: 16, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 28, y: 24, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 63, y: 28, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 90, y: 63, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 21, y: 90, tag: 'T-B', beHinted: false, size: 58, nodes: 35 },
             { x: 21, y: 81, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 90, y: 18, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 63, y: 86, tag: 'L-R', beHinted: false, size: 58, nodes: 35 },
             { x: 28, y: 35, tag: 'L-R', beHinted: false, size: 58, nodes: 35 } ] 
            }
        );
        */
        done();
    },

 };