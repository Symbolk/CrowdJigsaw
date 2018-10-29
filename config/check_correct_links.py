import pymongo
host = '162.105.89.243'
client = pymongo.MongoClient(host)
client.admin.authenticate("symbol", "Saw@PKU_1726")
db = client["CrowdJigsaw"]
cogs = [c for c in db.cogs.find({"round_id":25})]
last_cog = cogs[-1]

edges = [k for k in last_cog["edges_changed"].keys()]

correct_links_set = set()
for edge in edges:
	left, right = edge.split('-')
	x = int(left[:-1])
	y = int(right[1:])
	tag = left[-1]
	if tag == 'L':
		if x + 1 == y:
			if(y % 7) == 0:
				print(edge)
			correct_links_set.add(edge)
	else:
		if x + 7 == y:
			correct_links_set.add(edge)

correct_links_array = [e for e in correct_links_set]



