class Shingoki extends Game {
    static HIDDEN_CLUES_RATIO = {
        easy: 0.20,
        normal: 0.35,
        hard: 0.45,
        expert: 0.65,
        insane: 0.95
    };

    constructor(grid, difficulty) {
        super();

        this.grid = grid;
        this.loopGen = new LoopGen();
        this.loopGen.generateLoop(grid);

        // count edges on so, we can determine when the user finishes the game;
        this.totalEdgesOn = this.grid.edges.filter(e => e.type === Edge.TYPE_ON).length;

        this.calculateAllClues();
        this.hideClues(difficulty);
    }

    nextDot(edge, dot) {
        return edge.d1 === dot ? edge.d2 : edge.d1;
    }

    calculateAllClues() {
        let chains = 0;
        const sizes = {};
        let prevDot = this.grid.dots.find(dot => this.isTurningPoint(dot));
        let prevEdge = prevDot.edges.find(edge => edge.type === Edge.TYPE_ON);
        prevEdge.chain = chains;
        sizes[chains] = 1;

        let currentDot = this.nextDot(prevEdge, prevDot);
        let currentEdge = currentDot.edges.find(next => next.type === Edge.TYPE_ON && next !== prevEdge);

        while (currentEdge.chain === undefined) {
            let nextDot = this.nextDot(currentEdge, currentDot);
            let nextEdge = nextDot.edges.find(next => next.type === Edge.TYPE_ON && next !== currentEdge);

            if (this.collinear(prevDot, currentDot, nextDot)) {
                currentEdge.chain = chains;
                ++sizes[chains];
            } else {
                currentEdge.chain = ++chains;
                sizes[chains] = 1;
            }

            prevDot = currentDot;
            prevEdge = currentEdge
            currentDot = nextDot
            currentEdge = nextEdge;
        }

        this.grid.dots.forEach((dot) => this.setDotValue(dot, sizes));
        this.grid.dots.forEach((dot) => dot.valueVisible = true);
    }


    isTurningPoint(dot) {
        const loopEdges = dot.edges.filter(edge => edge.type === Edge.TYPE_ON);
        if (loopEdges.length !== 2) {
            return false
        }
        return this.turns(dot, loopEdges[0], loopEdges[1]);
    }

    turns(dot, e1, e2) {
        const d1 = e1.d1 === dot ? e1.d2 : e1.d1;
        const d2 = e2.d1 === dot ? e2.d2 : e2.d1;

        return !this.collinear(d1, dot, d2);
    }

    collinear(d1, d2, d3) {
        const d = d1.x * (d2.y - d3.y) + d2.x * (d3.y - d1.y) + d3.x * (d1.y - d2.y);
        return Math.abs(d) <= 0.001;
    }

    next(edge, incomingDot) {
        const outcomingDot = edge.d1 === incomingDot ? edge.d2 : edge.d1;
        return outcomingDot.edges.find(next => next.type === Edge.TYPE_ON && next !== edge);
    }

    setDotValue(dot, sizes) {
        const loopEdges = dot.edges.filter(edge => edge.type === Edge.TYPE_ON);
        if (loopEdges.length === 0) {
            dot.value = 0;
            dot.type = undefined;
            return;
        }
        if (loopEdges.length !== 2) {
            throw new Error("More than 2 edges go through one dot");
        }
        if (loopEdges[0].chain === loopEdges[1].chain) {
            dot.value = sizes[loopEdges[0].chain];
            dot.type = Dot.TYPE_OFF;
        } else {
            dot.value = sizes[loopEdges[1].chain] + sizes[loopEdges[0].chain];
            dot.type = Dot.TYPE_ON;
        }
    }

