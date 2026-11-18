import profile from '../../data/profile.js'

const age = () => new Date().getFullYear() - profile.born
const escape = (text) => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const icons = {
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#0A66C2"/><path fill="#fff" d="M7.1 9.6h2.4V17H7.1zM8.3 6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zm2.9 3.6h2.3v1h.1c.3-.6 1.1-1.2 2.3-1.2 2.4 0 2.9 1.6 2.9 3.7V17h-2.4v-3.5c0-.8 0-1.9-1.2-1.9s-1.4.9-1.4 1.9V17h-2.4z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#EA4335"/><path fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round" d="M5.5 8h13v8.5h-13zM5.5 8.4 12 13l6.5-4.6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#0b0c0e"/><path fill="#fff" d="M9.2 6.2c.3 0 .6.2.7.5l.9 2.1c.1.3 0 .7-.2.9l-1 1c.6 1.3 1.6 2.3 2.9 2.9l1-1c.2-.2.6-.3.9-.2l2.1.9c.3.1.5.4.5.7v2c0 .6-.5 1-1 1C10.6 17 7 13.4 7 8.2c0-.6.4-1 1-1z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#25D366"/><path fill="#fff" d="M12 5.5a6.4 6.4 0 0 0-5.5 9.7l-.8 3 3.1-.8A6.4 6.4 0 1 0 12 5.5zm3.4 8.9c-.1.4-.8.8-1.2.8-.3 0-.7.1-2.2-.5a7.8 7.8 0 0 1-3-2.7c-.2-.4-.7-1-.7-1.9s.5-1.3.6-1.5c.2-.2.4-.2.5-.2h.4c.1 0 .3 0 .4.3l.6 1.4c0 .1.1.2 0 .4l-.3.4-.2.3c-.1.1-.2.2-.1.4.1.2.6.9 1.2 1.4.8.7 1.4.9 1.6 1 .2.1.3 0 .4-.1l.6-.7c.1-.2.3-.1.4-.1l1.3.6c.2.1.3.1.4.2 0 .1 0 .5-.1.8z"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 19V5M6 11l6-6 6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M9 9h10v10H9zM5 15V5h10"/></svg>',
}

// Rich blocks rendered inside answers
const blocks = {
    contact: () => `
        <div class="cg-contact">
            <a class="cg-contact-row" href="${profile.linkedin}" target="_blank" rel="noreferrer">${icons.linkedin}<span><b>LinkedIn</b><small>${escape(profile.name)}</small></span><i>↗</i></a>
            <a class="cg-contact-row" href="mailto:${profile.email}">${icons.mail}<span><b>Email</b><small>${escape(profile.email)}</small></span><i>↗</i></a>
            <a class="cg-contact-row" href="${profile.phoneLink}">${icons.phone}<span><b>Call</b><small>${escape(profile.phone)}</small></span><i>↗</i></a>
            <a class="cg-contact-row" href="${profile.whatsapp}" target="_blank" rel="noreferrer">${icons.whatsapp}<span><b>WhatsApp</b><small>${escape(profile.phone)}</small></span><i>↗</i></a>
        </div>`,
    grades: () => `
        <div class="cg-stats">
            ${profile.education.map(e => `<div class="cg-stat"><b data-count="${parseInt(e.result)}">0</b><span>A's</span><small>${escape(e.exam)}</small></div>`).join('')}
        </div>
        <div class="cg-total"><span>Total</span><b data-count="${profile.totalAs}">0</b><span>A's</span></div>`,
    career: () => `
        <ol class="cg-timeline">
            <li class="is-now"><small>${profile.roleSince} → now</small><b>${escape(profile.role)}</b><span>${escape(profile.company)} · A2 migration, H200 → Huawei NPU</span></li>
            <li><small>${escape(profile.previousRoleYears)}</small><b>${escape(profile.previousRole)}</b><span>AI prototyping · AIOps &amp; MLOps</span></li>
            <li><small>2012 → 2017</small><b>UPSR · PT3 · SPM</b><span>${profile.totalAs} A's in total</span></li>
        </ol>`,
    projects: () => `
        <div class="cg-contact">
            ${profile.projects.map(p => `<div class="cg-contact-row cg-project"><span><b>${escape(p.title)}</b><small>${escape(p.role)}${p.at ? ' · ' + escape(p.at) : ''} · ${escape(p.year)}</small></span></div>`).join('')}
        </div>`,
    stack: () => `
        <div class="cg-tags">${[ 'Huawei Cloud', 'ModelArts', 'Python', 'PyTorch', 'Kubernetes', 'LLMs & RAG', 'Solution design' ].map(t => `<span>${t}</span>`).join('')}</div>`,
}

