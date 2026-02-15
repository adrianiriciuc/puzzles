class GameGenerationProgressRenderer {
    margin = 10;

    barHeight = 20;

    constructor(grid, canvas, scale) {
        this.grid = grid;
        this.canvas = canvas;
        this.scale = scale;

        this.width = this.grid.getWidth() * scale;
        this.height = this.grid.getHeight() * scale;

        this.canvas.width = this.width + 2 * this.margin + 1;
        this.canvas.height = this.height + 2 * this.margin + 1;

        const ctx = this.canvas.getContext("2d");
        ctx.translate(0.5, 0.5);
    }

    draw(theme, progress) {
        const ctx = this.canvas.getContext("2d");

        ctx.fillStyle = theme.background;
        ctx.fillRect(-1, -1, this.canvas.width + 2, this.canvas.height + 2);

        const barHeight = this.barHeight;
        const barWidth = this.width;

        const x = (this.width - barWidth) / 2 + this.margin;
        const y = (this.height - barHeight) / 2 + this.margin;

        const progressWidth = barWidth * progress;
        ctx.fillStyle = theme.edgeSelected;
        ctx.fillRect(x, y, progressWidth, barHeight);

        ctx.strokeStyle = theme.edgeDefault;
        ctx.lineWidth = 2;
        ctx.rect(x, y, barWidth, barHeight);
        ctx.stroke();
    }
}