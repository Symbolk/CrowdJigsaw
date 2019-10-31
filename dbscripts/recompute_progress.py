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

rounds = list(db['rounds'].find({'round_id': {'$gt': 409}}))

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
		totalHints = 0
		allPlayersTotalLinks = 0
		allPlayersCorrectLinks = 0
		gaLinks = 0
		gaCorrectLinks = 0
		if 'ga_edges' in c and c['ga_edges']:
			ga_edges = c['ga_edges']
			gaLinks = len(ga_edges)
			for e in ga_edges:
				l, r = e.split('-')
				x, tag, y = int(l[:-1]), 'L-R' if r[0] == 'R' else 'T-B', int(r[1:])
				if tag == 'L-R' and x + 1 == y and y % tilesPerRow != 0:
					gaCorrectLinks += 1
				if tag == 'T-B' and x + tilesPerColumn == y:
					gaCorrectLinks += 1
		if 'hints' in c and c['hints']:
			hints = c['hints']
			for i in range(len(hints)):
				if i % tilesPerRow < tilesPerRow - 1 and i + 1 == hints[i][1] and i == hints[i+1][3]:
					correctHints += 1
					e = '%dL-R%d' % (i, i + 1)
				if i < (tilesPerColumn - 1) * tilesPerRow and i + tilesPerRow == hints[i][2] and i == hints[i + tilesPerRow][0]:
					correctHints += 1
					e = '%dT-B%d' % (i, i + tilesPerRow)
				for d in range(4):
					if hints[i][d] >= 0:
						totalHints += 1
		for e, edge in c['edges_saved'].items():
			if float(edge['wp']) <= 0:
				continue
			slen = int(edge['sLen'])
			allPlayersTotalLinks += slen
			l, r = e.split('-')
			x, tag, y = int(l[:-1]), 'L-R' if r[0] == 'R' else 'T-B', int(r[1:])
			completeLinks += 1
			if tag == 'L-R' and x + 1 == y and y % tilesPerRow != 0:
				correctLinks += 1
				allPlayersCorrectLinks += slen
			if tag == 'T-B' and x + tilesPerColumn == y:
				correctLinks += 1
				allPlayersCorrectLinks += slen
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
            'totalHints': totalHints / 2,
            'correctLinks': correctLinks,
            'completeLinks': completeLinks,
            'totalLinks': totalLinks,
            'allPlayersTotalLinks': allPlayersTotalLinks,
            'allPlayersCorrectLinks': allPlayersCorrectLinks,
            'gaLinks': gaLinks,
            'gaCorrectLinks': gaCorrectLinks,
		})
		redis_cli.rpush(redis_key, cog_json)
		push_count += 1
	print(round_id, len(cogs), push_count)