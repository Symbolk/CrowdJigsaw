from pymongo import MongoClient

mongo_ip = "162.105.89.243"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
client.admin.authenticate('xxx', 'xxx')
db = client.CrowdJigsaw

records = db["records"].find()

for r in records:
	username, round_id = r['username'], r['round_id']
	Round = db['rounds'].find_one({'round_id': round_id})

	if 'winner_time' not in Round or Round['winner_time'] == '-1':
		continue
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
		'beHintedTiles': [-1, -1, -1, -1]
	} for _ in range(tile_num)]

	score = 0
	create_correct_links = 0
	create_wrong_links = 0
	remove_correct_links = 0
	remove_wrong_links = 0
	remove_hinted_wrong_links = 0

	e_map = dict()
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

			if size > 0:
				e_map[edge] = (x, y, tag, beHinted)
				if tag == "T-B" and (tiles[x]['aroundTiles'][2] != y 
					or tiles[y]['aroundTiles'][0] != x):
					#print(x, tag, y, tiles[x]['aroundTiles'][2], tiles[y]['aroundTiles'][0])
					tiles[x]['aroundTiles'][2] = y
					tiles[y]['aroundTiles'][0] = x
					if beHinted:
						tiles[x]['hintedTiles'][2] = y
						tiles[y]['hintedTiles'][0] = x
						if tiles[x]['nodes'] < tiles[y]['nodes']:
							tiles[x]['beHintedTiles'][2] = y
						if tiles[y]['nodes'] < tiles[x]['nodes']:
							tiles[y]['beHintedTiles'][0] = x
					else:
						if int(a['time']) < winner_time:
							if x + tilesPerRow == y:
								create_correct_links += 1
							else:
								create_wrong_links += 1
				if tag == "L-R" and (tiles[x]['aroundTiles'][1] != y 
					or tiles[y]['aroundTiles'][3] != x):
					#print(x, tag, y, tiles[x]['aroundTiles'][1], tiles[y]['aroundTiles'][3])
					tiles[x]['aroundTiles'][1] = y
					tiles[y]['aroundTiles'][3] = x
					if beHinted:
						tiles[x]['hintedTiles'][1] = y
						tiles[y]['hintedTiles'][3] = x
						if tiles[x]['nodes'] <= tiles[y]['nodes']:
							tiles[x]['beHintedTiles'][1] = y
						if tiles[y]['nodes'] <= tiles[x]['nodes']:
							tiles[y]['beHintedTiles'][3] = x
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
	for tile in tiles:
		linked_tile = False
		beHinted_tile = False
		for i in range(4):
			if tile['aroundTiles'][i] >= 0:
				linked_tile = True
				if (tile['hintedTiles'][i] == tile['aroundTiles'][i] and 
					tile['beHintedTiles'][i] == tile['aroundTiles'][i]):
					beHinted_tile = True
		if linked_tile:
			total_tiles += 1
			if beHinted_tile:
				hinted_tiles += 1
	hint_ratio = hinted_tiles / total_tiles if total_tiles else 0
	if 'hinted_tiles' in r:
		print("not save", r['hinted_tiles'], r['total_tiles'], hint_ratio, hinted_tiles, total_tiles)
	if 'hinted_tiles' not in r or not r['hinted_tiles'] or int(r['hinted_tiles']) < hinted_tiles:
		print('update', username, round_id, hinted_tiles, total_tiles)
		db['records'].update_one({'username': username, 'round_id': round_id}, {
			'$set': {
				'hinted_tiles': str(hinted_tiles),
				'total_tiles': str(total_tiles)
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

