class HexagonGrid extends Grid {
    constructor(rows, columns) {

        const dotsGrid = emptyArray(2 * rows + 2);
        for (let row = 0; row < 2 * rows + 2; row++) {
            const size = row === 0 || row === 2 * rows + 1 ? columns : columns + 1;
            dotsGrid[row] = emptyArray(size);
            for (let col = 0; col < size; col++) {
                dotsGrid[row][col] = new Dot([], []);
            }
        }

        const facesGrid = emptyGrid(rows, columns);
        for(let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const dots = [
                    dotsGrid[2 * row][col + row  % 2],
                    dotsGrid[2 * row + 1][col + 1],
                    dotsGrid[2 * row + 2][col + 1],
                    dotsGrid[2 * row + 3][col + ((row % 2 === 1 && row < rows - 1) ? 1 : 0)],
                    dotsGrid[2 * row + 2][col],
                    dotsGrid[2 * row + 1][col],
                ]
                facesGrid[row][col] = new Face(dots, []);
            }
        }

        const vEdgesGrid = emptyGrid(rows, columns + 1);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns + 1; col++) {
                const d1 = dotsGrid[2 * row + 1][col];
                const d2 = dotsGrid[2 * row + 2][col];
                vEdgesGrid[row][col] = new Edge(d1, d2);
            }
        }

        const odd = rows % 2 === 1;
        const dEdgesGrid = emptyArray(rows + 1);
        for (let row = 0; row < rows + odd ? 1 : 0; row++) {
            dEdgesGrid[row] = emptyArray(row === 0 ? 2 * columns : 2 * columns + 1);
            const offset = row % 2;
            if (offset) {
                const d1 = dotsGrid[2 * row][0];
                const d2 = dotsGrid[2 * row + 1][0];
                dEdgesGrid[row][0] = new Edge(d1, d2);
            }
            for (let col = 0; col < columns; col++) {
                const d1 = dotsGrid[2 * row + 1][col];
                const d2 = dotsGrid[2 * row][col + offset];
                const d3 = dotsGrid[2 * row + 1][col + 1];
                dEdgesGrid[row][2 * col + offset] = new Edge(d1, d2);
                if (d3 !== undefined) {
                    dEdgesGrid[row][2 * col + 1 + offset] = new Edge(d2, d3);
                }
            }
            if (!offset && row) {
                const d1 = dotsGrid[2 * row + 1][columns];
                const d2 = dotsGrid[2 * row][columns];
                dEdgesGrid[row][2 * columns] = new Edge(d1, d2);
            }
        }
        // when number of rows is even the last row of is somewhat special
        if (!odd) {
            dEdgesGrid[rows] = emptyArray(2 * columns);
            for (let col = 0; col < columns; col++) {
                const d1 = dotsGrid[2 * rows][col];
                const d2 = dotsGrid[2 * rows + 1][col];
                const d3 = dotsGrid[2 * rows][col + 1];
                dEdgesGrid[rows][2 * col] = new Edge(d1, d2);
                dEdgesGrid[rows][2 * col + 1] = new Edge(d2, d3);
            }
        }

        // connect faces with edges
        for (let row = 0; row < rows; row++) {
            const offset = row % 2;
            for (let col = 0; col < columns; col++) {
                facesGrid[row][col].edges = [
                    dEdgesGrid[row][2 * col + 1 + offset],
                    vEdgesGrid[row][col + 1],
                    dEdgesGrid[row + 1][2 * col + 1 + ((row === rows - 1) && (rows % 2 === 0) ? 0 : offset)],
                    dEdgesGrid[row + 1][2 * col + ((row === rows - 1) && (rows % 2 === 0) ? 0 : offset)],
                    vEdgesGrid[row][col],
                    dEdgesGrid[row][2 * col + offset]
                ];
            }
        }

        const faces = facesGrid.flatMap(row => row);
        const edges = vEdgesGrid.flatMap((row) => row).concat(...dEdgesGrid.flatMap((row) => row));
        const dots = dotsGrid.flatMap(row => row);
        super(faces, edges, dots);

        // finish connections
        faces.forEach(face => {
           face.dots.forEach(dot => dot.faces.push(face));
           face.edges.forEach(edge => edge[!edge.f1 ? 'f1' : 'f2'] = face);
        });
        edges.forEach(edge => {
            edge.d1.edges.push(edge);
            edge.d2.edges.push(edge);
        });

        this.rows = rows;
        this.columns = columns;

        this.dotsGrid = dotsGrid;
        this.facesGrid = facesGrid;
        this.dEdgesGrid = dEdgesGrid;

        this.computeCoordinates();
    }

    // creates unit grid = each haz has the size of 1
    computeCoordinates() {
        const w = 1;
        const h = 1;

        const w2 = w / 2;
        const h2 = h / 2;
        const h3 = 3 * h / 4;
        const h4 = h / 4;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const offset = (row % 2) * w2;
                const face = this.facesGrid[row][col];
                face.dots[0].x = offset + w2 + col * w;
                face.dots[0].y = row * h3;
                face.dots[1].x = offset + col * w + w;
                face.dots[1].y = row * h3 + h4;
                face.dots[2].x = offset + col * w + w;
                face.dots[2].y = (row + 1) * h3;
                face.dots[3].x = offset + w2 + col * w;
                face.dots[3].y = (row + 1) * h3 + h4;
                face.dots[4].x = offset + col * w;
                face.dots[4].y = (row + 1) * h3;
                face.dots[5].x = offset + col * w;
                face.dots[5].y = row * h3 + h4;

                face.cx = face.dots[0].x;
                face.cy = face.dots[0].y + h2;
            }
        }
    }

    getWidth() {
        return this.columns + 0.5;
    }

    getHeight() {
        return (3 * this.rows) / 4 + 0.25;
    }
}