class SquareGrid extends Grid {
    constructor(rows, columns) {

        //build all dots with empty data
        const dotsGrid = emptyGrid(rows + 1, columns + 1);
        for (let row = 0; row < rows + 1; row++) {
            for (let col = 0; col < columns + 1; col++) {
                dotsGrid[row][col] = new Dot([], []);
            }
        }

        //build all faces with the connected dots, but with empty edges
        const facesGrid = emptyGrid(rows, columns);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const dots = [dotsGrid[row][col], dotsGrid[row][col + 1], dotsGrid[row + 1][col + 1], dotsGrid[row + 1][col]];
                facesGrid[row][col] = new Face(dots, []);
                facesGrid[row][col].cx = col + 0.5;
                facesGrid[row][col].cy = row + 0.5;
            }
        }

        //we can fully build horizontal edges
        const hEdgesGrid = emptyGrid(rows + 1, columns);
        for (let row = 0; row < rows + 1; row++) {
            for (let col = 0; col < columns; col++) {
                hEdgesGrid[row][col] = new Edge(dotsGrid[row][col], dotsGrid[row][col + 1], row === 0 ? null : facesGrid[row - 1][col], row === rows ? null : facesGrid[row][col]);
            }
        }

        //we can fully build vertical edges
        const vEdgesGrid = emptyGrid(rows,columns + 1);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns + 1; col++) {
                vEdgesGrid[row][col] = new Edge(dotsGrid[row][col], dotsGrid[row + 1][col], col === 0 ? null : facesGrid[row][col - 1], col === columns ? null : facesGrid[row][col]);
            }
        }

        //connect dots with faces and edges
        for (let row = 0; row < rows + 1; row++) {
            for (let col = 0; col < columns + 1; col++) {
                dotsGrid[row][col].faces.push(...getFacesForDot(row, col, facesGrid));
                dotsGrid[row][col].edges.push(...getEdgesForDot(row, col, vEdgesGrid, hEdgesGrid));
            }
        }

        //connect faces with edges
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                facesGrid[row][col].edges.push(hEdgesGrid[row][col]);
                facesGrid[row][col].edges.push(vEdgesGrid[row][col + 1]);
                facesGrid[row][col].edges.push(hEdgesGrid[row + 1][col]);
                facesGrid[row][col].edges.push(vEdgesGrid[row][col]);
            }
        }

        function getFacesForDot(row, col, facesGrid) {
            const result = [];
            if (row > 0 && col < facesGrid[row - 1].length) {
                result.push(facesGrid[row - 1][col]);
            }
            if (row < facesGrid.length && col < facesGrid[row].length) {
                result.push(facesGrid[row][col]);
            }
            if (row < facesGrid.length && col > 0) {
                result.push(facesGrid[row][col - 1]);
            }
            if (row > 0 && col > 0) {
                result.push(facesGrid[row - 1][col - 1]);
            }
            return result;
        }

        function getEdgesForDot(row, col, vEdgesGrid, hEdgesGrid) {
            const result = [];
            if (row > 0) {
                result.push(vEdgesGrid[row - 1][col]);
            }
            if (col < hEdgesGrid[row].length) {
                result.push(hEdgesGrid[row][col]);
            }
            if (row < vEdgesGrid.length) {
                result.push(vEdgesGrid[row][col]);
            }
            if (col > 0) {
                result.push(hEdgesGrid[row][col - 1]);
            }
            return result;
        }

        const faces = facesGrid.flatMap((row) => row);
        const dots = dotsGrid.flatMap((row) => row);
        const edges = vEdgesGrid.flatMap((row) => row).concat(...hEdgesGrid.flatMap((row) => row));

        super(faces, edges, dots);

        this.rows = rows;
        this.columns = columns;
        this.dotsGrid = dotsGrid;
        this.facesGrid = facesGrid;
        this.vEdgesGrid = vEdgesGrid;
        this.hEdgesGrid = hEdgesGrid;

        this.computeCoordinates();
    }

    // creates unit grid = each square has the size of 1
    computeCoordinates() {
        for (let row = 0; row < this.rows + 1; row++) {
            for (let col = 0; col < this.columns + 1; col++) {
                this.dotsGrid[row][col].x = col;
                this.dotsGrid[row][col].y = row;
            }
        }
    }

    getWidth() {
        return this.columns;
    }

    getHeight() {
        return this.rows;
    }
}