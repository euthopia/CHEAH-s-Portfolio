/**
 * Original low-poly driver character ("Chern Eu"), built from primitives.
 * Faces +X, up is +Y, origin at the roof line (body below y=0 is hidden inside the car).
 * Pure builder: receives THREE, RoundedBoxGeometry and a material factory so it can run in
 * the game (MeshDefaultMaterial) or in a plain preview.
 */
export const OUTFITS = {
    vice:      { label: 'Neon Vice', shirt: '#19c3b8', pattern: '#ff5fa2', tee: '#f4f1ea', chain: '#ffcc4d', glasses: '#14161c', lens: '#ff8a3d' },
    architect: { label: 'Architect', shirt: '#1d2a6b', pattern: '#2e3f99', tee: '#ffffff', chain: '#c9d3e0', glasses: '#14161c', lens: '#4c6bff' },
    street:    { label: 'Street', shirt: '#e8112d', pattern: '#a50d22', tee: '#141414', chain: '#ffcc4d', glasses: '#0b0c0e', lens: '#3ef0a6' },
    midnight:  { label: 'Midnight', shirt: '#14161c', pattern: '#3d4250', tee: '#22252d', chain: '#9fd0ff', glasses: '#0b0c0e', lens: '#ff2bd6' },
}

export const HAIRSTYLES = { short: 'Short', long: 'Long', cap: 'Cap' }