// Offline intent engine: keyword scoring over a hand-written knowledge base
const intents = [
    { id: 'hello', keys: [ 'hi', 'hello', 'hey', 'yo', 'selamat', 'khabar', 'morning' ],
        text: () => `Hi, I'm CHEAH-GPT. I know ${profile.name}'s career, grades and how to reach them. What would you like to know?` },
    { id: 'about', keys: [ 'who', 'about', 'introduce', 'cheah', 'chern', 'yourself', 'summary' ],
        text: () => `${profile.name} is a ${profile.role} at ${profile.company}. Born in ${profile.born} (${age()} this year), started as an ${profile.previousRole}, and now designs the cloud platforms that let AI run at scale.`,
        block: 'career' },
    { id: 'work', keys: [ 'job', 'work', 'huawei', 'architect', 'current', 'role', 'position', 'career', 'experience' ],
        text: () => `Since ${profile.roleSince}: ${profile.role} at ${profile.company}. Before that, ${profile.previousRole} from ${profile.previousRoleYears}.`,
        block: 'career' },
    { id: 'projects', keys: [ 'project', 'projects', 'migration', 'npu', 'h200', 'a2', 'gpu', 'ascend', 'portfolio', 'built', 'prototype', 'prototyping', 'mlops', 'aiops' ],
        text: () => `Three highlights. At Huawei, the A2 migration moved AI workloads from NVIDIA H200 GPUs to Huawei NPUs. As an AI Engineer (${profile.previousRoleYears}): AI prototyping, and AIOps / MLOps to keep models running in production.`,
        block: 'projects' },
    { id: 'ai', keys: [ 'ai', 'engineer', 'machine', 'learning', 'ml', 'model', 'llm', 'genai', 'generative', 'deep', 'rag' ],
        text: () => `From ${profile.previousRoleYears}, ${profile.shortName} worked as an AI Engineer on AI prototyping and AIOps / MLOps, which is why the architectures are built for real AI workloads.`,
        block: 'stack' },
    { id: 'stack', keys: [ 'skill', 'stack', 'tech', 'tools', 'python', 'pytorch', 'cloud', 'kubernetes', 'modelarts' ],
        text: () => `The toolbox, in short:`, block: 'stack' },
    { id: 'grades', keys: [ 'grade', 'spm', 'pt3', 'upsr', 'school', 'study', 'education', 'result', 'exam', 'straight' ],
        text: () => `Straight A's, three exams in a row:`, block: 'grades' },
    { id: 'age', keys: [ 'age', 'old', 'born', 'birthday' ],
        text: () => `Born in ${profile.born}, so ${age()} this year.` },
    { id: 'contact', keys: [ 'contact', 'linkedin', 'hire', 'reach', 'email', 'mail', 'connect', 'phone', 'call', 'number', 'whatsapp', 'recruit', 'touch' ],
        text: () => `Pick whichever suits you. ${profile.shortName} replies fastest on LinkedIn and WhatsApp.`, block: 'contact' },
    { id: 'where', keys: [ 'malaysia', 'where', 'country', 'live', 'based', 'located' ],
        text: () => `Based in ${profile.country}.` },
    { id: 'time', keys: [ 'time', 'clock', 'hour', 'now', 'date', 'today' ],
        text: () => { const t = new Intl.DateTimeFormat('en-MY', { hour: 'numeric', minute: '2-digit', weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date()); return `In Malaysia it's ${t}.` } },
    { id: 'garage', keys: [ 'car', 'paint', 'colour', 'color', 'garage', 'skin' ],
        text: () => `Open the Garage (press G or use the dock at the top) to repaint the car: studio paints, achievement paints, your own two-colour mix, and a secret Passport Gold.` },
    { id: 'weather', keys: [ 'weather', 'rain', 'raining', 'sunny', 'storm', 'temperature', 'hot' ],
        text: () => `The sky here follows the real weather in Malaysia, live from Open-Meteo, and day turns to night on Malaysia time. Tap the weather chip in the dock to switch cities or preview a monsoon storm.` },
    { id: 'journey', keys: [ 'journey', 'passport', 'stamp', 'quest', 'tour', 'travel', 'explore' ],
        text: () => `Your passport has six stops: starting line, career stones, projects, lab, social plaza and the time machine. Each one stamps when you drive in, and the Journey panel can fast travel you there.` },
    { id: 'secret', keys: [ 'secret', 'easter', 'egg', 'hidden', 'fun' ],
        text: () => `A few to find: complete the passport for a secret paint, the Neural Sky above the landing glows at night, the golden 23A statue can be knocked over, and chern.hello() in the browser console says hi.` },
    { id: 'thanks', keys: [ 'thank', 'thanks', 'terima', 'cool', 'nice', 'awesome', 'great' ],
        text: () => `Anytime. Enjoy the drive.` },
]

const prompts = [
    { label: 'Career', text: 'What does Chern Eu do?' },
    { label: 'Grades', text: 'Show me the grades' },
    { label: 'Projects', text: 'What projects has Chern Eu done?' },
    { label: 'Contact', text: 'How can I get in touch?' },
    { label: 'Secrets', text: 'Any secrets in this world?' },
]

export class CheahGpt
{
    constructor()
    {
        this.isOpen = false
        this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        this.build()
    }

    build()
    {
        this.element = document.createElement('div')
        this.element.className = 'cg'
        this.element.innerHTML = `
            <button class="cg-launcher" type="button" aria-haspopup="dialog" aria-expanded="false">
                <span class="cg-orb" aria-hidden="true"></span>
                <span class="cg-launcher-label">Ask CHEAH-GPT</span>
                <kbd>C</kbd>
            </button>
            <section class="cg-panel" role="dialog" aria-modal="false" aria-labelledby="cg-title" hidden>
                <header class="cg-head">
                    <span class="cg-orb cg-orb--lg" aria-hidden="true"></span>
                    <div class="cg-head-text">
                        <h2 id="cg-title">CHEAH-GPT</h2>
                        <p><span class="cg-live" aria-hidden="true"></span>Knows ${escape(profile.name)} by heart</p>
                    </div>
                    <button class="cg-icon-btn cg-close" type="button" aria-label="Close CHEAH-GPT">${icons.close}</button>
                </header>
                <div class="cg-scroll">
                    <div class="cg-intro">
                        <p class="cg-eyebrow">Profile</p>
                        <p class="cg-name">${escape(profile.name)}</p>
                        <p class="cg-role">${escape(profile.role)} · ${escape(profile.company)}</p>
                        <div class="cg-quick">
                            <a class="cg-quick-btn" href="${profile.linkedin}" target="_blank" rel="noreferrer" aria-label="LinkedIn">${icons.linkedin}</a>
                            <a class="cg-quick-btn" href="mailto:${profile.email}" aria-label="Email ${escape(profile.email)}">${icons.mail}</a>
                            <a class="cg-quick-btn" href="${profile.phoneLink}" aria-label="Call ${escape(profile.phone)}">${icons.phone}</a>
                            <a class="cg-quick-btn" href="${profile.whatsapp}" target="_blank" rel="noreferrer" aria-label="WhatsApp">${icons.whatsapp}</a>
                        </div>
                    </div>
                    <div class="cg-log" aria-live="polite"></div>
                </div>
                <div class="cg-prompts" role="list"></div>
                <form class="cg-form">
                    <label class="cg-sr" for="cg-input">Ask a question</label>
                    <input id="cg-input" class="cg-input" type="text" maxlength="200" placeholder="Ask about career, grades, contact…" autocomplete="off" />
                    <button class="cg-send" type="submit" aria-label="Send">${icons.send}</button>
                </form>
                <p class="cg-foot"><span>Enter to send · Esc to close</span><span>Runs offline</span></p>
            </section>
        `
        document.body.appendChild(this.element)

        this.launcher = this.element.querySelector('.cg-launcher')
        this.panel = this.element.querySelector('.cg-panel')
        this.log = this.element.querySelector('.cg-log')
        this.scroll = this.element.querySelector('.cg-scroll')
        this.input = this.element.querySelector('.cg-input')
        this.form = this.element.querySelector('.cg-form')

        // Typing must not drive the car
        for(const type of [ 'keydown', 'keyup', 'keypress' ])
            this.panel.addEventListener(type, (event) =>
            {
                if(type === 'keydown' && event.key === 'Escape')
                {
                    this.close()
                    this.launcher.focus()
                }
                event.stopPropagation()
            })

        this.launcher.addEventListener('click', () => this.toggle())
        this.element.querySelector('.cg-close').addEventListener('click', () => this.close())
        this.form.addEventListener('submit', (event) =>
        {
            event.preventDefault()
            this.ask(this.input.value)
            this.input.value = ''
        })

        const promptsElement = this.element.querySelector('.cg-prompts')
        prompts.forEach((prompt, index) =>
        {
            const button = document.createElement('button')
            button.type = 'button'
            button.className = 'cg-prompt'
            button.setAttribute('role', 'listitem')
            button.innerHTML = `<small>0${index + 1} · ${prompt.label}</small><span>${escape(prompt.text)}</span>`
            button.addEventListener('click', () => this.ask(prompt.text))
            promptsElement.appendChild(button)
        })
    }

    open(question = null)
    {
        if(!this.isOpen)
        {
            this.isOpen = true
            this.panel.hidden = false
            requestAnimationFrame(() => this.element.classList.add('is-open'))
            this.launcher.setAttribute('aria-expanded', 'true')
            setTimeout(() => this.input.focus({ preventScroll: true }), 60)
        }
        if(question)
            this.ask(question)
    }

    close()
    {
        if(!this.isOpen)
            return
        this.isOpen = false
        this.element.classList.remove('is-open')
        this.launcher.setAttribute('aria-expanded', 'false')
        this.input.blur()
        setTimeout(() => { if(!this.isOpen) this.panel.hidden = true }, 200)
    }

    toggle()
    {
        this.isOpen ? this.close() : this.open()
    }

    answer(question = '')
    {
        const q = ` ${question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')} `
        let best = null
        let bestScore = 0
        for(const intent of intents)
        {
            let score = 0
            for(const key of intent.keys)
                if(q.includes(` ${key} `) || (key.length > 3 && q.includes(key)))
                    score += key.length > 3 ? 2 : 1
            if(score > bestScore)
            {
                best = intent
                bestScore = score
            }
        }
        if(!best)
            return { id: 'unknown', text: `That one is outside what I know. Try the career, the grades, the AI work, or how to get in touch.` }
        return { id: best.id, text: best.text(), block: best.block }
    }

    ask(question)
    {
        question = question.trim()
        if(!question)
            return
        this.addUser(question)
        const reply = this.answer(question)
        const message = this.addBot()
        setTimeout(() => this.fill(message, reply), this.reducedMotion ? 0 : 420 + Math.random() * 300)
    }

    addUser(text)
    {
        const row = document.createElement('div')
        row.className = 'cg-msg cg-msg--user'
        row.innerHTML = `<p>${escape(text)}</p>`
        this.log.appendChild(row)
        this.toBottom()
    }

    addBot()
    {
        const row = document.createElement('div')
        row.className = 'cg-msg cg-msg--bot is-thinking'
        row.innerHTML = `<span class="cg-orb cg-orb--sm" aria-hidden="true"></span><div class="cg-body"><p class="cg-text"><span class="cg-dots" aria-label="Thinking"><i></i><i></i><i></i></span></p></div>`
        this.log.appendChild(row)
        this.toBottom()
        return row
    }

    fill(row, reply)
    {
        row.classList.remove('is-thinking')
        const textElement = row.querySelector('.cg-text')
        const body = row.querySelector('.cg-body')

        const finish = () =>
        {
            textElement.textContent = reply.text
            if(reply.block && blocks[reply.block])
            {
                const block = document.createElement('div')
                block.className = 'cg-block'
                block.innerHTML = blocks[reply.block]()
                body.appendChild(block)
                this.countUp(block)
            }
            this.toBottom()
        }

        if(this.reducedMotion)
            return finish()

        // Time-based reveal (~220 chars/s) so slow frames never stall the answer
        const start = performance.now()
        textElement.textContent = ''
        const step = (now) =>
        {
            const count = Math.min(reply.text.length, Math.ceil((now - start) * 0.22))
            textElement.textContent = reply.text.slice(0, count)
            this.toBottom()
            if(count < reply.text.length)
                requestAnimationFrame(step)
            else
                finish()
        }
        requestAnimationFrame(step)
    }

    countUp(root)
    {
        for(const element of root.querySelectorAll('[data-count]'))
        {
            const target = parseInt(element.dataset.count)
            if(this.reducedMotion)
            {
                element.textContent = target
                continue
            }
            const start = performance.now()
            const tick = (now) =>
            {
                const t = Math.min(1, (now - start) / 900)
                element.textContent = Math.round((1 - Math.pow(1 - t, 3)) * target)
                if(t < 1)
                    requestAnimationFrame(tick)
            }
            requestAnimationFrame(tick)
        }
    }

    toBottom()
    {
        this.scroll.scrollTop = this.scroll.scrollHeight
    }
}
