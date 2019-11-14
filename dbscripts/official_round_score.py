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

official_rounds = set(r['round_id'] for r in db["rounds"].find({'official': True}))
print(official_rounds)

user_map = defaultdict(lambda: {
	'round': set(),
	'score': 0})
official_records = db["records"].find()
for record in official_records:
	if record['round_id'] not in official_rounds:
		continue
	if record['round_id'] not in user_map[record['username']]['round']:
		user_map[record['username']]['score'] += record['score'] if record['score'] > 0 else 0
		user_map[record['username']]['round'].add(record['round_id'])


print(user_map)
for username, data in user_map.items():
	db['users'].update_one(
		{'username': username}, 
		{'$set': {'round_attend': len(data['round']), 'total_score': data['score']}})


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


