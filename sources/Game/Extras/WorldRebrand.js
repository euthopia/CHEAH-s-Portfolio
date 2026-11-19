import * as THREE from 'three/webgpu'
import { Game } from '../Game.js'
import { glyphGeometry, firstUv } from './glyphs.js'

/**
 * Replaces the original author's personal elements baked into the 3D world:
 * - Landing letters "BRUNO SIMON" -> "CHEAH CHERN"
 * - Social area: personal logos, statue and OnlyFans logo -> CHEAH CHERN EU pedestal items + statue
 * - Circuit: THREE.JS banner and logo -> CHEAH CHERN EU banner and CCE monogram
 */
export class WorldRebrand
{
    static LANDING_TEXT = [ 'CHEAH', 'CHERN' ]

    // Order of the 8 pedestals in the social area (as baked in the model)
    static SOCIAL_HIDE = [ 'x', 'bluesky', 'youtube', 'mail', 'twitch', 'discord', 'onlyfans', 'boy', 'baguira', 'sudo', 'refStatue' ]
    static PEDESTALS = { x: 'CV', bluesky: 'AI', youtube: 'A+', mail: '@', twitch: '2000', discord: 'NN' }

    constructor()
    {
        this.game = Game.getInstance()
        this.areas = this.game.world?.areas ?? {}

        this.safe(() => this.setLandingLetters())
        this.safe(() => this.setSocial())
        this.safe(() => this.setCircuitBranding())
    }

    safe(callback)
    {
        try { callback() }
        catch(error) { console.warn('[WorldRebrand]', error) }
    }

    meshOf(object3D)
    {
        if(object3D.isMesh)
            return object3D
        let found = null
        object3D.traverse(child => { if(!found && child.isMesh) found = child })
        return found
    }

    hide(object)
    {
        object.rebrandHidden = true
        this.game.objects.disable(object)
    }

    setLandingLetters()
    {
        const landing = this.areas.landing
        const references = landing?.references.items.get('letters')
        if(!references?.length)
            return

        // Original letters, ordered left to right as the camera reads them
        const letters = references
            .map(reference => reference.userData.object)
            .filter(object => object?.visual && object?.physical)
            .sort((a, b) => a.physical.initialState.position.x - b.physical.initialState.position.x)

        const chars = WorldRebrand.LANDING_TEXT.join('').split('')
        if(letters.length !== chars.length)
            return

        // Line along which letters are laid out
        const first = new THREE.Vector3().copy(letters[0].physical.initialState.position)
        const last = new THREE.Vector3().copy(letters[letters.length - 1].physical.initialState.position)
        const middle = first.clone().lerp(last, 0.5)
        const direction = last.clone().sub(first).setY(0).normalize()

        const height = 1.45
        const depth = 0.46
        const gap = 0.12
        const wordGap = 0.7

        // Build geometries and measure widths
        const items = letters.map((object, index) =>
        {
            const mesh = this.meshOf(object.visual.object3D)
            const geometry = glyphGeometry(chars[index], { height, depth, uv: firstUv(mesh.geometry) })
            const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x
            return { object, mesh, geometry, width }
        })

        const firstWordLength = WorldRebrand.LANDING_TEXT[0].length
        let total = items.reduce((sum, item) => sum + item.width, 0) + gap * (items.length - 2) + wordGap
        let cursor = - total / 2

        items.forEach((item, index) =>
        {
            const { object, mesh, geometry, width } = item

            // Visual
            mesh.geometry = geometry

            // Collider
            const collider = object.physical.colliders[0]
            if(collider?.setHalfExtents)
                collider.setHalfExtents({ x: width / 2, y: height / 2, z: depth / 2 })
            for(let i = 1; i < object.physical.colliders.length; i++)
                object.physical.colliders[i].setEnabled(false)

            // Position along the line
            const center = cursor + width / 2
            cursor += width + (index === firstWordLength - 1 ? wordGap : gap)
            const position = middle.clone().addScaledVector(direction, center)
            position.y = object.physical.initialState.position.y

            object.physical.body.setTranslation(position, true)
            object.physical.initialState.position = { x: position.x, y: position.y, z: position.z }
            object.visual.object3D.position.copy(position)
            object.needsUpdate = true
        })
    }

    setSocial()
    {
        const social = this.areas.social
        if(!social)
            return

        const byName = new Map()
        for(const object of social.objects.items)
            if(object?.visual)
                byName.set(object.visual.object3D.name.replace(/\.\d+$/, ''), object)

        // Pedestal items: replace personal logos with my own 3D words
        for(const [ name, text ] of Object.entries(WorldRebrand.PEDESTALS))
        {
            const original = byName.get(name)
            if(!original?.physical)
                continue
            const mesh = this.meshOf(original.visual.object3D)
            this.spawnWord(text, original, mesh, text.length > 2 ? 0.55 : 0.8)
        }

        // Statue: replace with a golden "23A" monument
        const statue = byName.get('refStatue')
        if(statue?.physical)
        {
            const mesh = this.meshOf(statue.visual.object3D)
            const word = this.spawnWord('23A', statue, mesh, 1.6, 0.6)
            if(word && social.statue)
                social.statue.body = word.physical.body
        }

        for(const name of WorldRebrand.SOCIAL_HIDE)
        {
            const object = byName.get(name)
            if(object)
                this.hide(object)
        }
    }