    hideClues(difficulty) {
        this.emit('generate-start');

        const cnf = new (function () {
            let v = 0;
            this.nextVar = () => ++v;
            this.variables = () => v;
        })();

        // index the edges
        for (let i = 0; i < this.grid.edges.length; i++) {
            this.grid.edges[i].id = cnf.nextVar();
        }

        // these clauses are always to be used
        const persistentClauses = []
        this.grid.dots.forEach(d => persistentClauses.push(...SatUtils.dotClausesForLoop(d)));
        // this clause excludes the actual solution -> so normally sat should never be able to solve it
        persistentClauses.push(this.grid.edges.map(e => e.type === Edge.TYPE_ON ? -e.id : e.id));

        // cache the clauses for the dots
        this.grid.dots
            .filter(d => d.type)
            .forEach(d => d.clauses = this.getDotSATClauses(cnf, d));

        const dots = shuffleArray(this.grid.dots.filter(d => d.type))
            .map(d => {
                d.importance = d.edges.length
                + d.value
                + d.type === Dot.TYPE_ON ? 2 : 0;
                return d;
            })
            .sort(((d1, d2) => -d1.importance + d2.importance));
        dots.length = Math.floor(dots.length * Shingoki.HIDDEN_CLUES_RATIO[difficulty]);
        let dindex = 0;
        let _this = this;

        setTimeout(function processNextDot() {
            const dot = dots[dindex];

            dot.valueVisible = false;

            const clauses = [...persistentClauses];
            _this.grid.dots
                .filter(d => d.type && d.valueVisible)
                .forEach(d => clauses.push(...d.clauses));

            // if we found a solution it means hiding the face allows multiple solutions
            if (satSolve(cnf.variables(), clauses)) {
                dot.valueVisible = true;
            }

            _this.emit('generate-progress', (dindex + 1) / dots.length);

            if (dindex < dots.length - 1) {
                dindex++;
                setTimeout(processNextDot, 0);
            } else {
                _this.restart();
                _this.emit('generate-end');
            }
        }, 0);
    }

    getDotSATClauses(cnf, dot) {
        const segments = this.generateSegments(cnf, dot);
        return this.encodeSegments(dot, segments);
    }

    generateSegments(cnf, dot) {
        const segments = [];
        for (let i = 0; i < dot.edges.length; i++) {
            for (let j = i + 1; j < dot.edges.length; j++) {
                const e1 = dot.edges[i];
                const e2 = dot.edges[j];

                const d1 = this.nextDot(e1, dot);
                const d2 = this.nextDot(e2, dot);

                const collinear = this.collinear(d1, dot, d2);

                if (dot.type === Dot.TYPE_OFF && !collinear) continue;
                if (dot.type === Dot.TYPE_ON && collinear) continue;

                for (let k = 1; k < dot.value; k++) {
                    const before = this.extendStraight(dot, e1, k);
                    const after = this.extendStraight(dot, e2, dot.value - k);

                    if (!before || !after || !before.length || !after.length) continue;

                    segments.push({
                        before,
                        after,
                        center: [e1, e2],
                        id: cnf.nextVar()
                    });
                }
            }
        }

        return segments;
    }

    encodeSegments(dot, segments) {
        const clauses = [];
        const edgeInSegments = {};

        for (const seg of segments) {
            const edges = [...seg.before, ...seg.after];

            for (const e of edges) {
                clauses.push([-seg.id, e.id]);

                if (!edgeInSegments[e.id]) {
                    edgeInSegments[e.id] = [];
                }
                edgeInSegments[e.id].push(seg.id);
            }
        }

        // for (const [edgeId, segIds] of Object.entries(edgeInSegments)) {
        //     clauses.push([-edgeId, ...segIds]);
        // }

        clauses.push(segments.map(s => s.id));
        SatUtils.combinations(segments.length, 2, r => clauses.push(r.map(i => -segments[i].id)));

        return clauses;
    }

