from pymongo import MongoClient
from functools import reduce
from collections import defaultdict
import time
import json


mongo_ip = "162.105.89.173"
mongo_port = 27017
client = MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw
N = 1000
ga_rounds = []
with open('positive_feedback.csv') as f:
    lines = f.readlines()
    for l in lines[1:-1]:
        img, round_id, players_num, solve_time, _, _, _ = l.split(',')
        ga_rounds.append((img, round_id, players_num, solve_time))


def correct_count(edges):
    c = 0
    for e in edges:
        l, r = e.split('-')
        x, tag, y = int(l[:-1]), 'LR' if r[0] == 'R' else 'TB', int(r[1:])
        if tag == 'LR':
            if y % 10 and x + 1 == y:
                c += 1
        else:
            if x + 10 == y:
                c += 1
    return c


def get_p_r(round_id):
    print(round_id)
    cog_list = list(db['cogs'].find({'round_id': round_id}))
    cog_json = []
    with open('integration/%d.csv' % round_id, 'w+') as f:
        f.write('time,correct_in_cog,total_in_cog,correct_in_ga,total_in_ga,correct_in_hints,total_in_hints\n')
        for cog in cog_list:
            cog_edges = set(cog['edges_saved'].keys())
            ga_edges = set(cog['ga_edges'] if cog['ga_edges'] else [])
            hint_edges = set()
            hints = cog['hints']
            for x in range(100):
                for d in range(4):
                    rev_d = (4 - d) if d % 2 else (2 - d)
                    y = int(hints[x][d])
                    if y >= 0 and hints[y][rev_d] == x:
                        tag = 'L-R' if d % 2 else 'T-B'
                        _x, _y = (x, y) if d in (1, 2) else (y, x)
                        hint_edges.add('%d%s%d' % (_x, tag, _y))
            total_in_cog, total_in_ga, total_in_hints = len(cog_edges), len(ga_edges), len(hint_edges)
            correct_in_cog, correct_in_ga, correct_in_hints = correct_count(cog_edges), correct_count(ga_edges), correct_count(hint_edges)
            f.write('%f,%d,%d,%d,%d,%d,%d\n' % (cog['time'], correct_in_cog, total_in_cog, correct_in_ga, total_in_ga,
                                                correct_in_hints, total_in_hints))
            cog_json.append({
                'time': cog['time'],
                'cog_edges': list(cog_edges),
                'ga_edges': list(ga_edges),
                'hint_edges': list(hint_edges)
            })
    with open('integration/%d.json' % round_id, 'w+') as f:
        for cog in cog_json:
            f.write('%s\n' % json.dumps(cog))

for img, round_id, players_num, solve_time in ga_rounds:
    get_p_r(int(round_id))