export function buildDriver({ THREE, RoundedBoxGeometry, material })
{
    const colors = { skin: '#d99a6c', hair: '#15110f', cap: '#0b0c0e', ...OUTFITS.vice }
    const mats = {}
    const mat = (key) => (mats[key] ??= material(colors[key]))

    const box = (w, h, d, r = 0.03, seg = 2) => new RoundedBoxGeometry(w, h, d, seg, r)
    const mesh = (geometry, key, parent, x = 0, y = 0, z = 0) =>
    {
        const m = new THREE.Mesh(geometry, mat(key))
        m.position.set(x, y, z)
        m.castShadow = true
        m.receiveShadow = true
        parent.add(m)
        return m
    }

    const root = new THREE.Group()
    root.name = 'driver'

    // Torso (lean pivot sits low, inside the car)
    const torso = new THREE.Group()
    root.add(torso)
    const chestY = 0.2
    mesh(box(0.3, 0.5, 0.46, 0.08, 3), 'shirt', torso, 0, chestY, 0)
    // White tee showing through the open shirt
    mesh(box(0.03, 0.26, 0.1, 0.02), 'tee', torso, 0.145, chestY + 0.09, 0)
    // Shirt pattern stripes (floral-style blocks) on both front panels
    for(const side of [ -1, 1 ])
        for(let i = 0; i < 3; i++)
            mesh(box(0.02, 0.06, 0.06, 0.015, 1), 'pattern', torso, 0.152, chestY - 0.12 + i * 0.13, side * (0.15 - (i % 2) * 0.04))
    // Collar
    for(const side of [ -1, 1 ])
    {
        const collar = mesh(box(0.05, 0.09, 0.1, 0.02), 'shirt', torso, 0.12, chestY + 0.24, side * 0.09)
        collar.rotation.x = side * 0.5
    }
    // Gold chain + pendant
    const chain = mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 20), 'chain', torso, 0.07, chestY + 0.2, 0)
    chain.rotation.set(0, Math.PI / 2, 0)
    chain.rotation.x = 0
    chain.rotation.z = -1.15
    mesh(box(0.02, 0.05, 0.04, 0.008, 1), 'chain', torso, 0.155, chestY + 0.1, 0)

    // Neck + head
    mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.1, 10), 'skin', torso, 0, chestY + 0.29, 0)
    const head = new THREE.Group()
    head.position.set(0, chestY + 0.47, 0)
    torso.add(head)
    mesh(box(0.27, 0.3, 0.26, 0.09, 3), 'skin', head, 0, 0, 0)
    // Ears + nose
    for(const side of [ -1, 1 ])
        mesh(box(0.06, 0.08, 0.03, 0.015, 1), 'skin', head, -0.01, -0.01, side * 0.135)
    mesh(box(0.05, 0.06, 0.05, 0.02, 1), 'skin', head, 0.14, -0.035, 0)
    // Aviators: frame + two lenses
    mesh(box(0.02, 0.025, 0.25, 0.008, 1), 'glasses', head, 0.14, 0.04, 0)
    for(const side of [ -1, 1 ])
        mesh(box(0.025, 0.07, 0.1, 0.02, 2), 'lens', head, 0.145, 0.015, side * 0.062)
    // Smile
    mesh(box(0.012, 0.018, 0.08, 0.006, 1), 'glasses', head, 0.135, -0.1, 0)

    // Hair variants
    const hair = {}
    hair.short = new THREE.Group()
    mesh(box(0.29, 0.1, 0.28, 0.05, 2), 'hair', hair.short, -0.005, 0.15, 0)
    mesh(box(0.08, 0.2, 0.28, 0.04, 2), 'hair', hair.short, -0.11, 0.06, 0)
    const quiff = mesh(box(0.1, 0.06, 0.2, 0.03, 1), 'hair', hair.short, 0.1, 0.18, 0.02)
    quiff.rotation.z = -0.3
    hair.long = new THREE.Group()
    mesh(box(0.3, 0.11, 0.29, 0.05, 2), 'hair', hair.long, -0.005, 0.15, 0)
    mesh(box(0.12, 0.42, 0.3, 0.05, 2), 'hair', hair.long, -0.1, -0.05, 0)
    for(const side of [ -1, 1 ])
        mesh(box(0.1, 0.3, 0.04, 0.02, 1), 'hair', hair.long, 0.02, -0.02, side * 0.14)
    hair.cap = new THREE.Group()
    mesh(box(0.29, 0.11, 0.285, 0.05, 2), 'cap', hair.cap, -0.005, 0.16, 0)
    mesh(box(0.16, 0.02, 0.24, 0.01, 1), 'cap', hair.cap, 0.17, 0.12, 0)
    mesh(box(0.08, 0.14, 0.27, 0.03, 1), 'hair', hair.cap, -0.11, 0.03, 0)
    for(const group of Object.values(hair))
        head.add(group)

    // Arms: shoulder → upper arm → elbow → forearm → hand
    const arm = (side) =>
    {
        const shoulder = new THREE.Group()
        shoulder.position.set(0, chestY + 0.18, side * 0.27)
        torso.add(shoulder)
        mesh(new THREE.SphereGeometry(0.085, 10, 8), 'shirt', shoulder)
        const upper = mesh(new THREE.CapsuleGeometry(0.06, 0.18, 4, 8), 'shirt', shoulder, 0, -0.13, 0)
        const elbow = new THREE.Group()
        elbow.position.set(0, -0.26, 0)
        shoulder.add(elbow)
        mesh(new THREE.CapsuleGeometry(0.05, 0.16, 4, 8), 'skin', elbow, 0, -0.1, 0)
        mesh(box(0.08, 0.09, 0.07, 0.03, 1), 'skin', elbow, 0, -0.22, 0)
        return { shoulder, upper, elbow }
    }
    const arms = { left: arm(-1), right: arm(1) }

    const setOutfit = (id) =>
    {
        const outfit = OUTFITS[id] ?? OUTFITS.vice
        for(const key of [ 'shirt', 'pattern', 'tee', 'chain', 'glasses', 'lens' ])
        {
            colors[key] = outfit[key]
            mats[key]?.userData.setColor?.(outfit[key])
        }
    }

    const setHair = (id) =>
    {
        for(const [ key, group ] of Object.entries(hair))
            group.visible = key === id
    }
    setHair('short')

    // Smoothed pose state
    const pose = { lean: 0, pitch: 0, wave: 0, cheer: 0, look: 0 }
    const damp = (current, target, rate, dt) => current + (target - current) * Math.min(1, rate * dt)

    /**
     * animate({ t, dt, steer (-1..1, + = left), accel, boost (0..1), wave (0..1), look (-1..1) })
     */
    const animate = ({ t, dt, steer = 0, accel = 0, boost = 0, wave = 0, look = 0 }) =>
    {
        pose.lean = damp(pose.lean, -steer * 0.22, 6, dt)
        pose.pitch = damp(pose.pitch, -accel * 0.12 - boost * 0.08, 5, dt)
        pose.cheer = damp(pose.cheer, boost, 8, dt)
        pose.wave = damp(pose.wave, wave * (1 - pose.cheer), 6, dt)
        pose.look = damp(pose.look, look, 3, dt)

        const breathe = Math.sin(t * 2.2) * 0.012
        torso.position.y = breathe
        torso.rotation.x = pose.lean
        torso.rotation.z = pose.pitch

        head.rotation.y = pose.look * 0.6 + Math.sin(t * 0.7) * 0.05
        head.rotation.x = -pose.lean * 0.5
        head.rotation.z = pose.cheer * 0.15

        // Rest: forearms on the roof. Cheer: both arms up. Wave: right arm up, forearm swinging.
        const rest = { shoulderZ: 0.95, elbowZ: 0.75 }
        const wavePhase = Math.sin(t * 9) * 0.5

        // Left arm (−Z side)
        arms.left.shoulder.rotation.set(
            pose.cheer * 2.7 + pose.lean * 0.3,
            0,
            rest.shoulderZ * (1 - pose.cheer)
        )
        arms.left.elbow.rotation.set(pose.cheer * 0.3, 0, rest.elbowZ * (1 - pose.cheer))

        // Right arm (+Z side)
        const up = Math.max(pose.cheer, pose.wave)
        arms.right.shoulder.rotation.set(
            -up * 2.7 + pose.lean * 0.3,
            0,
            rest.shoulderZ * (1 - up)
        )
        arms.right.elbow.rotation.set(-pose.cheer * 0.3 + pose.wave * wavePhase, 0, rest.elbowZ * (1 - up) + pose.wave * 0.4)
    }

    animate({ t: 0, dt: 1 })

    return { root, torso, head, arms, setOutfit, setHair, animate, materials: mats }
}
