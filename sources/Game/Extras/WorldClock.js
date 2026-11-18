import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

/**
 * Floating real-time clock (Malaysia time, UTC+8) beside the landing zone.
 * Glass dial, instanced ticks, sweeping hands, an orbiting "second comet" with a trail,
 * a digital readout panel, a pulse every minute and a burst on the hour.
 * Always faces the camera and glows brighter at night.
 */
export class WorldClock
{
    constructor()
    {
        this.game = Game.getInstance()
        this.radius = 2.1
        this.group = new THREE.Group()
        this.group.name = 'worldClock'
        this.face = new THREE.Group()
        this.group.add(this.face)

        const landing = this.game.respawns.getByName('landing') ?? this.game.respawns.getDefault()
        this.anchor = landing ? landing.position.clone() : new THREE.Vector3()
        this.anchor.add(new THREE.Vector3(-6.5, 4.2, -7.5))
        this.group.position.copy(this.anchor)

        this.colors = {
            ink: new THREE.Color('#0b0c0e'),
            white: new THREE.Color('#f2f5ff'),
            cobalt: new THREE.Color('#4c6bff'),
            ice: new THREE.Color('#9fd0ff'),
            coral: new THREE.Color('#ff5a4e'),
        }

        this.setDial()
        this.setTicks()
        this.setHands()
        this.setComet()
        this.setPulses()
        this.setReadout()

        this.game.scene.add(this.group)
        this.lastSecond = -1
        this.lastMinute = -1
        this.lastHour = -1
        this.game.ticker.events.on('tick', () => this.update(), 12)
    }

    basic(color, options = {})
    {
        const material = new THREE.MeshBasicNodeMaterial({ color, fog: false, ...options })
        material.toneMapped = false
        return material
    }

