import { Float32BufferAttribute, BufferGeometry, Vector3 } from "three";
import { Generate, IPoint3D } from "./lib";

export enum generationMode {
    Uniform,
    LSymmetrical,
    WSymmetrical,
    LWSymmetrical
}

export enum generationParity {
    All,
    Odd,
    Even
}

export interface ISidePlaneProps {
    length: number;
    width: number;
    pointsMapper: (l: number, w: number) => IPoint3D;
    mode: generationMode;
    parity: generationParity;
    log?: boolean;
}

export type pointMapper = (p: IPoint3D) => IPoint3D;

export interface IVerticeData {
    vertice: IPoint3D;
    handlers: pointMapper[];
}

export class SidePlane {
    props: ISidePlaneProps;
    vertices: IVerticeData[] = [];
    indices: number[] = [];
    uvs: number[] = [];
    normals: number[] = [];

    get offset() {
        return this.props.length * this.props.width;
    }

    constructor(props: ISidePlaneProps) {
        const { length, width, pointsMapper } = props;
        const { vertices, indices, uvs } = this;

        this.props = props;

        for (const l of Generate.range(0, length)) {
            for (const w of Generate.range(0, width)) {
                vertices.push({
                    vertice: pointsMapper(l, w),
                    handlers: []
                });
                uvs.push(0.5, 0.5);
                //uvs.push(1, 1);
            }
        }

        for (const l of Generate.range(0, length)) {
            for (const w of Generate.range(0, width)) {
                const p = pointsMapper(l, w);
                vertices.push({
                    vertice: p,
                    handlers: []
                });
                uvs.push(0.5, 0.5);
                //uvs.push(1, 1);
            }
        }

        const facesFromIndexes = (
            offset: number, 
            l: number, 
            w: number,
            side: "front" | "back"
            ) => {
            const { mode } = this.props;

            const lHalf = (length - 1) / 2;
            const wHalf = (width - 1) / 2;

            const i0 = offset + l * width + w;
            const i1 = i0 + 1;
            const i2 = i0 + width;
            const i3 = i2 + 1;

            switch (side) {
                case "front":
                    switch (mode) {
                        case generationMode.Uniform: 
                            return [
                                i0, i1, i2,
                                i1, i3, i2,
                            ];  
                        case generationMode.LSymmetrical:
                            if ( l < lHalf) {
                                return [
                                    i0, i1, i3,
                                    i0, i3, i2,
                                ]; 
                            }
                            else {
                                return [
                                    i0, i1, i2,
                                    i1, i3, i2,
                                ]; 
                            }  
                        case generationMode.WSymmetrical:
                            if ( w < wHalf) {
                                return [
                                    i0, i1, i3,
                                    i0, i3, i2,
                                ]; 
                            }
                            else {
                                return [
                                    i0, i1, i2,
                                    i1, i3, i2,
                                ]; 
                            }    
                        case generationMode.LWSymmetrical:
                            if ((w < wHalf) === (l < lHalf)) {
                                return [
                                    i0, i1, i3,
                                    i0, i3, i2,
                                ]; 
                            }
                            else {
                                return [
                                    i0, i1, i2,
                                    i1, i3, i2,
                                ]; 
                            }  
                    }
                    break;
                case "back":
                    switch (mode) {
                        case generationMode.Uniform: 
                            return [
                                i0, i2, i1,
                                i1, i2, i3,
                            ]
                        case generationMode.LSymmetrical:
                            if ( l < lHalf) {
                                return [
                                    i0, i3, i1,
                                    i0, i2, i3,
                                ]  
                            }
                            else {
                                return [
                                    i0, i2, i1,
                                    i1, i2, i3,
                                ]  
                            }   
                        case generationMode.WSymmetrical:
                            if ( w < wHalf) {
                                return [
                                    i0, i3, i1,
                                    i0, i2, i3,
                                ]  
                            }
                            else {
                                return [
                                    i0, i2, i1,
                                    i1, i2, i3,
                                ]  
                            } 
                        case generationMode.LWSymmetrical:
                            if ((w < wHalf) === (l < lHalf)) {
                                return [
                                    i0, i3, i1,
                                    i0, i2, i3,
                                ]  
                            }
                            else {
                                return [
                                    i0, i2, i1,
                                    i1, i2, i3,
                                ]  
                            } 
                    }
            }

            return [];
        }

        for (const l of Generate.range(0, length - 1)) {
            for (const w of Generate.range(0, width - 1)) {
                if (!this.parityMatch((l + w) % 2 !== 0)) continue;

                indices.push(...facesFromIndexes(0, l, w, "front"));
            }
        }

        for (const l of Generate.range(0, length - 1)) {
            for (const w of Generate.range(0, width - 1)) {
                if (!this.parityMatch((l + w) % 2 !== 0)) continue;

                indices.push(...facesFromIndexes(this.offset, l, w, "back"));
            }
        }
    }