    // Replace a baked texture by swapping the material on every mesh that uses it
    swapMaterialTexture(materialName, canvas)
    {
        const current = this.game.materials.list?.get(materialName)
        if(!current)
            return
        const map = new THREE.CanvasTexture(canvas)
        map.colorSpace = THREE.SRGBColorSpace
        map.flipY = false
        map.anisotropy = 4
        const replacement = this.game.materials.createFromMaterial(new THREE.MeshStandardMaterial({ map, name: `${materialName}Cheah` }))
        this.game.scene.traverse((child) =>
        {
            if(child.isMesh && child.material === current)
                child.material = replacement
        })
        this.game.materials.list.set(materialName, replacement)
    }

    setCircuitBranding()
    {
        const font = (weight, size) => `${weight} ${size}px "Host Grotesk", "Nunito", system-ui, sans-serif`
        const ground = '#45392f'
        const accent = '#d39bff'

        // Banner 512x128: monogram + name with racing stripes (same layout as the original)
        const banner = document.createElement('canvas')
        banner.width = 512
        banner.height = 128
        let ctx = banner.getContext('2d')
        ctx.fillStyle = ground
        ctx.fillRect(0, 0, 512, 128)
        ctx.fillStyle = accent
        for(const [ x, y, w ] of [ [ 120, 12, 150 ], [ 360, 12, 110 ], [ 300, 106, 170 ], [ 120, 106, 90 ] ])
        {
            ctx.beginPath()
            ctx.moveTo(x + 8, y)
            ctx.lineTo(x + w + 8, y)
            ctx.lineTo(x + w, y + 10)
            ctx.lineTo(x, y + 10)
            ctx.fill()
        }
        ctx.fillStyle = '#ffffff'
        ctx.font = font(800, 44)
        ctx.textBaseline = 'middle'
        ctx.save()
        ctx.transform(1, 0, -0.18, 1, 0, 0)
        ctx.fillText('CHEAH CHERN EU', 120, 64)
        ctx.restore()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(60, 64, 34, Math.PI * 0.25, Math.PI * 1.75)
        ctx.stroke()
        ctx.font = font(800, 26)
        ctx.textAlign = 'center'
        ctx.fillStyle = '#ffffff'
        ctx.fillText('CCE', 62, 65)
        this.swapMaterialTexture('circuitBrand', banner)

        // Logo 128x128: CCE monogram
        const logo = document.createElement('canvas')
        logo.width = 128
        logo.height = 128
        ctx = logo.getContext('2d')
        ctx.fillStyle = ground
        ctx.fillRect(0, 0, 128, 128)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 8
        ctx.beginPath()
        ctx.arc(64, 64, 44, Math.PI * 0.25, Math.PI * 1.75)
        ctx.stroke()
        ctx.fillStyle = accent
        ctx.font = font(800, 34)
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('CCE', 66, 66)
        this.swapMaterialTexture('circuitThreejs', logo)
    }

    spawnWord(text, original, sourceMesh, height = 0.8, depth = 0.25)
    {
        const geometry = glyphGeometry(text, { height, depth, uv: firstUv(sourceMesh?.geometry) })
        const box = geometry.boundingBox
        const mesh = new THREE.Mesh(geometry, sourceMesh?.material ?? new THREE.MeshLambertNodeMaterial({ color: '#e9c46a' }))
        mesh.castShadow = true
        mesh.receiveShadow = true

        const initial = original.physical.initialState
        const position = new THREE.Vector3(initial.position.x, initial.position.y + height * 0.5, initial.position.z)
        const rotation = new THREE.Quaternion(initial.rotation.x, initial.rotation.y, initial.rotation.z, initial.rotation.w)

        // Face the social area center
        const center = this.areas.social.center
        if(center)
        {
            const angle = Math.atan2(center.x - position.x, center.z - position.z)
            rotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle)
        }

        mesh.position.copy(position)
        mesh.quaternion.copy(rotation)

        return this.game.objects.add(
            { model: mesh, parent: this.game.scene, castShadow: true, receiveShadow: true },
            {
                type: 'dynamic',
                position,
                rotation,
                sleeping: true,
                mass: 0.3,
                colliders: [ {
                    shape: 'cuboid',
                    parameters: [ (box.max.x - box.min.x) / 2, (box.max.y - box.min.y) / 2, (box.max.z - box.min.z) / 2 ],
                    position: new THREE.Vector3(),
                    quaternion: new THREE.Quaternion()
                } ]
            }
        )
    }
}
