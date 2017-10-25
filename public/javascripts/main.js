const requrl='http://localhost:3000/';

/**
 *  Update links in the background graph bidirectionally
 *  Check which case it is in the 4 cases, and call the corrosponding method:
 *  *  When one link is made:
 *  1, If the link does not exist, create a link;
 *  2, If the link already exists, update: append the user to the supporter list of the selected tile;
 *  *  When one link is destroyed:
 *  1, If the user is the only one supporter, remove;
 *  2, Else update: remove the user from the supporter list of the 2 tiles
 * @param releasedTile
 * @param aroundTiles
 * @return msg
 */
function checkLinks(){
    var params={
        from: 4,
        to: 6,
        dir: 0
    };
    // Case 1: build new links only
    // check if this link exists in the db
    // $.ajax({        
    //     url: requrl+'exist/'+params.from+'/'+params.to,
    //     type: 'get',
    //     // contentType: 'application/json',
    //     dataType: 'json',
    //     // async: false,
    //     cache: false,
    //     timeout: 5000,
    //     success: function(data){
    //         // var data = $.parseJSON(data);
    //         if(data.count==0){
    //             createLink(params);
    //         }else{
    //             supportLink(params);
    //             // forgetLink(params);
    //         }
    //     },
    //     error: function(jqXHR, textStatus, errorThrown){
    //         console.log('error ' + textStatus + " " + errorThrown);  
    //     }
    // });
    // Case 2: destroy some links, build new links

    // Case 3: destroy all links only
    $.ajax({        
        url: requrl+'exist/'+params.from+'/'+params.to,
        type: 'get',
        // contentType: 'application/json',
        dataType: 'json',
        // async: false,
        cache: false,
        timeout: 5000,
        success: function(data){
            // var data = $.parseJSON(data);
            if(data.count > 0){
                forgetLink(params);
            }
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log('error ' + textStatus + " " + errorThrown);  
        }
    });
}

/**
 * Retrieve data from the server and return hint tiles for the player
 * @param  selectedTile
 * @return hintTiles
 */
function getHints(){
    $.ajax({
        url: requrl+'retrieve',
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function(data){
            // var data = $.parseJSON(data);
            console.log(data);
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log('error ' + textStatus + " " + errorThrown);  
        }
    });
}

/**
 *  *  When one link is built:
 *  1, If the link does not exist, create a link;
 *  2, If the link already exists, update: append the user to the supporter list of the selected tile;
 * * Logs: 
 * ++ : new a link and the current user is the first supporter 
 */
function createLink(params){
    $.ajax({
        data: params,
        url: requrl+'create',
        type: 'post',
        dataType: 'json',
        cache: false
    });
}

/**
 * [TO BE REMOVED]
 *  *  When one link is destroyed:
 *  1, If the user is the only one supporter, remove;
 *  2, Else update: remove the user from the supporter list of the 2 tiles
 *  * Logs:
 * -- : remove a link because the current user is the last supporter
 */
function removeLink(){
    var params={
        from: 4,
        to: 6
    };
    $.ajax({
        data: params,
        url: requrl+'remove',
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function(data){
            var data = $.parseJSON(data);
            console.log(data.message);
        },
        error: function(jqXHR, textStatus, errorThrown){
            console.log('error ' + textStatus + " " + errorThrown);  
        }
    });
}

/**
 *  1，append the user to the supporter list of the selected tile
 * + : add one supporter for the link
 */
function supportLink(params){
    $.ajax({
        data: params,
        url: requrl+'support',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function(data){
            console.log(data.msg +' ' +params.from+' --> '+params.to);            
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert('error ' + textStatus + " " + errorThrown);  
        }
    });
}

/**
 *  2, remove the user from the supporter list of the 2 tiles  
 * - : reduce one supporter for the link
 */
function forgetLink(params){
    $.ajax({
        data: params,
        url: requrl+'forget',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function(data){
            console.log(data.msg +' ' +params.from+' --> '+params.to);            
        },
        error: function(jqXHR, textStatus, errorThrown){
            alert('error ' + textStatus + " " + errorThrown);  
        }
    });
}