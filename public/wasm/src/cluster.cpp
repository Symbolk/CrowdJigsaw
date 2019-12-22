#include <stdio.h>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <math.h>

using namespace std;
typedef unsigned long long ull;

#define WIDTH 64
#define HEIGHT 64

int dirs[24][2] = { {0, 1}, {1, 0}, {0, -1}, {-1, 0}, {1, 1}, {-1, 1}, {1, -1}, {-1, -1},
	{0, -2}, {-2, 0}, {0, 2}, {2, 0}, {-2, 2}, {2, 2}, {2, -2}, {-2, -2},
	{1, 2},{1, -2}, {-1, 2}, {-1, -2}, {2, 1}, {2, -1}, {-2, 1}, {-2, -1} };

int pos_map[HEIGHT * WIDTH];

struct Tile {
	int id;
	int x;
	int y;
	Tile(int _id, int _x, int _y) : id(_id), x(_x), y(_y) {}
	void print() {
		printf("Tile-%d: (%d, %d)\n", id, x, y);
	}
};

struct Point {
	int x;
	int y;
};

struct DoublePoint {
	double x;
	double y;
};

template<class T>
double computeDistance(T p1, T p2) {
	return pow(p1.x - p2.x, 2) + pow(p1.y - p2.y, 2);
}

struct Group {
	int rows{ 0 };
	int cols{ 0 };
	Point left_top{ 0, 0 };
	Point move{ 0, 0 };
	DoublePoint mid{ 0.0, 0.0 };
	double distance{ 0.0 };
	ull* keys{ NULL };
	vector<Tile*> tiles;
	void init() {
		int min_r = WIDTH, max_r = 0;
		int min_c = HEIGHT, max_c = 0;
		for (auto t : tiles) {
			min_r = min(t->y, min_r);
			max_r = max(t->y, max_r);
			min_c = min(t->x, min_c);
			max_c = max(t->x, max_c);
		}
		rows = max_r - min_r + 1;
		cols = max_c - min_c + 1;
		left_top.x = min_c;
		left_top.y = min_r;

		mid.x = ((double)min_c + max_c) / 2.0;
		mid.y = ((double)min_r + max_r) / 2.0;

		keys = new ull[rows];
		memset(keys, 0, sizeof(ull) * rows);
		for (int i = 0; i < rows; i++) {
			keys[i] = 0;
		}
		for (auto t : tiles) {
			keys[t->y - min_r] |= (ull)1 << t->x;
		}

		move.x = move.y = 0;
	}
	void refresh_distance(DoublePoint& global_mid) {
		distance = computeDistance(mid, global_mid);
	}

	bool isConflict(ull* extented_keys, ull* global_keys, Point& des) {
		if (des.x < 0 || des.x + cols >= WIDTH || des.y < 0 || des.y + rows >= HEIGHT) {
			return false;
		}
		int start = des.y;
		int dx = des.x - left_top.x;
		for (int i = 0; i < rows + 2; i++) {
			int r = i + start - 1;
			if (r < 0 || r >= HEIGHT) {
				continue;
			}
			ull key_moved = dx > 0 ? extented_keys[i] << dx : extented_keys[i] >> -dx;
			if (key_moved & global_keys[r]) {
				return true;
			}
		}
		return false;
	}

	void pickGroup(ull* global_keys) {
		int start = left_top.y + move.y;
		int dy = move.y;
		int dx = move.x;
		for (int i = 0; i < rows; i++) {
			int r = start + i;
			ull key_moved = dx > 0 ? keys[i] << dx : keys[i] >> -dx;
			global_keys[r] ^= key_moved;
		}
	}

	void placeGroup(ull* global_keys) {
		int start = left_top.y + move.y;
		int dy = move.y;
		int dx = move.x;
		for (int i = 0; i < rows; i++) {
			int r = start + i;
			ull key_moved = dx > 0 ? keys[i] << dx : keys[i] >> -dx;
			global_keys[r] |= key_moved;
		}
	}

	void placeTiles() {
		for (auto t : tiles) {
			t->x += move.x;
			t->y += move.y;
		}
	}

	ull* generateExtentedKeys() {
		ull* extented_keys = new ull[rows + 2];
		memset(extented_keys, 0, sizeof(ull) * (rows + 2));
		for (int i = 0; i < rows + 2; i++) {
			extented_keys[i] = 0;
		}
		for (int i = 1; i < rows + 1; i++) {
			extented_keys[i] = keys[i - 1] | (keys[i - 1] << 1) | (keys[i - 1] >> 1);
		}
		for (int i = 0; i < rows + 2; i++) {
			extented_keys[i] |= (i >= 1 ? extented_keys[i - 1] : 0) | (i <= rows ? extented_keys[i + 1] : 0);
		}
		return extented_keys;
	}

