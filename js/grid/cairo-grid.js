class CairoGrid extends Grid {
    constructor(rows, columns) {
        // with of the inner square
        const w = 1;
        // with of the pentagon edge
        const s = w / Math.sqrt(2 * (1 - Math.cos(3 * Math.PI / 5)));

        const outerDotsGrid = emptyGrid(rows + 1, columns + 1);
        for (let r = 0; r <= rows; r++) {
            for (let c = 0; c <= columns; c++) {
                outerDotsGrid[r][c] = new Dot([],[]);
                outerDotsGrid[r][c].x = c;
                outerDotsGrid[r][c].y = r;
            }
        }

        const innerDotsGrid = emptyGrid(rows, columns);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                innerDotsGrid[r][c] = {
                    d1 : new Dot([],[]),
                    d2 : new Dot([],[])
                }
                if ((r + c) % 2) {
                    // horizontal dots
                    innerDotsGrid[r][c].d1.x = c + (w - s) / 2;
                    innerDotsGrid[r][c].d1.y = r + w / 2;
                    innerDotsGrid[r][c].d2.x = c + (w + s) / 2;
                    innerDotsGrid[r][c].d2.y = r + w / 2;
                } else {
                    // vertical dots
                    innerDotsGrid[r][c].d1.x = c + w / 2;
                    innerDotsGrid[r][c].d1.y = r + (w - s) / 2;
                    innerDotsGrid[r][c].d2.x = c + w / 2;
                    innerDotsGrid[r][c].d2.y = r + (w + s) / 2;
                }
            }
        }

        //4 edges per square + middle one
        const edgesGrid = emptyGrid(rows, columns);
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                if ((r + c) % 2) {
                    edgesGrid[r][c] = {
                        e1: new Edge(outerDotsGrid[r][c], innerDotsGrid[r][c].d1),
                        e2: new Edge(outerDotsGrid[r][c + 1], innerDotsGrid[r][c].d2),
                        e3: new Edge(outerDotsGrid[r + 1][c], innerDotsGrid[r][c].d1),
                        e4: new Edge(outerDotsGrid[r + 1][c + 1], innerDotsGrid[r][c].d2),
                        e5: new Edge(innerDotsGrid[r][c].d1, innerDotsGrid[r][c].d2)
                    }
                } else {
                    edgesGrid[r][c] = {
                        e1: new Edge(outerDotsGrid[r][c], innerDotsGrid[r][c].d1),
                        e2: new Edge(outerDotsGrid[r][c + 1], innerDotsGrid[r][c].d1),
                        e3: new Edge(outerDotsGrid[r + 1][c], innerDotsGrid[r][c].d2),
                        e4: new Edge(outerDotsGrid[r + 1][c + 1], innerDotsGrid[r][c].d2),
                        e5: new Edge(innerDotsGrid[r][c].d1, innerDotsGrid[r][c].d2)
                    }
                }
            }
        }

        function newFace(e1, e2, e3, e4, e5) {
            const dots = [... new Set([e1.d1, e1.d2, e2.d1, e2.d2, e3.d1, e3.d2, e4.d1, e4.d2])];
            const face = new Face(dots, [e1, e2, e3, e4, e5]);
            dots.forEach(d => d.faces.push(face));
            [e1, e2, e3, e4, e5].forEach(e => e[e.f1 ? 'f2' : 'f1'] = face);
            face.cx = dots.reduce((sum, dot) => sum + dot.x, 0) / dots.length;
            face.cy = dots.reduce((sum, dot) => sum + dot.y, 0) / dots.length;
            return face;
        }

        const faces = [];
        for (let r = 0; r < columns; r++) {
            for (let c = 0; c < columns; c++) {
                if ((r + c) % 2) {
                    // build face leaving on top
                    if (r > 0 && c > 0 && c < columns - 1) {
                        faces.push(newFace(edgesGrid[r][c].e5, edgesGrid[r][c].e2, edgesGrid[r - 1][c].e4, edgesGrid[r - 1][c].e3, edgesGrid[r][c].e1));
                    }
                    // build face leaving bottom
                    if (c > 0 && c < columns - 1 && r < rows - 1) {
                        faces.push(newFace(edgesGrid[r][c].e5, edgesGrid[r][c].e4, edgesGrid[r + 1][c].e2, edgesGrid[r + 1][c].e1, edgesGrid[r][c].e3));
                    }
                } else {
                    // build face leaving left
                    if (c > 0 && r > 0 && r < rows - 1) {
                        faces.push(newFace(edgesGrid[r][c].e5, edgesGrid[r][c].e3, edgesGrid[r][c - 1].e4, edgesGrid[r][c - 1].e2, edgesGrid[r][c].e1));
                    }
                    // build face leaving right
                    if (c < columns - 1 && r > 0 && r < rows - 1) {
                        faces.push(newFace(edgesGrid[r][c].e5, edgesGrid[r][c].e4, edgesGrid[r][c + 1].e3, edgesGrid[r][c + 1].e1, edgesGrid[r][c].e2))
                    }
                }
            }
        }

        const dots = outerDotsGrid.flatMap(r => r)
            .concat(...innerDotsGrid.flatMap(r => r).flatMap(v => [v.d1, v.d2]))
            .filter(d => d.faces.length);
        const edges = edgesGrid.flatMap(r => r).flatMap(v => [v.e1, v.e2, v.e3, v.e4, v.e5])
            .filter(edge => edge.f1 || edge.f2);

        edges.forEach(edge => {
            edge.d1.edges.push(edge);
            edge.d2.edges.push(edge);
        });

        super(faces, edges, dots);

        this.rows = rows;
        this.columns = columns;
    }

    getWidth() {
        return this.columns;
    }

    getHeight() {
        return this.rows;
    }
}