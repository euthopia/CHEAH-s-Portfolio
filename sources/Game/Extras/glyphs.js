import { Font } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import fontData from '../../data/fontInterBlack.json'

const font = new Font(fontData)

/**
 * Extruded text geometry, centered on the origin, facing +Z.
 * height = cap height in world units, uv = [u, v] palette coordinate applied to every vertex
 */
export function glyphGeometry(text, { height = 1, depth = 0.4, uv = null } = {})
{
    const geometry = new TextGeometry(text, {
        font,
        size: 1,
        depth: 1,
        curveSegments: 6,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.025,
        bevelSegments: 2
    })
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    const scaleY = height / (box.max.y - box.min.y)
    const scaleZ = depth / (box.max.z - box.min.z)
    geometry.translate(
        - (box.min.x + box.max.x) / 2,
        - (box.min.y + box.max.y) / 2,
        - (box.min.z + box.max.z) / 2
    )
    geometry.scale(scaleY, scaleY, scaleZ)

    if(uv)
    {
        const uvs = geometry.attributes.uv
        for(let i = 0; i < uvs.count; i++)
            uvs.setXY(i, uv[0], uv[1])
        uvs.needsUpdate = true
    }

    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    return geometry
}

export function firstUv(geometry)
{
    const uv = geometry?.attributes?.uv
    return uv ? [ uv.getX(0), uv.getY(0) ] : null
}
