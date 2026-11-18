import { Game } from '../Game.js'
import { CheahGpt } from './CheahGpt.js'
import { NeuralSky } from './NeuralSky.js'
import { WorldRebrand } from './WorldRebrand.js'
import profile from '../../data/profile.js'

/**
 * CHEAH CHERN EU additions on top of the folio engine:
 * - CHEAH-GPT: in-world assistant (press C)
 * - Neural Sky: a living neural network floating above the landing zone
 * - Report card: animated A's counter
 * - Console easter egg: chern.hello()
 */
export class Extras
{
    constructor()
    {
        this.game = Game.getInstance()

        this.worldRebrand = new WorldRebrand()
        this.cheahGpt = new CheahGpt()
        this.neuralSky = new NeuralSky()

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
                this.cheahGpt.toggle()
        })
    }

    setConsole()
    {
        window.chern = {
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
