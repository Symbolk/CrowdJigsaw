import os
import json
import time


def parse_time(time_str):
    return int(time.mktime(time.strptime(':'.join(time_str.split(':')[:-1]), '%Y-%m-%d %H:%M:%S')))


correct_edges = set()
for x in range(100):
    if x % 10:
        correct_edges.add('%dL-R%d' % (x - 1, x))
    if x < 90:
        correct_edges.add('%dT-B%d' % (x, x + 10))

round_map = dict()
for r_root, _, r_files in os.walk('round'):
    for fn in r_files:
        if fn.endswith('json'):
            with open(os.path.join(r_root, fn)) as f:
                lines = f.readlines()
                r = json.loads(lines[0])
                r['records'] = []
                r['cogs'] = []
                for rr in lines[1:]:
                    r['records'].append(json.loads(rr))
                round_map[r['round_id']] = r

for i_root, _, i_files in os.walk('integration'):
    for fn in i_files:
        if fn.endswith('json'):
            round_id = int(fn.split('.')[0])
            with open(os.path.join(i_root, fn)) as f:
                lines = f.readlines()
                for cog in lines:
                    cog = json.loads(cog)
                    round_map[round_id]['cogs'].append(cog)

print(len(round_map))
N = 1000

def all_data():
    with open('integrate_pr.csv', 'w+') as f:
        f.write('round_id,img,t31,t32,t41,t42,t43,t51,t52\n')
        for round_id, r in round_map.items():
            if round_id in (673, 827, 833):
                continue
            start_time = parse_time(r['start_time']) * 1000
            solve_time = r['records'][0]['solve_time'] * 1000
            t31a, t31b = 0, 0
            t32a, t32b = 0, 0
            t41a, t41b = 0, 0
            t42a, t42b = 0, 0
            t43a, t43b = 0, 0
            t51a, t51b = 0, 0
            t52a, t52b = 0, 0
            for i in range(N):
                t = (i+1) * solve_time / N + start_time
                cog_itr = 0
                for cog_itr, cog in enumerate(r['cogs']):
                    if cog['time'] > t:
                        break
                cog_itr -= 1
                if cog_itr < 0:
                    continue
                cog = r['cogs'][cog_itr]
                cog_edges, ga_edges, hints_edge = set(cog['cog_edges']), set(cog['ga_edges']), set(cog['hint_edges'])

                correct_in_hints = len(correct_edges.intersection(hints_edge))
                total_in_hints = len(hints_edge)
                correct_in_cog = len(correct_edges.intersection(cog_edges))
                total_in_cog = len(cog_edges)

                correct_in_ga = len(correct_edges.intersection(ga_edges))
                correct_in_ga_cog = len(correct_edges.intersection(ga_edges).intersection(cog_edges))
                advance_in_ga_cog = len(correct_edges.intersection(ga_edges - cog_edges))
                total_in_ga = len(ga_edges)

                correct_in_both = len(correct_edges.intersection(ga_edges).intersection(hints_edge))
                total_in_both = len(ga_edges.intersection(hints_edge))

                t31a += correct_in_hints
                t31b += total_in_hints
                t32a += correct_in_hints
                t32b += correct_in_cog

                t41a += correct_in_ga
                t41b += total_in_ga
                t42a += correct_in_ga_cog
                t42b += correct_in_cog
                t43a += advance_in_ga_cog
                t43b += correct_in_cog

                t51a += correct_in_both
                t51b += total_in_both
                t52a += correct_in_both
                t52b += correct_in_cog

            t31 = (t31a / t31b) if t31b else 0
            t32 = (t32a / t32b) if t32b else 0

            t41 = (t41a / t41b) if t41b else 0
            t42 = (t42a / t42b) if t42b else 0
            t43 = (t43a / t43b) if t43b else 0

            t51 = (t51a / t51b) if t51b else 0
            t52 = (t52a / t52b) if t52b else 0
            f.write('%d,%d,%f,%f,%f,%f,%f,%f,%f\n' % (round_id, r['players_num'], t31, t32, t41, t42, t43, t51, t52))
            print(round_id, r['players_num'], t31, t32, t41, t42, t43, t51, t52)


def n_data():
    n_pr = [{
        't31a': 0,
        't31b': 0,
        't32a': 0,
        't32b': 0,
        't41a': 0,
        't41b': 0,
        't42a': 0,
        't42b': 0,
        't43a': 0,
        't43b': 0,
        't51a': 0,
        't51b': 0,
        't52a': 0,
        't52b': 0,
    } for i in range(N)]
    for round_id, r in round_map.items():
        if round_id in (673, 827, 833):
            continue
        start_time = parse_time(r['start_time']) * 1000
        solve_time = r['records'][0]['solve_time'] * 1000
        for i in range(N):
            t = (i + 1) * solve_time / N + start_time
            cog_itr = 0
            for cog_itr, cog in enumerate(r['cogs']):
                if cog['time'] > t:
                    break
            cog_itr -= 1
            if cog_itr < 0:
                continue
            cog = r['cogs'][cog_itr]
            cog_edges, ga_edges, hints_edge = set(cog['cog_edges']), set(cog['ga_edges']), set(cog['hint_edges'])

            correct_in_hints = len(correct_edges.intersection(hints_edge))
            total_in_hints = len(hints_edge)
            correct_in_cog = len(correct_edges.intersection(cog_edges))
            total_in_cog = len(cog_edges)

            correct_in_ga = len(correct_edges.intersection(ga_edges))
            correct_in_ga_cog = len(correct_edges.intersection(ga_edges).intersection(cog_edges))
            advance_in_ga_cog = len(correct_edges.intersection(ga_edges - cog_edges))
            total_in_ga = len(ga_edges)

            correct_in_both = len(correct_edges.intersection(ga_edges).intersection(hints_edge))
            total_in_both = len(ga_edges.intersection(hints_edge))

            n_pr[i]['t31a'] += correct_in_hints
            n_pr[i]['t31b'] += total_in_hints
            n_pr[i]['t32a'] += correct_in_hints
            n_pr[i]['t32b'] += correct_in_cog

            n_pr[i]['t41a'] += correct_in_ga
            n_pr[i]['t41b'] += total_in_ga
            n_pr[i]['t42a'] += correct_in_ga_cog
            n_pr[i]['t42b'] += correct_in_cog
            n_pr[i]['t43a'] += advance_in_ga_cog
            n_pr[i]['t43b'] += correct_in_cog

            n_pr[i]['t51a'] += correct_in_both
            n_pr[i]['t51b'] += total_in_both
            n_pr[i]['t52a'] += correct_in_both
            n_pr[i]['t52b'] += correct_in_cog
        with open('integrate_1000_pr.csv', 'w+') as f:
            f.write('t31,t32,t41,t42,t43,t51,t52\n')
            for d in n_pr:
                t31 = (d['t31a'] / d['t31b']) if d['t31b'] else 0
                t32 = (d['t32a'] / d['t32b']) if d['t32b'] else 0
                t41 = (d['t41a'] / d['t41b']) if d['t41b'] else 0
                t42 = (d['t42a'] / d['t42b']) if d['t42b'] else 0
                t43 = (d['t43a'] / d['t43b']) if d['t43b'] else 0
                t51 = (d['t51a'] / d['t51b']) if d['t51b'] else 0
                t52 = (d['t52a'] / d['t52b']) if d['t52b'] else 0
                f.write('%f,%f,%f,%f,%f,%f,%f\n' % (t31, t32, t41, t42, t43, t51, t52))


n_data()
