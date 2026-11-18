import * as THREE from 'three/webgpu'

const text = `
 ██████╗██╗  ██╗███████╗ █████╗ ██╗  ██╗
██╔════╝██║  ██║██╔════╝██╔══██╗██║  ██║
██║     ███████║█████╗  ███████║███████║
██║     ██╔══██║██╔══╝  ██╔══██║██╔══██║
╚██████╗██║  ██║███████╗██║  ██║██║  ██║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝
        C H E R N   E U  ·  P O R T F O L I O

╔═ Hello, fellow developer ═════╗
║ I'm CHEAH CHERN EU — AI Cloud Solution Architect at Huawei Malaysia (since 2025), AI Engineer 2023–2025.
║ Projects: A2 migration (H200 → Huawei NPU) · AI prototyping · AIOps & MLOps.
║ Born in 2000 · UPSR 6A · PT3 7A · SPM 10A (23 A's in total).
╚═══════════════════════════════╝

╔═ Find me ═════════════════════╗
║ LinkedIn ⇒ https://my.linkedin.com/in/cheah-chern-eu-48b3ba132
║ GitHub   ⇒ https://github.com/euthopia
║ Email    ⇒ cheah.c.eu@gmail.com
║ Phone    ⇒ 018-945 6286 (call or WhatsApp)
╚═══════════════════════════════╝

╔═ Secrets ═════════════════════╗
║ Press [C] in the world to talk to CHEAH-GPT, my in-world AI assistant.
║ Look up at night: the Neural Sky trains itself while you drive.
║ Type  chern.hello()  right here in the console.
║ Add #debug to the URL for the debug mode, then [V] toggles the free camera.
╚═══════════════════════════════╝

╔═ Built with ══════════════════╗
║ Three.js (release ${THREE.REVISION}) · Rapier · Howler.js · Vite
║ World engine based on Bruno Simon's open-source folio-2025 (MIT) — https://github.com/brunosimon/folio-2025
║ Music by Kounine (CC0) — https://linktr.ee/Kounine
╚═══════════════════════════════╝
`
let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]