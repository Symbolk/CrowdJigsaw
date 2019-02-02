import numpy as np
from pymongo import MongoClient
import redis

data_ip = "162.105.89.243"
r = redis.Redis(host=data_ip)

users = list(r.zrange('round:130:scoreboard', 0, -1, withscores=True))

class_players_num = {
	b'051': [],
	b'052': [],
	b'053': [],
	b'224': [],
	b'225': [],
	b'others': []
}

for u in users:
	if len(u[0]) >= 10:
		if u[0][:2] == b'18':
			class_players_num[u[0][5:8]].append(u)
		elif u[0][:2] == b'17':
			class_players_num[b'225'].append(u)
		else:
			class_players_num[b'others'].append(u)

with open('round_130_class_num.csv', 'w') as f:
	f.write('class,players_num,' + ','.join([str(i) for i in range(1, 11)]) + '\n')
	for k, v in class_players_num.items():
		v.sort(key=lambda x:x[1])
		v.reverse()
		f.write("%s,%d," % (k.decode(), len(v)) + ','.join(str(x[1]) for x in v[:(len(v) if len(v) <= 10 else 10)]) + '\n')
		f.write(' , ,' + ','.join(x[0].decode() for x in v[:(len(v) if len(v) <= 10 else 10)]) + '\n')
		print(k, len(v), v[:(len(v) if len(v) <= 10 else 10)])




