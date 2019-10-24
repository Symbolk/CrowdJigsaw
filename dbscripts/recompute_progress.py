import numpy as np
from pymongo import MongoClient
import time
import datetime
import json
import redis

mongo_ip = "162.105.89.173"
mongo_port = 27017

redis_cli = redis.Redis(host=mongo_ip)

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

rounds = list(db['rounds'].find())

round_cog_backup = {}

for r in rounds:
	round_id = r['round_id']
	tilesPerColumn = r['tilesPerColumn']
	tilesPerRow = r['tilesPerRow']
	totalLinks = 2 * tilesPerColumn * tilesPerRow - tilesPerColumn - tilesPerRow
	cogs = list(db['cogs'].find({'round_id': round_id}))
	redis_key = 'round:%d:coglist' % round_id
	redis_cli.delete(redis_key)
	push_count = 0
	for c in cogs:
		if 'edges_saved' not in c:
			continue
		correctLinks = 0
		completeLinks = 0
		correctHints = 0
		if 'hints' in c and c['hints']:
			hints = c['hints']
			for i in range(len(hints)):
				if i % tilesPerRow < tilesPerRow - 1 and i + 1 == hints[i][1] and i == hints[i+1][3]:
					correctHints += 1
				if i < (tilesPerColumn - 1) * tilesPerRow and i + tilesPerRow == hints[i][2] and i == hints[i + tilesPerRow][0]:
					correctHints += 1
		for e, edge in c['edges_saved'].items():
			if 'sLen' not in edge or edge['sLen'] <= 0:
				continue
			l, r = e.split('-')
			x, tag, y = int(l[:-1]), 'L-R' if r[0] == 'R' else 'T-B', int(r[1:])
			completeLinks += 1
			if tag == 'L-R' and x + 1 == y and y % tilesPerRow != 0:
				correctLinks += 1
			if tag == 'T-B' and x + tilesPerColumn == y:
				correctLinks += 1
		#db['cogs'].update_one({'round_id': round_id, 'time':c['time']},
			#{ "$set":{'correctLinks': correctLinks, 'correctHints': correctHints, 'completeLinks': completeLinks,'totalLinks': totalLinks}})
		last_json = redis_cli.lindex(redis_key, -1)
		if last_json:
			last_cog = json.loads(last_json)
			if last_cog['correctHints'] >= correctHints and last_cog['correctLinks'] >= correctLinks and last_cog['completeLinks'] >= completeLinks:
				continue
		cog_json = json.dumps({
			'time': int(c['time']),
            'correctHints': correctHints,
            'correctLinks': correctLinks,
            'completeLinks': completeLinks,
            'totalLinks': totalLinks,
		})
		redis_cli.rpush(redis_key, cog_json)
		push_count += 1
	print(round_id, len(cogs), push_count)