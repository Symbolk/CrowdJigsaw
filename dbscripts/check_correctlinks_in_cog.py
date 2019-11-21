import numpy as np
from pymongo import MongoClient

mongo_ip = "162.105.89.173"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

def generate_single_file(round_id, row, column, bound):
	cogs = list(db['cogs'].find({"round_id":545}))
	oppo = {
		'left': 'right',
		'up': 'bottom',
		'right': 'left',
		'bottom': 'up',
	}

	d2i = {
		'up': 0,
		'right': 1,
		'bottom': 2,
		'left': 3,
	}

	i2d = {
		0: 'up',
		1: 'right',
		2: 'bottom',
		3: 'left',
	}

	idx_oppo = {
		0: 2,
		1: 3,
		2: 0,
		3: 1
	}

	offset = {
		0: -row,
		1: 1,
		2: row,
		3: -1
	}

	result = []
	for c in cogs:
		nodes = c['nodes']
		hints = [[-1, -1, -1, -1] for _ in range(row * column)]
		for x, dirs in enumerate(nodes):
			for d, data in dirs.items():
				if 'indexes' not in data:
					continue
				indexes = data['indexes']
				max_con, max_i = bound, None
				for idx, val in indexes.items():
					if val['confidence'] > max_con:
						max_con, max_i = val['confidence'], idx
				if max_i:
					hints[x][d2i[d]] = int(max_i)
		single_total = 0
		single_correct = 0
		for x, dirs in enumerate(hints):
			for d, y in enumerate(dirs):
				if y < 0:
					continue
				if hints[y][idx_oppo[d]] != x:
					single_total += 1
					if y - x == offset[d]:
						single_correct += 1
		result.append((single_total, single_correct, 0 if not single_total else single_correct / single_total))
	with open('single_precision_%d_%s.csv' % (round_id, str(bound)), 'w+') as f:
		f.write('total,correct,precision\n')
		for single_total, single_correct, precision in result:
			f.write('%d,%d,%s\n' % (single_total, single_correct, str(precision)))

rounds = list(db['rounds'].find({'official': True, 'round_id': {'$gt': 400}, 'solved_players': {'$gt': 0}}))
for r in rounds:
	round_id, row, column = int(r['round_id']), int(r['tilesPerRow']), int(r['tilesPerColumn'])
	print(round_id, row, column)
	generate_single_file(round_id, row, column, 0.9)

client.close()
