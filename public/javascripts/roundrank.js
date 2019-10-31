function getDefaultValue(data, key, defaultValue) {
    return data[key] ? data[key] : defaultValue;
}

function renderScore(data) {
    if (!data.score) {
        return;
    }
    var keys = ['create_correct_link', 'create_wrong_link','remove_correct_link','remove_wrong_link','remove_hinted_wrong_link'];
    
    // 指定图表的配置项和数据
    var option = {
        title: {
            text: 'score detail of ' + data.username,
            left: 'center'
        },
        tooltip : {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c}"
        },
        xAxis: {
            type: 'category',
            data: []
        },
        yAxis: {
            type: 'value'
        },
        series : [
            {
                type: 'bar',
                data:[],
                itemStyle: {
                    emphasis: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }
        ]
    };

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = getDefaultValue(data, key, 0);
        if (value <= 0) {
            continue;
        }
        option.xAxis.data.push(key);
        var series_data = {
            value: value,
            name: key
        };
        option.series[0].data.push(series_data);
    }

    if (option.xAxis.data.length == 0) {
        return;
    }
    var scoreTable = document.getElementById('score');
    scoreTable.style.display = "block";
    var myChart = echarts.init(scoreTable);
    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
};

function renderLinks(data) {
    if (!data.edges) {
        return;
    }
    var first_edges_set = new Set(data.first_edges ? data.first_edges : []);
    var first_edge_count = 0;
    var linksMap = {}
    for (var i = 0; i < data.edges.length; i++) {
        var edgeData = data.edges[i];
        var {edge, from, hinted} = edgeData;
        if (hinted && from == "") {
            from = "crowd";
        }
        from = from == "" ? data.username : from;
        var num = getDefaultValue(linksMap, from, 0);
        linksMap[from] = num + 1;
        if (from == data.username && first_edges_set.has(edge)) {
            first_edge_count += 1;
        }
    }
    var linksArray = [];
    for (var from in linksMap) {
        if (from == data.username) {
            continue;
        }
        linksArray.push({
            from: from,
            num: linksMap[from]
        });
    }
    linksArray.sort((a, b) => {return a.num - b.num});
    // 指定图表的配置项和数据
    var option = {
        legend : {
            data:['edges', 'first'],
            bottom: 10,
            left: 'center',
        },
        tooltip : {
            trigger: 'axis',
            axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
            },
            formatter: function (params) {
                console.log(params);
                var edges = parseInt(params[0].data);
                var first = params[1].data ? parseInt(params[1].data) : 0;
                var ret = 'edges created by ' + params[0].name 
                    + ': ' + (edges + first);
                if (first > 0) {
                    ret += '<br>edges first created by ' 
                    + params[1].name + ': ' + first;
                }
                return ret;
            },
        },
        title: {
            text: 'links detail of '+ data.username,
            left: 'center'
        },
        yAxis: {
            type: 'category',
            data: []
        },
        xAxis: {
            type: 'value'
        },
        series: [{
            data: [],
            stack: 'one',
            type: 'bar',
            name: 'edges'
        }]
    };
    for (var i = 0; i < linksArray.length; i++) {
        option.yAxis.data.push(linksArray[i].from);
        option.series[0].data.push(linksArray[i].num);
    }
    if (option.yAxis.data.length == 0) {
        return;
    }
    if (data.first_edges && data.edges) {
        var first_series = {
            data: [],
            stack: 'one',
            type: 'bar',
            name: 'first'
        };
        first_series.data[linksArray.length] = first_edge_count;
        option.series.push(first_series);

    }
    option.yAxis.data.push(data.username);
    option.series[0].data.push(linksMap[data.username] - first_edge_count);
    var linksTable = document.getElementById('links');
    linksTable.style.display = "block";
    var myChart = echarts.init(linksTable);
    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
};


