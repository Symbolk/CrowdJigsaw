import numpy as np
from pymongo import MongoClient
import redis

data_ip = "162.105.89.243"
r = redis.Redis(host=data_ip)

users = list(r.zrevrange('round:97:scoreboard', 0, 10, withscores=True))

with open('round_97_score_detail.csv', 'w') as f:
	f.write("rank,player,score,create_wrong_link,create_correct_link,remove_correct_link,remove_wrong_link,remove_hinted_wrong_link\n")
	for i in range(len(users)):
		username, score = users[i]
		create_wrong_link = r.zscore('round:97:scoreboard:create_wrong_link', username)
		create_correct_link = r.zscore('round:97:scoreboard:create_correct_link', username)
		remove_correct_link = r.zscore('round:97:scoreboard:remove_correct_link', username)
		remove_wrong_link = r.zscore('round:97:scoreboard:remove_wrong_link', username)
		remove_hinted_wrong_link = r.zscore('round:97:scoreboard:remove_hinted_wrong_link', username)
		create_wrong_link = create_wrong_link if create_wrong_link else 0
		create_correct_link = create_correct_link if create_correct_link else 0
		remove_correct_link = remove_correct_link if remove_correct_link else 0
		remove_wrong_link = remove_wrong_link if remove_wrong_link else 0
		remove_hinted_wrong_link = remove_hinted_wrong_link if remove_hinted_wrong_link else 0
		f.write("%d,%s,%d,%d,%d,%d,%d,%d\n" % (i/2, username, score, create_wrong_link, 
			create_correct_link, remove_correct_link,remove_wrong_link,remove_hinted_wrong_link))

