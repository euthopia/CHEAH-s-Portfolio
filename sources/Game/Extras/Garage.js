import * as THREE from 'three/webgpu'
import { mix, uniform, uv, vec4 } from 'three/tsl'
import { Game } from '../Game.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

const STORAGE_KEY = 'cheah:paint'

// Designed paints: [id, name, colorA (top), colorB (bottom)]
const designed = [
    [ 'lantern', 'Lantern Red', '#ff3b30', '#7a0a1e' ],
    [ 'cobalt', 'Cobalt', '#4c6bff', '#0e1678' ],
    [ 'emerald', 'Emerald', '#3ef0a6', '#0a5c40' ],
    [ 'sunset', 'Sunset', '#ffc15e', '#ff3d6e' ],
    [ 'jalur', 'Jalur Gemilang', '#e8112d', '#0a1f8f' ],
    [ 'gold', 'Gold Leaf', '#ffe7a0', '#a8740c' ],
    [ 'pearl', 'Pearl', '#ffffff', '#b9c4d4' ],
    [ 'midnight', 'Midnight', '#4a505e', '#0c0e13' ],
]

// Engine paints unlocked through achievements
const achievementPaints = [
    [ 'red', 'Classic', '#ff3a3a', '#721551' ],
    [ 'orange', 'Ember', '#ff940d', '#af0071' ],
    [ 'white', 'Snow', '#ffffff', '#b5b5b5' ],
    [ 'black', 'Shadow', '#626262', '#262526' ],
    [ 'flames', 'Flames', '#ff9c20', '#ff0000' ],
    [ 'abyssal', 'Abyssal', '#6053ff', '#05050a' ],
]

export class Garage
{
    constructor()
    {
        this.game = Game.getInstance()
        this.materials = new Map()
        this.custom = { a: '#00e5ff', b: '#ff2bd6' }
        this.secretUnlocked = this.read('cheah:journey-complete') === '1'
        this.current = null

        // Paint glow: night lighting multiplies colours by deep blue, so paints get a soft
        // self-illumination that rises after dark to keep their real colour readable
        this.glow = uniform(0.12)
        this.game.ticker.events.on('tick', () =>
        {
            const progress = this.game.dayCycles?.progress ?? 0
            const night = THREE.MathUtils.smoothstep(progress, 0.18, 0.32) * (1 - THREE.MathUtils.smoothstep(progress, 0.62, 0.8))
            this.glow.value = 0.12 + night * 0.5
        }, 9)

        const saved = this.read(STORAGE_KEY)
        if(saved)
        {
            try
            {
                const data = JSON.parse(saved)
                if(data.custom)
                    this.custom = data.custom
                this.apply(data.id, false)
            }
            catch {}
        }

        // Re-apply after an achievement reward change or a vehicle rebuild (Konami code)
        this.game.achievements?.events.on('rewardActiveChange', (reward) =>
        {
            this.current = reward.name
            this.save()
            this.refresh?.()
        })
    }

    read(key) { try { return localStorage.getItem(key) } catch { return null } }
    write(key, value) { try { localStorage.setItem(key, value) } catch {} }

    get vehicle() { return this.game.world?.visualVehicle }

    gradient(id, a, b)
    {
        let entry = this.materials.get(id)
        if(!entry)
        {
            const colorA = uniform(new THREE.Color(a))
            const colorB = uniform(new THREE.Color(b))
            const base = mix(colorA, colorB, uv().y)
            const material = new MeshDefaultMaterial({ colorNode: base })
            const lit = material.outputNode
            material.outputNode = vec4(lit.rgb.add(base.mul(this.glow)), lit.a)
            entry = { material, colorA, colorB }
            this.materials.set(id, entry)
        }
        entry.colorA.value.set(a)
        entry.colorB.value.set(b)
        return entry.material
    }

    isLocked(id)
    {
        if(id === 'secret')
            return !this.secretUnlocked
        const reward = this.game.achievements?.rewards.items.get(id)
        return reward ? reward.locked : false
    }

