import * as THREE from 'three/webgpu'
import { color, float, uniform } from 'three/tsl'
import { Game } from '../Game.js'

/**
 * Neural Sky: a layered neural network floating above the landing zone.
 * Signals travel from layer to layer like a forward pass; it glows brighter at night
 * and "trains" faster when the player drives close.
 */
export class NeuralSky
{
    constructor()
    {
        this.game = Game.getInstance()

        this.layers = [ 4, 7, 9, 7, 3 ]
        this.layerSpacing = 3.2
        this.nodeSpacing = 1.35
        this.height = 7.5
        this.burstTime = 0

        this.glow = uniform(1)
        this.coolColor = uniform(color('#7fd8ff'))
        this.hotColor = uniform(color('#ff6fb1'))

        this.group = new THREE.Group()
        this.group.name = 'neuralSky'

        const landing = this.game.respawns.getByName('landing') ?? this.game.respawns.getDefault()
        this.center = landing ? landing.position.clone() : new THREE.Vector3()
        this.group.position.set(this.center.x, this.center.y + this.height, this.center.z - 2)

        this.setNodes()
        this.setEdges()
        this.setSignals()

        this.game.scene.add(this.group)

        this.game.ticker.events.on('tick', () => this.update(), 10)
    }

    setNodes()
    {
        this.nodes = []
        const width = (this.layers.length - 1) * this.layerSpacing
        this.layers.forEach((count, layerIndex) =>
        {
            for(let i = 0; i < count; i++)
            {
                const angle = (i / count) * Math.PI * 2
                const radius = (count - 1) * this.nodeSpacing * 0.25
                this.nodes.push({
                    layer: layerIndex,
                    base: new THREE.Vector3(
                        layerIndex * this.layerSpacing - width / 2,
                        Math.sin(angle) * radius * 0.6,
                        Math.cos(angle) * radius
                    ),
                    position: new THREE.Vector3(),
                    phase: Math.random() * Math.PI * 2,
                    activation: 0
                })
            }
        })

        const geometry = new THREE.IcosahedronGeometry(0.22, 1)
        const material = new THREE.MeshBasicNodeMaterial({ fog: false })

        this.nodesMesh = new THREE.InstancedMesh(geometry, material, this.nodes.length)
        this.cool = new THREE.Color('#7fd8ff')
        this.hot = new THREE.Color('#ff6fb1')
        this.tempColor = new THREE.Color()
        for(let i = 0; i < this.nodes.length; i++)
            this.nodesMesh.setColorAt(i, this.cool)
        this.nodesMesh.frustumCulled = false
        this.nodesMesh.castShadow = false
        this.nodesMesh.receiveShadow = false
        this.group.add(this.nodesMesh)
    }

    setEdges()
    {
        this.edges = []
        for(const a of this.nodes)
            for(const b of this.nodes)
                if(b.layer === a.layer + 1 && Math.random() < 0.55)
                    this.edges.push({ a, b })

        const positions = new Float32Array(this.edges.length * 6)
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        const material = new THREE.LineBasicNodeMaterial({ transparent: true, depthWrite: false, fog: false })
        material.colorNode = this.coolColor.mul(this.glow.mul(0.9))
        material.opacityNode = float(0.35)
        this.edgesMesh = new THREE.LineSegments(geometry, material)
        this.edgesMesh.frustumCulled = false
        this.group.add(this.edgesMesh)
    }

    setSignals()
    {
        this.signalCount = 48
        this.signals = []
        for(let i = 0; i < this.signalCount; i++)
            this.signals.push(this.spawnSignal({}, true))

        const geometry = new THREE.SphereGeometry(0.09, 8, 6)
        const material = new THREE.MeshBasicNodeMaterial({ fog: false })
        material.colorNode = this.hotColor.mul(this.glow.mul(2.2))
        this.signalsMesh = new THREE.InstancedMesh(geometry, material, this.signalCount)
        this.signalsMesh.frustumCulled = false
        this.group.add(this.signalsMesh)
    }

    spawnSignal(signal, randomProgress = false)
    {
        const firstLayerEdges = this.edges.filter(edge => edge.a.layer === 0)
        signal.edge = firstLayerEdges[Math.floor(Math.random() * firstLayerEdges.length)]
        signal.progress = randomProgress ? Math.random() : 0
        signal.speed = 0.6 + Math.random() * 0.8
        return signal
    }

    burst()
    {
        this.burstTime = 6
    }

    update()
    {
        const delta = this.game.ticker.delta
        const elapsed = this.game.ticker.elapsed
        const matrix = new THREE.Matrix4()
        const scale = new THREE.Vector3(1, 1, 1)
        const quaternion = new THREE.Quaternion()

        // Night factor (day cycle: night between ~0.25 and 0.7)
        const progress = this.game.dayCycles?.progress ?? 0
        const night = THREE.MathUtils.smoothstep(progress, 0.2, 0.3) * (1 - THREE.MathUtils.smoothstep(progress, 0.65, 0.75))

        // Player proximity speeds up training
        let proximity = 0
        if(this.game.player)
        {
            const distance = Math.hypot(this.game.player.position.x - this.center.x, this.game.player.position.z - this.center.z)
            proximity = 1 - THREE.MathUtils.clamp(distance / 25, 0, 1)
        }

        this.burstTime = Math.max(0, this.burstTime - delta)
        const speed = 1 + proximity * 1.5 + (this.burstTime > 0 ? 3 : 0)
        this.glow.value = 0.55 + night * 0.9 + (this.burstTime > 0 ? 0.6 : 0)

        // Slow rotation + floating
        this.group.rotation.y = elapsed * 0.05
        this.group.position.y = this.center.y + this.height + Math.sin(elapsed * 0.6) * 0.25

        // Nodes
        this.nodes.forEach((node, i) =>
        {
            node.activation = Math.max(0, node.activation - delta * 1.8)
            node.position.copy(node.base)
            node.position.y += Math.sin(elapsed * 0.9 + node.phase) * 0.15
            const s = 1 + node.activation * 0.9
            scale.set(s, s, s)
            matrix.compose(node.position, quaternion, scale)
            this.nodesMesh.setMatrixAt(i, matrix)
            this.tempColor.copy(this.cool).lerp(this.hot, node.activation).multiplyScalar(this.glow.value * 1.6)
            this.nodesMesh.setColorAt(i, this.tempColor)
        })
        this.nodesMesh.instanceMatrix.needsUpdate = true
        this.nodesMesh.instanceColor.needsUpdate = true

        // Edges
        const positions = this.edgesMesh.geometry.attributes.position.array
        this.edges.forEach((edge, i) =>
        {
            edge.a.position.toArray(positions, i * 6)
            edge.b.position.toArray(positions, i * 6 + 3)
        })
        this.edgesMesh.geometry.attributes.position.needsUpdate = true

        // Signals (forward pass)
        const position = new THREE.Vector3()
        scale.set(1, 1, 1)
        this.signals.forEach((signal, i) =>
        {
            signal.progress += delta * signal.speed * speed
            if(signal.progress >= 1)
            {
                signal.edge.b.activation = 1
                const next = this.edges.filter(edge => edge.a === signal.edge.b)
                if(next.length)
                {
                    signal.edge = next[Math.floor(Math.random() * next.length)]
                    signal.progress = 0
                }
                else
                    this.spawnSignal(signal)
            }
            position.lerpVectors(signal.edge.a.position, signal.edge.b.position, signal.progress)
            matrix.compose(position, quaternion, scale)
            this.signalsMesh.setMatrixAt(i, matrix)
        })
        this.signalsMesh.instanceMatrix.needsUpdate = true
    }
}
