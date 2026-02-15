class HoneycombGrid extends Grid {
    constructor(size) {

        //build dots grid without connections to edges and faces
        const dotsGrid = emptyArray(4 * size);
        for (let row = 0; row < size; row++) {
            const columns = size + row;
            dotsGrid[2 * row] = emptyArray(columns);
            dotsGrid[2 * row + 1] = emptyArray(columns + 1);
            dotsGrid[4 * size - 2 * row - 1] = emptyArray(columns);
            dotsGrid[4 * size - 2 * row - 2] = emptyArray(columns + 1);
            for (let col = 0; col < columns; col++) {
                dotsGrid[2 * row][col] = new Dot([], []);
                dotsGrid[2 * row + 1][col] = new Dot([], []);
                dotsGrid[4 * size - 2 * row - 1][col] = new Dot([], []);
                dotsGrid[4 * size - 2 * row - 2][col] = new Dot([], []);
            }
            dotsGrid[2 * row + 1][columns] = new Dot([], []);
            dotsGrid[4 * size - 2 * row - 2][columns] = new Dot([], []);
        }

        //build all faces with the connected dots, but with empty edges
        const facesGrid = emptyArray(2 * size - 1);
        for (let row = 0; row < size; row++) {
            const columns = size + row;
            facesGrid[row] = emptyArray(columns);
            if (row !== size - 1) {
                facesGrid[2 * size - row - 2] = emptyArray(columns);
            }
            for (let col = 0; col < columns; col++) {
                facesGrid[row][col] = new Face(getDotsForFace(row, col), []);
                if (row !== size - 1) {
                    facesGrid[2 * size - row - 2][col] = new Face(getDotsForFace(2 * size - row - 2, col + 1), []);
                }
            }
        }

        //build diagonal edges connected to the dots and faces
        const dEdgesGrid = emptyArray(2 * size );
        for (let row = 0; row < size; row++) {
            const columns = size + row;
            dEdgesGrid[row] = emptyArray(2 * columns);
            dEdgesGrid[2 * size - row - 1] = emptyArray(2 * columns);
            for (let col = 0; col < columns; col++) {
                dEdgesGrid[row][2 * col] = new Edge(dotsGrid[2 * row][col], dotsGrid[2 * row + 1][col]);
                dEdgesGrid[row][2 * col].f1 = row > 0 && col > 0 ? facesGrid[row - 1][col - 1] : null;
                dEdgesGrid[row][2 * col].f2 = facesGrid[row][col];
                dEdgesGrid[row][2 * col + 1] = new Edge(dotsGrid[2 * row][col], dotsGrid[2 * row + 1][col + 1]);
                dEdgesGrid[row][2 * col + 1].f1 = row > 0 && col < columns ? facesGrid[row - 1][col] : null;
                dEdgesGrid[row][2 * col + 1].f2 = facesGrid[row][col];
                dEdgesGrid[2 * size - row - 1][2 * col] = new Edge(dotsGrid[4 * size - 2 * row - 1][col], dotsGrid[4 * size - 2 * row - 2][col]);
                dEdgesGrid[2 * size - row - 1][2 * col].f1 = facesGrid[2 * size - row - 2][col];
                dEdgesGrid[2 * size - row - 1][2 * col].f2 = row > 0 && col > 0 ? facesGrid[2 * size - row - 1][col - 1] : null;
                dEdgesGrid[2 * size - row - 1][2 * col + 1] = new Edge(dotsGrid[4 * size - 2 * row - 1][col], dotsGrid[4 * size - 2 * row - 2][col + 1]);
                dEdgesGrid[2 * size - row - 1][2 * col + 1].f1 = facesGrid[2 * size - row - 2][col];
                dEdgesGrid[2 * size - row - 1][2 * col + 1].f2 = row > 0 && col < columns ? facesGrid[2 * size - row - 1][col] : null;
            }
        }

        //build vertical edges connected to the dots and faces
        const vEdgesGrid = emptyArray(2 * size - 1);
        for (let row = 0; row < size; row++) {
            const columns = size + row + 1;
            vEdgesGrid[row] = emptyArray(columns);
            if (row !== size - 1) {
                vEdgesGrid[2 * size - row - 2] = emptyArray(columns);
            }
            for (let col = 0; col < columns; col++) {
                vEdgesGrid[row][col] = new Edge(dotsGrid[2 * row + 1][col], dotsGrid[2 * row + 2][col]);
                vEdgesGrid[row][col].f1 = col > 0 ? facesGrid[row][col - 1] : null;
                vEdgesGrid[row][col].f2 = col < columns ? facesGrid[row][col] : null;
                if (row !== size - 1) {
                    vEdgesGrid[2 * size - row - 2][col] = new Edge(dotsGrid[4 * size - 2 * row - 2][col], dotsGrid[4 * size - 2 * row - 3][col]);
                    vEdgesGrid[2 * size - row - 2][col].f1 = col > 0 ? facesGrid[2 * size - row - 2][col - 1] : null;
                    vEdgesGrid[2 * size - row - 2][col].f2 = col < columns ? facesGrid[2 * size - row - 2][col] : null;
                }
            }
        }

        function getDotsForFace(row, col) {
            const halfDx = row < size ? 0 : -1;
            return [
                dotsGrid[2 * row][col],
                dotsGrid[2 * row + 1][col + 1 + halfDx],
                dotsGrid[2 * row + 2][col + 1 + halfDx],
                dotsGrid[2 * row + 3][col + 1 + 2 * halfDx + (row === size - 1 ? -1 : 0)],
                dotsGrid[2 * row + 2][col + halfDx],
                dotsGrid[2 * row + 1][col + halfDx]
            ];
        }

        // connect faces with edges
        for (let row = 0; row < size; row++) {
            const columns = size + row;
            for (let col = 0; col < columns; col++) {
                facesGrid[row][col].edges = getEdgesForFace(row, col);
                facesGrid[2 * size - row - 2][col].edges = getEdgesForFace(2 * size - row - 2, col);
            }
        }

        function getEdgesForFace(row, col) {
            return [
                dEdgesGrid[row][2 * col + 1 + (row < size ? 0 : 1)],
                vEdgesGrid[row][col + 1],
                dEdgesGrid[row + 1][2 * col + 2 + (row < size ? 0 : -1) + (row === size - 1 ? -1 : 0)],
                dEdgesGrid[row + 1][2 * col + 1 + (row < size ? 0 : -1) + (row === size - 1 ? -1 : 0)],
                vEdgesGrid[row][col],
                dEdgesGrid[row][2 * col + (row < size ? 0 : 1)]
            ];
        }

        // connect dots with faces and edges
        for (let row = 0; row < size; row++) {
            const columns = size + row;
            for (let col = 0; col < columns; col++) {
                dotsGrid[2 * row][col].edges = getEdgesForDot(2 * row, col);
                dotsGrid[2 * row][col].faces = getFacesForDot(2 * row, col);
                dotsGrid[2 * row + 1][col].edges = getEdgesForDot(2 * row + 1, col);
                dotsGrid[2 * row + 1][col].faces = getFacesForDot(2 * row + 1, col);
                dotsGrid[4 * size - 2 * row - 1][col].edges = getEdgesForDot(4 * size - 2 * row - 1, col);
                dotsGrid[4 * size - 2 * row - 1][col].faces = getFacesForDot(4 * size - 2 * row - 1, col);
                dotsGrid[4 * size - 2 * row - 2][col].edges = getEdgesForDot(4 * size - 2 * row - 2, col);
                dotsGrid[4 * size - 2 * row - 2][col].faces = getFacesForDot(4 * size - 2 * row - 2, col);
            }
            dotsGrid[2 * row + 1][columns].edges = getEdgesForDot(2 * row + 1, columns);
            dotsGrid[2 * row + 1][columns].faces = getFacesForDot(2 * row + 1, columns);
            dotsGrid[4 * size - 2 * row - 2][columns].edges = getEdgesForDot(4 * size - 2 * row - 2, columns);
            dotsGrid[4 * size - 2 * row - 2][columns].faces = getFacesForDot(4 * size - 2 * row - 2, columns);
        }

        function getEdgesForDot(row, col) {
            const edges = [];
            if (row > 0 && row % 2 === 0) {
                edges.push(vEdgesGrid[row / 2 - 1][col]);
            }
            if (row % 2 === 1) {
                let c = 2 * col + (row < 2 * size ? 0 : 1);
                if (c < dEdgesGrid[(row - 1) / 2].length) {
                    edges.push(dEdgesGrid[(row - 1) / 2][c]);
                }
            }
            if (row % 2 === 0) {
                let c = 2 * col + 1 + (row / 2 < size ? 0 : -1);
                if (c < dEdgesGrid[row / 2].length) {
                    edges.push(dEdgesGrid[row / 2][c]);
                }
            }
            if (row % 2 === 1 && row < 4 * size - 2) {
                edges.push(vEdgesGrid[(row - 1) / 2][col]);
            }
            if (row % 2 === 0) {
                let c = 2 * col + (row / 2 < size ? 0 : -1);
                if (c >= 0 && c < dEdgesGrid[row / 2].length) {
                    edges.push(dEdgesGrid[row / 2][c]);
                }
            }
            if (row % 2 === 1) {
                let c = 2 * col + -1 + (row < 2 * size ? 0 : 1);
                if (c >= 0 && c < dEdgesGrid[(row - 1) / 2].length) {
                    edges.push(dEdgesGrid[(row - 1) / 2][c]);
                }
            }
            return edges;
        }

        function getFacesForDot(row, col) {
            const faces = [];
            if (row % 2 === 1 && row > 2) {
                const c = col - 1 + (row < 2 * size ? 0 : 1);
                if (c >= 0 && c < facesGrid[(row - 1) / 2 - 1].length) {
                    faces.push(facesGrid[(row - 1) / 2 - 1][c]);
                }
            }
            if (row % 2 === 0 && row > 0 && col < facesGrid[row / 2 - 1].length) {
                faces.push(facesGrid[row / 2 - 1][col]);
            }
            if (row % 2 === 1 && row < 4 * size - 2 && col < facesGrid[(row - 1) / 2].length) {
                faces.push(facesGrid[(row - 1) / 2][col]);
            }
            if (row % 2 === 0 && row < 4 * size - 2) {
                const c = col + (row < 2 * size ? 0 : -1);
                if (c >= 0 && c < facesGrid[row / 2].length) {
                    faces.push(facesGrid[row / 2][c]);
                }
            }
            if (row % 2 === 1 && row < 4 * size - 2 && col > 0) {
                faces.push(facesGrid[(row - 1) / 2][col - 1]);
            }
            if (row % 2 === 0 && row > 0 && col > 0) {
                faces.push(facesGrid[row / 2 - 1][col - 1]);
            }
            return faces;
        }

        const faces = facesGrid.flatMap(row => row);
        const edges = dEdgesGrid.flatMap(row => row).concat(...vEdgesGrid.flatMap(row => row));
        const dots = dotsGrid.flatMap(row => row);

        super(faces, edges, dots);

        this.size = size;
        this.dotsGrid = dotsGrid;

        this.computeCoordinates();
        this.computeFacesCenters();
    }

    getWidth() {
        return 2 * this.size - 1;
    }

    getHeight() {
        return (3 * this.size - 1) / 2;
    }

    //unit hex = width and height of a hexagon are 1
    computeCoordinates() {
        const w = 1;
        const h = 1;
        const w2 = w / 2;
        const h4 = h / 4;

        for (let row = 0; row < this.size; row++) {
            const sx = (this.size - row) * w2;
            const sy = 3 * h4 * row;
            const columns = this.size + row;
            for (let col = 0; col < columns; col++) {
                this.dotsGrid[2 * row][col].x = sx + col * w;
                this.dotsGrid[2 * row][col].y = sy;
                this.dotsGrid[2 * row + 1][col].x = sx - w2 + col * w;
                this.dotsGrid[2 * row + 1][col].y = sy + h4;

                this.dotsGrid[4 * this.size - 2 * row - 1][col].x = sx + col * w;
                this.dotsGrid[4 * this.size - 2 * row - 1][col].y = 2 * this.size * 3 * h4 - 2 * h4 - sy;
                this.dotsGrid[4 * this.size - 2 * row - 2][col].x= sx - w2 + col * w;
                this.dotsGrid[4 * this.size - 2 * row - 2][col].y= 2 * this.size * 3 * h4 - 2 * h4 - sy - h4;
            }
            this.dotsGrid[2 * row + 1][columns].x = sx - w2 + columns * w;
            this.dotsGrid[2 * row + 1][columns].y = sy + h4;
            this.dotsGrid[4 * this.size - 2 * row - 2][columns].x = sx - w2 + columns * w;
            this.dotsGrid[4 * this.size - 2 * row - 2][columns].y = 2 * this.size * 3 * h4 - 2 * h4 - sy - h4;
        }
    }

    computeFacesCenters () {
        const h = 1;
        const h2 = h / 2;

        for (let f of this.faces) {
            f.cx = f.dots[0].x;
            f.cy = f.dots[0].y + h2;
        }
    }

}