	void moveTowardCenter(DoublePoint& global_mid, ull* global_keys) {
		ull* extented_keys = generateExtentedKeys();
		int start = left_top.y - 1;
		DoublePoint p = mid;

		double l = 1;
		double dy = global_mid.y - mid.y;
		double dx = global_mid.x - mid.x;
		double lx, ly;
		if (dx == 0) {
			lx = 0, ly = dy > 0 ? l : -l;
		}
		else {
			double k = abs(dy / dx);
			lx = sqrt(pow(l, 2) / (pow(k, 2) + 1));
			ly = k * lx;
			if (dx < 0) {
				lx = -lx;
			}
			if (dy < 0) {
				ly = -ly;
			}
		}

		int cur_x = round(p.x), cur_y = round(p.y);
		int after_x = cur_x, after_y = cur_y;
		double cur_dis = distance;
		while (cur_dis > 0) {
			p.x += lx;
			p.y += ly;
			int after_x = (int)round(p.x), after_y = (int)round(p.y);
			if (after_x == cur_x && after_y == cur_y) {
				continue;
			}
			Point des{ left_top.x + move.x + after_x - cur_x, left_top.y + move.y + after_y - cur_y };
			if (isConflict(extented_keys, global_keys, des)) {
				break;
			}
			move.x += after_x - cur_x;
			move.y += after_y - cur_y;
			cur_x = after_x;
			cur_y = after_y;

			cur_dis = computeDistance(p, global_mid);
		}

		//printf("Move Group with %lu Tiles from (%d, %d) by (%d, %d)\n", tiles.size(), left_top.x, left_top.y, move.x, move.y);
		placeGroup(global_keys);
		placeTiles();

		delete[] extented_keys;
	}

	~Group() {
		delete[] keys;
	}
};

void dfsGroup(Group* group, Tile* t, vector<Tile*>* tiles) {
	int x = t->x, y = t->y;
	if (pos_map[y * WIDTH + x] < 0) {
		return;
	}
	group->tiles.push_back(t);
	pos_map[y * WIDTH + x] = -2;
	for (auto xy : dirs) {
		int dx = x + xy[0], dy = y + xy[1];
		if (dx < 0 || dx >= WIDTH || dy < 0 || dy >= HEIGHT) {
			continue;
		}
		int neighbor = pos_map[dy * WIDTH + dx];
		if (neighbor >= 0) {
			//printf("from %d at (%d, %d) to %d at (%d, %d)\n", t->id, x, y, neighbor, dx, dy);
			dfsGroup(group, (*tiles)[neighbor], tiles);
		}
	}
}

vector<Group*>* generateGroups(vector<Tile*>* tiles) {
	int len = tiles->size();
	auto groups = new vector<Group*>();
	for (auto t : *tiles) {
		if (pos_map[t->y * WIDTH + t->x] < 0) {
			continue;
		}
		auto group = new Group();
		dfsGroup(group, t, tiles);
		groups->push_back(group);
		//printf("\ngroup size: %lu \n\n", group->tiles.size());
	}
	return groups;
}

extern "C" {
	void cluster(Point* tile_positions, int rows, int cols);
}

void cluster(Point* tile_positions, int rows, int cols) {
	int len = rows * cols;
	auto tiles = new vector<Tile*>;
	//auto pos_map = new PosMapping(rows, cols);
	for (int i = 0; i < HEIGHT; ++i) {
		for (int j = 0; j < WIDTH; j++) {
			pos_map[i * WIDTH + j] = -2;
		}
		//memset(pos_map[i], -1, sizeof(int) * cols);
	}

	int min_r = WIDTH, max_r = 0;
	int min_c = HEIGHT, max_c = 0;

	for (int id = 0; id < len; id++)
	{
		int x = tile_positions[id].x;
		int y = tile_positions[id].y;

		min_r = min(y, min_r);
		max_r = max(y, max_r);
		min_c = min(x, min_c);
		max_c = max(x, max_c);

		Tile* t = new Tile(id, x, y);
		//t->print();
		tiles->push_back(t);
		pos_map[y * WIDTH + x] = id;
	}

	//printf("\n");
	DoublePoint mid{ ((double)min_c + max_c) / 2.0, ((double)min_r + max_r) / 2.0 };
	auto groups = generateGroups(tiles);
	for (auto g : *groups) {
		g->init();
		g->refresh_distance(mid);
	}

	auto sortByDis = [](const Group* g1, const Group* g2) {return g1->distance < g2->distance; };

	sort(groups->begin(), groups->end(), sortByDis);

	Group* biggest = *groups->begin();
	for (auto g : *groups) {
		if (!biggest || biggest->tiles.size() < g->tiles.size()) {
			biggest = g;
		}
	}
	mid = biggest->mid;
	for (auto g : *groups) {
		g->refresh_distance(mid);
	}
	sort(groups->begin(), groups->end(), sortByDis);

	ull* global_keys = new ull[HEIGHT];
	memset(global_keys, 0, sizeof(ull) * HEIGHT);
	for (int i = 0; i < HEIGHT; i++) {
		global_keys[i] = 0;
	}

	//cluster logic

	for (auto g : *groups) {
		g->moveTowardCenter(mid, global_keys);
	}

	for (auto t : *tiles) {
		auto p = tile_positions + t->id;
		p->x = t->x;
		p->y = t->y;
	}

	// delete all resource
	delete[] global_keys;
	for (auto g : *groups) {
		delete g;
	}
	delete groups;
	auto t = (*tiles)[0];
	for (auto t : *tiles) {
		delete t;
	}
	delete tiles;
}
