from pymongo import MongoClient
from functools import reduce
from collections import defaultdict
import time


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

image_map = defaultdict(list)

with open('positive_feedback.csv', 'w+') as f:
    f.write("img,round_id,players_num,solve_time,hint_ratio_by_links,hint_ratio_by_steps,hint_precision\n")
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
        for r in records:
            if r['username'].startswith('GeneticAlgorithm'):
                has_genetic = True
            r['solve_time'] = get_solve_time(r)
        if not has_genetic:
            continue
        records.sort(key=lambda r: r['solve_time'])
        print(round_id, records[0]['username'], records[1]['username'] if len(records) > 1 else '')
        winner = records[1] if len(records) > 1 and records[0]['username'].startswith('GeneticAlgorithm') else records[0]
        players_num = len(set(record['username'] for record in records if int(record['steps']) > 10))
        r['players_num'] = players_num
        image_map[img].append(r)
        hinted_links, total_links = int(winner['hinted_links']),int(winner['total_links'])
        hinted_steps, total_steps = int(winner['hinted_steps']), int(winner['total_steps'])
        correct_hints, total_hints = int(winner['correct_hints']), int(winner['total_hints'])
        hint_ratio_by_links = (hinted_links / total_links) if total_links else 0
        hint_ratio_by_steps = (hinted_steps / total_steps) if total_steps else 0
        hint_precision = (correct_hints / total_hints) if total_hints else 0

        f.write('%s,%s,%s,%s,%f,%f,%f\n' %
                (img, round_id, players_num, winner['solve_time'],
                 hint_ratio_by_links, hint_ratio_by_steps, hint_precision))

