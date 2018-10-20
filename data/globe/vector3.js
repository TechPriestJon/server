function Vector3(x, y, z){
    this.x = x;
    this.y = y;
    this.z = z;

    this.normal = () => {
        let d = 1.0 / this.length();
        return this.multiply(d);
    }
    this.length = () => {
       return this.x*this.x + this.y*this.y + this.z*this.z;
    }
    this.add = (vector) => new Vector3(this.x+vector.x, this.y+vector.y, this.z+vector.z);
    this.multiply = (factor) => new Vector3(this.x * factor,this.y * factor,this.z * factor);
}
exports.Vector3 = Vector3;