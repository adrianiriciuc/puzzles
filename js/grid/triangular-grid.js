class TriangularGrid extends Grid {
    constructor(size) {
        const dotsMap = new Map();
        const edgeMap = new Map();

        const dots = [];
        const edges = [];
        const faces = [];

        function dotKey(r, c) {
            return `${r},${c}`;
        }

        function edgeKey(d1, d2) {
            const a = d1.id < d2.id ? d1.id : d2.id;
            const b = d1.id < d2.id ? d2.id : d1.id;
            return `${a}-${b}`;
        }

        function getOrCreateDot(r, c) {
            const key = dotKey(r, c);
            if (dotsMap.has(key)) {
                return dotsMap.get(key);
            }

            const dot = new Dot([], []);
            dot.id = dots.length;

            dots.push(dot);
            dotsMap.set(key, dot);
            return dot;
        }

        function getOrCreateEdge(d1, d2) {
            const key = edgeKey(d1, d2);
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

        function createFace(d1, d2, d3) {
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

            return face;
        }

        // generate dots, so that the edges have width = 1
        const h = Math.sqrt(3) / 2;
        for (let r = 0; r <= size; r++) {
            const sx = size / 2 - r / 2;
            const sy = r * h;
            for (let c = 0; c <= r; c++) {
                const dot = getOrCreateDot(r, c);
                dot.x = sx + c;
                dot.y = sy;
            }
        }

        // generate faces
        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= r; c++) {
                // Upward triangle
                createFace(
                    getOrCreateDot(r, c),
                    getOrCreateDot(r + 1, c),
                    getOrCreateDot(r + 1, c + 1));

                // Downward triangle (if exists)
                if (c < r) {
                    createFace(
                        getOrCreateDot(r, c),
                        getOrCreateDot(r, c + 1),
                        getOrCreateDot(r + 1, c + 1));
                }
            }
        }


        super(faces, edges, dots);

        this.size = size;
        this.width = size;
        this.height = (Math.sqrt(3) / 2) * size;
    }

    getWidth() {
        return this.width;
    }

    getHeight() {
        return this.height;
    }
}