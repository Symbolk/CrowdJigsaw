import numpy as np
from pymongo import MongoClient
import time
import datetime
import json
from collections import defaultdict

mongo_ip = "162.105.89.243"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
client.admin.authenticate('symbol', 'Saw@PKU_1726')
db = client.CrowdJigsaw

Rounds = db['rounds'].find({'players_num':{'$gte':10}, 'tilesPerRow':{'$gte':7}})

user_records = defaultdict(list)

for R in Rounds:
	if R['round_id'] in (38, 130, 133, 143):
		continue
	r_total_links = R['tilesPerRow'] * (R['tilesPerRow'] - 1) * 2
	if 'winner_time' in R and R['winner_time'] != "-1":
		_, mm, ss = R['winner_time'].split(':')
	else:
		mm, ss = 'null', 'null'
	file_name = 'round_%s_%s_%s_%s.csv' % (R['round_id'], R['tilesPerRow'], mm, ss)
	print('write to', file_name)
	sorted_round = []
	with open(file_name, 'w') as f:
		f.write('username,finish_percent,time,step,hint_ratio,score,\
			create_correct_links,create_wrong_links,remove_correct_links,\
			remove_wrong_links,remove_hinted_wrong_links\n')
		records = db['records'].find({'round_id': R['round_id'], 'time':{'$ne':'-1'}})
		for r in records:
			if r['time'][:2] != '00':
				continue
			finish_percent = ((int(r['total_links']) / 2) / r_total_links) if r_total_links else 0
			hinted_links, total_links = int(r['hinted_links']), int(r['total_links'])
			hint_ratio = hinted_links / total_links if hinted_links else 0
			score = r['score'] if 'score' in r else 0
			create_correct_links = r['create_correct_links'] if 'create_correct_links' in r else 0
			create_wrong_links = r['create_wrong_links'] if 'create_wrong_links' in r else 0
			remove_correct_links = r['remove_correct_links'] if 'remove_correct_links' in r else 0
			remove_wrong_links = r['remove_wrong_links'] if 'remove_wrong_links' in r else 0
			remove_hinted_wrong_links = r['remove_hinted_wrong_links'] if 'remove_hinted_wrong_links' in r else 0
			f.write('%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' % (r['username'], 
				finish_percent, r['time'], r['steps'], hint_ratio, score, 
				create_correct_links, create_wrong_links, remove_correct_links,
				remove_wrong_links, remove_hinted_wrong_links))
			sorted_round.append((r['username'], 
				finish_percent, r['time'], r['steps'], hint_ratio, score, 
				create_correct_links, create_wrong_links, remove_correct_links,
				remove_wrong_links, remove_hinted_wrong_links))
	sorted_round.sort(key=lambda x: (-x[1], x[2], x[5]))
	for rank, ur in enumerate(sorted_round):
		username = ur[0]
		user_records[username].append((rank + 1, R['round_id']) + ur)

for username, data in user_records.items():
	with open('%s_records.csv' % username, 'w') as f:
		f.write('rank,round_id,username,finish_percent,time,step,hint_ratio,score,\
			create_correct_links,create_wrong_links,remove_correct_links,\
			remove_wrong_links,remove_hinted_wrong_links\n')
		for ur in data:
			f.write('%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' % ur)