function renderProgress(coglist) {
    var option = {
        title: {
            text: 'progress',
        },
        tooltip : {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            }
        },
        legend: {
            data:['correctHints','correctLinks','totalLinks','completeLinks', 'gaCompleteLinks', 'gaCorrectLinks']
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis : [
            {
                type: 'time',
                splitLine: {
                    show: false
                }
            }
        ],
        yAxis : [
            {
                type : 'value'
            }
        ],
        series : [
            {
                name:'correctHints',
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            },
            {
                name:'correctLinks',
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            },
            {
                name:'totalLinks',
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            },
            {
                name:'completeLinks',
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            },
            {
                name:'gaCompleteLinks',
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            },
            {
                name:'gaCorrectLinks',
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            }
        ]
    };
    for (var i = 0; i < coglist.length; i++) {
        var cog = coglist[i];
        option.series[0].data.push([cog.time, cog.correctHints > 0 ? cog.correctHints: 0]);
        option.series[1].data.push([cog.time, cog.correctLinks > 0 ? cog.correctLinks: 0]);
        option.series[2].data.push([cog.time, cog.totalLinks > 0 ? cog.totalLinks: 0]);
        option.series[3].data.push([cog.time, cog.completeLinks > 0 ? cog.completeLinks: 0]);
        option.series[4].data.push([cog.time, cog.gaLinks > 0 ? cog.gaLinks: 0]);
        option.series[5].data.push([cog.time, cog.gaCorrectLinks > 0 ? cog.gaCorrectLinks: 0]);
    }
    var progressChart = document.getElementById('progress');
    progressChart.style.display = "block";
    var myChart = echarts.init(progressChart);
    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
}

function renderPrecision(coglist) {
    var option = {
        title: {
            text: 'precision',
        },
        tooltip : {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            }
        },
        legend: {
            data:[`all links' precision`, `strong links' precision`, `ga links' precision`]
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis : [
            {
                type: 'time',
                splitLine: {
                    show: false
                }
            }
        ],
        yAxis : [
            {
                type : 'value'
            }
        ],
        series : [
            {
                name:`all links' precision`,
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            },
            {
                name:`strong links' precision`,
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            },
            {
                name:`ga links' precision`,
                type:'line',
                data:[],
                symbol: 'none',
                smooth: true
            }
        ]
    };
    for (var i = 0; i < coglist.length; i++) {
        var cog = coglist[i];
        var allPrecision = cog.allPlayersCorrectLinks / cog.allPlayersTotalLinks;
        var hintsPrecision = cog.totalHints? (cog.correctHints / cog.totalHints): 0;
        var gaPrecision = cog.gaLinks? (cog.gaCorrectLinks / cog.gaLinks): 0;
        option.series[0].data.push([cog.time, allPrecision]);
        option.series[1].data.push([cog.time, hintsPrecision]);
        option.series[2].data.push([cog.time, gaPrecision]);
    }
    var progressChart = document.getElementById('precision');
    progressChart.style.display = "block";
    var myChart = echarts.init(progressChart);
    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
}

function renderDetail(username) {
    console.log(round_id, username);
    $.ajax({
        url: window.location.protocol + '//' + window.location.host + '/round/detail/' + round_id + '/' + username,
        type: 'get',
        dataType: 'json',
        cache: true,
        timeout: 5000,
        success: function (data) {
            console.log(data);
            renderScore(data);
            renderLinks(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {}
    });
}

function getProgress(endTime) {
    console.log(round_id);
    $.ajax({
        url: window.location.protocol + '//' + window.location.host + '/round/progress/' + round_id,
        type: 'get',
        dataType: 'json',
        cache: true,
        timeout: 5000,
        success: function (data) {
            if (data && data.length > 0) {
                var coglist = data;
                coglist.forEach((ele, i) => {
                    coglist[i] = JSON.parse(ele);
                });
                coglist.sort((a, b) => (a.time - b.time));
                var startTime = coglist[0].time;
                endTime = endTime * 1000 + startTime;
                coglist = coglist.filter((ele) => endTime >= ele.time);
                renderProgress(coglist);
                renderPrecision(coglist);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {}
    });
}