class SlitherLink extends Game {
    static HIDDEN_FACES_RATIO = [
        0.1, // easy
        0.2, // normal
        0.3, // hard
        0.4, // expert
        0.6  // insane
    ];

    constructor(grid, difficulty) {
        super();

        this.grid = grid;
        this.loopGen = new LoopGen();

        this.loopGen.generateLoop(grid);
        this.grid.edges.forEach(e => e.type = this.loopEdge(e) ? Edge.TYPE_ON : Edge.TYPE_OFF);
        this.grid.faces.forEach(f => f.value = this.countEdgesOn(f));

        // count edges on so, we can determine when the user finishes the game;
        this.totalEdgesOn = this.grid.edges.filter(e => e.type === Edge.TYPE_ON).length;

        this.generatePuzzle(difficulty);
    }

    loopEdge(edge) {
        const facesOn = (edge.f1?.type === Face.TYPE_ON ? 1 : 0) + (edge.f2?.type === Face.TYPE_ON ? 1 : 0);
        return facesOn === 1;
    }

    countEdgesOn(face) {
        return face.edges.reduce((count, edge) => edge.type === Edge.TYPE_ON ? count + 1 : count, 0);
    }

    onEdgeClick(event) {
        if (this.finished) {
            return;
        }
        event.preventDefault = true;

        const before = event.edge.state;

        switch (event.edge.state) {
            case Edge.STATE_DEFAULT:
                this.setEdgeState(event.edge, Edge.STATE_SELECTED);
                break;
            case Edge.STATE_SELECTED:
                this.setEdgeState(event.edge, Edge.STATE_DISABLED);
                break;
            case Edge.STATE_DISABLED:
                this.setEdgeState(event.edge, Edge.STATE_DEFAULT);
        }

        const after = event.edge.state;

        this.undos.push({
            undo: () => this.setEdgeState(event.edge, before),
            redo: () => this.setEdgeState(event.edge, after),
        });

        this.redos = [];

        if (this.userCorrectQuesses === this.totalEdgesOn && this.userIncorrectQuesses === 0) {
            this.finished = true;
            this.emit("finish", null);
        }
    }

    restart() {
        // user completed the game (totalEdgesOn = userCorrectQuesses and userWrongQuesses = 0)
        this.finished = false;

        // count users correct and incorrect guesses
        this.userCorrectQuesses = 0;
        this.userIncorrectQuesses = 0;

        // default values for edges and faces
        this.grid.faces.forEach(f => f.error = false);
        this.grid.edges.forEach(e => {
            e.state = Edge.STATE_DEFAULT;
            e.error = false;
            e.valid = true;
        });

        // invalidate edges around faces with 0 faces on
        const validated = [];
        this.grid.faces
            .filter(f => f.valueVisible && f.value === 0)
            .forEach(f => f.edges.forEach(e => this.setValidState(e, validated)));

        this.undos = [];
        this.redos = [];
    }

    undo() {
        if (this.finished || !this.undos.length) {
            return;
        }

        const pop = this.undos.pop();
        pop.undo();

        this.redos.push(pop);
    }

    redo() {
        if (this.finished || !this.redos.length) {
            return;
        }

        const pop = this.redos.pop();
        pop.redo();

        this.undos.push(pop);
    }

    canUndo() {
        return !this.finished && this.undos?.length;
    }

    canRedo() {
        return !this.finished && this.redos?.length;
    }

    setEdgeState(edge, state) {
        if (this.isCorrectGuess(edge)) {
            this.userCorrectQuesses--;
        }
        if (this.isIncorrectGuess(edge)) {
            this.userIncorrectQuesses--;
        }

        edge.state = state;

        if (this.isCorrectGuess(edge)) {
            this.userCorrectQuesses++;
        }
        if (this.isIncorrectGuess(edge)) {
            this.userIncorrectQuesses++;
        }

        const validated = [];
        edge.valid = true;
        if (edge.f1) {
            edge.f1.edges.forEach(e => this.setValidState(e, validated));
        }
        if (edge.f2) {
            edge.f2.edges.forEach(e => this.setValidState(e, validated));
        }
        edge.d1.edges.forEach(e => this.setValidState(e, validated));
        edge.d2.edges.forEach(e => this.setValidState(e, validated));

        this.setEdgesErrorState(edge.d1);
        this.setEdgesErrorState(edge.d2);
        this.setFaceErrorState(edge.f1);
        this.setFaceErrorState(edge.f2);
    }

    isCorrectGuess(edge) {
        return edge.type === Edge.TYPE_ON && edge.state === Edge.STATE_SELECTED;
    }

    isIncorrectGuess(edge) {
        return edge.type === Edge.TYPE_ON && edge.state === Edge.STATE_DISABLED
            || edge.type === Edge.TYPE_OFF && edge.state === Edge.STATE_SELECTED;
    }

    setEdgesErrorState(dot) {
        const on = dot.edges.filter(e => e.state === Edge.STATE_SELECTED).length;
        dot.edges.forEach(e => {
            if (dot === e.d1) {
                e.error1 = e.state === Edge.STATE_SELECTED && on > 2;
            } else {
                e.error2 = e.state === Edge.STATE_SELECTED && on > 2;
            }

            e.error = e.error1 || e.error2;
        });
    }

