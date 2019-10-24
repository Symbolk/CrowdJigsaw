import numpy as np
from pymongo import MongoClient
import time
import datetime
import json
from collections import defaultdict

mongo_ip = "162.105.89.173"
mongo_port = 27017

client =  MongoClient(mongo_ip, mongo_port)
db = client.CrowdJigsaw

round_id = 420

Round = list(db['rounds'].find({'round_id': round_id}))[0]
start_time = int(datetime.datetime.strptime(Round['start_time'], '%Y-%m-%d %H:%M:%S:%f').timestamp())

user_stats = dict()
records = list(db['records'].find({'round_id': round_id}))
for r in records:
	username = r['username']
	hhmmss = list(r['time'].split(':'))
	time = 0
	for t in hhmmss:
		time = time * 60 + int(t)
	stat = {
		'username': r['username'],
		'round_id': r['round_id'],
		'time': time,
		'time_str': r['time'],
		'score': r['score'],
		'satisfy': r['rating'] or -1,
		'willing_to_share': False,
		'not_willing_to_share_reason': '',
		'click_share_info': False,
		'click_share_info_time': "",
		'click_hint_count': 0,
		'click_hint_time': [],
		'guess_click_count': 0,
		'guess_count': 0,
		'guess_word': [],
		'guess_word_time': [],
		'willing_next_game': False,
		'not_willing_next_game_reason': ''
	}
	if r['username'] not in user_stats:
		user_stats[username] = stat

surveys = list(db['surveys'].find({'round_id': round_id}))
for s in surveys:
	username = s['player_name']
	if username not in user_stats:
		continue
	time = int(str(s['_id'])[:8], 16) - start_time
	if s['survey_type'] == 'pregame' and s['extra']:
		extra = json.loads(s['extra'])
		user_stats[username]['willing_to_share'] = extra['wantToShare']
		user_stats[username]['not_willing_to_share_reason'] = extra['reason']
	elif s['survey_type'] == 'guess' and s['extra']:
		words = [s for s in s['extra'].strip().split() if s]
		user_stats[username]['guess_count'] += 1
		user_stats[username]['guess_word'].append(' '.join(words))
		user_stats[username]['guess_word_time'].append(time)
	elif s['survey_type'] == 'shareInfo':
		user_stats[username]['click_share_info'] = True
		user_stats[username]['click_share_info_time'] = time
	elif s['survey_type'] == 'endgame' and s['extra']:
		extra = json.loads(s['extra'])
		if float(extra['rating']) > float(user_stats[username]['satisfy']):
			user_stats[username]['satisfy'] = extra['rating']
		user_stats[username]['willing_next_game'] = extra['nextGame']
		user_stats[username]['not_willing_next_game_reason'] = extra['reason']
	elif s['survey_type'] == 'askHelp':
		user_stats[username]['click_hint_count'] += 1
		user_stats[username]['click_hint_time'].append(time)
	elif s['survey_type'] == 'guess_countlick':
		user_stats[username]['guess_click_count'] += 1


with open('survey_result_%d.csv' % round_id, 'w+') as f:
	f.write('username,willing_to_share,not_willing_to_share_reason,click_share_button,click_guess_count,submit_guess_count,\
		click_hint_count,click_share_button_time,click_hint_time,click_guess_time,guess_words,\
		hint_satisfy,willing_next_game,not_willing_next_game_reason,finish_time,score\n')
	for _, stat in user_stats.items():
		f.write('%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' % (
				stat['username'], str(stat['willing_to_share']), stat['not_willing_to_share_reason'],
				str(stat['click_share_info']), str(stat['guess_click_count']), str(stat['guess_count']),
				str(stat['click_hint_count']), str(stat['click_share_info_time']), 
				"/".join([str(_) for _ in stat['click_hint_time']]),
				"/".join([str(_) for _ in stat['guess_word_time']]), "/".join(stat['guess_word']),
				str(stat['satisfy']), str(stat['willing_next_game']), stat['not_willing_next_game_reason'],
				str(stat['time_str']), str(stat['score'])
			))


