import numpy as np
from pymongo import MongoClient
import time
import datetime
import json
import redis
from collections import defaultdict

mongo_ip = "162.105.89.173"
mongo_port = 27017

redis_cli = redis.Redis(host=mongo_ip)

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw
round_id = 437

Cogs = list(db['cogs'].find({'round_id': round_id}))

hint_edges = set()
user_edges = set()

last_time = None

for i, cog in enumerate(Cogs):
	print(i + 1, cog['time'], datetime.datetime.fromtimestamp(float(cog['time']) // 1000), cog['correctLinks'], cog['correctHints'])
	last_time = float(cog['time'])
	if 'hints' in cog and cog['hints']:
		hints = cog['hints']
		for i in range(len(hints)):
			if hints[i][1] != -1 and i == hints[hints[i][1]][3]:
				e = '%dL-R%d' % (i, hints[i][1])
				hint_edges.add(e)
			if hints[i][3] != -1 and i == hints[hints[i][3]][1]:
				e = '%dL-R%d' % (hints[i][3], i)
				hint_edges.add(e)
			if hints[i][2] != -1 and i == hints[hints[i][2]][0]:
				e = '%dT-B%d' % (i, hints[i][2])
				hint_edges.add(e)
			if hints[i][0] != -1 and i == hints[hints[i][0]][2]:
				e = '%dT-B%d' % (hints[i][0], i)
				hint_edges.add(e)
	user_edges.update(set(cog['edges_saved'].keys()))
	print(hint_edges - user_edges)
	print('---------------------')

Actions = list(db['actions'].find({'round_id': round_id}))
user_edges_map = defaultdict(set)

last_i = None
for i, a in enumerate(Actions):
	if float(a['time']) > last_time:
		break
	last_i = i

print(i)
