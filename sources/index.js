import './threejs-override.js'
import { Game } from './Game/Game.js'
import { Debug } from './Game/Debug.js'
import consoleLog from './data/consoleLog.js'

if(import.meta.env.VITE_LOG)
    console.log(
        ...consoleLog
    )

Debug.preload().then(() =>
{
    if(import.meta.env.VITE_GAME_PUBLIC)
        window.game = new Game()
    else
        new Game()
})