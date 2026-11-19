import * as THREE from 'three/webgpu'
import { color, uniform, vec4 } from 'three/tsl'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { Game } from '../Game.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'
import { buildDriver, OUTFITS, HAIRSTYLES } from './driverModel.js'

const STORAGE_KEY = 'cheah:driver'

/**
 * Original driver character riding out of the sunroof.
 * Leans into turns, cheers on boost, waves when parked or honking, looks around.
 */
export class Driver
{
    constructor({ glow } = {})
    {
        this.game = Game.getInstance()
        this.glow = glow ?? uniform(0.12)
        this.settings = { visible: true, outfit: 'vice', hair: 'short' }
        try { Object.assign(this.settings, JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')) } catch {}

        this.model = buildDriver({
            THREE,
            RoundedBoxGeometry,
            material: (hex) =>
            {
                const tint = uniform(new THREE.Color(hex))
                const material = new MeshDefaultMaterial({ colorNode: tint, hasWater: false })
                const lit = material.outputNode
                material.outputNode = vec4(lit.rgb.add(tint.mul(this.glow).mul(0.7)), lit.a)
                material.userData.setColor = (value) => tint.value.set(value)
                return material
            }
        })
        this.model.root.position.set(-0.2, 0.7, 0)
        this.apply()

        this.idleTime = 0
        this.waveTime = 0
        this.lookTarget = 0
        this.nextLook = 2

        this.game.ticker.events.on('tick', () => this.update(), 11)
    }

    get chassis() { return this.game.world?.visualVehicle?.parts?.chassis }

    save()
    {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings)) } catch {}
    }

    apply()
    {
        this.model.setOutfit(this.settings.outfit)
        this.model.setHair(this.settings.hair)
        this.model.root.visible = this.settings.visible
    }

    set(key, value)
    {
        this.settings[key] = value
        this.apply()
        this.save()
        this.refresh?.()
    }

    wave(duration = 2.4)
    {
        this.waveTime = Math.max(this.waveTime, duration)
    }

    update()
    {
        const chassis = this.chassis
        if(!chassis)
            return
        // Re-attach if the vehicle was rebuilt (e.g. Konami code)
        if(this.model.root.parent !== chassis)
            chassis.add(this.model.root)
        if(!this.settings.visible)
            return

        const dt = Math.min(0.1, this.game.ticker.delta)
        const t = this.game.ticker.elapsed
        const player = this.game.player
        const speed = this.game.physicalVehicle?.speed ?? 0

        // Parked for a while → friendly wave every few seconds; honking → wave back
        if(speed < 0.4 && !player?.accelerating)
            this.idleTime += dt
        else
            this.idleTime = 0
        if(this.idleTime > 1.5 && this.waveTime <= 0 && (this.idleTime % 9) < dt * 1.5)
            this.wave()
        if(this.game.inputs?.actions?.get('honk')?.active)
            this.wave(1.2)
        this.waveTime = Math.max(0, this.waveTime - dt)

        // Look around now and then (toward the camera side when parked)
        this.nextLook -= dt
        if(this.nextLook <= 0)
        {
            this.lookTarget = this.idleTime > 1 ? (Math.random() * 2 - 1) : (Math.random() - 0.5) * 0.6
            this.nextLook = 1.5 + Math.random() * 3
        }

        this.model.animate({
            t,
            dt,
            steer: player?.steering ?? 0,
            accel: player?.accelerating ?? 0,
            boost: (player?.boosting ?? 0) * Math.min(1, speed / 2),
            wave: this.waveTime > 0 ? 1 : 0,
            look: this.lookTarget,
        })
    }

    render(container)
    {
        container.innerHTML = `
            <label class="wx-toggle"><input type="checkbox" class="dr-visible"> <span>Show driver</span></label>
            <div class="dr-row"><span class="dr-label">Outfit</span><div class="dr-chips dr-outfits">
                ${Object.entries(OUTFITS).map(([ id, o ]) => `<button type="button" data-id="${id}"><span class="gr-chip" style="--a:${o.shirt};--b:${o.pattern}"></span>${o.label}</button>`).join('')}
            </div></div>
            <div class="dr-row"><span class="dr-label">Hair</span><div class="dr-chips dr-hair">
                ${Object.entries(HAIRSTYLES).map(([ id, label ]) => `<button type="button" data-id="${id}">${label}</button>`).join('')}
            </div></div>
            <button type="button" class="hud-btn-solid dr-wave">👋 Say hi</button>
        `
        container.querySelector('.dr-visible').addEventListener('change', (e) => this.set('visible', e.target.checked))
        container.querySelectorAll('.dr-outfits button').forEach(b => b.addEventListener('click', () => this.set('outfit', b.dataset.id)))
        container.querySelectorAll('.dr-hair button').forEach(b => b.addEventListener('click', () => this.set('hair', b.dataset.id)))
        container.querySelector('.dr-wave').addEventListener('click', () => this.wave())

        this.refresh = () =>
        {
            container.querySelector('.dr-visible').checked = this.settings.visible
            container.querySelectorAll('.dr-outfits button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === this.settings.outfit)))
            container.querySelectorAll('.dr-hair button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === this.settings.hair)))
        }
        this.refresh()
    }
}
