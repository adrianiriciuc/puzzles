function emptyArray(n) {
    const result = [];
    result.length = n;
    return result;
}

function emptyGrid(rows, columns) {
    const result = [];
    result.length = rows;

    for (let r = 0; r < rows; r++) {
        result[r] = emptyArray(columns);
    }

    return result;
}

function shuffleArray(arr) {
    const result = arr.slice();
    for (let i = 0, len = result.length; i < len; i++) {
        let j = Math.floor(Math.random() * (i + 1));
        const temp = result[i];
        result[i] = result[j];
        result[j] = temp;

    }
    return result;
}