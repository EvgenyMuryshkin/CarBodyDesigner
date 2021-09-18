import { Float32BufferAttribute, BufferGeometry } from "three";
import { Generate, IPoint3D } from "./lib";

export interface ISidePlaneProps {
    length: number;
    width: number;
    pointsMapper: (l: number, w: number) => IPoint3D;
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

    constructor(props: ISidePlaneProps) {
        const { length, width, pointsMapper } = props;
        const { vertices, indices, uvs, normals } = this;

        this.props = props;

        for (const l of Generate.range(0, length)) {
            for (const w of Generate.range(0, width)) {
                vertices.push({
                    vertice: pointsMapper(l, w),
                    handlers: []
                });
                uvs.push(0.5, 0.5);
            }
        }

        for (const l of Generate.range(0, length - 1)) {
            for (const w of Generate.range(0, width - 1)) {

                const i0 = l * width + w;
                const i1 = i0 + 1;
                const i2 = i0 + width;
                const i3 = i2 + 1;

                indices.push(
                    i0, i1, i2,
                    i1, i3, i2,
                    i0, i2, i1,
                    i1, i2, i3
                );
            }
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
    }

    public geometry(scale: number): BufferGeometry {
        const { vertices, indices, uvs, normals } = this;

        const r = new BufferGeometry();

        const points: number[] = [];
        vertices.forEach(v => {
            let p = v.vertice;
            v.handlers.forEach(h => {
                p = h(p);
            });
            points.push(p.x * scale, p.y * scale, p.z * scale);
        });

        r.setAttribute('position', new Float32BufferAttribute(points, 3));
        r.setAttribute('normal', new Float32BufferAttribute(normals, 3));
        r.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        r.setIndex(indices);

        return r;
    }
}
