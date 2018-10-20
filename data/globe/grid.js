var Tile = require("./tile.js").Tile;
var Corner = require("./corner.js").Corner;
var Edge = require("./edge.js").Edge;

function Grid (s) {
    this.tiles = [];
    this.corners = [];
    this.edges = [];

    this.tile_count = (size) => 10*Math.pow(3,size)+2;
    this.corner_count = (size) => 20*Math.pow(3,size);
    this.edge_count = (size) => 30*Math.pow(3,size);

	for (let i=0; i<this.tile_count(s); i++) {
        this.tiles.push(new Tile(i, i<12 ? 5 : 6));
    }
	for (let i=0; i<this.corner_count(s); i++) {
        this.corners.push(new Corner(i));
    }
	for (let i=0; i<this.edge_count(s); i++) {
        this.edges.push(new Edge(i));
    }
}
exports.Grid = Grid;