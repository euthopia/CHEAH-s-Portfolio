/**
 * Top-center dock that hosts the CHEAH CHERN EU extras (CHEAH-GPT, Garage, Weather, Journey).
 * Each item either runs an action or toggles a popover; only one popover is open at a time.
 */
export class Hud
{
    constructor()
    {
        this.items = new Map()
        this.current = null

        this.element = document.createElement('div')
        this.element.className = 'hud'
        this.element.innerHTML = `<nav class="hud-dock" aria-label="Portfolio tools"></nav><div class="hud-pop-layer"></div>`
        document.body.appendChild(this.element)
        this.dock = this.element.querySelector('.hud-dock')
        this.layer = this.element.querySelector('.hud-pop-layer')

        // Keep typing and clicks inside the HUD away from the game controls
        for(const type of [ 'keydown', 'keyup', 'keypress' ])
            this.element.addEventListener(type, (event) =>
            {
                if(type === 'keydown' && event.key === 'Escape')
                    this.close()
                if(event.target.closest('input, textarea, select'))
                    event.stopPropagation()
            })

        document.addEventListener('pointerdown', (event) =>
        {
            if(this.current && !this.element.contains(event.target))
                this.close()
        })
    }

    /**
     * add({ id, label, icon, kbd, onClick, popover: { title, render(container) } })
     */
    add(options)
    {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = `hud-btn hud-btn--${options.id}`
        button.setAttribute('aria-label', options.label)
        button.innerHTML = `<span class="hud-icon" aria-hidden="true">${options.icon}</span><span class="hud-label">${options.text ?? options.label}</span>${options.kbd ? `<kbd>${options.kbd}</kbd>` : ''}`
        this.dock.appendChild(button)

        const item = { ...options, button, pop: null }

        if(options.popover)
        {
            button.setAttribute('aria-expanded', 'false')
            const pop = document.createElement('section')
            pop.className = `hud-pop hud-pop--${options.id}`
            pop.setAttribute('role', 'dialog')
            pop.setAttribute('aria-label', options.popover.title)
            pop.hidden = true
            pop.innerHTML = `<header class="hud-pop-head"><h2>${options.popover.title}</h2><button type="button" class="hud-pop-close" aria-label="Close">×</button></header><div class="hud-pop-body"></div>`
            pop.querySelector('.hud-pop-close').addEventListener('click', () => this.close())
            this.layer.appendChild(pop)
            item.pop = pop
            options.popover.render(pop.querySelector('.hud-pop-body'), item)
        }

        button.addEventListener('click', () =>
        {
            if(item.pop)
                this.toggle(options.id)
            else
            {
                this.close()
                options.onClick?.()
            }
        })

        this.items.set(options.id, item)
        return item
    }

    setText(id, html)
    {
        const label = this.items.get(id)?.button.querySelector('.hud-label')
        if(label)
            label.innerHTML = html
    }

    setIcon(id, html)
    {
        const icon = this.items.get(id)?.button.querySelector('.hud-icon')
        if(icon)
            icon.innerHTML = html
    }

    open(id)
    {
        const item = this.items.get(id)
        if(!item?.pop)
            return
        if(this.current && this.current !== item)
            this.close()
        this.current = item
        item.pop.hidden = false
        item.button.setAttribute('aria-expanded', 'true')
        item.button.classList.add('is-active')
        requestAnimationFrame(() => item.pop.classList.add('is-open'))
        item.popover.onOpen?.()
    }

    close()
    {
        const item = this.current
        if(!item)
            return
        this.current = null
        item.pop.classList.remove('is-open')
        item.button.setAttribute('aria-expanded', 'false')
        item.button.classList.remove('is-active')
        setTimeout(() => { if(this.current !== item) item.pop.hidden = true }, 180)
    }

    toggle(id)
    {
        this.current?.id === id ? this.close() : this.open(id)
    }
}
