import { Game } from '../Game.js'

/**
 * Adaptive resolution: once the world is visible, watch the frame rate and step the
 * render pixel ratio down (to a floor of 1) when the device can't keep up.
 * Steps back up slowly if there is plenty of headroom.
 */
export class Performance
{
    constructor()
    {
        this.game = Game.getInstance()
        this.viewport = this.game.viewport
        this.samples = []
        this.cooldown = 4 // seconds before the first measurement (let compilation settle)
        this.min = 1
        this.max = this.viewport.pixelRatioMax
        this.step = 0.25

        this.game.ticker.events.on('tick', () => this.update(), 999)
    }

    setPixelRatio(value)
    {
        const next = Math.max(this.min, Math.min(this.max, Math.round(value * 100) / 100))
        if(Math.abs(next - this.viewport.pixelRatio) < 0.01)
            return
        this.viewport.pixelRatioMax = next
        this.viewport.pixelRatio = Math.min(this.viewport.pixelRatioPure, next)
        this.game.rendering?.resize()
    }

    update()
    {
        // Real wall-clock frame time (the game ticker caps its delta at 1/30 s)
        const now = performance.now()
        const delta = this.last ? Math.min(1, (now - this.last) / 1000) : 1 / 60
        this.last = now
        if(document.hidden)
            return

        if(this.cooldown > 0)
        {
            this.cooldown -= delta
            return
        }

        // Evaluate every ~2 seconds (or 90 frames), whichever comes first, so slow devices react quickly
        this.samples.push(delta)
        const elapsed = this.samples.reduce((sum, value) => sum + value, 0)
        if(this.samples.length < 90 && (elapsed < 2 || this.samples.length < 8))
            return

        const sorted = [ ...this.samples ].sort((a, b) => a - b)
        const median = sorted[Math.floor(sorted.length / 2)]
        this.samples.length = 0

        if(median > 1 / 38 && this.viewport.pixelRatio > this.min)
        {
            this.setPixelRatio(this.viewport.pixelRatio - this.step)
            this.cooldown = 2
        }
        else if(median < 1 / 58 && this.viewport.pixelRatio < Math.min(this.max, this.viewport.pixelRatioPure))
        {
            this.setPixelRatio(this.viewport.pixelRatio + this.step)
            this.cooldown = 6
        }
    }
}
