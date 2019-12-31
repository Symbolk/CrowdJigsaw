from pymongo import MongoClient
from functools import reduce
from collections import defaultdict
import time


mongo_ip = "162.105.89.173"
mongo_port = 27017

client = MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

IMG = 'images/raw/2012MiumiuAdvertisement2_10x10.jpg'

rounds = list(db['rounds'].find({'image': IMG}))
print([r['round_id'] for r in rounds])

players = set()
for r in rounds:
    round_id = r['round_id']
    records = list(db['records'].find({'round_id': round_id}))
    players.update([rr['username'] for rr in records if rr['username'][0] not in ('G', 'V', '1')])
print(players)