    setFaceErrorState(face) {
        if (!face || !face.valueVisible) {
            return;
        }

        const selected = face.edges.filter(e => e.state === Edge.STATE_SELECTED).length;
        if (face.value < selected) {
            face.error = true;
            return;
        }

        const off = face.edges.filter(e => e.state === Edge.STATE_DISABLED || e.state === Edge.STATE_DEFAULT && !e.valid).length;
        if (face.edges.length - face.value < off) {
            face.error = true;
            return;
        }

        face.error = false;
    }

    setValidState(edge, validated) {
        // skip it for now
        return;

        if (edge.state !== Edge.STATE_DEFAULT) {
            return;
        }

        const valid = this.isValidForFace(edge.f1) && this.isValidForFace(edge.f2)
            && this.isValidForDot(edge, edge.d1, validated) && this.isValidForDot(edge, edge.d2, validated);

        validated.push(edge);
        const changed = edge.valid !== valid;
        edge.valid = valid;

        if (changed) {
            edge.d1.edges.forEach(e => this.setValidState(e, validated));
            edge.d2.edges.forEach(e => this.setValidState(e, validated));
        }
    }

    isValidForFace(face) {
        if (!face || !face.valueVisible) {
            return true;
        }
        const selected = face.edges.filter(e => e.state === Edge.STATE_SELECTED).length;
        return selected < face.value;
    }

    isValidForDot(edge, dot, validated) {
        const selected = dot.edges.filter(e => e.state === Edge.STATE_SELECTED).length;
        if (selected === 1) {
            return true;
        }

        if (selected >= 2) {
            return false;
        }

        return dot.edges.some(e => e !== edge && e.state === Edge.STATE_DEFAULT && (e.valid || !validated.includes(e)));
    }

    onDotClick(edge) {
    }

    onFaceClick(event) {
    }

    generatePuzzle(difficulty) {
        const start = new Date().getTime();
        this.emit('generate-start');
        // index the edges
        for (let i = 0; i < this.grid.edges.length; i++) {
            this.grid.edges[i].id = i + 1;
        }

        // cache the clauses for the faces
        this.grid.faces.forEach(f => f.clauses = this.getFaceSATClauses(f));

        // these clauses are always to be used
        const persistentClauses = []
        this.grid.dots.forEach(d => persistentClauses.push(...this.getDotSATClauses(d)));
        // this clause excludes the actual solution -> so normally sat should never be able to solve it
        persistentClauses.push(this.grid.edges.map(e => e.type === Edge.TYPE_ON ? -e.id : e.id));

        const faces = shuffleArray(this.grid.faces);
        faces.length = Math.floor(faces.length * SlitherLink.HIDDEN_FACES_RATIO[difficulty]);
        let fidx = 0;
        let _this = this;

        setTimeout(function processNextFace() {
            const face = faces[fidx];

            face.valueVisible = false;

            const clauses = [...persistentClauses];
            _this.grid.faces
                .filter(f => f.valueVisible)
                .forEach(f => clauses.push(...f.clauses));

            // if we found a solution it means hiding the face allows multiple solutions
            if (satSolve(_this.grid.edges.length, clauses)) {
                face.valueVisible = true;
            }

            _this.emit('generate-progress', (fidx + 1) / faces.length);

            if (fidx < faces.length - 1) {
                fidx++;
                setTimeout(processNextFace, 0);
            } else {
                const end = new Date().getTime();
                console.log("Puzzle generated in " + (end - start));
                _this.restart();
                _this.emit('generate-end');
            }
        }, 0);
    }

    getFaceSATClauses(face) {
        const n = face.edges.length;
        const k = face.value;

        if (k === 0) {
            return face.edges.map(e => [-e.id]);
        }

        const clauses = [];

        //n - k + 1 edges can not be false
        this.combinations(n, n - k + 1, result => clauses.push(result.map(i => face.edges[i].id)));
        //k + 1 edges can not be true
        this.combinations(n, k + 1, result => clauses.push(result.map(i => -face.edges[i].id)));

        return clauses;
    }

    getDotSATClauses(dot) {
        const n = dot.edges.length;
        const clauses = [];
        // 3 edges connected by this dot cannot be true
        this.combinations(n, 3, result => clauses.push(result.map(i => -dot.edges[i].id)));
        // only one edge alone cannot be true;
        for (let i = 0; i < n; i++) {
            clauses.push(dot.edges.map(e => e === dot.edges[i] ? -e.id : e.id));
        }
        return clauses;
    }

    combinations(n, k, callback) {
        const st = emptyArray(k);
        st[0] = -1;
        let i = 0;
        while (i > -1) {
            if (i < k && st[i] < n - 1) {
                st[i] += 1;
                i = i + 1;
                if (i < k) {
                    st[i] = st[i - 1];
                }
            } else if (i === k) {
                callback(st);
                i = i - 1;
            } else {
                i = i - 1;
            }
        }
    }
}