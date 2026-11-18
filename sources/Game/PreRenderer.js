import * as THREE from 'three/webgpu'
import { Game } from './Game.js'
import CubeRenderTarget from 'three/src/renderers/common/CubeRenderTarget.js'

export class PreRenderer
{
    /**
     * Non-blocking warm-up: compiles all materials with renderer.compileAsync
     * (WebGPU async pipelines / WebGL parallel shader compile). Falls back to render().
     */
    static async compile()
    {
        const game = Game.getInstance()
        const renderer = game.rendering.renderer
        const camera = game.view?.camera

        if(typeof renderer.compileAsync !== 'function' || !camera)
        {
            if(game.quality.level === 0 && renderer.backend.isWebGPUBackend)
                PreRenderer.render()
            return
        }

        const invisibles = []
        game.scene.traverse((child) =>
        {
            if(child.visible === false && typeof child.userData.preventPreRender === 'undefined')
            {
                child.visible = true
                invisibles.push(child)
            }
        })

        try
        {
            game.world?.intro?.setPreparing?.(true)
            await renderer.compileAsync(game.scene, camera)
        }
        catch(error)
        {
            console.warn('[PreRenderer] compileAsync failed', error)
        }
        finally
        {
            for(const child of invisibles)
                child.visible = false
            game.world?.intro?.setPreparing?.(false)
        }
    }

    static render()
    {
        const game = Game.getInstance()

        // Setup
        const renderTarget = new CubeRenderTarget(32)
        
        const cubeCamera = new THREE.CubeCamera(1, 100000, renderTarget)
        game.scene.add(cubeCamera)

        // Make all visible
        const invisibles = []
        game.scene.traverse((child) =>
        {
            if(child.visible === false && typeof child.userData.preventPreRender === 'undefined')
            {
                child.visible = true
                invisibles.push(child)
            }
        })

        // Force render
        cubeCamera.update(game.rendering.renderer, game.scene)

        // Hide back
        for(const child of invisibles)
            child.visible = false
    }
}