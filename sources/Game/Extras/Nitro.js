import * as THREE from 'three/webgpu'
import { attribute, color, mix, uniform, vec3, vec4 } from 'three/tsl'
import { Game } from '../Game.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'
import { buildNitro } from './nitroModel.js'

/**
 * Quad nitro exhausts on the car: blue pilot flames at idle, long nitro jets with shock
 * diamonds on boost, orange backfire pops when lifting off the throttle at speed.
 * Konami code → rainbow nitro for a while.
 */
export class Nitro
{
    constructor()
    {
        this.game = Game.getInstance()
        this.rainbow = uniform(0)
        this.tint = uniform(new THREE.Color('#ffffff'))
        this.rainbowTime = 0

        this.model = buildNitro({
            THREE,
            chrome: () => new MeshDefaultMaterial({ colorNode: color('#dfe5ee'), hasWater: false }),
            dark: () => new MeshDefaultMaterial({ colorNode: color('#0b0c0e'), hasWater: false }),
            flame: () =>
            {
                const material = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false })
                const baked = attribute('color', 'vec4')
                const tinted = mix(baked.rgb, baked.rgb.add(this.tint.mul(baked.a)).mul(1.3), this.rainbow)
                material.colorNode = tinted.mul(1.15)
                material.opacityNode = baked.a
                material.toneMapped = false
                return material
            }
        })

        this.game.ticker.events.on('tick', () => this.update(), 11)
    }

    get chassis() { return this.game.world?.visualVehicle?.parts?.chassis }

    rainbowMode(duration = 20)
    {
        this.rainbowTime = duration
        this.game.notifications?.show('🌈 Konami! Rainbow nitro unlocked for 20 seconds. Hold Shift!', '', 5)
    }

    update()
    {
        const chassis = this.chassis
        if(!chassis)
            return
        if(this.model.root.parent !== chassis)
            chassis.add(this.model.root)

        const dt = Math.min(0.1, this.game.ticker.delta)
        const t = this.game.ticker.elapsed
        const player = this.game.player
        const speed = this.game.physicalVehicle?.speed ?? 0

        this.rainbowTime = Math.max(0, this.rainbowTime - dt)
        const rainbowTarget = this.rainbowTime > 0 ? 1 : 0
        this.rainbow.value += (rainbowTarget - this.rainbow.value) * Math.min(1, dt * 3)
        if(this.rainbow.value > 0.001)
            this.tint.value.setHSL((t * 0.5) % 1, 1, 0.55)

        const boosting = (player?.boosting ?? 0) * (player?.accelerating ? 1 : 0.4)
        this.model.update({
            t,
            dt,
            boost: Math.max(boosting, this.rainbowTime > 0 && player?.accelerating ? 1 : 0),
            accel: Math.abs(player?.accelerating ?? 0),
            speed,
        })
    }
}
