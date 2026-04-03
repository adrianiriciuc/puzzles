function PuzzlesApp() {
    const gridTypes = {
        honeycomb: 'Honeycomb',
        rectangular: 'Squares',
        hexagonal: 'Hexagons',
        triangular: 'Triangles',
        pentagram: 'Pentagram',
        cairo: 'Cairo',
    };

    const difficultyTypes = {
        easy: 'Easy',
        normal: 'Normal',
        hard: 'Hard',
        expert: 'Expert',
        insane: 'Insane'
    };

    const sizeTypes = {
        tiny: 'Tiny',
        small: 'Small',
        medium: 'Medium',
        large: 'Large',
        huge: 'Huge'
    };

    const games = {
        slitherlink: {
            grids: ['honeycomb', 'rectangular', 'hexagonal', 'triangular', 'pentagram', 'cairo'],
            factory: (grid, difficulty) => new SlitherLink(grid, difficulty)
        },
        shingoki: {
            grids: ['rectangular', 'triangular', 'pentagram'],
            factory: (grid, difficulty) => new Shingoki(grid, difficulty)
        }
    }

    const grids = {
        honeycomb: {
            edgeSize: 50,
            sizes: {
                tiny: 3,
                small: 5,
                medium: 7,
                large: 10,
                huge: 15,
            },
            factory: (size) => new HoneycombGrid(size)
        },
        rectangular: {
            edgeSize: 50,
            sizes: {
                tiny: [5, 5],
                small: [10, 10],
                medium: [15, 15],
                large: [20, 20],
                huge: [25, 25]
            },
            factory: (size) => new SquareGrid(size[0], size[1]),
        },
        hexagonal: {
            edgeSize: 50,
            sizes: {
                tiny: [5, 5],
                small: [10, 10],
                medium: [15, 15],
                large: [20, 20],
                huge: [25, 25]
            },
            factory: (size) => new HexagonGrid(size[0], size[1]),
        },
        triangular: {
            edgeSize: 50,
            sizes: {
                tiny: 5,
                small: 10,
                medium: 15,
                large: 20,
                huge: 25
            },
            factory: (size) => new TriangularGrid(size),
        },
        pentagram: {
            edgeSize: 50,
            sizes: {
                tiny: 6,
                small: 9,
                medium: 15,
                large: 18,
                huge: 24,
            },
            factory: (size) => new PentagramGrid(size),
        },
        cairo: {
            edgeSize: 70,
            sizes: {
                tiny: [5, 5],
                small: [10, 10],
                medium: [15, 15],
                large: [20, 20],
                huge: [25, 25]
            },
            factory: (size) => new CairoGrid(size[0], size[1]),
        }
    };

    this.getDifficultyTypes = () => difficultyTypes;
    this.getSizeTypes = () => sizeTypes;
    this.getGridTypes = (game) => Object.fromEntries(games[game].grids.map(type => [type, gridTypes[type]]));

    this.buildGrid = (type, size) => {
        const definition = grids[type];
        return definition.factory(definition.sizes[size]);
    }

    this.newGame = (type, grid, difficulty) => {
        if (debugGrid) {
            return new DebugGame(grid);
        }
        const game = games[type];
        return game.factory(grid, difficulty);
    }

    this.getEdgeSize = (type) => {
        return grids[type].edgeSize;
    }
}