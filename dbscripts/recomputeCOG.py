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

round_cog_backup = {}

save_count = 0
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
		save_count += 1
		for cog in cogs:
			edges = cog['edges_changed']
			completeLinks = len(edges)
			correctLinks = 0
			for e in edges:
				first_piece_id, second_piece_id = int(e.split('-')[0][:-1]), int(e.split('-')[1][1:])
				if e.split('-')[0][-1] == 'L':
					if second_piece_id == first_piece_id + 1:
						correctLinks += 1
				else:
					if second_piece_id == first_piece_id + tilesPerColumn:
						correctLinks += 1
			db['cogs'].update_one({'round_id': round_id, 'time':cog['time']},{ "$set":{'correctLinks': correctLinks,'completeLinks': completeLinks,'totalLinks': totalLinks}})
			round_COG.append({
					'time': cog['time'],
					'correctLinks': correctLinks,
					'completeLinks': completeLinks,
					'totalLinks': totalLinks
				})
			db['rounds'].update_one({'round_id': round_id},{ "$set":{"COG":round_COG}})
			#print(cog['round_id'], cog['time'])
			#print(completeLinks, correctLinks, totalLinks)
			#print(cog['completeLinks'], cog['correctLinks'], cog['totalLinks'], '\n')
	elif len(r['COG']) > 0 and r['COG'][0]['totalLinks'] != totalLinks:
		print(round_id)
		for c in r['COG']:
			correctLinks = int(round(float(c['correctLinks']) / 2, 0))
			completeLinks = int(round(float(c['completeLinks']) / 2, 0))
			round_COG.append({
					'time': c['time'],
					'correctLinks': correctLinks,
					'completeLinks': completeLinks,
					'totalLinks': totalLinks
				})
		print(round_id, round_COG[-1], r['COG'][-1])
		round_cog_backup[round_id] = r['COG']
		db['rounds'].update_one({'round_id': round_id},{ "$set":{"COG":round_COG}})

back_up_file = open("backup.json", 'w')
back_up_file.write(json.dumps(round_cog_backup))
back_up_file.close()


print('rescure cog record for %d rounds in totally %d rounds' % (save_count, total_count))

client.close()
