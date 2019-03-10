from pymongo import MongoClient

class UnionFind:
	def __init__(self, tiles):
		self.tiles = tiles
		self.father = [i for i in range(len(tiles))]
		for i, t in enumerate(tiles):
			for neibor in t['aroundTiles']:
				if neibor < 0:
					continue
				self.union(i, neibor)

	def find(self, n):
		if self.father[n] != n:
			self.father[n] = self.find(self.father[n])
		return self.father[n]

	def union(self, n1, n2):
		f1, f2 = self.find(n1), self.find(n2)
		self.father[f2] = f1


mongo_ip = "162.105.89.173"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
#client.admin.authenticate('xxx', 'xxx')
db = client.CrowdJigsaw

records = db["records"].find()

for r in records:
	username, round_id = r['username'], r['round_id']
	Round = db['rounds'].find_one({'round_id': round_id})

	if 'winner_time' not in Round or Round['winner_time'] == '-1':
		winner_time = 10000000000
	else:
		print(round_id, Round['winner_time'])
		HH, MM, SS = map(int, Round['winner_time'].split(':'))
		winner_time = (HH * 3600 + MM * 60 + SS + 1) * 1000

	tile_num = Round['tile_num']
	tilesPerRow = Round['tilesPerRow']

	actions = list(db['actions'].find({'player_name': username, 'round_id': round_id}))
	if not actions:
		continue
	actions.sort(key=lambda x: x['time'])
	tiles = [{
		'size': 0,
		'nodes': 1,
		'aroundTiles': [-1, -1, -1, -1],
		'hintedTiles': [-1, -1, -1, -1],
		'linkSteps': [-1, -1, -1, -1]
	} for _ in range(tile_num)]

	score = 0
	create_correct_links = 0
	create_wrong_links = 0
	remove_correct_links = 0
	remove_wrong_links = 0
	remove_hinted_wrong_links = 0

	e_map = dict()
	step = 0
	for a in actions:
		if type(a['links_size']) == dict:
			edge_list = [(k, v) for k, v in a['links_size'].items()]
		else:
			edge_list = []
			for data in a['links_size']:
				k = str(data['x']) + data['tag'] + str(data['y'])
				edge_list.append((k, data))
		edge_list.sort(key=lambda x: x[1]['size'])
		for edge, data in edge_list:
			x, tag, y = data['x'], data['tag'], data['y']
			beHinted, nodes, size = data['beHinted'], data['nodes'], data['size']
			if size < 0:
				if edge in e_map:
					del e_map[edge]
				if tag == "T-B":
					tiles[x]['aroundTiles'][2] = -1
					tiles[y]['aroundTiles'][0] = -1
					if int(a['time']) < winner_time:
						if x + tilesPerRow == y and not beHinted:
							remove_correct_links += 1
						if not x + tilesPerRow == y:
							if beHinted:
								remove_hinted_wrong_links += 1
							else:
								remove_wrong_links += 1
				else:
					tiles[x]['aroundTiles'][1] = -1
					tiles[y]['aroundTiles'][3] = -1
					if int(a['time']) < winner_time:
						if x + 1 == y and y % tilesPerRow != 0 and not beHinted:
							remove_correct_links += 1
						if not (x + 1 == y and y % tilesPerRow != 0):
							if beHinted:
								remove_hinted_wrong_links += 1
							else:
								remove_wrong_links += 1 

		uf = UnionFind(tiles)

		for edge, data in edge_list:
			x, tag, y = data['x'], data['tag'], data['y']
			beHinted, nodes, size = data['beHinted'], data['nodes'], data['size']
			if size > 0:
				e_map[edge] = (x, y, tag, beHinted)
				if tag == "T-B" and (tiles[x]['aroundTiles'][2] != y 
					or tiles[y]['aroundTiles'][0] != x):
					if uf.find(x) != uf.find(y):
						step += 1
						uf.union(x, y)
					#print(x, tag, y, tiles[x]['aroundTiles'][2], tiles[y]['aroundTiles'][0])
					tiles[x]['aroundTiles'][2] = y
					tiles[y]['aroundTiles'][0] = x
					tiles[x]['linkSteps'][2] = step
					tiles[y]['linkSteps'][0] = step
					if beHinted:
						tiles[x]['hintedTiles'][2] = y
						tiles[y]['hintedTiles'][0] = x
					else:
						if int(a['time']) < winner_time:
							if x + tilesPerRow == y:
								create_correct_links += 1
							else:
								create_wrong_links += 1
				if tag == "L-R" and (tiles[x]['aroundTiles'][1] != y 
					or tiles[y]['aroundTiles'][3] != x):
					#print(x, tag, y, tiles[x]['aroundTiles'][1], tiles[y]['aroundTiles'][3])
					if uf.find(x) != uf.find(y):
						step += 1
						uf.union(x, y)
					tiles[x]['aroundTiles'][1] = y
					tiles[y]['aroundTiles'][3] = x
					tiles[x]['linkSteps'][1] = step
					tiles[y]['linkSteps'][3] = step
					if beHinted:
						tiles[x]['hintedTiles'][1] = y
						tiles[y]['hintedTiles'][3] = x
					else:
						if int(a['time']) < winner_time:
							if x + 1 == y and y % tilesPerRow != 0:
								create_correct_links += 1
							else:
								create_wrong_links += 1

			#print('nodes', x, y, tiles[x]['nodes'], tiles[y]['nodes'])
			tiles[x]['nodes'], tiles[y]['nodes'] = nodes, nodes
			tiles[x]['size'], tiles[y]['size'] = size, size

	score = (3 * create_correct_links - 
		6 * remove_correct_links - 3 * create_wrong_links + 
		3 * remove_wrong_links + 6 * remove_hinted_wrong_links)

	total_tiles, hinted_tiles = 0, 0
	total_steps_set, hinted_steps_set = set(), set()
	for tile in tiles:
		beHinted_tile = False
		for i in range(4):
			if tile['aroundTiles'][i] >= 0 and tile['linkSteps'][i] >= 0:
				if (tile['hintedTiles'][i] == tile['aroundTiles'][i]):
					hinted_steps_set.add(tile['linkSteps'][i])
				total_steps_set.add(tile['linkSteps'][i])
	total_steps, hinted_steps = len(total_steps_set), len(hinted_steps_set)
	hint_ratio = hinted_steps / total_steps if total_steps else 0
	if 'hinted_steps' in r:
		print("not save", r['round_id'], r['hinted_steps'], r['total_steps'], hint_ratio, hinted_steps, total_steps)
	if 'hinted_steps' not in r or not r['hinted_steps'] or int(r['hinted_steps']) < hinted_steps:
		print('update', username, round_id, hinted_steps, total_steps)
		db['records'].update_one({'username': username, 'round_id': round_id}, {
			'$set': {
				'hinted_steps': str(hinted_steps),
				'total_steps': str(total_steps)
			}
		})

	if 'score' not in r:
		db['records'].update_one({'username': username, 'round_id': round_id}, {
			'$set': {
				'score': score,
				'create_correct_links': create_correct_links,
				'create_wrong_links': create_wrong_links,
				'remove_correct_links': remove_correct_links,
				'remove_wrong_links': remove_wrong_links,
				'remove_hinted_wrong_links': remove_hinted_wrong_links
			}
		})
	
	hinted_links, total_links, correct_links = 0, 2 * len(e_map), 0
	for edge, data in e_map.items():
		x, y, tag, beHinted = data
		if tag == 'T-B':
			if x + tilesPerRow == y:
				correct_links += 2
		else:
			if x + 1 == y and y % tilesPerRow != 0:
				correct_links += 2
		if beHinted:
			hinted_links += 2

	if not ('hinted_links' in r and 'total_links' in r and 'correct_links' in r):
		print('update', username, round_id, hinted_links, total_links, correct_links)
		db['records'].update_one({'username': username, 'round_id': round_id}, {
			'$set': {
				'hinted_links': str(hinted_links),
				'total_links': str(total_links),
				'correct_links': str(correct_links)
			}
		})

