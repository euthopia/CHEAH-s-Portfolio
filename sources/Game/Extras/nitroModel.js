/**
 * Quad nitro exhaust: chrome tips under the rear bumper with layered additive flames.
 * Car-local space (chassis): forward +X, up +Y. Pure builder (THREE + material factories),
 * so the same code runs in the game and in a plain preview.
 */
const PALETTES = {
    nitro: { core: [ 0.4, 0.85, 1 ], mid: [ 0.05, 0.45, 1 ], edge: [ 0.6, 0.1, 1 ] },
    core: { core: [ 0.85, 0.97, 1 ], mid: [ 0.35, 0.75, 1 ], edge: [ 0.2, 0.4, 1 ] },
    glow: { core: [ 0.2, 0.45, 1 ], mid: [ 0.35, 0.15, 0.9 ], edge: [ 0.25, 0.05, 0.6 ] },
    idle: { core: [ 0.8, 0.9, 1 ], mid: [ 0.2, 0.4, 1 ], edge: [ 0.1, 0.1, 0.6 ] },
    backfire: { core: [ 1, 0.95, 0.7 ], mid: [ 1, 0.55, 0.1 ], edge: [ 1, 0.15, 0.05 ] },
}

const lerp3 = (a, b, t) => [ a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t ]

export function buildNitro({ THREE, chrome, dark, flame })
{
    const root = new THREE.Group()
    root.name = 'nitroExhausts'

    const tips = []
    const tipX = -2.04
    const positions = [ [ -0.24, 0.3 ], [ -0.24, 0.5 ], [ -0.24, -0.3 ], [ -0.24, -0.5 ] ]

    // Flame geometry: open cone along -X with baked RGBA gradient (core → edge, fading at the tip)
    const flameGeometry = (radius, length, palette) =>
    {
        const geometry = new THREE.ConeGeometry(radius, length, 14, 6, true)
        geometry.translate(0, -length / 2, 0)     // base at origin, tip toward -Y
        geometry.rotateZ(-Math.PI / 2)            // -Y → -X (out of the tailpipe)
        const position = geometry.attributes.position
        const colors = new Float32Array(position.count * 4)
        for(let i = 0; i < position.count; i++)
        {
            const t = Math.min(1, -position.getX(i) / length) // 0 at pipe, 1 at tip
            const rgb = t < 0.35 ? lerp3(palette.core, palette.mid, t / 0.35) : lerp3(palette.mid, palette.edge, (t - 0.35) / 0.65)
            const alpha = Math.pow(1 - t, 1.4)
            colors.set([ rgb[0] * alpha, rgb[1] * alpha, rgb[2] * alpha, alpha ], i * 4)
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))
        return geometry
    }

    const geometries = {
        glow: flameGeometry(0.17, 1.1, PALETTES.glow),
        outer: flameGeometry(0.1, 1, PALETTES.nitro),
        inner: flameGeometry(0.045, 0.55, PALETTES.core),
        idle: flameGeometry(0.04, 0.25, PALETTES.idle),
        backfire: flameGeometry(0.075, 0.5, PALETTES.backfire),
        diamond: new THREE.SphereGeometry(0.03, 8, 6),
    }
    // Shock diamonds share the core colour
    {
        const c = new Float32Array(geometries.diamond.attributes.position.count * 4).fill(1)
        geometries.diamond.setAttribute('color', new THREE.BufferAttribute(c, 4))
    }

    const chromeMaterial = chrome()
    const darkMaterial = dark()
    const flameMaterial = flame()

    for(const [ y, z ] of positions)
    {
        const tip = new THREE.Group()
        tip.position.set(tipX, y, z)
        root.add(tip)

        // Pipe body (hidden partly inside the bumper) + rolled chrome lip + dark bore
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.36, 16, 1, true), chromeMaterial)
        pipe.rotation.z = Math.PI / 2
        pipe.position.x = 0.18
        tip.add(pipe)
        const lip = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.012, 8, 20), chromeMaterial)
        lip.rotation.y = Math.PI / 2
        tip.add(lip)
        const bore = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), darkMaterial)
        bore.rotation.y = -Math.PI / 2
        bore.position.x = 0.03
        tip.add(bore)

        const flames = new THREE.Group()
        tip.add(flames)
        const make = (geometry) =>
        {
            const m = new THREE.Mesh(geometry, flameMaterial)
            m.frustumCulled = false
            m.renderOrder = 10
            flames.add(m)
            return m
        }
        const idle = make(geometries.idle)
        const glow = make(geometries.glow)
        const outer = make(geometries.outer)
        const inner = make(geometries.inner)
        const backfire = make(geometries.backfire)
        const diamonds = [ 0.18, 0.36, 0.54 ].map(x => { const d = make(geometries.diamond); d.position.x = -x; return d })

        tips.push({ tip, idle, glow, outer, inner, backfire, diamonds, seed: Math.random() * 100 })
    }

    const state = { boost: 0, backfire: 0, lastAccel: 0 }

    /**
     * update({ t, dt, boost (0..1), accel (0..1), speed })
     * Idle: small blue pilot flame. Accelerating: longer. Boost: big nitro jets with shock diamonds.
     * Lifting off the throttle at speed: an orange backfire pop.
     */
    const update = ({ t, dt, boost = 0, accel = 0, speed = 0 }) =>
    {
        state.boost += (boost - state.boost) * Math.min(1, dt * (boost > state.boost ? 12 : 5))
        if(state.lastAccel > 0.5 && accel < 0.2 && speed > 3)
            state.backfire = 1
        state.lastAccel = accel
        state.backfire = Math.max(0, state.backfire - dt * 4)

        for(const tp of tips)
        {
            const flicker = 0.8 + Math.sin(t * 47 + tp.seed) * 0.12 + Math.sin(t * 83 + tp.seed * 2) * 0.08
            const b = state.boost

            tp.idle.visible = b < 0.95
            const idleScale = (0.6 + accel * 0.9) * flicker
            tp.idle.scale.set(idleScale, 1, 1)

            const len = b * (0.75 + Math.sin(t * 31 + tp.seed) * 0.12)
            tp.outer.visible = tp.inner.visible = tp.glow.visible = b > 0.02
            tp.glow.scale.set(len * (0.9 + flicker * 0.2), 0.7 + b * 0.5, 0.7 + b * 0.5)
            tp.outer.scale.set(len * flicker, 0.8 + b * 0.5, 0.8 + b * 0.5)
            tp.inner.scale.set(len * 1.1, 1, 1)

            tp.diamonds.forEach((d, i) =>
            {
                d.visible = b > 0.3
                const s = b * (1 - i * 0.25) * (0.7 + Math.sin(t * 60 + i + tp.seed) * 0.3)
                d.scale.set(s * 1.6, s, s)
                d.position.x = -(0.16 + i * 0.17) * len / 0.75
            })

            tp.backfire.visible = state.backfire > 0.01
            const bf = state.backfire
            tp.backfire.scale.set(bf * (0.6 + Math.random() * 0.6), 0.8 + bf, 0.8 + bf)
        }
    }

    update({ t: 0, dt: 1 })
    return { root, tips, update, state }
}
