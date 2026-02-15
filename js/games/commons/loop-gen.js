class LoopGen {
    generateLoop(grid) {
        let face = grid.faces[this.rnd(grid.faces.length)];
        face.type = Face.TYPE_ON;
        face.visited = true;

        const remaining = this.getVisitableNeighbours(face);

        while (remaining.length) {
            face = remaining.splice(this.rnd(remaining.length), 1)[0];
            face.visited = true;
            if (this.canBeAddedToLoop(face)) {
                face.type = Face.TYPE_ON;
                remaining.push(...this.getVisitableNeighbours(face));
            }
        }
    }

    rnd(x) {
        return Math.floor(Math.random() * x);
    }

    canBeAddedToLoop(face) {
        if (face.type === Face.TYPE_ON) {
            return false;
        }

        const edgesOn = face.edges.filter(edge => edge.f1?.type === Face.TYPE_ON || edge.f2?.type === Face.TYPE_ON);
        if (edgesOn.length < 1 || edgesOn.length > 2) {
            return false;
        }

        // if (edgesOn.length === 1) {
        //     return true;
        // }

        const dotsOn = face.dots.filter(dot => dot.faces.some(face => face.type === Face.TYPE_ON));
        return dotsOn.length < 3;
    }

    getVisitableNeighbours(face) {
        return face.edges
            .flatMap(edge => [edge.f1, edge.f2])
            .filter(face => face && !face.visited);
    }
}