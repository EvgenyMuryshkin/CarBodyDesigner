import { Float32BufferAttribute, BufferGeometry, Vector3, BufferAttribute } from "three";
import { Generate, IPoint2D, IPoint3D } from "./lib";

export class Geom extends BufferGeometry {
    vertices: number[] = [];
    indices: number[] = [];
    normals: number[] = [];
    uvs: number[] = [];
    geometryScale: number = 5;

    constructor(
        private length: number, 
        private width: number, 
        private height: number
        ) {
        super();
        this.create();
    }

    private create() {
        const { geometryScale, length, width, height } = this;
        const halfWidth = width / 2;

        for (const idx of Generate.range(0, length)) {
            this.vertices.push(
                idx * geometryScale, 0, halfWidth, 
                idx * geometryScale, 0, halfWidth
            );
            this.uvs.push(0.5, 0.5);
            this.normals.push(
                0, 0, 0, 
                0, 0, 0, 
                0, 0, 0, 
                0, 0, 0
            );
        }
        
        for (const idx of Generate.range(0, length - 1)) {
            var offset = idx * 2;
            const i0 = offset;
            const i1 = offset + 1;
            const i2 = offset + 2;
            const i3 = offset + 3;

            this.indices.push(
                i0, i1, i2, 
                i1, i3, i2, 
                i0, i2, i1, 
                i1, i2, i3
            );
        }

        this.setIndex(this.indices);
        this.setAttribute('position', new Float32BufferAttribute(this.vertices, 3));
        this.setAttribute('normal', new Float32BufferAttribute(this.normals, 3));
        this.setAttribute('uv', new Float32BufferAttribute(this.uvs, 2));

        console.log("Length", this.length);
    }

    update(points: IPoint2D[]) {
        const { 
            length,
            width,
            geometryScale,
            //vertices, 
            indices, 
            normals, 
            uvs 
        } = this;
        const halfWidth = width / 2;

        //const indices = this.getIndex()?.array as number[];
        const position = this.attributes.position as BufferAttribute;
        const vertices = position.array as number[];

        let verticeIndex = 0;
        const setVertices = (...values: number[]) => {
            for (const value of values) {
                vertices[verticeIndex++] = value;
            }
        }

        let indexIndex = 0;
        const setIndices = (...values: number[]) => {
            for (const value of values) {
                indices[indexIndex++] = value;
            }
        }

        let normalIndex = 0;
        const setNormals = (...values: number[]) => {
            for (const value of values) {
                normals[normalIndex++] = value;
            }
        }

        for (const idx of Generate.range(0, points.length)) {
            setVertices(idx * geometryScale, points[idx].y * geometryScale, halfWidth);
            setVertices(idx * geometryScale, 0, halfWidth);
        }
/*
        const getVector = (index: number) => {
            const abs = index * 3;
            return new Vector3(vertices[abs], vertices[abs + 1], vertices[abs + 2]);
        }

        for (const idx of Generate.range(0, length - 1)) {
            var offset = idx * 2;
            const i0 = offset;
            const i1 = offset + 1;
            const i2 = offset + 2;
            const i3 = offset + 3;

            const v1 = new Vector3().subVectors(getVector(i1), getVector(i0));
            const v2 = new Vector3().subVectors(getVector(i2), getVector(i0));
            const cross1 = new Vector3().crossVectors(v2, v1).normalize();
            const cross2 = new Vector3().crossVectors(v1, v2).normalize();

            setNormals(cross1.x, cross1.y, cross1.z);
            setNormals(cross1.x, cross1.y, cross1.z);
            setNormals(cross2.x, cross2.y, cross2.z);
            setNormals(cross2.x, cross2.y, cross2.z);
        }
*/

        //this.setIndex(indices);
        //this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        //this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        //this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        
        //this.setIndex(indices);
        //(this.attributes.position as BufferAttribute).needsUpdate = true;
        //(this.attributes.position as BufferAttribute).needsUpdate = true;
        //this.attributes.position.needsUpdate = true

        position.needsUpdate = true;
        //this.setDrawRange(0, 100);
        //this.computeBoundingBox();
        //this.computeBoundingSphere();

        console.log("Points Length", points.length);
    }
}
