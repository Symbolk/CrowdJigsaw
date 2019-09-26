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
