function Tile(id, edge_count){
    this.id = id;
    this.tiles = new Array(edge_count);
    this.corners = new Array(edge_count);
    this.edges = new Array(edge_count);
    this.edge_count = edge_count;

    this.position_tile = (n) => {
        for (let i=0; i<this.edge_count; i++)
            if (this.tiles[i] === n)
                return i;
        return -1;
    }
    
    this.position_corner = (c) => {
        for (let i=0; i<this.edge_count; i++)
            if (this.corners[i] === c)
                return i;
        return -1;
    }
    
    this.position_edge = (e) => {
        for (let i=0; i<this.edge_count; i++)
            if (this.edges[i] === e)
                return i;
        return -1;
    }
}
exports.Tile = Tile;