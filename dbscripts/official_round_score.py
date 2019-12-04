import numpy as np
from pymongo import MongoClient
import time
import datetime
import json
from collections import defaultdict

mongo_ip = "162.105.89.173"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

user_map = defaultdict(lambda: {
	'round': set(),
	'score': 0,
	'after_class_score': 0})

official_rounds = list(db["rounds"].find({'official': True, 'round_id': {'$gt': 530}}))
official_round_ids = set(r['round_id'] for r in official_rounds)
round_map = dict()
for r in official_rounds:
	round_map[r['round_id']] = r
#print(official_round_ids)

official_records = db["records"].find()
for record in official_records:
	if record['round_id'] not in official_round_ids:
		continue
	if record['round_id'] not in user_map[record['username']]['round']:
		creator = round_map[record['round_id']]['creator']
		score = record['score']
		if not creator.startswith('wyh'):
			r = round_map[record['round_id']]
			solved_players, rows = r['solved_players'], r['tilesPerRow']
			if solved_players:
				score = 10 * (1.5 if record['username'] == creator else 1) * \
							r['players_num'] * ((rows - 5) / 5)
				user_map[record['username']]['after_class_score'] += score if score > 0 else 0
		user_map[record['username']]['score'] += score if score > 0 else 0
		user_map[record['username']]['round'].add(record['round_id'])

all_users = list(db['users'].find())
for user in all_users:
	username = user['username']
	round_attend, total_score, after_class_score = (len(user_map[username]['round']), 
		user_map[username]['score'], user_map[username]['after_class_score']
		) if username in user_map else (0, 0, 0)
	db['users'].update_one(
		{'username': username}, 
		{'$set': {
		'round_attend': round_attend, 
		'total_score': total_score,
		'after_class_score': int(after_class_score)}})


'''
class_map = defaultdict(lambda: {
	'players': set(),
	'score': 0})
for username, data in user_map.items():
	if username[0] != '1' or len(username) != 10 or data['score'] <= 0:
		continue
	class_map[username[:8]]['score'] += data['score']
	class_map[username[:8]]['players'].add(username)
print(class_map)
with open('classscore.csv', 'w+') as f:
	f.write('class_id,attended_players,total_score\n')
	for class_id, data in class_map.items():
		f.write('%s,%s,%s\n' % (class_id, str(len(data['players'])), str(data['score'])))



with open('userscore.csv', 'w+') as f:
	f.write('username,round_attended,total_score\n')
	for username, data in user_map.items():
		round_attended, total_score = len(data['round']), data['score']
		f.write('%s,%s,%s\n' % (username, str(round_attended), str(total_score)))


'''