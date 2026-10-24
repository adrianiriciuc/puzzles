// Pointer coordinates stay in CSS pixels; only grid spacing changes with zoom.
function BoardControls(canvas, getRenderer) {
    const pointers = new Map();
    let start, moved = false;
    const point = e => {
        const rect = canvas.getBoundingClientRect();
        return {x: e.clientX - rect.left, y: e.clientY - rect.top};
    };
    const pair = () => {
        const [a, b] = [...pointers.values()];
        return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y)};
    };
    canvas.addEventListener('pointerdown', e => {
        if (e.button !== 0 || pointers.size >= 2 || !getRenderer()?.enabled) return;
        canvas.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, point(e));
        if (pointers.size === 1) { start = point(e); moved = false; }
        else moved = true;
    });
    canvas.addEventListener('pointermove', e => {
        if (!pointers.has(e.pointerId)) return;
        const r = getRenderer();
        const previous = pointers.get(e.pointerId), next = point(e);
        const before = pointers.size === 2 ? pair() : null;
        pointers.set(e.pointerId, next);
        if (before) {
            const after = pair();
            if (before.distance > 0) r.zoom(after.distance / before.distance, before.x, before.y);
            r.pan.x += after.x - before.x;
            r.pan.y += after.y - before.y;
        } else {
            if (!moved && Math.hypot(next.x - start.x, next.y - start.y) < 6) return;
            const origin = moved ? previous : start;
            moved = true;
            r.pan.x += next.x - origin.x;
            r.pan.y += next.y - origin.y;
        }
        r.constrain();
        r.draw(r.theme);
    });
    const end = e => {
        if (!pointers.has(e.pointerId)) return;
        if (e.type === 'pointerup' && pointers.size === 1 && !moved) {
            const p = point(e);
            getRenderer().activate(p.x, p.y);
        }
        pointers.delete(e.pointerId);
        moved = true;
    };
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, end);
    canvas.addEventListener('wheel', e => {
        const r = getRenderer();
        if (!r?.enabled) return;
        e.preventDefault();
        const p = point(e);
        r.zoom(Math.exp(-e.deltaY * 0.002), p.x, p.y);
    }, {passive: false});
    new ResizeObserver(() => getRenderer()?.resize()).observe(canvas.parentElement);
}
