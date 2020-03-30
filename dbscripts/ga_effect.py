import os
import json
import time


def parse_time(time_str):
    return int(time.mktime(time.strptime(':'.join(time_str.split(':')[:-1]), '%Y-%m-%d %H:%M:%S')))


correct_edges = set()
for x in range(100):
    if x % 10:
        correct_edges.add('%dL-R%d' % (x - 1, x))
    if x < 90:
        correct_edges.add('%dT-B%d' % (x, x + 10))

round_map = dict()
for r_root, _, r_files in os.walk('round'):
    for fn in r_files:
        if fn.endswith('json'):
            with open(os.path.join(r_root, fn)) as f:
                lines = f.readlines()
                r = json.loads(lines[0])
                rrs = []
                for rr in lines[1:]:
                    rrs.append(json.loads(rr))
                rrs.sort(key=lambda x: x['solve_time'])
                r['records'] = rrs
                round_map[r['round_id']] = r

with open('ga_advance.csv', 'w+') as f:
    f.write('round_id,players,first_man,ga\n')
    for round_id, r in round_map.items():
        players_num = r['players_num']
        first_ga, first_man = None, None
        for rr in r['records']:
            if rr['username'].startswith('GeneticAlgorithm'):
                first_ga = rr['solve_time']
            elif not first_man:
                first_man = rr['solve_time']
            if first_ga and first_man:
                break
        f.write('%d,%d,%d,%d\n' % (round_id, players_num, first_man, first_ga))
