var Grid = require("./grid.js").Grid;
var Vector3 = require("./vector3.js").Vector3;
var Simplex = require('perlin-simplex');

function create(size, scale){
	let g = size_n_grid(size, scale);
	let vectors = Array.from(g.corners.map(c => c.v).filter(onlyUnique))
	let simplex = new Simplex();
	let sA = 5;
	let sB = 10;
	let earth = {
		vertices: vectors.map(v => {
			let h = 1;
			h += 0.2 * simplex.noise3d(sA*v.x, sA*v.y, sA*v.z);
			h += simplex.noise3d(sB*v.x, sB*v.y, sB*v.z);
			return ({x: v.x, y: v.y, z: v.z, h: h})
		}),
		tiles: g.tiles.map(tile => tile.corners.map(corner => vectors.indexOf(corner.v))),
	}
	return earth;
}

function size_n_grid(size, scale) {
	if (size === 0) {
		return size_0_grid(scale);
	}
	else {
		return _subdivided_grid(size_n_grid(size-1, scale));
	}
}

function size_0_grid(scale) {
	let grid = new Grid(0);
	// let x = -0.525731112119133606;
	// let z = -0.850650808352039932;
	let x = -0.525731112119133606 * scale;
	let z = -0.850650808352039932 * scale;

	let icos_tiles = [
		new Vector3(-x, 0, z), new Vector3(x, 0, z),new Vector3(-x, 0, -z),new Vector3(x, 0, -z),
		new Vector3(0, z, x), new Vector3(0, z, -x),new Vector3(0, -z, x), new Vector3(0, -z, -x),
		new Vector3(z, x, 0), new Vector3(-z, x, 0),new Vector3(z, -x, 0),new Vector3(-z, -x, 0)
    ];
	
	let icos_tiles_n = [
		[9, 4, 1, 6, 11], [4, 8, 10, 6, 0], [11, 7, 3, 5, 9], [2, 7, 10, 8, 5],
		[9, 5, 8, 1, 0], [2, 3, 8, 4, 9], [0, 1, 10, 7, 11], [11, 6, 10, 3, 2],
		[5, 3, 10, 1, 4], [2, 5, 4, 0, 11], [3, 7, 6, 1, 8], [7, 2, 9, 0, 6]
    ];
	
    for (let i=0;i<grid.tiles.length;i++) {
        let t = grid.tiles[i];
		t.v = icos_tiles[t.id];
		for (let k=0; k<5; k++) {
			t.tiles[k] = grid.tiles[icos_tiles_n[t.id][k]];
		}
	}
	for (let i=0; i<5; i++) {
		_add_corner(i, grid, 0, icos_tiles_n[0][(i+4)%5], icos_tiles_n[0][i]);
	}
	for (let i=0; i<5; i++) {
		_add_corner(i+5, grid, 3, icos_tiles_n[3][(i+4)%5], icos_tiles_n[3][i]);
	}
	_add_corner(10,grid,10,1,8);
	_add_corner(11,grid,1,10,6);
	_add_corner(12,grid,6,10,7);
	_add_corner(13,grid,6,7,11);
	_add_corner(14,grid,11,7,2);
	_add_corner(15,grid,11,2,9);
	_add_corner(16,grid,9,2,5);
	_add_corner(17,grid,9,5,4);
	_add_corner(18,grid,4,5,8);
	_add_corner(19,grid,4,8,1);
	
	//_add corners to corners
	for (let i=0;i<grid.corners.length;i++) {
        let c = grid.corners[i];
		for (let k=0; k<3; k++) {
			c.corners[k] = c.tiles[k].corners[(c.tiles[k].position_corner(c)+1)%5];
		}
	}
	//new edges
	let next_edge_id = 0;
	for (let i=0;i<grid.tiles.length;i++) {
        let t=grid.tiles[i]
		for (let k=0; k<5; k++) {
			if (t.edges[k] === null) {
				_add_edge(next_edge_id, grid, t.id, icos_tiles_n[t.id][k]);
				next_edge_id++;
			}
		}
	}
	return grid;
}

function _subdivided_grid (prev) {
	let grid = new Grid(prev.size + 1);

	let prev_tile_count = prev.tiles.length;
	let prev_corner_count = prev.corners.length;
	
	//old tiles
	for (let i=0; i<prev_tile_count; i++) {
		grid.tiles[i].v = prev.tiles[i].v;
		for (let k=0; k<grid.tiles[i].edge_count; k++) {
			grid.tiles[i].tiles[k] = grid.tiles[prev.tiles[i].corners[k].id+prev_tile_count];
		}
	}
	//old corners become tiles
	for (let i=0; i<prev_corner_count; i++) {
		grid.tiles[i+prev_tile_count].v = prev.corners[i].v;
		for (let k=0; k<3; k++) {
			grid.tiles[i+prev_tile_count].tiles[2*k] = grid.tiles[prev.corners[i].corners[k].id+prev_tile_count];
			grid.tiles[i+prev_tile_count].tiles[2*k+1] = grid.tiles[prev.corners[i].tiles[k].id];
		}
	}
	//new corners
	let next_corner_id = 0;
	for (let i=0;i<prev.tiles.length;i++) {
        let n = prev.tiles[i]
		let t = grid.tiles[n.id];
		for (let k=0; k<t.edge_count; k++) {
			_add_corner(next_corner_id, grid, t.id, t.tiles[(k+t.edge_count-1)%t.edge_count].id, t.tiles[k].id);
			next_corner_id++;
		}
	}
	//connect corners
	for (let i=0;i<grid.corners.length;i++) {
        let c = grid.corners[i];
		for (let k=0; k<3; k++) {
			c.corners[k] = c.tiles[k].corners[(c.tiles[k].position_corner(c)+1)%(c.tiles[k].edge_count)];
		}
	}
	//new edges
    let next_edge_id = 0;
	for (let i=0;i<grid.tiles.length;i++) {
        let t = grid.tiles[i];
		for (let k=0; k<t.edge_count; k++) {
			if (t.edges[k] === null) {
				_add_edge(next_edge_id, grid, t.id, t.tiles[k].id);
				next_edge_id++;
			}
		}
	}
	return grid;
}

function _add_corner (id, grid, t1, t2, t3) {
	let c = grid.corners[id];
	let t = [grid.tiles[t1], grid.tiles[t2], grid.tiles[t3]];
	let v = t[0].v.add(t[1].v).add(t[2].v);
	c.v = v.normal();
	for (let i=0; i<3; i++) {
		t[i].corners[t[i].position_tile(t[(i+2)%3])] = c;
		c.tiles[i] = t[i];
	}
}
function _add_edge (id, grid, t1, t2) {
	let e = grid.edges[id];
	let t = [grid.tiles[t1], grid.tiles[t2]];
	let c = [
		grid.corners[t[0].corners[t[0].position_tile(t[1])].id],
        grid.corners[t[0].corners[(t[0].position_tile(t[1])+1)%t[0].edge_count].id]
    ];
	for (let i=0; i<2; i++) {
		t[i].edges[t[i].position_tile(t[(i+1)%2])] = e;
		e.tiles[i] = t[i];
		c[i].edges[c[i].position_corner(c[(i+1)%2])] = e;
		e.corners[i] = c[i];
	}
}

function onlyUnique(value, index, self) { 
	return self.indexOf(value) === index;
}
exports.create = create;