class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y


class Line:
    def __init__(self, p1, p2):
        self.p1 = p1
        self.p2 = p2
        self.a = (p1.y - p2.y) / (p1.x - p2.x)
        self.b = p1.y - self.a * p1.x

    def get_square(self, s, e):
        if s >= self.p2.x or e <= self.p1.x:
            return 0
        sx, ex = max(self.p1.x, s), min(self.p2.x, e)
        sy, ey = self.get_y(sx), self.get_y(ex)
        return (ex - sx) * (sy + ey) / 2

    def get_y(self, x):
        return self.a * x + self.b


class ExpGroup:
    def __init__(self, img):
        self.img = img
        self.points = []
        self.lines = []
        self.start = None
        self.end = None
        self.k = 1

    def add_point(self, x, y):
        p2 = Point(x, y)
        if self.points:
            p1 = self.points[-1]
            self.lines.append(Line(p1, p2))
        self.points.append(p2)
        self.start = min(x, self.start) if self.start else x
        self.end = max(x, self.end) if self.end else x

    def get_square(self, s, e):
        return sum(map(lambda l: l.get_square(s, e), self.lines))


def load_data():
    exp_map = dict()
    with open('ab_data.csv') as f:
        lines = f.readlines()
        for l in lines[1:]:
            img, players, time = l.strip().split(',')
            if img not in exp_map:
                exp_map[img] = ExpGroup(img)
            exp_map[img].add_point(int(players), int(time))
    return list(exp_map.values())


def save_data(experiments):
    with open('adapt_ab_data.csv', 'w+') as f:
        f.write('img,players,time,k,adapt_t\n')
        for exp in experiments:
            for p in exp.points:
                f.write('%s,%d,%d,%f,%f\n' % (exp.img, p.x, p.y, exp.k, p.y/exp.k))


if __name__ == '__main__':
    experiments = load_data()
    print(len(experiments))
    base = experiments[1]
    for i in experiments:
        if i == base:
            continue
        s, e = max(i.start, base.start), min(i.end, base.end)
        square_i, square_base = i.get_square(s, e), base.get_square(s, e)
        i.k = square_i / square_base
    data = []
    for i in experiments:
        i_data = []
        for p in i.points:
            i_data.append((p.x, p.y))
        data.append(i_data)
    print(len(data))
    ix = ','.join(map(lambda i: 'c(%s)' % (','.join(map(lambda e: str(e[0]), i))), data))
    iy = ','.join(map(lambda i: 'c(%s)' % (','.join(map(lambda e: str(e[1]), i))), data))
    ik = ','.join(map(lambda i: '%.4f' % i.k, experiments))
    print("img_x = list(%s)\nimg_y = list(%s)\nimg_k = list(%s)" % (ix, iy, ik))
    save_data(experiments)
'''

'''