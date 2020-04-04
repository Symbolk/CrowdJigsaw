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

rating = [0 for _ in range(20)]
for r_root, _, r_files in os.walk('round'):
    for fn in r_files:
        if fn.endswith('json'):
            with open(os.path.join(r_root, fn)) as f:
                lines = f.readlines()
                r = json.loads(lines[0])
                rrs = []
                for rr in lines[1:]:
                    rr = json.loads(rr)
                    rating[int(rr['rating'] * 2)] += 1

for i, n in enumerate(rating):
    print(i, n)




