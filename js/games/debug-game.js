class DebugGame extends Game {
    constructor(grid) {
        super();
        this.grid = grid;
        const _this = this;
        setTimeout( () => _this.emit('generate-end'), 10);
    }

    onDotClick(event) {
        this.grid.debuggedDot = event.dot === this.grid.debuggedDot ? null : event.dot;
        this.grid.debuggedEdge = null;
        this.grid.debuggedFace = null;

        event.stopPropagation = true;
    }

    onEdgeClick(event) {
        this.grid.debuggedDot = null;
        this.grid.debuggedEdge = event.edge === this.grid.debuggedEdge ? null : event.edge;
        this.grid.debuggedFace = null;

        event.stopPropagation = true;
    }

    onFaceClick(event) {
        this.grid.debuggedDot = null;
        this.grid.debuggedEdge = null;
        this.grid.debuggedFace = event.face === this.grid.debuggedFace ? null : event.face;

        event.stopPropagation = true;
    }
}