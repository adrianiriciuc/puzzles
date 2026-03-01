class PentagramGrid extends Grid {
    constructor(size) {
        if (size % 3) {
            throw new Error('size must be a multiple of 3');
        }

        const dotsMap = new Map();
        const edgeMap = new Map();
        const facesMap = new Map();

        const dots = [];
        const edges = [];
        const faces = [];

        function dk(x, y) {
            const vx = Math.round(x * 100) / 100;
            const vy = Math.round(y * 100) / 100;
            return `${vx}-${vy}`;
        }

        function ek(d1, d2) {
            const a = d1.id < d2.id ? d1.id : d2.id;
            const b = d1.id < d2.id ? d2.id : d1.id;
            return `${a}-${b}`;
        }

        function fk(d1, d2, d3) {
            const dots = [d1, d2, d3].sort((a, b) => {
                if (a.id < b.id) {
                    return -1;
                } else if (a.id > b.id) {
                    return 1;
                } else {
                    return 0;
                }
            });
            return `${dots[0].id}-${dots[1].id}-${dots[2].id}`;
        }

        function getOrCreateDot(x, y) {
            const key = dk(x, y);
            if (dotsMap.has(key)) {
                return dotsMap.get(key);
            }

            const dot = new Dot([], []);
            dot.id = dots.length;
            dot.x = x;
            dot.y = y;

            dots.push(dot);
            dotsMap.set(key, dot);
            return dot;
        }


        function getOrCreateEdge(d1, d2) {
            const key = ek(d1, d2);
            if (edgeMap.has(key)) {
                return edgeMap.get(key);
            }

            const edge = new Edge(d1, d2);

            edges.push(edge);
            edgeMap.set(key, edge);

            d1.edges.push(edge);
            d2.edges.push(edge);

            return edge;
        }

        function addFace(edge, face) {
            if (!edge.f1) {
                edge.f1 = face;
            } else {
                edge.f2 = face;
            }
        }

        function getOrCreateFace(d1, d2, d3) {
            const key = fk(d1, d2, d3);
            if (facesMap.has(key)) {
                return facesMap.get(key);
            }

            const e1 = getOrCreateEdge(d1, d2);
            const e2 = getOrCreateEdge(d2, d3);
            const e3 = getOrCreateEdge(d3, d1);

            const face = new Face([d1, d2, d3], [e1, e2, e3]);
            face.cx = (d1.x + d2.x + d3.x) / 3;
            face.cy = (d1.y + d2.y + d3.y) / 3;

            faces.push(face);

            d1.faces.push(face);
            d2.faces.push(face);
            d3.faces.push(face);

            addFace(e1, face);
            addFace(e2, face);
            addFace(e3, face);

            facesMap.set(key, face);

            return face;
        }

        const h = Math.sqrt(3) / 2;
        const w = 1;

        // generate upside triangle
        for (let r = 0; r < size; r++) {
            const sx = size / 2 - r * w / 2;
            const sy = r * h;

            for (let c = 0; c <= r; c++) {
                // Upward triangle
                getOrCreateFace(
                    getOrCreateDot(sx + c * w, sy),
                    getOrCreateDot(sx + c * w - w / 2, sy + h),
                    getOrCreateDot(sx + c * w + w / 2, sy + h));

                // Downward triangle (if exists)
                if (c < r) {
                    getOrCreateFace(
                        getOrCreateDot(sx + c * w, sy),
                        getOrCreateDot(sx + c * w + w, sy),
                        getOrCreateDot(sx + c * w + w / 2, sy + h));
                }
            }
        }

        // generate downside triangle, bottom to top
        for (let r = 0; r < size; r++) {
            const sx = size / 2 - r * w / 2;
            const sy = size / 3 * h + (size - r - 1) * h;
            for (let c = 0; c <= r; c++) {
                // Downward triangle
                getOrCreateFace(
                    getOrCreateDot(sx + c * w - w / 2, sy),
                    getOrCreateDot(sx + c * w + w / 2, sy),
                    getOrCreateDot(sx + c * w, sy + h));

                // Upward triangle (if exists)
                if (c < r) {
                    getOrCreateFace(
                        getOrCreateDot(sx + c * w + w /2, sy),
                        getOrCreateDot(sx + c * w, sy + h),
                        getOrCreateDot(sx + c * w + w, sy + h));
                }
            }
        }

        super(faces, edges, dots);

        this.size = size;
        this.width = size;
        this.height = (Math.sqrt(3) / 2) * (size + size / 3);
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }
}