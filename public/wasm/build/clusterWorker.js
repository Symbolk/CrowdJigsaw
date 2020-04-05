importScripts('cluster.js');

var wasmCluster = Module.cwrap("cluster", null, ["number", "number", "number"]);

var cppCluster = function (tilePositions, rows, cols) {
    var input_array = new Int32Array(tilePositions);
    
    var len = input_array.length;
    var bytes_per_element = input_array.BYTES_PER_ELEMENT;
    var input_ptr = Module._malloc(2 * len * bytes_per_element);
    Module.HEAP32.set(input_array, input_ptr / bytes_per_element);

    wasmCluster(input_ptr, rows, cols);

    var ret = new Int32Array(Module.HEAP32.buffer, input_ptr, len);

    newTilePositions = new Array();
    for(var i = 0; i < ret.length; ++i) {
        newTilePositions.push(ret[i]);
    }
    
    Module._free(input_ptr);

    return newTilePositions;
}

Module.onRuntimeInitialized = function() {
	postMessage({
		cmd: 'ready',
	});
}

function arrayEqual(a1, a2) {
	if (!a1 || !a2) {
		return false;
	}
	if (a1.length != a2.length) {
		return false;
	}
	for (var i = 0; i < a1.length; i++) {
		if (a1[i] != a2[i]) {
			console.log(i, a1[i], a2[i]);
			return false;
		}
	}
	return true;
}

addEventListener('message', function (e) {
	var data = e.data;
    switch (data.cmd) {
        case 'cluster':
        	var tilePositions = data.tilePositions;
        	var tilesPerRow = data.tilesPerRow;
        	var tilesPerColumn = data.tilesPerColumn;
        	var maxTry = 10;
			while (maxTry) {
				try {
					tilePositions = cppCluster(tilePositions, tilesPerRow, tilesPerColumn);
					console.log("[Worker] Called cpp cluster by WebAssembly");
					break;
				}
				catch (error) {
			        console.log("[Worker] Error while calling cpp cluster by WebAssembly, retry");
			    }
			    finally {
			    	maxTry -= 1;
			    }
			}
	        postMessage({
            	cmd: 'cluster return',
            	tilePositions: tilePositions,
            	funcStartTime: data.funcStartTime
            });
            break;
        default:
            break;
    } 
});