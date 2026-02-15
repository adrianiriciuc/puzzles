class GridRenderer extends EventEmitter {
    margin = 10;
    debug = false;
    finished = false;

    constructor(grid, canvas, scale) {
        super();

        this.grid = grid;
        this.canvas = canvas;
        this.scale = scale;

        this.width = this.grid.getWidth() * scale;
        this.height = this.grid.getHeight() * scale;

        this.canvas.width = this.width + 2 * this.margin + 1;
        this.canvas.height = this.height + 2 * this.margin + 1;

        const ctx = this.canvas.getContext("2d");
        ctx.translate(0.5, 0.5);

        this.canvas.oncontextmenu = e => {
            e.preventDefault();
        }

        this.canvas.onclick = e => {
            console.log(e);
            const x = (e.offsetX - this.margin - 0.5) / scale;
            const y = (e.offsetY - this.margin - 0.5) / scale;

            const closestDot = this.grid.dots.reduce((a, b) => a.distance(x, y) > b.distance(x, y) ? b : a);
            if (closestDot.distance(x, y) < 7 / scale) {
                const event = {dot: closestDot, stopPropagation: false};
                this.emit('dotClicked', event);
                if (event.stopPropagation) {
                    return;
                }
            }

            const closestEdge = this.grid.edges.reduce((a, b) => a.distance(x, y) > b.distance(x, y) ? b : a);
            if (closestEdge.distance(x, y) < 10 / scale) {
                const event = {edge: closestEdge, stopPropagation: false};
                this.emit('edgeClicked', event);
                if (event.stopPropagation) {
                    return;
                }
            }

            const foundFace = this.grid.faces.find(face => face.contains(x, y));
            if (foundFace) {
                const event = {face: foundFace, stopPropagation: false};
                this.emit('faceClicked', event);
            }
        };
    }

    draw(theme) {
        const ctx = this.canvas.getContext("2d");

        ctx.fillStyle = theme.background;
        ctx.fillRect(-1, -1, this.canvas.width + 2, this.canvas.height + 2);

        if (this.finished) {
            this.drawFaces(ctx, this.grid.faces.filter(f => f.type === Face.TYPE_ON), theme.edgeSelected);
            this.drawEdges(ctx, this.grid.edges, theme.edgeDefault, 1);

            return;
        }

        this.drawEdges(ctx, this.edgesByState(Edge.STATE_DEFAULT).filter(e => e.valid), theme.edgeDefault, 1);
        this.drawEdges(ctx, this.edgesByState(Edge.STATE_DEFAULT).filter(e => !e.valid), theme.edgeDiscarded, 1);
        this.drawEdges(ctx, this.edgesByState(Edge.STATE_SELECTED), theme.edgeSelected, 2);
        this.drawEdges(ctx, this.edgesByState(Edge.STATE_DISABLED), theme.edgeDiscarded, 1);
        this.drawXOnEdges(ctx, this.edgesByState(Edge.STATE_DISABLED), theme.edgeDiscardedX);

        if (debug) {
            this.grid.faces
                .filter(face => face.type === Face.TYPE_ON)
                .forEach(face => this.drawFace(ctx, face, theme.debuggedFaceON));

            this.drawDebuggedDot(ctx, theme);
            this.drawDebuggedEdge(ctx, theme);
            this.drawDebuggedFace(ctx, theme);

            const hasValues = this.grid.faces.some(face => face.value);
            if (!hasValues) {
                this.drawFacesIds(ctx, theme.faceValue, theme.font);
            }
        }

        this.drawValues(ctx, theme.faceValue, theme.faceError, theme.font);
        this.drawEdges(ctx, this.grid.edges.filter(e => e.error), theme.edgeError, 2);
    }

    drawEdges(ctx, edges, lineColor, lineWidth) {
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        for (let e of edges) {
            ctx.moveTo(this.p(e.d1.x), this.p(e.d1.y));
            ctx.lineTo(this.p(e.d2.x), this.p(e.d2.y));
        }
        ctx.stroke();
    }

    drawXOnEdges(ctx, edges, xcolor) {
        ctx.strokeStyle = xcolor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let e of edges) {
            const cx = this.p((e.d1.x + e.d2.x) / 2);
            const cy = this.p((e.d1.y + e.d2.y) / 2);
            ctx.moveTo(cx - 3, cy - 3);
            ctx.lineTo(cx + 3, cy + 3);
            ctx.moveTo(cx + 3, cy - 3);
            ctx.lineTo(cx - 3, cy + 3);
        }
        ctx.stroke();
    }

    edgesByState(state) {
        return this.grid.edges.filter(e => e.state === state && !e.error);
    }

    drawDot(ctx, dot, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.p(dot.x), this.p(dot.y), 5, 0, 2 * Math.PI);
        ctx.fill();
    }

    drawEdge(ctx, edge, color, width) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(this.p(edge.d1.x), this.p(edge.d1.y));
        ctx.lineTo(this.p(edge.d2.x), this.p(edge.d2.y));
        ctx.stroke();
    }

    drawValues(ctx, color, error, font) {
        for (let f of this.grid.faces) {
            if (f.value !== undefined && f.valueVisible) {
                ctx.font = (f.error ? "bold " : "") + font;
                ctx.fillStyle = f.error ? error : color;
                ctx.fillText(f.value, this.p(f.cx) - 6, this.p(f.cy) + 6);
            }
        }
    }

    drawFaces(ctx, faces, color) {
        ctx.fillStyle = color;
        for (let face of faces) {
            ctx.beginPath();
            ctx.moveTo(this.p(face.dots[0].x), this.p(face.dots[0].y));
            for (let i = 1; i < face.dots.length; i++) {
                ctx.lineTo(this.p(face.dots[i].x), this.p(face.dots[i].y));
            }
            ctx.closePath();
            ctx.fill();
        }

    }

    p (v) {
        return v * this.scale + this.margin;
    }

    /*** Methods used for debugging ***/
    drawFacesIds(ctx, color, font) {
        ctx.font = font;
        ctx.fillStyle = color;
        let id = 0;
        for (let f of this.grid.faces) {
            ctx.fillText(id++, this.p(f.cx) - 6, this.p(f.cy) + 6);
        }
    }

    drawDebuggedDot(ctx, theme) {
        if (!this.grid.debuggedDot) {
            return;
        }

        this.drawFaces(ctx, this.grid.debuggedDot.faces, theme.debuggedFace);
        for (let e of this.grid.debuggedDot.edges) {
            this.drawEdge(ctx, e, theme.debuggedEdge, 2);
        }
        this.drawDot(ctx, this.grid.debuggedDot, theme.debuggedDot);
    }

    drawDebuggedEdge(ctx, theme) {
        if (!this.grid.debuggedEdge) {
            return;
        }

        if (this.grid.debuggedEdge.f1) {
            this.drawFaces(ctx, [this.grid.debuggedEdge.f1], theme.debuggedFace);
        }
        if (this.grid.debuggedEdge.f2) {
            this.drawFaces(ctx, [this.grid.debuggedEdge.f2], theme.debuggedFace);
        }
        this.drawEdge(ctx, this.grid.debuggedEdge, theme.debuggedEdge, 2);
        this.drawDot(ctx, this.grid.debuggedEdge.d1, theme.debuggedDot);
        this.drawDot(ctx, this.grid.debuggedEdge.d2, theme.debuggedDot);
    }

    drawDebuggedFace (ctx, theme) {
        if (!this.grid.debuggedFace) {
            return;
        }

        this.drawFaces(ctx, [this.grid.debuggedFace], theme.debuggedFace);
        for (let e of this.grid.debuggedFace.edges) {
            this.drawEdge(ctx, e, theme.debuggedEdge, 2);
        }
        for (let d of this.grid.debuggedFace.dots) {
             this.drawDot(ctx, d, theme.debuggedDot);
        }
    }
}