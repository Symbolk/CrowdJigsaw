from pymongo import MongoClient
from functools import reduce
from collections import defaultdict
import time
import json


def get_negative_recall(round_id, winner):
    actions = list(db['actions'].find({'round_id': round_id, 'player_name': winner}))
    edge_set = set()
    cog_itr = db['cogs'].find({'round_id': round_id})
    cog_list = []
    recall_count = 0
    total_count = 0
    actions.sort(key=lambda dd: dd['time'])
    for a_iter, a in enumerate(actions):
        if not a_iter % 10:
            print(a_iter)
        for e, d in a['links_size'].items():
            if d['size'] > 0:
                edge_set.add(e)
            else:
                if e in edge_set:
                    edge_set.remove(e)
        if not a['is_hint']:
            continue
        for cog in cog_itr:
            cog_list.append(cog)
            if cog['time'] > a['time']:
                break
        cog = cog_list[-2]
        error_set = set()
        for e, d in cog['edges_saved'].items():
            wp, wn = float(d['wp']), float(d['wn'])
            if not (wp + wn) or wp / (wp + wn) > 0.5:
                continue
            error_set.add(e)
        for e in edge_set:
            l, r = e.split('-')
            x, tag, y = int(l[:-1]), 'LR' if r[0] == 'R' else 'TB', int(r[1:])
            if tag == 'LR':
                if not (y % 10 and x + 1 == y):
                    total_count += 1
                    if e in error_set:
                        recall_count += 1
            else:
                if not (x + 10 == y):
                    total_count += 1
                    if e in error_set:
                        recall_count += 1
    return recall_count, total_count, (recall_count / total_count) if total_count else 1


def get_negative_precision(round_id, winner):
    actions = list(db['actions'].find({'round_id': round_id, 'player_name': winner}))
    edge_set = set()
    cog_itr = db['cogs'].find({'round_id': round_id})
    cog_list = []
    feedback_count = 0
    correct_count = 0
    actions.sort(key=lambda dd: dd['time'])
    for a in actions:
        for e, d in a['links_size'].items():
            if d['size'] > 0:
                edge_set.add(e)
            else:
                if e in edge_set:
                    edge_set.remove(e)
        if not a['is_hint']:
            continue
        for cog in cog_itr:
            cog_list.append(cog)
            if cog['time'] > a['time']:
                break
        cog = cog_list[-2]
        for e, d in cog['edges_saved'].items():
            wp, wn = float(d['wp']), float(d['wn'])
            if not (wp + wn) or wp / (wp + wn) > 0.5:
                continue
            if e in edge_set:
                feedback_count += 1
                l, r = e.split('-')
                x, tag, y = int(l[:-1]), 'LR' if r[0] == 'R' else 'TB', int(r[1:])
                if tag == 'LR':
                    if y % 10 and x + 1 == y:
                        correct_count += 1
                else:
                    if x + 10 == y:
                        correct_count += 1
    return correct_count, feedback_count, ((feedback_count - correct_count) / feedback_count) if feedback_count else 1


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
    'round_id': {'$lt': 500},
    'official': True,
    'algorithm': 'central',
    'solved_players': {'$gt': 1},
}))
print([r['round_id'] for r in official_rounds])

with open('negative_feedback.csv', 'w+') as f:
    f.write("img,round_id,players_num,solve_time,hit_error,total_error,recall\n")
    ga_rounds = dict()
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
        print(round_id, records[0]['username'], records[1]['username'] if len(records) > 1 else '')
        winner = records[1] if len(records) > 1 and records[0]['username'].startswith('GeneticAlgorithm') else records[0]
        players_num = len(set(record['username'] for record in records if int(record['steps']) > 10))
        r['winner'] = winner
        ga_rounds[round_id] = r
        correct, total, precision = get_negative_precision(round_id, winner['username'])
        output = '%s,%s,%s,%s,%d,%d,%f' % (img, round_id, players_num, winner['solve_time'],
                                             correct, total, precision)
        print(output)
        f.write('%s\n' % output)

