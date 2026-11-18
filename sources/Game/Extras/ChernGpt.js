import profile from '../../data/profile.js'

const age = () => new Date().getFullYear() - profile.born

// Tiny offline "AI": intent matching over a hand-written knowledge base. No data leaves the browser.
const intents = [
    {
        keys: [ 'hi', 'hello', 'hey', 'helo', 'yo', 'selamat', 'apa khabar' ],
        answer: () => `Hello! 👋 I'm CHERN-GPT, the in-world assistant of ${profile.name}. Ask me about Chern Eu's job, AI background, grades, or how to get in touch.`
    },
    {
        keys: [ 'who', 'about', 'yourself', 'introduce', 'cheah', 'chern' ],
        answer: () => `${profile.name} is a ${age()}-year-old ${profile.role} at ${profile.company}, born in ${profile.born}. Starting out as an ${profile.previousRole}, Chern Eu now designs the cloud platforms that let AI run at scale.`
    },
    {
        keys: [ 'job', 'work', 'huawei', 'architect', 'current', 'now', 'role', 'position' ],
        answer: () => `Right now: ${profile.role} at ${profile.company}, turning business problems into cloud & AI architectures that are secure, scalable and cost-aware. Drive to the career stones to see the timeline.`
    },
    {
        keys: [ 'ai', 'engineer', 'machine', 'learning', 'ml', 'model', 'llm', 'genai', 'generative', 'deep' ],
        answer: () => `Before becoming an architect, ${profile.shortName} was an AI Engineer: data → model → production. That hands-on experience is why the architectures are built for real AI workloads, not just slides.`
    },
    {
        keys: [ 'cloud', 'kubernetes', 'k8s', 'infra', 'devops', 'modelarts' ],
        answer: () => `Cloud is the playground: designing platforms on Huawei Cloud, containers and AI services such as ModelArts. The Lab area has a few favourite tools.`
    },
    {
        keys: [ 'grade', 'spm', 'pt3', 'upsr', 'school', 'study', 'education', 'result', 'exam', 'straight' ],
        answer: () => `Report card: ${profile.education.map(e => `${e.exam} ${e.result}`).join(' · ')}. That's ${profile.totalAs} A's in total! Press the "Report card" button in the social area, or visit the time machine.`
    },
    {
        keys: [ 'age', 'old', 'born', 'birthday' ],
        answer: () => `Born in ${profile.born}, so ${age()} this year.`
    },
    {
        keys: [ 'contact', 'linkedin', 'hire', 'reach', 'email', 'connect', 'job offer', 'recruit' ],
        answer: () => `The best way to reach Chern Eu is LinkedIn: ${profile.linkedin} (I just opened it for you 😉).`,
        action: () => window.open(profile.linkedin, '_blank')
    },
    {
        keys: [ 'skill', 'stack', 'tech', 'tools', 'python', 'pytorch' ],
        answer: () => `Toolbox highlights: Python, PyTorch, Kubernetes, Huawei Cloud & ModelArts, plus a lot of architecture diagrams. Check the Lab area for the full shelf.`
    },
    {
        keys: [ 'malaysia', 'where', 'country', 'live', 'from' ],
        answer: () => `Based in ${profile.country} 🇲🇾.`
    },
    {
        keys: [ 'secret', 'easter', 'egg', 'hidden', 'fun' ],
        answer: () => `Psst... look up at night for the Neural Sky, honk near friends, open the browser console and type chern.hello(), and try the Konami code. 🤫`
    },
    {
        keys: [ 'thank', 'thanks', 'terima kasih', 'cool', 'nice', 'awesome' ],
        answer: () => `You're welcome! Enjoy the drive 🚗💨`
    },
]

const suggestions = [ 'Who is Chern Eu?', "What's the role at Huawei?", 'Show me the grades', 'AI experience?', 'How do I get in touch?', 'Any secrets?' ]

export class ChernGpt
{
    constructor()
    {
        this.isOpen = false
        this.build()
    }

    build()
    {
        this.element = document.createElement('div')
        this.element.className = 'chern-gpt'
        this.element.innerHTML = `
            <div class="chern-gpt-window" role="dialog" aria-label="CHERN-GPT">
                <div class="chern-gpt-header">
                    <span class="chern-gpt-dot"></span>
                    <span class="chern-gpt-title">CHERN-GPT <small>offline · v1</small></span>
                    <button class="chern-gpt-close" aria-label="Close">✕</button>
                </div>
                <div class="chern-gpt-messages"></div>
                <div class="chern-gpt-suggestions"></div>
                <form class="chern-gpt-form">
                    <input class="chern-gpt-input" type="text" maxlength="200" placeholder="Ask me anything about Chern Eu..." autocomplete="off" />
                    <button type="submit">➤</button>
                </form>
            </div>
            <button class="chern-gpt-launcher" title="Ask CHERN-GPT (C)">🤖 <span>Ask CHERN-GPT</span> <kbd>C</kbd></button>
        `
        document.body.appendChild(this.element)

        this.messages = this.element.querySelector('.chern-gpt-messages')
        this.input = this.element.querySelector('.chern-gpt-input')
        this.form = this.element.querySelector('.chern-gpt-form')

        // Don't let typing drive the car
        for(const type of [ 'keydown', 'keyup', 'keypress' ])
            this.element.addEventListener(type, (event) =>
            {
                if(event.key === 'Escape')
                    this.close()
                event.stopPropagation()
            })

        this.element.querySelector('.chern-gpt-close').addEventListener('click', () => this.close())
        this.element.querySelector('.chern-gpt-launcher').addEventListener('click', () => this.toggle())
        this.form.addEventListener('submit', (event) =>
        {
            event.preventDefault()
            this.ask(this.input.value)
            this.input.value = ''
        })

        const suggestionsElement = this.element.querySelector('.chern-gpt-suggestions')
        for(const text of suggestions)
        {
            const chip = document.createElement('button')
            chip.type = 'button'
            chip.textContent = text
            chip.addEventListener('click', () => this.ask(text))
            suggestionsElement.appendChild(chip)
        }
    }

    open()
    {
        if(this.isOpen)
            return
        this.isOpen = true
        this.element.classList.add('is-open')
        if(!this.greeted)
        {
            this.greeted = true
            this.say(intents[0].answer(), 'bot')
        }
        setTimeout(() => this.input.focus(), 50)
    }

    close()
    {
        this.isOpen = false
        this.element.classList.remove('is-open')
        this.input.blur()
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
            return { text: `Hmm, my neurons didn't fire on that one 🤔. Try asking about the job at Huawei, the AI background, the grades, or how to get in touch.` }
        return { text: best.answer(), action: best.action }
    }

    ask(question)
    {
        question = question.trim()
        if(!question)
            return
        this.say(question, 'user')
        const { text, action } = this.answer(question)
        const typing = this.say('', 'bot is-typing')
        setTimeout(() =>
        {
            typing.classList.remove('is-typing')
            this.typewrite(typing, text)
            if(action)
                setTimeout(action, 600)
        }, 450 + Math.random() * 400)
    }

    say(text, type)
    {
        const bubble = document.createElement('div')
        bubble.className = `chern-gpt-message ${type}`
        bubble.textContent = text
        this.messages.appendChild(bubble)
        this.messages.scrollTop = this.messages.scrollHeight
        return bubble
    }

    typewrite(element, text)
    {
        let i = 0
        const tick = () =>
        {
            i += 2
            element.textContent = text.slice(0, i)
            this.messages.scrollTop = this.messages.scrollHeight
            if(i < text.length)
                setTimeout(tick, 12)
        }
        tick()
    }
}
