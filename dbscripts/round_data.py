from pymongo import MongoClient
from functools import reduce
from collections import defaultdict
import time
import json


def parse_time(time_str, join_time, start_time, end_time):
    join_time = int(time.mktime(time.strptime(':'.join(join_time.split(':')[:-1]), '%Y-%m-%d %H:%M:%S'))) \
        if join_time else None
    start_time = int(start_time) // 1000 if start_time else None
    end_time = int(time.mktime(time.strptime(':'.join(end_time.split(':')[:-1]), '%Y-%m-%d %H:%M:%S')))
    return min(reduce(lambda t1, t2: 60 * t1 + t2, map(int, time_str.split(':'))),
               end_time - start_time if start_time else (end_time - join_time if join_time else None))


def get_solve_time(record):
    return parse_time(record['time'], record['join_time'] if 'join_time' in record else None,record['start_time'],
                      record['end_time'])


mongo_ip = "162.105.89.173"
mongo_port = 27017

client = MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

official_rounds = list(db["rounds"].find({
    'official': True,
    'algorithm': 'central',
    'solved_players': {'$gt': 1},
}))
print([r['round_id'] for r in official_rounds])

for r in official_rounds:
    round_id = r['round_id']
    tpr, tpc = int(r['tilesPerRow']), int(r['tilesPerColumn'])
    if tpr < 10 and tpc < 10:
        continue
    img = r['image'].split('/')[-1].split('_')[0]
    records = list(db['records'].find({'round_id': round_id, 'end_time': {'$ne': '-1'}}))
    if not records:
        continue
    has_genetic = False
    for rr in records:
        if rr['username'].startswith('GeneticAlgorithm'):
            has_genetic = True
        rr['solve_time'] = get_solve_time(rr)
    if not has_genetic:
        continue
    records.sort(key=lambda r: r['solve_time'])
    with open('round/%d.json' % round_id, 'w+') as f:
        if '_id' in r:
            del r['_id']
        f.write('%s\n' % json.dumps(r))
        for rr in records:
            if '_id' in rr:
                del rr['_id']
            f.write('%s\n' % json.dumps(rr))