    extendStraight(dot, edge, length) {
        const edges = [];
        let currentDot = dot;
        let currentEdge = edge;
        edges.push(currentEdge);

        for (let i = 1; i < length; i++) {
            const nextDot = this.nextDot(currentEdge, currentDot);
            const candidates = nextDot.edges
                .filter(e => e !== currentEdge)
                .filter(e => this.collinear(currentDot, nextDot, this.nextDot(e, nextDot)));

            if (candidates.length !== 1) {
                return null;
            }

            currentDot = nextDot;
            currentEdge = candidates[0];

            edges.push(currentEdge);
        }

        return edges;
    }

    restart() {
        // user completed the game (totalEdgesOn = userCorrectQuesses and userIncorrectQuesses = 0)
        this.finished = false;

        // count users correct and incorrect guesses
        this.userCorrectQuesses = 0;
        this.userIncorrectQuesses = 0;

        // default values for edges and faces
        this.grid.edges.forEach(e => {
            e.state = Edge.STATE_DEFAULT;
            e.valid = true;
            e.error = false;
            e.error1 = false;
            e.error2 = false;
        });

        this.grid.dots.forEach(d => d.error = false);

        this.undos = [];
        this.redos = [];
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

        this.grid.edges.forEach(e => e.valid = true);
        this.grid.edges.forEach(e => this.setValidState(e));

        this.setEdgesErrorState(edge.d1);
        this.setEdgesErrorState(edge.d2);
        this.grid.dots.forEach(d => d.error = this.getDotErrorState(d));
    }

    setValidState(edge) {
        if (edge.state !== Edge.STATE_DEFAULT || !edge.valid) {
            return;
        }

        const valid = this.isValidForDot(edge, edge.d1) && this.isValidForDot(edge, edge.d2);

        const changed = edge.valid !== valid;
        edge.valid = valid;

        if (changed) {
            edge.d1.edges.forEach(e => this.setValidState(e));
            edge.d2.edges.forEach(e => this.setValidState(e));
        }
    }

    isValidForDot(edge, dot) {
        const selected = dot.edges.filter(e => e.state === Edge.STATE_SELECTED).length;
        if (selected === 1) {
            return true;
        }

        if (selected >= 2) {
            return false;
        }

        return dot.edges.some(e => e !== edge
            && e.state === Edge.STATE_DEFAULT
            && e.valid);
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

    getDotErrorState(dot) {
        if (!dot.value || !dot.valueVisible) {
            return false;
        }
        const selected = dot.edges.filter(e => e.state === Edge.STATE_SELECTED);
        const available = dot.edges.filter(e => e.state === Edge.STATE_DEFAULT)
        if (!selected.length) {
            return available.length < 2;
        }
        if (selected.length > 2) {
            return true;
        }

        if (selected.length === 1) {
            return !available.length || this.computeSelectedSegmentLength(dot, selected[0]) >= dot.value;
        }

        const e1 = selected[0];
        const e2 = selected[1];
        const collinear  = this.collinear(this.nextDot(e1, dot), dot, this.nextDot(e2, dot));

        if (dot.type === Dot.TYPE_ON && collinear || dot.type === Dot.TYPE_OFF && !collinear) {
            return true;
        }

        return this.computeSelectedSegmentLength(dot, e1) + this.computeSelectedSegmentLength(dot, e2) > dot.value ;
    }

    computeSelectedSegmentLength(dot, edge) {
        if (!edge || edge.state !== Edge.STATE_SELECTED) {
            return 0;
        }

        let nextDot = this.nextDot(edge, dot);
        const candidates = nextDot.edges
            .filter(e => e !== edge)
            .filter(e => this.collinear(dot, nextDot, this.nextDot(e, nextDot)));

        return 1 + (candidates.length ? this.computeSelectedSegmentLength(nextDot, candidates[0]) : 0);
    }

    isCorrectGuess(edge) {
        return edge.type === Edge.TYPE_ON && edge.state === Edge.STATE_SELECTED;
    }

    isIncorrectGuess(edge) {
        return edge.type === Edge.TYPE_ON && edge.state === Edge.STATE_DISABLED
            || edge.type === Edge.TYPE_OFF && edge.state === Edge.STATE_SELECTED;
    }
}