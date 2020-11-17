
/**
 * 
 * FIX SOME STUPID THREE JS ERROR MESSAGES
 * https://github.com/mrdoob/three.js/issues/19735
 * 
 */
var ThreePatcher = {
    patch: function () {
        //THREE.InterleavedBufferAttribute.prototype.getX = function (index) { return this.data.array[index * this.data.stride + this.offset] || 0; };
        //THREE.InterleavedBufferAttribute.prototype.getY = function (index) { return this.data.array[index * this.data.stride + this.offset + 1] || 0; };
        THREE.InterleavedBufferAttribute.prototype.getZ = function (index) { return this.data.array[index * this.data.stride + this.offset + 2] || 0; };
        //THREE.InterleavedBufferAttribute.prototype.getW = function (index) { return this.data.array[index * this.data.stride + this.offset + 3] || 0; };

        //THREE.BufferAttribute.prototype.getX = function (index) { return this.array[index * this.itemSize] || 0; };
        //THREE.BufferAttribute.prototype.getY = function (index) { return this.array[index * this.itemSize + 1] || 0; };
        THREE.BufferAttribute.prototype.getZ = function (index) { return this.array[index * this.itemSize + 2] || 0; };
        //THREE.BufferAttribute.prototype.getW = function (index) { return this.array[index * this.itemSize + 3] || 0; };
    }
}