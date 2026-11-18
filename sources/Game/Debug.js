import * as THREE from 'three/webgpu'

export class Debug
{
    static libs = null

    // Tweakpane is only needed with #debug: load it on demand so visitors never download it
    static async preload()
    {
        if(!location.hash.match(/debug/i))
            return
        const [ { Pane }, EssentialsPlugin, CamerakitPlugin ] = await Promise.all([
            import('tweakpane'),
            import('@tweakpane/plugin-essentials'),
            import('@tweakpane/plugin-camerakit'),
        ])
        Debug.libs = { Pane, EssentialsPlugin, CamerakitPlugin }
    }

    constructor()
    {
        
        this.active = location.hash.match(/debug/i) && Debug.libs

        if(this.active)
        {
            const { Pane, EssentialsPlugin, CamerakitPlugin } = Debug.libs
            this.panel = new Pane()
            this.panel.registerPlugin(EssentialsPlugin)
            this.panel.registerPlugin(CamerakitPlugin)

            addEventListener('keydown', (event) =>
            {
                if(event.code === 'KeyH')
                    this.panel.hidden = !this.panel.hidden
            })
        }
    }

    addManualBinding(panel, object, property, settings, update, manual = false)
    {
        const binding = {}
        binding.manual = manual
        binding.manualValue = object[property]
        binding.update = () =>
        {
            object[property] = binding.manual ? binding.manualValue : update()
        }

        if(this.active)
        {
            binding.instance = panel.addBinding(binding, 'manualValue', settings)
            binding.instance.on('change', () => { binding.manual = true })
            
            this.addButtons(
                panel,
                {
                    manual: () =>
                    {
                        binding.manual = true
                        binding.manualValue = object[property]
                        binding.instance.refresh()
                    },
                    auto: () =>
                    {
                        binding.manual = false
                        binding.update()
                        binding.manualValue = object[property]
                    }
                },
                ''
            )
        }

        return binding
    }

    addThreeColorBinding(panel, object, label)
    {
        return panel.addBinding({ color: object.getHex(THREE.SRGBColorSpace) }, 'color', { label: label, view: 'color' })
                    .on('change', tweak => { object.set(tweak.value) })
    }

    addButtons(panel, buttons, title = '')
    {
        const buttonKeys = Object.keys(buttons)

        panel
            .addBlade({
                view: 'buttongrid',
                size: [ buttonKeys.length, 1 ],
                cells: (x, y) => ({
                    title: [
                        buttonKeys,
                    ][y][x],
                }),
                label: title,
            })
            .on('click', (event) =>
            {
                buttons[event.cell.title](event.cell.title)
            })
    }
}