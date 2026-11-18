import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'

const STORAGE_KEY = 'cheah:journey'

// The portfolio route: each stop is an area of the world
const STOPS = [
    { area: 'landing', respawn: 'landing', title: 'Starting line', text: 'Where it all begins: CHEAH CHERN in 3D letters.', icon: '🏁' },
    { area: 'career', respawn: 'career', title: 'Career stones', text: 'From straight A\'s to AI Engineer to Huawei.', icon: '🪨' },
    { area: 'projects', respawn: 'projects', title: 'Projects forge', text: 'A2 migration, AI prototyping, AIOps & MLOps.', icon: '🔨' },
    { area: 'lab', respawn: 'lab', title: 'AI lab', text: 'The tools behind the work.', icon: '🧪' },
    { area: 'social', respawn: 'social', title: 'Social plaza', text: 'Golden 23A statue and ways to connect.', icon: '🗿' },
    { area: 'timeMachine', respawn: 'timeMachine', title: 'Time machine', text: 'Travel back to 2012 and the report card.', icon: '⏳' },
]

export class Journey
{
    constructor({ onComplete, onChange } = {})
    {
        this.game = Game.getInstance()
        this.onComplete = onComplete
        this.onChange = onChange
        this.stamps = new Set(this.load())

        for(const stop of STOPS)
        {
            const area = this.game.world?.areas?.[stop.area]
            area?.events.on('boundingIn', () => this.stamp(stop))
            if(area?.isIn)
                this.stamp(stop, true)
        }
    }

    load()
    {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
        catch { return [] }
    }

    save()
    {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify([ ...this.stamps ])) } catch {}
    }

    get total() { return STOPS.length }
    get count() { return this.stamps.size }
    get complete() { return this.count >= this.total }

    stamp(stop, silent = false)
    {
        if(this.stamps.has(stop.area))
            return
        this.stamps.add(stop.area)
        this.save()
        this.onChange?.()

        if(!silent)
            this.toast(stop)

        if(this.complete)
            setTimeout(() => this.celebrate(), silent ? 0 : 1600)
    }

    toast(stop)
    {
        const element = document.createElement('div')
        element.className = 'jr-toast'
        element.setAttribute('role', 'status')
        element.innerHTML = `
            <span class="jr-stamp" aria-hidden="true">${stop.icon}</span>
            <span><small>Passport stamp ${this.count}/${this.total}</small><b>${stop.title}</b><em>${stop.text}</em></span>`
        document.body.appendChild(element)
        requestAnimationFrame(() => element.classList.add('is-in'))
        setTimeout(() => element.classList.remove('is-in'), 3800)
        setTimeout(() => element.remove(), 4400)
    }

    celebrate()
    {
        if(this.celebrated)
            return
        this.celebrated = true

        const confetti = this.game.world?.confetti
        const position = this.game.player?.position
        if(confetti && position)
            for(let i = 0; i < 4; i++)
                setTimeout(() => confetti.pop(new THREE.Vector3(position.x + (Math.random() - 0.5) * 4, 0, position.z + (Math.random() - 0.5) * 4)), i * 350)

        this.onComplete?.()
    }

    travel(stop)
    {
        this.game.player?.respawn(stop.respawn)
    }

    render(container, hud)
    {
        container.innerHTML = `
            <div class="jr-progress">
                <svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" class="jr-track"/><circle cx="22" cy="22" r="19" class="jr-fill"/></svg>
                <div><p class="hud-eyebrow">Portfolio passport</p><p class="jr-count"></p></div>
            </div>
            <ol class="jr-list">
                ${STOPS.map((stop, index) => `
                    <li class="jr-stop" data-area="${stop.area}">
                        <span class="jr-icon" aria-hidden="true">${stop.icon}</span>
                        <span class="jr-text"><small>Stop ${index + 1}</small><b>${stop.title}</b><em>${stop.text}</em></span>
                        <button type="button" class="jr-go" aria-label="Fast travel to ${stop.title}">Go</button>
                    </li>`).join('')}
            </ol>
            <p class="jr-reward"></p>
        `
        container.querySelectorAll('.jr-stop').forEach((element, index) =>
            element.querySelector('.jr-go').addEventListener('click', () =>
            {
                hud?.close()
                this.travel(STOPS[index])
            }))

        this.refresh = () =>
        {
            container.querySelector('.jr-count').textContent = `${this.count} of ${this.total} stamps`
            container.querySelector('.jr-fill').style.strokeDashoffset = `${119.4 * (1 - this.count / this.total)}`
            container.querySelectorAll('.jr-stop').forEach(element => element.classList.toggle('is-stamped', this.stamps.has(element.dataset.area)))
            container.querySelector('.jr-reward').innerHTML = this.complete
                ? '🏆 Journey complete. <b>Passport Gold</b> paint is unlocked in the Garage.'
                : 'Visit every stop to unlock a secret car paint.'
        }
        this.refresh()
    }
}
