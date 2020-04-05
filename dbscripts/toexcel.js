var xlsx = require('node-xlsx');
var fs = require('fs');

var raw = [
    {
        "group_size": 1,
        "puzzle_size": 4,
        "average_time": "108.125",
        "average_steps": "21.750",
        "average_hint_ratio": "0.00000",
        "average_hint_precision": "0.00000"
    },
    {
        "group_size": 1,
        "puzzle_size": 5,
        "average_time": "191.500",
        "average_steps": "37.750",
        "average_hint_ratio": "0.00000",
        "average_hint_precision": "0.00000"
    },
    {
        "group_size": 1,
        "puzzle_size": 6,
        "average_time": "244.667",
        "average_steps": "50.667",
        "average_hint_ratio": "0.00000",
        "average_hint_precision": "0.00000"
    },
    {
        "group_size": 1,
        "puzzle_size": 7,
        "average_time": "286.167",
        "average_steps": "60.500",
        "average_hint_ratio": "0.00000",
        "average_hint_precision": "0.00000"
    },
    {
        "group_size": 1,
        "puzzle_size": 8,
        "average_time": "575.167",
        "average_steps": "99.333",
        "average_hint_ratio": "0.00000",
        "average_hint_precision": "0.00000"
    },
    {
        "group_size": 1,
        "puzzle_size": 9,
        "average_time": "821.000",
        "average_steps": "113.167",
        "average_hint_ratio": "0.00000",
        "average_hint_precision": "0.00000"
    },
    {
        "group_size": 1,
        "puzzle_size": 10,
        "average_time": "1432.000",
        "average_steps": "170.000",
        "average_hint_ratio": "0.00635",
        "average_hint_precision": "0.14286"
    },
    {
        "group_size": 2,
        "puzzle_size": 4,
        "average_time": "79.000",
        "average_steps": "11.500",
        "average_hint_ratio": "0.37500",
        "average_hint_precision": "1.00000"
    },
    {
        "group_size": 2,
        "puzzle_size": 5,
        "average_time": "186.500",
        "average_steps": "19.500",
        "average_hint_ratio": "0.32500",
        "average_hint_precision": "0.70000"
    },
    {
        "group_size": 2,
        "puzzle_size": 6,
        "average_time": "129.000",
        "average_steps": "28.000",
        "average_hint_ratio": "0.23333",
        "average_hint_precision": "1.00000"
    },
    {
        "group_size": 2,
        "puzzle_size": 7,
        "average_time": "664.000",
        "average_steps": "74.000",
        "average_hint_ratio": "0.13095",
        "average_hint_precision": "0.53333"
    },
    {
        "group_size": 2,
        "puzzle_size": 8,
        "average_time": "583.000",
        "average_steps": "71.000",
        "average_hint_ratio": "0.25000",
        "average_hint_precision": "0.85000"
    },
    {
        "group_size": 2,
        "puzzle_size": 9,
        "average_time": "960.000",
        "average_steps": "121.000",
        "average_hint_ratio": "0.29861",
        "average_hint_precision": "0.63889"
    },
    {
        "group_size": 2,
        "puzzle_size": 10,
        "average_time": "1433.000",
        "average_steps": "118.000",
        "average_hint_ratio": "0.07222",
        "average_hint_precision": "0.88889"
    },
    {
        "group_size": 3,
        "puzzle_size": 4,
        "average_time": "56.750",
        "average_steps": "14.500",
        "average_hint_ratio": "0.25000",
        "average_hint_precision": "1.00000"
    },
    {
        "group_size": 3,
        "puzzle_size": 5,
        "average_time": "126.000",
        "average_steps": "21.000",
        "average_hint_ratio": "0.35000",
        "average_hint_precision": "0.94118"
    },
    {
        "group_size": 3,
        "puzzle_size": 6,
        "average_time": "242.000",
        "average_steps": "36.000",
        "average_hint_ratio": "0.25833",
        "average_hint_precision": "0.91288"
    },
    {
        "group_size": 3,
        "puzzle_size": 7,
        "average_time": "391.667",
        "average_steps": "67.333",
        "average_hint_ratio": "0.22024",
        "average_hint_precision": "0.55988"
    },
    {
        "group_size": 3,
        "puzzle_size": 8,
        "average_time": "326.000",
        "average_steps": "58.000",
        "average_hint_ratio": "0.34821",
        "average_hint_precision": "1.00000"
    },
    {
        "group_size": 3,
        "puzzle_size": 9,
        "average_time": "822.000",
        "average_steps": "65.000",
        "average_hint_ratio": "0.28472",
        "average_hint_precision": "0.79412"
    },
    {
        "group_size": 3,
        "puzzle_size": 10,
        "average_time": "842.500",
        "average_steps": "123.500",
        "average_hint_ratio": "0.32778",
        "average_hint_precision": "0.90054"
    },
    {
        "group_size": 4,
        "puzzle_size": 4,
        "average_time": "54.000",
        "average_steps": "13.000",
        "average_hint_ratio": "0.33333",
        "average_hint_precision": "1.00000"
    },
    {
        "group_size": 4,
        "puzzle_size": 5,
        "average_time": "80.000",
        "average_steps": "18.000",
        "average_hint_ratio": "0.43750",
        "average_hint_precision": "0.78214"
    },
    {
        "group_size": 4,
        "puzzle_size": 6,
        "average_time": "203.500",
        "average_steps": "44.500",
        "average_hint_ratio": "0.35833",
        "average_hint_precision": "0.85000"
    },
    {
        "group_size": 4,
        "puzzle_size": 7,
        "average_time": "164.000",
        "average_steps": "29.000",
        "average_hint_ratio": "0.55952",
        "average_hint_precision": "0.96296"
    },
    {
        "group_size": 4,
        "puzzle_size": 8,
        "average_time": "215.000",
        "average_steps": "38.000",
        "average_hint_ratio": "0.47321",
        "average_hint_precision": "0.97059"
    },
    {
        "group_size": 4,
        "puzzle_size": 9,
        "average_time": "492.000",
        "average_steps": "76.000",
        "average_hint_ratio": "0.40972",
        "average_hint_precision": "0.91429"
    },
    {
        "group_size": 4,
        "puzzle_size": 10,
        "average_time": "516.000",
        "average_steps": "79.000",
        "average_hint_ratio": "0.42778",
        "average_hint_precision": "0.94845"
    },
    {
        "group_size": 5,
        "puzzle_size": 4,
        "average_time": "40.000",
        "average_steps": "10.000",
        "average_hint_ratio": "0.33333",
        "average_hint_precision": "1.00000"
    },
    {
        "group_size": 5,
        "puzzle_size": 5,
        "average_time": "131.000",
        "average_steps": "14.000",
        "average_hint_ratio": "0.52500",
        "average_hint_precision": "0.88889"
    },
    {
        "group_size": 5,
        "puzzle_size": 6,
        "average_time": "150.500",
        "average_steps": "31.000",
        "average_hint_ratio": "0.50000",
        "average_hint_precision": "0.87500"
    },
    {
        "group_size": 5,
        "puzzle_size": 7,
        "average_time": "172.000",
        "average_steps": "39.000",
        "average_hint_ratio": "0.57143",
        "average_hint_precision": "0.96552"
    },
    {
        "group_size": 5,
        "puzzle_size": 8,
        "average_time": "343.333",
        "average_steps": "53.667",
        "average_hint_ratio": "0.43155",
        "average_hint_precision": "0.66157"
    },
    {
        "group_size": 5,
        "puzzle_size": 9,
        "average_time": "507.000",
        "average_steps": "90.000",
        "average_hint_ratio": "0.50694",
        "average_hint_precision": "0.82357"
    },
    {
        "group_size": 5,
        "puzzle_size": 10,
        "average_time": "539.000",
        "average_steps": "81.000",
        "average_hint_ratio": "0.32778",
        "average_hint_precision": "0.85417"
    },
    {
        "group_size": 6,
        "puzzle_size": 4,
        "average_time": "52.000",
        "average_steps": "12.000",
        "average_hint_ratio": "0.41667",
        "average_hint_precision": "0.85714"
    },
    {
        "group_size": 6,
        "puzzle_size": 5,
        "average_time": "68.000",
        "average_steps": "25.000",
        "average_hint_ratio": "0.50000",
        "average_hint_precision": "0.84615"
    },
    {
        "group_size": 6,
        "puzzle_size": 6,
        "average_time": "171.000",
        "average_steps": "36.500",
        "average_hint_ratio": "0.44167",
        "average_hint_precision": "0.77262"
    },
    {
        "group_size": 6,
        "puzzle_size": 7,
        "average_time": "216.000",
        "average_steps": "66.000",
        "average_hint_ratio": "0.58333",
        "average_hint_precision": "0.96552"
    },
    {
        "group_size": 6,
        "puzzle_size": 8,
        "average_time": "368.000",
        "average_steps": "82.000",
        "average_hint_ratio": "0.33929",
        "average_hint_precision": "0.70588"
    },
    {
        "group_size": 6,
        "puzzle_size": 9,
        "average_time": "539.000",
        "average_steps": "35.000",
        "average_hint_ratio": "0.64583",
        "average_hint_precision": "0.96667"
    },
    {
        "group_size": 6,
        "puzzle_size": 10,
        "average_time": "741.000",
        "average_steps": "67.000",
        "average_hint_ratio": "0.53333",
        "average_hint_precision": "0.96053"
    },
    {
        "group_size": 7,
        "puzzle_size": 4,
        "average_time": "46.500",
        "average_steps": "11.500",
        "average_hint_ratio": "0.47917",
        "average_hint_precision": "0.78409"
    },
    {
        "group_size": 7,
        "puzzle_size": 5,
        "average_time": "53.000",
        "average_steps": "21.000",
        "average_hint_ratio": "0.60000",
        "average_hint_precision": "1.00000"
    },
    {
        "group_size": 7,
        "puzzle_size": 6,
        "average_time": "144.000",
        "average_steps": "21.000",
        "average_hint_ratio": "0.51667",
        "average_hint_precision": "0.84000"
    },
    {
        "group_size": 7,
        "puzzle_size": 7,
        "average_time": "164.000",
        "average_steps": "33.000",
        "average_hint_ratio": "0.61905",
        "average_hint_precision": "0.80000"
    },
    {
        "group_size": 7,
        "puzzle_size": 8,
        "average_time": "238.000",
        "average_steps": "58.000",
        "average_hint_ratio": "0.49554",
        "average_hint_precision": "0.80624"
    },
    {
        "group_size": 7,
        "puzzle_size": 9,
        "average_time": "475.000",
        "average_steps": "74.000",
        "average_hint_ratio": "0.58333",
        "average_hint_precision": "0.94898"
    },
    {
        "group_size": 7,
        "puzzle_size": 10,
        "average_time": "355.000",
        "average_steps": "92.000",
        "average_hint_ratio": "0.54444",
        "average_hint_precision": "0.95313"
    },
    {
        "group_size": 8,
        "puzzle_size": 4,
        "average_time": "50.000",
        "average_steps": "10.000",
        "average_hint_ratio": "0.33333",
        "average_hint_precision": "0.85714"
    },
    {
        "group_size": 8,
        "puzzle_size": 5,
        "average_time": "93.500",
        "average_steps": "24.500",
        "average_hint_ratio": "0.21250",
        "average_hint_precision": "0.68750"
    },
    {
        "group_size": 8,
        "puzzle_size": 6,
        "average_time": "285.000",
        "average_steps": "20.000",
        "average_hint_ratio": "0.55833",
        "average_hint_precision": "0.81081"
    },
    {
        "group_size": 8,
        "puzzle_size": 7,
        "average_time": "236.000",
        "average_steps": "71.000",
        "average_hint_ratio": "0.34524",
        "average_hint_precision": "0.75000"
    },
    {
        "group_size": 8,
        "puzzle_size": 8,
        "average_time": "325.000",
        "average_steps": "90.000",
        "average_hint_ratio": "0.42857",
        "average_hint_precision": "0.93478"
    },
    {
        "group_size": 8,
        "puzzle_size": 9,
        "average_time": "277.000",
        "average_steps": "42.000",
        "average_hint_ratio": "0.65972",
        "average_hint_precision": "0.86842"
    },
    {
        "group_size": 8,
        "puzzle_size": 10,
        "average_time": "654.000",
        "average_steps": "52.000",
        "average_hint_ratio": "0.67778",
        "average_hint_precision": "0.97436"
    },
    {
        "group_size": 9,
        "puzzle_size": 4,
        "average_time": "50.000",
        "average_steps": "14.000",
        "average_hint_ratio": "0.20833",
        "average_hint_precision": "0.62500"
    },
    {
        "group_size": 9,
        "puzzle_size": 5,
        "average_time": "104.500",
        "average_steps": "28.500",
        "average_hint_ratio": "0.40000",
        "average_hint_precision": "0.87857"
    },
    {
        "group_size": 9,
        "puzzle_size": 6,
        "average_time": "165.000",
        "average_steps": "22.000",
        "average_hint_ratio": "0.33333",
        "average_hint_precision": "0.87500"
    },
    {
        "group_size": 9,
        "puzzle_size": 7,
        "average_time": "181.000",
        "average_steps": "30.000",
        "average_hint_ratio": "0.69048",
        "average_hint_precision": "0.94444"
    },
    {
        "group_size": 9,
        "puzzle_size": 8,
        "average_time": "293.000",
        "average_steps": "41.000",
        "average_hint_ratio": "0.62500",
        "average_hint_precision": "0.84906"
    },
    {
        "group_size": 9,
        "puzzle_size": 9,
        "average_time": "393.000",
        "average_steps": "32.000",
        "average_hint_ratio": "0.70833",
        "average_hint_precision": "0.98551"
    },
    {
        "group_size": 9,
        "puzzle_size": 10,
        "average_time": "490.000",
        "average_steps": "79.000",
        "average_hint_ratio": "0.22778",
        "average_hint_precision": "0.75610"
    },
    {
        "group_size": 10,
        "puzzle_size": 4,
        "average_time": "37.667",
        "average_steps": "11.667",
        "average_hint_ratio": "0.38611",
        "average_hint_precision": "0.76243"
    },
    {
        "group_size": 10,
        "puzzle_size": 5,
        "average_time": "64.833",
        "average_steps": "16.167",
        "average_hint_ratio": "0.49306",
        "average_hint_precision": "0.84615"
    },
    {
        "group_size": 10,
        "puzzle_size": 6,
        "average_time": "76.800",
        "average_steps": "18.600",
        "average_hint_ratio": "0.60333",
        "average_hint_precision": "0.97231"
    },
    {
        "group_size": 10,
        "puzzle_size": 7,
        "average_time": "177.400",
        "average_steps": "26.800",
        "average_hint_ratio": "0.64048",
        "average_hint_precision": "0.90661"
    },
    {
        "group_size": 10,
        "puzzle_size": 8,
        "average_time": "211.200",
        "average_steps": "29.800",
        "average_hint_ratio": "0.61429",
        "average_hint_precision": "0.92856"
    },
    {
        "group_size": 10,
        "puzzle_size": 9,
        "average_time": "311.800",
        "average_steps": "57.600",
        "average_hint_ratio": "0.52083",
        "average_hint_precision": "0.88560"
    },
    {
        "group_size": 10,
        "puzzle_size": 10,
        "average_time": "492.714",
        "average_steps": "87.571",
        "average_hint_ratio": "0.42817",
        "average_hint_precision": "0.87358"
    }
];
var hint_ratios = new Array();
hint_ratios.push([
    'gs&ps',
    '4x4',
    '5x5',
    '6x6',
    '7x7',
    '8x8',
    '9x9',
    '10x10'
]);
var hint_precisions = new Array();
hint_precisions.push([
    'gs&ps',
    '4x4',
    '5x5',
    '6x6',
    '7x7',
    '8x8',
    '9x9',
    '10x10'
]);
var avg_time = new Array();
avg_time.push([
    'gs&ps',
    '4x4',
    '5x5',
    '6x6',
    '7x7',
    '8x8',
    '9x9',
    '10x10'
]);
var avg_steps = new Array();
avg_steps.push([
    'gs&ps',
    '4x4',
    '5x5',
    '6x6',
    '7x7',
    '8x8',
    '9x9',
    '10x10'
]);


for (let i = 0; i < 10; i++) {
    let temp1 = new Array();
    let temp2 = new Array();
    let temp3 = new Array();
    let temp4 = new Array();

    temp1.push(i + 1);
    temp2.push(i + 1);
    temp3.push(i + 1);
    temp4.push(i + 1);
    for (let j = 0; j < 7; j++) {
        temp1.push(Number(raw[i * 7 + j].average_hint_ratio * 100).toFixed(3) + '%');
        temp2.push(Number(raw[i * 7 + j].average_hint_precision * 100).toFixed(3) + '%');
        temp3.push(Number(raw[i * 7 + j].average_time));
        temp4.push(Number(raw[i * 7 + j].average_steps));
    }
    hint_ratios.push(temp1);
    hint_precisions.push(temp2);
    avg_time.push(temp3);
    avg_steps.push(temp4);
}

var data = [
    {
        name: 'Hint Ratio',
        data: hint_ratios
    },
    {
        name: 'Hint Precision',
        data: hint_precisions
    },
    {
        name: 'Average Time',
        data: avg_time
    },
    {
        name: 'Average Steps',
        data: avg_steps
    }
];
var file = xlsx.build(data);
fs.writeFileSync('results.xlsx', file, 'binary');