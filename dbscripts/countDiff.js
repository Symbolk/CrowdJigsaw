import numpy as np
from pymongo import MongoClient
import time
import datetime
import json

mongo_ip = "162.105.89.243"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
client.admin.authenticate("symbol", "Saw@PKU_1726")
db = client.CrowdJigsaw

round = list(db['rounds'].find({'round_id':133}))[-1]
diffs = list(db['diffs'].find({'round_id':133}))

rows, cols = round['tilesPerRow'], round['tilesPerColumn']
startTime = None
with open('diff_result_133.csv', 'w') as f:
	f.write('time,edges_in_ga,correct_in_ga,edges_in_cog,correct_in_cog,edges_in_both,correct_in_both,create,correct,wrong,ga_precision,cog_precision,both_precision\n')
	for diff in diffs:
		ga_edges, hints = json.loads(diff['ga_edges']), json.loads(diff['hints'])
		time, edges_in_ga, correct_in_ga, edges_in_cog, correct_in_cog, edges_in_both, correct_in_both, create, correct, wrong = (int(diff['time']), 
			len(ga_edges) * 2, 0, 0, 0, 0, 0, 0, 0, 0)
		if startTime == None:
			startTime = time
		edges_in_cog = sum([sum([0 if _ < 0 else 1 for _ in h]) for h in hints])
		for x in range(len(hints)):
			for d in range(4):
				y = hints[x][d]
				if y >= 0:
					correct_in_cog += 1 if d == 0 and x >= rows and y == x - rows else 0
					correct_in_cog += 1 if d == 1 and x % rows != rows - 1 and y == x + 1 else 0
					correct_in_cog += 1 if d == 2 and y == x + rows else 0
					correct_in_cog += 1 if d == 3 and x % rows != 0 and y == x - 1 else 0
		for e in ga_edges:
			x, y, tag = int(e.split('-')[0][:-1]), int(e.split('-')[1][1:]), 'LR' if e.split('-')[0][-1] == 'L' else 'TD'
			if tag == 'LR':
				e_correct = (x + 1 == y and y % rows != 0)
				correct_in_ga += 2 if e_correct else 0

				if hints[x][1] == y and hints[y][3] == x:
					edges_in_both += 2
					correct_in_both += 2 if e_correct else 0
				'''
				flag = False
				if (hints[x][1] == y and hints[y][3] != x) or (hints[y][3] == x and hints[x][1] != y):
					hints[x][1] = y
					hints[y][3] = x
					correct += 2 if e_correct else 0
					wrong += 2 if not e_correct else 0
				if hints[x][1] < 0:
					flag = True
					create += 1
					hints[x][1] = y
				if hints[y][3] < 0:
					flag = True
					create += 1
					hints[y][3] = x
				if flag and hints[x][1] == y and hints[y][3] == x:
					correct += 2 if e_correct else 0
					wrong += 2 if not e_correct else 0
				'''
			else:
				e_correct = (x + cols == y)
				correct_in_ga += 2 if e_correct else 0

				if hints[x][2] == y and hints[y][0] == x:
					edges_in_both += 2
					correct_in_both += 2 if e_correct else 0
				'''
				flag = False
				if (hints[x][2] == y and hints[y][0] != x) or (hints[y][0] == x and hints[x][2] != y):
					hints[x][2] = y
					hints[y][0] = x
					correct += 2 if e_correct else 0
					wrong += 2 if not e_correct else 0
				if hints[x][2] < 0:
					flag = True
					create += 1
					hints[x][2] = y
				if hints[y][0] < 0:
					flag = True
					create += 1
					hints[y][0] = x
				if flag and hints[x][2] == y and hints[y][0] == x:
					correct += 2 if e_correct else 0
					wrong += 2 if not e_correct else 0
				'''
		f.write('%d,%d,%d,%d,%d,%d,%d,%d,%d,%d,%4f,%4f,%4f\n' % (time-startTime, edges_in_ga, correct_in_ga, edges_in_cog, correct_in_cog, edges_in_both, correct_in_both, create, correct, wrong, (float(correct_in_ga)/float(edges_in_ga)) if edges_in_ga else 0, (float(correct_in_cog)/float(edges_in_cog)) if edges_in_cog else 0, (float(correct_in_both)/float(edges_in_both)) if edges_in_both else 0))
		print(time, edges_in_ga, correct_in_ga, edges_in_cog, correct_in_cog, edges_in_both, correct_in_both, create, correct, wrong)

