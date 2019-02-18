import numpy as np
from pymongo import MongoClient
import time
import datetime
import json

mongo_ip = "162.105.89.173"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

users = db['users'].find()

for u in users:
	records = u["records"]
	for r in records:
		db["record"].update({u'username': u['username'], u'round_id': r['round_id']}, 
							{'$set':r}, upsert=True)