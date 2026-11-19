import profile from './profile.js'

// slot = pedestal index in the social area (0 → 7, right to left)
export default [
    { slot: 0, name: 'Quick profile', url: './cv.html', align: 'right' },
    { slot: 1, name: 'CHEAH-GPT', action: 'cheahGpt', align: 'right' },
    { slot: 2, name: 'Report card', modal: 'about', align: 'right' },
    { slot: 3, name: 'Contact me', action: 'contact', align: 'right' },
    { slot: 4, name: 'Since 2000', action: 'born', align: 'right' },
    { slot: 5, name: 'GitHub', url: profile.github, align: 'right' },
    { slot: 6, name: 'LinkedIn', url: profile.linkedin, align: 'left' },
    { slot: 7, name: 'Neural Sky', action: 'neuralSky', align: 'left' },
]
