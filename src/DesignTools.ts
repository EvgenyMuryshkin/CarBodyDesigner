import { IDesign } from "./DesignStore";
import { Generate, IPoint2D } from "./lib";

export class DesignTools {
    constructor(private design: IDesign) {

    }

    interpolateSections() {
        const { design } = this;
        const { boxSize, frontSegments, frontPoints  } = design;

        const interpolatedSegments: IPoint2D[][] = [...frontSegments];

        // prefill first segmet with from countour
        if (!interpolatedSegments[0]) interpolatedSegments[0] = [...frontPoints];
          
        const sectionsIndexes = Generate.range(0, boxSize.x);
        const existingSections = sectionsIndexes.filter(i => interpolatedSegments[i]);
          
        for (let idx = 0; idx < existingSections.length - 1; idx++)
        {
            const startSectionIdx = existingSections[idx];
            const startSection = interpolatedSegments[startSectionIdx];

            const nextSectionIdx = existingSections[idx + 1];
            const nextSection = interpolatedSegments[nextSectionIdx];
            const dx = nextSectionIdx - startSectionIdx;
            const dy = Generate.range(0, boxSize.y).map(i => (nextSection[i].y - startSection[i].y) / dx);

            for (let sectionIdx = startSectionIdx + 1; sectionIdx < nextSectionIdx; sectionIdx++) {
                const interpolatedSection = Generate.range(0, boxSize.y).map((i): IPoint2D => ({
                    x: i,
                    y: startSection[i].y + dy[i] * (sectionIdx - startSectionIdx)
                }));
                interpolatedSegments[sectionIdx] = interpolatedSection;
            }
        }

        return interpolatedSegments;
    }
}