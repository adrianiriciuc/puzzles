class GameGenerationProgressRenderer {
    progress = 0;

    constructor(canvas) {
        this.canvas = canvas;
        this.resize();
    }

    resize() {
        const {width, height} = this.canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        this.canvas.width = Math.round(width * ratio);
        this.canvas.height = Math.round(height * ratio);
        if (this.theme) this.draw(this.theme);
    }

    draw(theme) {
        this.theme = theme;
        const ctx = this.canvas.getContext("2d");
        const {width, height} = this.canvas.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

        ctx.fillStyle = theme.background;
        ctx.fillRect(0, 0, width, height);

        const barWidth = Math.max(0, Math.min(280, width - 48));
        const barHeight = 6;
        const x = (width - barWidth) / 2;
        const y = height / 2 + 12;
        const progress = Math.max(0, Math.min(1, this.progress));

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '14px system-ui, sans-serif';
        ctx.fillStyle = theme.face.value;
        ctx.fillText(`Generating puzzle… ${Math.round(progress * 100)}%`, width / 2, y - 20);
        ctx.strokeStyle = theme.edge.default.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);
        ctx.fillStyle = theme.edge.selected.color;
        ctx.fillRect(x, y, barWidth * progress, barHeight);
        ctx.restore();
    }
}
