import numpy as np
from pymongo import MongoClient
import time
import datetime
import json

mongo_ip = "162.105.89.130"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

rounds = db['rounds'].find()

cog_json = {
	'correct_cog': {},
	'incorrect_cog': {},
}

def initNodesAndHints(nodes, piece_id):
	nodes[piece_id] = {
		'T': {
			'indexes': {},
			'maxConfidence': 0
		},
		'R': {
			'indexes': {},
			'maxConfidence': 0
		},
		'D': {
			'indexes': {},
			'maxConfidence': 0
		},
		'L': {
			'indexes': {},
			'maxConfidence': 0
		},
	}
	hints[piece_id] = {
		'T': -1,
		'R': -1,
		'D': -1,
		'L': -1,
	}

def updateNodesAndHints(nodes, hints, first_piece_id, orient, second_piece_id, confidence):
	if confidence > 0.618:
		nodes[first_piece_id][orient]['indexes'][second_piece_id] = confidence
		if confidence > nodes[first_piece_id][orient]['maxConfidence']:
			hints[first_piece_id][orient] = second_piece_id
			nodes[first_piece_id][orient]['maxConfidence'] = confidence

def checkUnsureHints(nodes, hints):
	for first_piece_id in hints:
		for orient in hints[first_piece_id]:
			if hints[first_piece_id][orient] >= 0:
				second_piece_id = hints[first_piece_id][orient]
				unsure = False
				for other_piece_id in nodes[first_piece_id][orient]['indexes']:
					confidence = nodes[first_piece_id][orient]['indexes'][other_piece_id]
					maxConfidence = nodes[first_piece_id][orient]['maxConfidence']
					if other_piece_id != second_piece_id and maxConfidence - confidence <= 0.2:
						unsure = True
				if unsure:
					hints[first_piece_id][orient] = -1
					nodes[first_piece_id][orient]['maxConfidence'] = 0

def computeStrongLinks(hints):
	strongLinks = 0.0
	for first_piece_id in hints:
		for orient in hints[first_piece_id]:
			if hints[first_piece_id][orient] >= 0:
				strongLinks += 1
	return strongLinks / 2
				
strongLinks_sum = 0
completeLinks_sum = 0
ratio_count = 0
ratio_sum = 0.0
total_count = 0
for r in rounds:
	round_id = r['round_id']
	tilesPerColumn = r['tilesPerColumn']
	tilesPerRow = r['tilesPerRow']
	totalLinks = 2 * tilesPerColumn * tilesPerRow - tilesPerColumn - tilesPerRow
	if 'COG' in r:
		total_count += 1
	else:
		continue
	cogs = list(db['cogs'].find({'round_id': round_id}))
	round_COG = []
	if len(cogs) > 0 and 'edges_changed' in cogs[0]:
		aver_strongLinks_ratio_for_cog = 0.0
		strongLinks_ratio_time_for_cog = 0.0
		for cog in cogs:
			nodes = {}
			hints = {}
			edges = cog['edges_changed']
			for e in edges:
				first_piece_id, second_piece_id = int(e.split('-')[0][:-1]), int(e.split('-')[1][1:])
				if not first_piece_id in nodes:
					initNodesAndHints(nodes, first_piece_id)
				if not second_piece_id in nodes:
					initNodesAndHints(nodes, second_piece_id)
				edge = edges[e]
				wp = float(edge['wp'])
				wn = float(edge['wn'])
				confidence = wp / (wp + wn)
				if e.split('-')[0][-1] == 'L':
					updateNodesAndHints(nodes, hints, first_piece_id, 'R', second_piece_id, confidence)
					updateNodesAndHints(nodes, hints, second_piece_id, 'L', first_piece_id, confidence)
				else:
					updateNodesAndHints(nodes, hints, first_piece_id, 'D', second_piece_id, confidence)
					updateNodesAndHints(nodes, hints, second_piece_id, 'T', first_piece_id, confidence)
			st = computeStrongLinks(hints)
			checkUnsureHints(nodes, hints)
			strongLinks = computeStrongLinks(hints)
			if st < strongLinks:
				print(st, strongLinks)
			completeLinks = cog['completeLinks']
			strongLinks_sum += strongLinks
			completeLinks_sum += completeLinks
			ratio_sum += (strongLinks * 1.0) / (completeLinks * 1.0)
			aver_strongLinks_ratio_for_cog  += (strongLinks * 1.0) / (completeLinks * 1.0)
			ratio_count += 1.0
			strongLinks_ratio_time_for_cog += 1.0
		cog_json['correct_cog'][round_id] = {
			'COG': r['COG'],
			'puzzle_size': r['tilesPerRow'],
			'group_size': r['players_num'],
			'strongLinks_ratio': aver_strongLinks_ratio_for_cog / strongLinks_ratio_time_for_cog
		}
	elif len(r['COG']) > 0:
		cog_json['correct_cog'][round_id] = {
			'COG': r['COG'],
			'puzzle_size': r['tilesPerRow'],
			'group_size': r['players_num']
		}

aver_ratio = ratio_sum / ratio_count
sum_ratio = (strongLinks_sum * 1.0) / (completeLinks_sum * 1.0) 
print(aver_ratio, sum_ratio)

cog_json['aver_strongLinks_ratio'] = aver_ratio
cog_json['sum_strongLinks_ratio'] = sum_ratio

cog_save_file = open("cog.json", 'w')
cog_save_file.write(json.dumps(cog_json, indent = 4))
cog_save_file.close()


print('save cog record for totally %d rounds' % total_count)

client.close()
