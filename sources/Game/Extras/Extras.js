import { Game } from '../Game.js'
import { CheahGpt } from './CheahGpt.js'
import { NeuralSky } from './NeuralSky.js'
import { WorldRebrand } from './WorldRebrand.js'
import { Hud } from './Hud.js'
import { Garage } from './Garage.js'
import { LiveWeather } from './LiveWeather.js'
import { LensRain } from './LensRain.js'
import { Journey } from './Journey.js'
import { WorldClock } from './WorldClock.js'
import profile from '../../data/profile.js'

/**
 * CHEAH CHERN EU additions on top of the folio engine:
 * - CHEAH-GPT: in-world assistant (press C)
 * - Neural Sky: a living neural network floating above the landing zone
 * - Report card: animated A's counter
 * - World clock: floating 3D real-time Malaysia clock beside the landing zone
 * - Garage: car paints (G)
 * - Live weather: real-time Malaysian weather + local time of day (Open-Meteo)
 * - Journey: passport stamps across the portfolio, fast travel and a reward
 * - Console easter egg: chern.hello()
 */
const PRESET_CITY = (s) => s.mode === 'live' || s.mode === 'off' ? `${s.city.name} · ${new Intl.DateTimeFormat('en-MY', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())}` : 'Preview mode'

export class Extras
{
    constructor()
    {
        this.game = Game.getInstance()

        this.worldRebrand = new WorldRebrand()
        this.cheahGpt = new CheahGpt()
        this.neuralSky = new NeuralSky()
        this.worldClock = new WorldClock()
        this.garage = new Garage()
        this.lensRain = new LensRain()
        this.setHud()

        this.setReportCard()
        this.setShortcuts()
        this.setConsole()
    }

    run(action)
    {
        if(action === 'cheahGpt' || action === 'chernGpt')
            this.cheahGpt.open()
        else if(action === 'reportCard')
            this.openReportCard()
        else if(action === 'contact')
            this.cheahGpt.open('How can I get in touch?')
        else if(action === 'malaysia')
            this.game.notifications?.show('🇲🇾 Proudly based in Malaysia.', '', 4)
        else if(action === 'born')
            this.game.notifications?.show(`🎂 Born in ${profile.born}. Same age as the millennium.`, '', 4)
        else if(action === 'neuralSky')
        {
            this.neuralSky.burst()
            this.game.notifications?.show('🧠 Neural Sky is training harder! Look above the landing zone.', '', 4)
        }
    }

    setHud()
    {
        const hud = this.hud = new Hud()

        hud.add({
            id: 'gpt',
            label: 'Ask CHEAH-GPT',
            icon: '<span class="cg-orb"></span>',
            kbd: 'C',
            onClick: () => this.cheahGpt.toggle()
        })

        hud.add({
            id: 'garage',
            label: 'Garage: paint your car',
            text: 'Garage',
            icon: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 17h14M6.5 17l1.6-5.2A2 2 0 0 1 10 10.4h4a2 2 0 0 1 1.9 1.4L17.5 17M4 17v2.5M20 17v2.5M7.5 14h9"/><circle cx="8" cy="17" r="1.6" fill="currentColor"/><circle cx="16" cy="17" r="1.6" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M17 3.5l1 2M20.5 4.5l-1.5 1.5M21 8h-2"/></svg>',
            kbd: 'G',
            popover: { title: 'Garage', render: (container) => this.garage.render(container) }
        })

        let weatherRefresh = null
        this.liveWeather = new LiveWeather({
            onChange: (status) =>
            {
                hud.setIcon('weather', `<span class="wx-emoji">${status.icon}</span>`)
                hud.setText('weather', status.temp !== null ? `${status.temp}°` : (status.mode === 'off' ? 'Off' : '…'))
                weatherRefresh?.(status)
            }
        })

        hud.add({
            id: 'weather',
            label: 'Live Malaysia weather',
            text: '…',
            icon: '<span class="wx-emoji">🌤️</span>',
            popover: {
                title: 'Live weather',
                render: (container) => { weatherRefresh = this.renderWeather(container) },
                onOpen: () => weatherRefresh?.(this.liveWeather.status())
            }
        })

        this.journey = new Journey({
            onChange: () =>
            {
                hud.setText('journey', `${this.journey?.count ?? 0}/6`)
                this.journey?.refresh?.()
            },
            onComplete: () =>
            {
                this.garage.unlockSecret()
                this.game.notifications?.show('🏆 Passport complete! <b>Passport Gold</b> paint unlocked in the Garage (G).', '', 6)
            }
        })

        hud.add({
            id: 'journey',
            label: 'Journey passport',
            text: `${this.journey.count}/6`,
            icon: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M6 3.5h10.5A1.5 1.5 0 0 1 18 5v14.5a1 1 0 0 1-1 1H6a1.5 1.5 0 0 1-1.5-1.5V5A1.5 1.5 0 0 1 6 3.5z"/><circle cx="11.3" cy="10.5" r="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path stroke="currentColor" stroke-width="1.6" stroke-linecap="round" d="M8.5 16.5h5.6"/></svg>',
            popover: { title: 'Journey', render: (container) => this.journey.render(container, hud), onOpen: () => this.journey.refresh?.() }
        })

        if(this.journey.complete)
            this.garage.unlockSecret()
    }

