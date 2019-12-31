with open('ooo.csv') as f:
    lines = list(map(lambda x: x.strip().split(','), f.readlines()))
    header = [int(e) if e else None for e in lines[0]]
    lines = lines[1:]

print(header)
opo = []
for l in lines:
    img = l[0]
    opo_img = []
    for i in range(2, len(l)):
        for j in range(i + 1, len(l)):
            if not l[i] or not l[j]:
                continue
            p1, p2 = header[i], header[j]
            t1, t2 = float(l[i]), float(l[j])
            opo_img.append(2 * (t1 / t2) / (p2 / p1))
    if opo_img:
        opo.append(sum(opo_img) / len(opo_img))
        print(img, ':  1 + 1 = %s' % str(opo[-1]))
if opo:
    print('1 + 1 = %s' % (sum(opo) / len(opo)))
