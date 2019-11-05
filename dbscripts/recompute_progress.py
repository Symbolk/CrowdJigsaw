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

	time_map = defaultdict(lambda: {
		'hint_edges': set(),
		'user_edges': defaultdict(int),
		'ga_edges': set(),
	})

	time_arr = []

	for c in cogs:
		time = float(c['time']) // 1000
		if 'ga_edges' in c and c['ga_edges']:
			time_map[time]['ga_edges'] |= set(c['ga_edges'])

		if 'edges_saved' in c and c['edges_saved']:
			if time_arr and time != time_arr[-1]:
				for e, sLen in time_map[time_arr[-1]]['user_edges'].items():
					time_map[time]['user_edges'][e] = int(sLen)
			for e, edge in c['edges_saved'].items():
				if float(edge['wp']) <= 0:
					if e in time_map[time]['user_edges']:
						del time_map[time]['user_edges'][e]
					continue
				time_map[time]['user_edges'][e] = int(edge['sLen'])

		if 'hints' in c and c['hints']:
			hints = c['hints']
			for i in range(len(hints)):
				if hints[i][1] != -1 and i == hints[hints[i][1]][3]:
					e = '%dL-R%d' % (i, hints[i][1])
					time_map[time]['hint_edges'].add(e)
				if hints[i][3] != -1 and i == hints[hints[i][3]][1]:
					e = '%dL-R%d' % (hints[i][3], i)
					time_map[time]['hint_edges'].add(e)
				if hints[i][2] != -1 and i == hints[hints[i][2]][0]:
					e = '%dT-B%d' % (i, hints[i][2])
					time_map[time]['hint_edges'].add(e)
				if hints[i][0] != -1 and i == hints[hints[i][0]][2]:
					e = '%dT-B%d' % (hints[i][0], i)
					time_map[time]['hint_edges'].add(e)
		if not time_arr or time != time_arr[-1]:
			time_arr.append(time)

	for t in time_arr:
		print(t, time_map[t]['hint_edges'] - set(time_map[t]['user_edges'].keys()))
		correctLinks = 0
		completeLinks = 0
		correctHints = 0
		totalHints = 0
		allPlayersTotalLinks = 0
		allPlayersCorrectLinks = 0
		gaLinks = 0
		gaCorrectLinks = 0

		ga_edges, user_edges, hint_edges = time_map[t]['ga_edges'], time_map[t]['user_edges'], time_map[t]['hint_edges']
		gaLinks = len(ga_edges)
		for e in ga_edges:
			l, r = e.split('-')
			x, tag, y = int(l[:-1]), 'L-R' if r[0] == 'R' else 'T-B', int(r[1:])
			if tag == 'L-R' and x + 1 == y and y % tilesPerRow != 0:
				gaCorrectLinks += 1
			if tag == 'T-B' and x + tilesPerColumn == y:
				gaCorrectLinks += 1
		
		totalHints = len(hint_edges)
		for e in hint_edges:
			l, r = e.split('-')
			x, tag, y = int(l[:-1]), 'L-R' if r[0] == 'R' else 'T-B', int(r[1:])
			if tag == 'L-R' and x + 1 == y and y % tilesPerRow != 0:
				correctHints += 1
			if tag == 'T-B' and x + tilesPerColumn == y:
				correctHints += 1

		completeLinks = len(user_edges)
		for e, sLen in user_edges.items():
			l, r = e.split('-')
			x, tag, y = int(l[:-1]), 'L-R' if r[0] == 'R' else 'T-B', int(r[1:])
			allPlayersTotalLinks += sLen
			if tag == 'L-R' and x + 1 == y and y % tilesPerRow != 0:
				correctLinks += 1
				allPlayersCorrectLinks += sLen
			if tag == 'T-B' and x + tilesPerColumn == y:
				correctLinks += 1
				allPlayersCorrectLinks += sLen

		totalLinks = 2 * tilesPerColumn * tilesPerRow - tilesPerColumn - tilesPerRow

		last_json = redis_cli.lindex(redis_key, -1)
		if last_json:
			last_cog = json.loads(last_json)
			if last_cog['correctHints'] >= correctHints and last_cog['correctLinks'] >= correctLinks and last_cog['completeLinks'] >= completeLinks:
				continue
		cog_json = json.dumps({
			'time': t * 1000,
            'correctHints': correctHints,
            'totalHints': totalHints,
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
