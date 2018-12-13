import numpy as np
from pymongo import MongoClient
import time
import datetime
import json

mongo_ip = "localhost"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

round = list(db['rounds'].find({'round_id':11}))[-1]
diffs = list(db['diffs'].find({'round_id':11}))

rows, cols = round['tilesPerRow'], round['tilesPerColumn']

with open('diff_result_9.csv', 'w') as f:
	f.write('time,edges_in_ga,edges_in_cog,create,correct,wrong\n')
	for diff in diffs:
		ga_edges, hints = json.loads(diff['ga_edges']), json.loads(diff['hints'])
		time, edges_in_ga, edges_in_cog, create, correct, wrong = (int(diff['time']), 
			len(ga_edges) * 2, 0, 0, 0, 0)
		edges_in_cog = sum([sum([0 if _ < 0 else 1 for _ in h]) for h in hints])
		for e in ga_edges:
			x, y, tag = int(e.split('-')[0][:-1]), int(e.split('-')[1][1:]), 'LR' if e.split('-')[0][-1] == 'L' else 'TD'
			if tag == 'LR':
				e_correct = (x + 1 == y and y % rows != 0)
				create += 1 if hints[x][1] < 0 else 0
				create += 1 if hints[y][3] < 0 else 0
				correct += 1 if e_correct and hints[x][1] != y else 0
				correct += 1 if e_correct and hints[y][3] != x else 0
				wrong += 1 if not e_correct and hints[x][1] != y else 0
				wrong += 1 if not e_correct and hints[y][3] != x else 0
			else:
				e_correct = (x + cols == y)
				create += 1 if hints[x][2] < 0 else 0
				create += 1 if hints[y][0] < 0 else 0
				correct += 1 if e_correct and hints[x][2] != y else 0
				correct += 1 if e_correct and hints[y][0] != x else 0
				wrong += 1 if not e_correct and hints[x][2] != y else 0
				wrong += 1 if not e_correct and hints[y][0] != x else 0
		f.write('%d,%d,%d,%d,%d,%d\n' % (time, edges_in_ga, edges_in_cog, create, correct, wrong))
		print(time, edges_in_ga, edges_in_cog, create, correct, wrong)

