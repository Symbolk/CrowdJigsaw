import numpy as np
from pymongo import MongoClient

mongo_ip = "162.105.89.243"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

cogs = db['cogs'].find({"round_id":27})

cog = cogs[-1];

print(cog);

client.close()
