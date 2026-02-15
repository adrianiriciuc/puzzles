class Dot {
    x;
    y;
    constructor(edges, faces) {
        this.edges = edges;
        this.faces = faces;
    }

    distance(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Edge {
    // default edge, no info
    static STATE_DEFAULT = 'default';
    // user selected
    static STATE_SELECTED = 'selected';
    // user discarded
    static STATE_DISABLED = 'disabled';

    static TYPE_OFF = 'off';
    static TYPE_ON = 'on';

    state = Edge.STATE_DEFAULT;
    type = Edge.TYPE_OFF;

    // automatically determined as error
    error = false;
    // automatically determined if it's possible for selection or not
    valid = true;

    constructor(d1, d2, f1, f2) {
        this.d1 = d1;
        this.d2 = d2;
        this.f1 = f1;
        this.f2 = f2;
    }

    distance(x, y) {
        const a = x - this.d1.x;
        const b = y - this.d1.y;
        const c = this.d2.x - this.d1.x;
        const d = this.d2.y - this.d1.y;

        const dot = a * c + b * d;
        const len = c * c + d * d;
        const p = len !== 0 ? dot / len : -1;

        if (p < 0) {
            return this.d(this.d1.x, this.d1.y, x, y);
        } else if (p > 1) {
            return this.d(this.d2.x, this.d2.y, x, y);
        } else {
            return this.d(this.d1.x + p * c, this.d1.y + p * d, x, y);
        }
    }

    d(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Face {
    static TYPE_OFF = 'off';
    static TYPE_ON = 'on';

    cx;
    cy;

    type = Face.TYPE_OFF;

    value;
    valueVisible = true;

    error = false;

    constructor(dots, edges) {
        this.dots = dots;
        this.edges = edges;
    }

    size() {
        return this.edges.length;
    }

    contains(x, y) {
        const dx = this.cx - x;
        const dy = this.cy - y;
        return Math.sqrt(dx * dx + dy * dy) < 0.5;
    }
}

class Grid {
    debuggedDot;
    debuggedEdge;
    debuggedFace;

    constructor(faces, edges, dots) {
        this.dots = dots;
        this.edges = edges;
        this.faces = faces;
    }

    getWidth() {
        throw new Error("Not implemented!");
    }

    getHeight() {
        throw new Error("Not implemented!");
    }
}