    private parityMatch(value: boolean) {
        const { parity } = this.props;
        switch (parity) {
            case generationParity.Even: return value === false;
            case generationParity.Odd: return value === true;
            default: return true;
        }
    }

    public apply(handler: (l: number, w: number, p: IVerticeData) => void) {
        const { length, width } = this.props;
        const { vertices } = this;
        for (const l of Generate.range(0, length)) {
            for (const w of Generate.range(0, width)) {
                handler(l, w, vertices[l * width + w]);
            }
        }

        for (const l of Generate.range(0, length)) {
            for (const w of Generate.range(0, width)) {
                handler(l, w, vertices[this.offset + l * width + w]);
            }
        }     
    }

    public geometry(scale: number): BufferGeometry {
        const { vertices, indices, uvs, normals } = this;
        const { log } = this.props;

        const r = new BufferGeometry();

        const points: number[] = [];
        vertices.forEach(v => {
            let p = v.vertice;
            v.handlers.forEach(h => {
                p = h(p);
            });
            points.push(p.x * scale, p.y * scale, p.z * scale);
        });

        const getVector = (index: number) => {
            const vertice =  vertices[index].vertice
            return new Vector3(vertice.x, vertice.y, vertice.z);
        }
        
        let normalIndex = 0;
        const setNormals = (...values: number[]) => {
            for (const value of values) {
                normals[normalIndex++] = value;
            }
        }

        const setNormalVectors = (...values: Vector3[]) => {
            for (const value of values) {
                if (log) console.log(value);
                setNormals(value.x, value.y, value.z);
            }
        }

        for (let idx = 0; idx < indices.length; idx += 3) {
            const v_0_1 = new Vector3().subVectors(getVector(indices[idx + 1]), getVector(indices[idx]));
            const v_0_2 = new Vector3().subVectors(getVector(indices[idx + 2]), getVector(indices[idx]));
            const cross1 = new Vector3().crossVectors(v_0_1, v_0_2).normalize();
            setNormalVectors(cross1, cross1, cross1);
        }
/*
        for (const l of Generate.range(0, length - 1)) {
            for (const w of Generate.range(0, width - 1)) {
                const i0 = l * width + w;
                const i1 = i0 + 1;
                const i2 = i0 + width;
                const i3 = i2 + 1;
    
                const v_0_1 = new Vector3().subVectors(getVector(i1), getVector(i0));
                const v_0_2 = new Vector3().subVectors(getVector(i2), getVector(i0));
                const cross1 = new Vector3().crossVectors(v_0_1, v_0_2).normalize();
                setNormalVectors(cross1, cross1, cross1);

                const v_3_1 = new Vector3().subVectors(getVector(i3), getVector(i1));
                const v_3_2 = new Vector3().subVectors(getVector(i3), getVector(i2));
                const cross2 = new Vector3().crossVectors(v_3_2, v_3_1).normalize();
                setNormalVectors(cross2, cross2, cross2);
            }
        }

        for (const l of Generate.range(0, length - 1)) {
            for (const w of Generate.range(0, width - 1)) {
                const i0 = this.offset + l * width + w;
                const i1 = i0 + 1;
                const i2 = i0 + width;
                const i3 = i2 + 1;
    
                const v_0_1 = new Vector3().subVectors(getVector(i1), getVector(i0));
                const v_0_2 = new Vector3().subVectors(getVector(i2), getVector(i0));
                const cross1 = new Vector3().crossVectors(v_0_2, v_0_1).normalize();
                setNormalVectors(cross1, cross1, cross1);

                const v_3_1 = new Vector3().subVectors(getVector(i3), getVector(i1));
                const v_3_2 = new Vector3().subVectors(getVector(i3), getVector(i2));
                const cross2 = new Vector3().crossVectors(v_3_1, v_3_2).normalize();
                setNormalVectors(cross2, cross2, cross2);
            }
        }
*/

/*
        console.log(points);
        console.log(normals);
        console.log(indices);
*/   
        r.setAttribute('position', new Float32BufferAttribute(points, 3));
        r.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        r.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        r.setIndex(indices);

        r.computeVertexNormals();

        return r;
    }
}
