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


mongo_ip = "162.105.89.173"
mongo_port = 27017

client = MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

official_rounds = list(db["rounds"].find({
    'official': True,
    'algorithm': 'central',
    'solved_players': {'$gt': 0},
}))
print([r['round_id'] for r in official_rounds])

image_map = defaultdict(list)
for r in official_rounds:
    round_id = r['round_id']
    tpr, tpc = int(r['tilesPerRow']), int(r['tilesPerColumn'])
    if tpr < 10 and tpc < 10:
        continue
    img = r['image'].split('/')[-1].split('_')[0]
    records = list(db['records'].find({'round_id': round_id}))
    solve_time = min([parse_time(record['time'], record['join_time'] if 'join_time' in record else None,
                                 record['start_time'], record['end_time'])
                      for record in records if record['time'] != '-1' and record['end_time'] != '-1'])
    players_num = len(set(record['username'] for record in records if int(record['steps']) > 10))
    r['solve_time'] = solve_time
    r['players_num'] = players_num
    image_map[img].append(r)

with open('one_plus_one.csv', 'w+') as f:
    f.write('image,round_id,players,time\n')
    opo = []
    for img, rounds in image_map.items():
        if len(rounds) > 1:
            print('------------------------------')
            print(img)
        rounds.sort(key=lambda x: x['players_num'])
        for r in rounds:
            round_id, solve_time, players_num = r['round_id'], r['solve_time'], r['players_num']
            if len(rounds) > 1:
                print('round_id: %s, solve_time: %s, players_num: %s' %
                      (str(round_id), str(solve_time), str(players_num)))
            f.write('%s,%s,%s,%s\n' % (img, round_id, str(players_num), str(solve_time)))

        opo_img = []
        for i, r1 in enumerate(rounds):
            for j in range(i + 1, len(rounds)):
                r2 = rounds[j]
                t1, t2 = r1['solve_time'], r2['solve_time']
                p1, p2 = r1['players_num'], r2['players_num']
                if t1 < t2 or p1 < 10 or p2 < 10:
                    continue
                opo_img.append(2 * (t1 / t2) / (p2 / p1))
        if opo_img:
            opo.append(sum(opo_img) / len(opo_img))
            print('1 + 1 = %s' % str(opo[-1]))
        f.write(',,,\n')
    if opo:
        print('1 + 1 = %s' % (sum(opo) / len(opo)))