    setDial()
    {
        // Smoked glass disc
        this.glass = new THREE.Mesh(
            new THREE.CircleGeometry(this.radius, 96),
            this.basic(this.colors.ink, { transparent: true, opacity: 0.55, depthWrite: false })
        )
        this.face.add(this.glass)

        // Bezel: thin bright ring + soft outer halo
        this.bezelMaterial = this.basic(this.colors.white.clone())
        this.bezel = new THREE.Mesh(new THREE.RingGeometry(this.radius, this.radius + 0.07, 128), this.bezelMaterial)
        this.bezel.position.z = 0.01
        this.face.add(this.bezel)

        this.haloMaterial = this.basic(this.colors.cobalt.clone(), { transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending })
        this.halo = new THREE.Mesh(new THREE.RingGeometry(this.radius + 0.1, this.radius + 0.2, 128), this.haloMaterial)
        this.halo.position.z = 0.005
        this.face.add(this.halo)

        // Back depth: a slim cylinder edge gives the clock body when seen at an angle
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(this.radius + 0.07, this.radius + 0.07, 0.18, 96, 1, true),
            this.basic(this.colors.cobalt.clone().multiplyScalar(0.5), { side: THREE.DoubleSide })
        )
        body.rotation.x = Math.PI / 2
        body.position.z = -0.09
        this.face.add(body)
    }

    setTicks()
    {
        const geometry = new THREE.PlaneGeometry(1, 1)
        this.ticks = new THREE.InstancedMesh(geometry, this.basic(this.colors.white), 60)
        const matrix = new THREE.Matrix4()
        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        const scale = new THREE.Vector3()
        const color = new THREE.Color()
        for(let i = 0; i < 60; i++)
        {
            const angle = (i / 60) * Math.PI * 2
            const major = i % 5 === 0
            const length = major ? 0.32 : 0.12
            const r = this.radius - 0.12 - length / 2
            position.set(Math.sin(angle) * r, Math.cos(angle) * r, 0.02)
            quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -angle)
            scale.set(major ? 0.07 : 0.03, length, 1)
            matrix.compose(position, quaternion, scale)
            this.ticks.setMatrixAt(i, matrix)
            this.ticks.setColorAt(i, color.copy(i % 15 === 0 ? this.colors.ice : this.colors.white).multiplyScalar(major ? 1 : 0.55))
        }
        this.face.add(this.ticks)
    }

    hand(length, width, color, z, tail = 0.18)
    {
        const shape = new THREE.Shape()
        const w = width / 2
        shape.moveTo(-w, -tail)
        shape.lineTo(w, -tail)
        shape.lineTo(w * 0.6, length)
        shape.quadraticCurveTo(0, length + w, -w * 0.6, length)
        shape.lineTo(-w, -tail)
        const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), this.basic(color))
        mesh.position.z = z
        this.face.add(mesh)
        return mesh
    }

    setHands()
    {
        this.hourHand = this.hand(this.radius * 0.5, 0.16, this.colors.white, 0.04)
        this.minuteHand = this.hand(this.radius * 0.78, 0.1, this.colors.ice, 0.05)
        this.secondHand = this.hand(this.radius * 0.88, 0.035, this.colors.coral, 0.06, 0.4)

        const hub = new THREE.Mesh(new THREE.CircleGeometry(0.11, 32), this.basic(this.colors.coral))
        hub.position.z = 0.07
        this.face.add(hub)
        const hubDot = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), this.basic(this.colors.ink))
        hubDot.position.z = 0.075
        this.face.add(hubDot)
    }

    setComet()
    {
        // Head + fading trail of instanced dots riding the bezel
        this.trailCount = 24
        this.comet = new THREE.InstancedMesh(new THREE.CircleGeometry(0.075, 20), this.basic(0xffffff, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), this.trailCount)
        this.comet.position.z = 0.03
        for(let i = 0; i < this.trailCount; i++)
            this.comet.setColorAt(i, this.colors.coral.clone().multiplyScalar(Math.pow(1 - i / this.trailCount, 1.6)))
        this.face.add(this.comet)
    }

    setPulses()
    {
        this.pulses = []
        for(let i = 0; i < 3; i++)
        {
            const material = this.basic(this.colors.cobalt.clone(), { transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })
            const mesh = new THREE.Mesh(new THREE.RingGeometry(this.radius + 0.05, this.radius + 0.12, 128), material)
            mesh.position.z = -0.01
            this.face.add(mesh)
            this.pulses.push({ mesh, material, life: 1, strength: 1 })
        }
    }

    pulse(strength = 1, color = this.colors.cobalt)
    {
        const pulse = this.pulses.find(p => p.life >= 1) ?? this.pulses[0]
        pulse.life = 0
        pulse.strength = strength
        pulse.material.color.copy(color)
    }

    setReadout()
    {
        this.canvas = document.createElement('canvas')
        this.canvas.width = 1024
        this.canvas.height = 256
        this.context = this.canvas.getContext('2d')
        this.texture = new THREE.CanvasTexture(this.canvas)
        this.texture.colorSpace = THREE.SRGBColorSpace
        this.texture.anisotropy = 4

        const width = 3.6
        this.readout = new THREE.Mesh(
            new THREE.PlaneGeometry(width, width / 4),
            this.basic(0xffffff, { map: this.texture, transparent: true, depthWrite: false })
        )
        this.readout.position.set(0, -this.radius - 0.75, 0.02)
        this.face.add(this.readout)

        document.fonts?.ready.then(() => { this.lastSecond = -1 })
    }

    drawReadout(parts)
    {
        const ctx = this.context
        const { width, height } = this.canvas
        ctx.clearRect(0, 0, width, height)

        // Pill background
        const r = 64
        ctx.fillStyle = 'rgba(11, 12, 14, 0.78)'
        ctx.beginPath()
        ctx.roundRect(8, 8, width - 16, height - 16, r)
        ctx.fill()
        ctx.strokeStyle = 'rgba(159, 208, 255, 0.45)'
        ctx.lineWidth = 4
        ctx.stroke()

        // Live dot
        ctx.fillStyle = parts.second % 2 ? '#ff5a4e' : '#ff8a80'
        ctx.beginPath()
        ctx.arc(92, height / 2, 16, 0, Math.PI * 2)
        ctx.fill()

        // Time
        ctx.fillStyle = '#f2f5ff'
        ctx.textBaseline = 'middle'
        ctx.font = '500 118px "JetBrains Mono", ui-monospace, monospace'
        const time = `${parts.hh}:${parts.mm}`
        ctx.fillText(time, 136, height / 2 + 6)
        const timeWidth = ctx.measureText(time).width
        ctx.fillStyle = '#ff5a4e'
        ctx.font = '500 64px "JetBrains Mono", ui-monospace, monospace'
        ctx.fillText(parts.ss, 136 + timeWidth + 14, height / 2 + 22)

        // Date + zone
        ctx.textAlign = 'right'
        ctx.fillStyle = '#9fd0ff'
        ctx.font = '500 44px "JetBrains Mono", ui-monospace, monospace'
        ctx.fillText(parts.date, width - 64, height / 2 - 26)
        ctx.fillStyle = 'rgba(242, 245, 255, 0.7)'
        ctx.font = '500 36px "JetBrains Mono", ui-monospace, monospace'
        ctx.fillText('MALAYSIA · UTC+8', width - 64, height / 2 + 32)
        ctx.textAlign = 'left'

        this.texture.needsUpdate = true
    }

    malaysiaNow()
    {
        const now = Date.now()
        const local = new Date(now + 8 * 3600 * 1000) // shift to UTC+8, then read UTC fields
        const ms = local.getUTCMilliseconds()
        const s = local.getUTCSeconds()
        const m = local.getUTCMinutes()
        const h = local.getUTCHours()
        const days = [ 'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT' ]
        const months = [ 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC' ]
        return {
            h, m, s, ms,
            second: s,
            hh: String(h).padStart(2, '0'),
            mm: String(m).padStart(2, '0'),
            ss: String(s).padStart(2, '0'),
            date: `${days[local.getUTCDay()]} ${local.getUTCDate()} ${months[local.getUTCMonth()]}`,
        }
    }

    update()
    {
        const t = this.malaysiaNow()
        const delta = this.game.ticker.delta
        const elapsed = this.game.ticker.elapsed

        // Hands: smooth sweep
        const seconds = t.s + t.ms / 1000
        const minutes = t.m + seconds / 60
        const hours = (t.h % 12) + minutes / 60
        this.secondHand.rotation.z = -(seconds / 60) * Math.PI * 2
        this.minuteHand.rotation.z = -(minutes / 60) * Math.PI * 2
        this.hourHand.rotation.z = -(hours / 12) * Math.PI * 2

        // Comet trail along the bezel
        const matrix = new THREE.Matrix4()
        const position = new THREE.Vector3()
        const quaternion = new THREE.Quaternion()
        const scale = new THREE.Vector3()
        for(let i = 0; i < this.trailCount; i++)
        {
            const angle = ((seconds - i * 0.09) / 60) * Math.PI * 2
            const r = this.radius + 0.035
            position.set(Math.sin(angle) * r, Math.cos(angle) * r, 0)
            const size = 1 - i / this.trailCount
            scale.set(size, size, 1)
            matrix.compose(position, quaternion, scale)
            this.comet.setMatrixAt(i, matrix)
        }
        this.comet.instanceMatrix.needsUpdate = true

        // Events
        if(t.s !== this.lastSecond)
        {
            this.lastSecond = t.s
            this.drawReadout(t)
        }
        if(t.m !== this.lastMinute)
        {
            if(this.lastMinute !== -1)
                this.pulse(t.m === 0 ? 2.2 : 1, t.m === 0 ? this.colors.coral : this.colors.cobalt)
            this.lastMinute = t.m
        }

        // Pulses expand and fade
        for(const pulse of this.pulses)
        {
            if(pulse.life >= 1)
            {
                pulse.material.opacity = 0
                continue
            }
            pulse.life = Math.min(1, pulse.life + delta / (1.2 * pulse.strength))
            const s = 1 + pulse.life * 0.35 * pulse.strength
            pulse.mesh.scale.set(s, s, 1)
            pulse.material.opacity = (1 - pulse.life) * 0.8
        }

        // Night glow
        const progress = this.game.dayCycles?.progress ?? 0
        const night = THREE.MathUtils.smoothstep(progress, 0.2, 0.3) * (1 - THREE.MathUtils.smoothstep(progress, 0.65, 0.75))
        const breathe = 0.5 + Math.sin(elapsed * 1.5) * 0.5
        this.haloMaterial.opacity = 0.25 + night * 0.4 + breathe * 0.15
        this.bezelMaterial.color.copy(this.colors.white).multiplyScalar(1 + night * 0.8)

        // Float + face the camera
        this.group.position.y = this.anchor.y + Math.sin(elapsed * 0.8) * 0.15
        const camera = this.game.view?.camera
        if(camera)
            this.group.quaternion.copy(camera.quaternion)
    }
}
