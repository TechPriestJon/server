function Corner(id){
    this.id = id;
    this.tiles = new Array(3);
    this.corners = new Array(3);
    this.edges = new Array(3);

    this.position_tile = (c, t) => {
        for (let i=0; i<3; i++)
            if (c.tiles[i] === t)
                return i;
        return -1;
    }
    this.position_corner = (c, n) => {
        for (let i=0; i<3; i++)
            if (c.corners[i] === n)
                return i;
        return -1;
    }
    this.position_edge = (c, e) => {
        for (let i=0; i<3; i++)
            if (c.edges[i] === e)
                return i;
        return -1;
    }
}
exports.Corner = Corner;