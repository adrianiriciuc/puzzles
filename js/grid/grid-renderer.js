class GridRenderer extends EventEmitter {
    margin = 15;
    debug = false;
    finished = false;

    constructor(grid, canvas, scale) {
        super();

        this.grid = grid;
        this.canvas = canvas;
        this.scale = scale;

        this.baseScale = scale;
        this.pan = {x: 0, y: 0};
        this.resize();

        this.canvas.oncontextmenu = e => {
            e.preventDefault();
        }

        this.activate = (px, py) => {
            if (!this.enabled) return;
            const scale = this.scale;
            const x = (px - this.pan.x - this.margin - 0.5) / scale;
            const y = (py - this.pan.y - this.margin - 0.5) / scale;

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

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const oldWidth = this.width;
        const oldHeight = this.height;
        this.width = rect.width;
        this.height = rect.height;
        this.pixelRatio = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(this.width * this.pixelRatio);
        this.canvas.height = Math.round(this.height * this.pixelRatio);
        if (oldWidth) {
            this.pan.x += (this.width - oldWidth) / 2;
            this.pan.y += (this.height - oldHeight) / 2;
        } else {
            this.fit();
        }
        this.constrain();
        if (this.theme) this.draw(this.theme);
    }

    fit() {
        this.scale = Math.max(4, Math.min(this.baseScale,
            (this.width - 2 * this.margin) / this.grid.getWidth(),
            (this.height - 2 * this.margin) / this.grid.getHeight()));
        this.pan.x = (this.width - this.grid.getWidth() * this.scale) / 2 - this.margin;
        this.pan.y = (this.height - this.grid.getHeight() * this.scale) / 2 - this.margin;
        if (this.theme) this.draw(this.theme);
    }

    constrain() {
        for (const [axis, extent, units] of [['x', this.width, this.grid.getWidth()], ['y', this.height, this.grid.getHeight()]]) {
            const size = units * this.scale + 2 * this.margin;
            this.pan[axis] = size <= extent ? (extent - size) / 2 : Math.max(extent - size, Math.min(0, this.pan[axis]));
        }
    }

    zoom(factor, x = this.width / 2, y = this.height / 2) {
        const previous = this.scale;
        this.scale = Math.max(4, Math.min(this.baseScale * 4, previous * factor));
        const ratio = this.scale / previous;
        this.pan.x = x - this.margin - (x - this.pan.x - this.margin) * ratio;
        this.pan.y = y - this.margin - (y - this.pan.y - this.margin) * ratio;
        this.constrain();
        if (this.theme) this.draw(this.theme);
    }

    draw(theme) {
        this.theme = theme;
        const ctx = this.canvas.getContext("2d");
        ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.translate(this.pan.x + 0.5, this.pan.y + 0.5);

        if (this.finished) {
            this.drawFaces(ctx, this.grid.faces.filter(f => f.type === Face.TYPE_ON), theme.edge.selected.color);
            this.drawEdges(ctx, this.grid.edges, theme.edge.default);

            return;
        }

        this.drawEdges(ctx, this.edgesByState(Edge.STATE_DEFAULT).filter(e => e.valid), theme.edge.default);
        this.drawEdges(ctx, this.edgesByState(Edge.STATE_DEFAULT).filter(e => !e.valid), theme.edge.discarded);
        this.drawEdges(ctx, this.edgesByState(Edge.STATE_SELECTED), theme.edge.selected);
        this.drawEdges(ctx, this.edgesByState(Edge.STATE_DISABLED), theme.edge.discarded);
        this.drawXOnEdges(ctx, this.edgesByState(Edge.STATE_DISABLED), theme.edge.discardedX);

        if (this.debug) {
            this.drawFaces(ctx, this.grid.faces.filter(f => f.type === Face.TYPE_ON), theme.debuggedFaceON);

            this.drawDebuggedDot(ctx, theme);
            this.drawDebuggedEdge(ctx, theme);
            this.drawDebuggedFace(ctx, theme);
        }

        this.drawFaceValues(ctx, theme.face);
        this.drawDotValues(ctx, this.grid.dots.filter(d => d.type === Dot.TYPE_ON && d.valueVisible), theme.dot.on);
        this.drawDotValues(ctx, this.grid.dots.filter(d => d.type === Dot.TYPE_OFF && d.valueVisible), theme.dot.off);
        this.drawEdges(ctx, this.grid.edges.filter(e => e.error), theme.edge.error);
    }

    drawEdges(ctx, edges, style) {
        ctx.save();
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.width;
        ctx.shadowColor = style.shadowColor;
        ctx.shadowBlur = style.shadowBlur;
        ctx.beginPath();
        for (let e of edges) {
            ctx.moveTo(this.p(e.d1.x), this.p(e.d1.y));
            ctx.lineTo(this.p(e.d2.x), this.p(e.d2.y));
        }
        ctx.stroke();
        ctx.restore();
    }

    drawXOnEdges(ctx, edges, style) {
        ctx.strokeStyle = style.color;
        ctx.lineWidth = style.width;
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

    drawFaceValues(ctx, style) {
        for (let f of this.grid.faces) {
            if (f.value !== undefined && f.valueVisible) {
                ctx.font = (f.error ? "bold " : "") + style.font;
                ctx.fillStyle = f.error ? style.error : style.value;
                ctx.fillText(f.value, this.p(f.cx) - 6, this.p(f.cy) + 6);
            }
        }
    }

    drawDotValues(ctx, dots, style) {
        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWidth;
        ctx.fillStyle = style.fillColor;

        for (let d of dots) {
            ctx.beginPath();
            ctx.arc(this.p(d.x), this.p(d.y), 13, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        }

        ctx.strokeStyle = style.strokeColor;
        ctx.lineWidth = style.strokeWidth;
        ctx.fillStyle = style.fillColor;
        for (let d of dots) {
            const marginTop = 5;
            const marginLeft = d.value < 10 ? -5 : -10;
            ctx.font = style.font;
            ctx.fillStyle = d.error ? style.error : style.value;
            ctx.fillText(d.value, this.p(d.x) + marginLeft, this.p(d.y) + marginTop);
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
    drawFacesIds(ctx, style) {
        ctx.font = style.font;
        ctx.fillStyle = style.value;
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
