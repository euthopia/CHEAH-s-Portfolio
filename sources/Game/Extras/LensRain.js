import { Game } from '../Game.js'

/**
 * Raindrops sliding on the "camera lens" while it rains, plus a cool tint during storms.
 * Lightweight 2D canvas; fades out completely when dry or under reduced motion.
 */
export class LensRain
{
    constructor()
    {
        this.game = Game.getInstance()
        this.reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        this.canvas = document.createElement('canvas')
        this.canvas.className = 'lens-rain'
        this.canvas.setAttribute('aria-hidden', 'true')
        document.body.appendChild(this.canvas)
        this.context = this.canvas.getContext('2d')
        this.drops = []
        this.opacity = 0
        this.resize()
        addEventListener('resize', () => this.resize())
        this.game.ticker.events.on('tick', () => this.update(), 20)
    }

    resize()
    {
        const ratio = this.game.viewport?.isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
        this.ratio = ratio
        this.canvas.width = innerWidth * ratio
        this.canvas.height = innerHeight * ratio
    }

    spawn()
    {
        const r = (2 + Math.random() * 7) * this.ratio
        this.drops.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height * 0.9,
            r,
            vy: 0,
            life: 0,
            slide: Math.random() < 0.35,
        })
    }

    update()
    {
        if(this.reduced)
            return
        const rain = Math.max(0, this.game.weather?.rain.value ?? 0)
        const storm = Math.max(0, this.game.weather?.electricField.value ?? 0) * rain
        const target = rain > 0.15 ? Math.min(1, rain * 1.2) : 0
        this.opacity += (target - this.opacity) * 0.04
        this.canvas.style.opacity = this.opacity.toFixed(3)
        this.canvas.style.boxShadow = storm > 0.01 ? `inset 0 0 ${Math.round(160 * storm)}px rgba(20, 40, 90, ${(0.6 * storm).toFixed(2)})` : 'none'

        if(this.opacity < 0.01)
        {
            if(this.drops.length)
            {
                this.drops.length = 0
                this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            }
            return
        }

        const delta = this.game.ticker.delta
        this.spawnBudget = (this.spawnBudget ?? 0) + rain * 14 * delta
        while(this.spawnBudget >= 1)
        {
            this.spawnBudget -= 1
            if(this.drops.length < (this.game.viewport?.isMobile ? 60 : 140)) this.spawn()
        }

        const ctx = this.context
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        for(const drop of this.drops)
        {
            drop.life += delta
            if(drop.slide && drop.life > 0.6)
            {
                drop.vy += delta * 160 * this.ratio
                drop.y += drop.vy * delta
                drop.x += Math.sin(drop.life * 8 + drop.r) * 0.3
            }

            // Body: light refracted from above, darker rim below
            const gradient = ctx.createRadialGradient(drop.x - drop.r * 0.3, drop.y - drop.r * 0.4, drop.r * 0.1, drop.x, drop.y, drop.r)
            gradient.addColorStop(0, 'rgba(255,255,255,0.55)')
            gradient.addColorStop(0.55, 'rgba(200,225,255,0.12)')
            gradient.addColorStop(1, 'rgba(10,20,40,0.35)')
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.ellipse(drop.x, drop.y, drop.r * 0.85, drop.r, 0, 0, Math.PI * 2)
            ctx.fill()

            if(drop.slide && drop.vy > 0)
            {
                ctx.strokeStyle = 'rgba(220,235,255,0.12)'
                ctx.lineWidth = drop.r * 0.5
                ctx.beginPath()
                ctx.moveTo(drop.x, drop.y - drop.r)
                ctx.lineTo(drop.x, drop.y - drop.r - Math.min(80 * this.ratio, drop.vy * 0.15))
                ctx.stroke()
            }
        }
        this.drops = this.drops.filter(d => d.y < this.canvas.height + 20 && d.life < (d.slide ? 8 : 3 + d.r * 0.1))
    }
}