    apply(id, persist = true)
    {
        const vehicle = this.vehicle
        if(!vehicle?.paints || this.isLocked(id))
            return false

        if(achievementPaints.some(([ paintId ]) => paintId === id))
        {
            // Engine paints keep their special shaders (flames, abyssal)
            vehicle.paints.changeTo(id)
        }
        else
        {
            let material
            if(id === 'custom')
                material = this.gradient('custom', this.custom.a, this.custom.b)
            else if(id === 'secret')
                material = this.gradient('secret', '#fff6c8', '#ff8a00')
            else
            {
                const paint = designed.find(([ paintId ]) => paintId === id)
                if(!paint)
                    return false
                material = this.gradient(id, paint[2], paint[3])
            }
            vehicle.paints.choices[`garage-${id}`] = material
            vehicle.paints.changeTo(`garage-${id}`)
        }

        this.current = id
        if(persist)
            this.save()
        this.refresh?.()
        return true
    }

    save()
    {
        this.write(STORAGE_KEY, JSON.stringify({ id: this.current, custom: this.custom }))
    }

    unlockSecret()
    {
        this.secretUnlocked = true
        this.write('cheah:journey-complete', '1')
        this.refresh?.()
    }

    render(container)
    {
        const swatch = ([ id, name, a, b ], group) => `
            <button type="button" class="gr-swatch" data-id="${id}" data-group="${group}" aria-label="${name}">
                <span class="gr-chip" style="--a:${a};--b:${b}"></span>
                <span class="gr-name">${name}</span>
            </button>`

        container.innerHTML = `
            <div class="gr-preview"><span class="gr-chip gr-chip--lg"></span><div><p class="hud-eyebrow">Now painted</p><p class="gr-current">Classic</p></div></div>
            <p class="hud-eyebrow">Studio paints</p>
            <div class="gr-grid">${designed.map(p => swatch(p, 'designed')).join('')}</div>
            <p class="hud-eyebrow">Earned with achievements</p>
            <div class="gr-grid">${achievementPaints.map(p => swatch(p, 'achievement')).join('')}</div>
            <p class="hud-eyebrow">Mix your own</p>
            <div class="gr-custom">
                <label>Top <input type="color" class="gr-color-a" value="${this.custom.a}"></label>
                <label>Bottom <input type="color" class="gr-color-b" value="${this.custom.b}"></label>
                <button type="button" class="hud-btn-solid gr-apply-custom">Spray it</button>
            </div>
            <div class="gr-grid gr-grid--secret">${swatch([ 'secret', 'Passport Gold', '#fff6c8', '#ff8a00' ], 'secret')}</div>
            <p class="gr-hint">Finish the Journey passport to unlock Passport Gold.</p>
        `

        for(const button of container.querySelectorAll('.gr-swatch'))
            button.addEventListener('click', () =>
            {
                const id = button.dataset.id
                if(this.isLocked(id))
                {
                    button.classList.remove('is-shake')
                    void button.offsetWidth
                    button.classList.add('is-shake')
                    return
                }
                this.apply(id)
            })

        const colorA = container.querySelector('.gr-color-a')
        const colorB = container.querySelector('.gr-color-b')
        const live = () =>
        {
            this.custom = { a: colorA.value, b: colorB.value }
            if(this.current === 'custom')
                this.apply('custom')
        }
        colorA.addEventListener('input', live)
        colorB.addEventListener('input', live)
        container.querySelector('.gr-apply-custom').addEventListener('click', () =>
        {
            this.custom = { a: colorA.value, b: colorB.value }
            this.apply('custom')
        })

        this.refresh = () =>
        {
            const all = [ ...designed, ...achievementPaints, [ 'secret', 'Passport Gold', '#fff6c8', '#ff8a00' ] ]
            for(const button of container.querySelectorAll('.gr-swatch'))
            {
                const id = button.dataset.id
                button.classList.toggle('is-locked', this.isLocked(id))
                button.classList.toggle('is-active', id === this.current)
            }
            const active = this.current === 'custom' ? [ 'custom', 'Custom mix', this.custom.a, this.custom.b ] : all.find(([ id ]) => id === this.current) ?? achievementPaints[0]
            const chip = container.querySelector('.gr-chip--lg')
            chip.style.setProperty('--a', active[2])
            chip.style.setProperty('--b', active[3])
            container.querySelector('.gr-current').textContent = active[1]
            container.querySelector('.gr-hint').hidden = this.secretUnlocked
        }
        if(!this.current)
            this.current = this.game.achievements?.rewards.current?.name ?? 'red'
        this.refresh()
    }
}
