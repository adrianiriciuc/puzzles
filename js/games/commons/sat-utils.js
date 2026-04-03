class SatUtils {
    static dotClausesForLoop(dot) {
        const n = dot.edges.length;
        const clauses = [];
        // 3 edges connected by this dot cannot be true
        SatUtils.combinations(n, 3, result => clauses.push(result.map(i => -dot.edges[i].id)));
        // only one edge alone cannot be true;
        for (let i = 0; i < n; i++) {
            clauses.push(dot.edges.map(e => e === dot.edges[i] ? -e.id : e.id));
        }
        return clauses;
    }

    static combinations(n, k, callback) {
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