    renderWeather(container)
    {
        const lw = this.liveWeather
        const status = lw.status()
        container.innerHTML = `
            <div class="wx-now">
                <span class="wx-big" aria-hidden="true"></span>
                <div><p class="hud-eyebrow wx-city"></p><p class="wx-temp"></p><p class="wx-label"></p></div>
            </div>
            <dl class="wx-stats"></dl>
            <p class="hud-eyebrow">Source</p>
            <div class="wx-modes" role="radiogroup" aria-label="Weather source">
                <button type="button" role="radio" data-mode="live">📡 Live</button>
                ${Object.entries(status.presets).map(([ id, p ]) => `<button type="button" role="radio" data-mode="${id}">${p.icon} ${p.label}</button>`).join('')}
                <button type="button" role="radio" data-mode="off">🎲 Engine</button>
            </div>
            <label class="wx-field"><span class="hud-eyebrow">City</span>
                <select class="wx-select">${status.cities.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}</select>
            </label>
            <label class="wx-toggle"><input type="checkbox" class="wx-time"> <span>Match Malaysia time of day</span></label>
            <p class="wx-note"></p>
        `
        container.querySelectorAll('.wx-modes button').forEach(button => button.addEventListener('click', () => lw.setMode(button.dataset.mode)))
        container.querySelector('.wx-select').addEventListener('change', (event) => lw.setCity(event.target.value))
        container.querySelector('.wx-time').addEventListener('change', (event) => lw.setTimeSyncEnabled(event.target.checked))

        return (s) =>
        {
            const d = s.data
            container.querySelector('.wx-big').textContent = s.icon
            container.querySelector('.wx-city').textContent = PRESET_CITY(s)
            container.querySelector('.wx-temp').textContent = s.temp !== null ? `${s.temp}°C` : '—'
            container.querySelector('.wx-label').textContent = s.error && s.mode === 'live' ? s.error : s.label
            container.querySelector('.wx-stats').innerHTML = d ? `
                <div><dt>Feels like</dt><dd>${Math.round(d.apparent_temperature)}°</dd></div>
                <div><dt>Humidity</dt><dd>${d.relative_humidity_2m}%</dd></div>
                <div><dt>Wind</dt><dd>${Math.round(d.wind_speed_10m)} km/h</dd></div>
                <div><dt>Rain</dt><dd>${d.precipitation} mm</dd></div>` : ''
            container.querySelectorAll('.wx-modes button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.mode === s.mode)))
            container.querySelector('.wx-select').value = s.city.id
            container.querySelector('.wx-time').checked = s.syncTime
            container.querySelector('.wx-note').textContent = d ? `Data: ${d.source}, updated ${d.fetchedAt.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' })}, refreshed every 10 minutes.` : 'Data: Open-Meteo (fallback wttr.in), refreshed every 10 minutes.'
        }
    }

    openReportCard()
    {
        if(this.game.menu?.close)
            this.game.menu.close()
        this.game.modals.open('about')
    }

    setReportCard()
    {
        const countElement = document.querySelector('.js-about-count')
        const item = this.game.modals.items.get('about')

        if(item && countElement)
        {
            const animate = () =>
            {
                const start = performance.now()
                const duration = 1400
                const step = (now) =>
                {
                    const t = Math.min(1, (now - start) / duration)
                    const eased = 1 - Math.pow(1 - t, 3)
                    countElement.textContent = Math.round(eased * profile.totalAs)
                    if(t < 1)
                        requestAnimationFrame(step)
                }
                countElement.textContent = '0'
                requestAnimationFrame(step)
            }
            item.events.on('opened', animate)
        }

        for(const link of document.querySelectorAll('.js-open-report-card'))
        {
            link.addEventListener('click', (event) =>
            {
                event.preventDefault()
                this.openReportCard()
            })
        }
    }

    setShortcuts()
    {
        addEventListener('keydown', (event) =>
        {
            const target = event.target
            const isTyping = target && (target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(target.tagName))
            if(isTyping || event.metaKey || event.ctrlKey || event.altKey)
                return

            if(event.code === 'KeyC')
            {
                this.hud?.close()
                this.cheahGpt.toggle()
            }
            else if(event.code === 'KeyG')
                this.hud?.toggle('garage')
        })
    }

    setConsole()
    {
        window.chern = {
            game: this.game,
            extras: this,
            hello: () =>
            {
                console.log(`%c👋 Hi! I'm ${profile.name}, ${profile.role} at ${profile.company}.\nLinkedIn: ${profile.linkedin}\nEmail: ${profile.email} · Phone/WhatsApp: ${profile.phone}`, 'color:#ff6f91;font:700 14px monospace')
                return '✨'
            },
            ask: (question) => this.cheahGpt.answer(question),
            grades: () => console.table(profile.education),
        }
    }
}
