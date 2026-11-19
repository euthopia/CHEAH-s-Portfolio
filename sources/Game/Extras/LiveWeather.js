import { Game } from '../Game.js'
import { lerp } from '../utilities/maths.js'

// Malaysian cities (lat, lon); Open-Meteo is free, keyless and CORS-enabled
const CITIES = [
    { id: 'kl', name: 'Kuala Lumpur', lat: 3.139, lon: 101.6869 },
    { id: 'penang', name: 'George Town', lat: 5.4141, lon: 100.3288 },
    { id: 'jb', name: 'Johor Bahru', lat: 1.4927, lon: 103.7414 },
    { id: 'ipoh', name: 'Ipoh', lat: 4.5975, lon: 101.0901 },
    { id: 'kk', name: 'Kota Kinabalu', lat: 5.9804, lon: 116.0735 },
    { id: 'kuching', name: 'Kuching', lat: 1.5533, lon: 110.3592 },
]

// Preview presets for visitors (values in engine units)
const PRESETS = {
    sunny: { label: 'Sunny', icon: '☀️', temperature: 32, humidity: 0.55, clouds: -0.6, wind: 0.15, rain: 0, electricField: 0 },
    cloudy: { label: 'Cloudy', icon: '☁️', temperature: 29, humidity: 0.75, clouds: 0.7, wind: 0.35, rain: 0, electricField: 0 },
    rain: { label: 'Monsoon rain', icon: '🌧️', temperature: 26, humidity: 0.95, clouds: 1, wind: 0.55, rain: 0.75, electricField: 0.1 },
    storm: { label: 'Thunderstorm', icon: '⛈️', temperature: 25, humidity: 1, clouds: 1, wind: 0.85, rain: 1, electricField: 1 },
}

// WMO weather codes → label + icon
const describe = (code, isDay) =>
{
    if(code === 0) return [ isDay ? 'Clear sky' : 'Clear night', isDay ? '☀️' : '🌙' ]
    if(code <= 2) return [ 'Partly cloudy', isDay ? '⛅' : '☁️' ]
    if(code === 3) return [ 'Overcast', '☁️' ]
    if(code === 45 || code === 48) return [ 'Hazy / fog', '🌫️' ]
    if(code >= 51 && code <= 57) return [ 'Drizzle', '🌦️' ]
    if(code >= 61 && code <= 67) return [ 'Rain', '🌧️' ]
    if(code >= 80 && code <= 82) return [ 'Rain showers', '🌧️' ]
    if(code >= 95) return [ 'Thunderstorm', '⛈️' ]
    return [ 'Cloudy', '☁️' ]
}

const clamp01 = (v) => Math.min(1, Math.max(0, v))

export class LiveWeather
{
    constructor({ onChange } = {})
    {
        this.game = Game.getInstance()
        this.onChange = onChange
        this.mode = this.read('cheah:weather-mode') ?? 'live' // live | preset name | off
        this.city = CITIES.find(c => c.id === this.read('cheah:weather-city')) ?? CITIES[0]
        this.syncTime = this.read('cheah:weather-time') !== '0'
        this.data = null
        this.error = null
        this.strength = 0
        this.targets = null

        this.setTimeSync()
        this.game.ticker.events.on('tick', () => this.update(), 8)

        this.fetch()
        this.interval = setInterval(() => this.fetch(), 10 * 60 * 1000)
        this.applyMode()
    }

    read(key) { try { return localStorage.getItem(key) } catch { return null } }
    write(key, value) { try { localStorage.setItem(key, value) } catch {} }

    async fetch()
    {
        try
        {
            this.data = { ...(await this.fetchOpenMeteo()), city: this.city.name, fetchedAt: new Date(), source: 'Open-Meteo' }
            this.error = null
        }
        catch(error)
        {
            try
            {
                this.data = { ...(await this.fetchWttr()), city: this.city.name, fetchedAt: new Date(), source: 'wttr.in' }
                this.error = null
            }
            catch(fallbackError)
            {
                this.error = 'Live weather is unavailable right now'
                console.warn('[LiveWeather]', error, fallbackError)
            }
        }
        this.applyMode()
    }

    async fetchOpenMeteo()
    {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.city.lat}&longitude=${this.city.lon}` +
            '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m' +
            '&timezone=Asia%2FKuala_Lumpur'
        const response = await fetch(url)
        const json = await response.json()
        if(!response.ok || json.error || !json.current)
            throw new Error(json.reason || `HTTP ${response.status}`)
        return json.current
    }

    // Fallback: wttr.in (WorldWeatherOnline codes) normalised to the Open-Meteo shape
    async fetchWttr()
    {
        const response = await fetch(`https://wttr.in/${this.city.lat},${this.city.lon}?format=j1`)
        if(!response.ok)
            throw new Error(`HTTP ${response.status}`)
        const c = (await response.json()).current_condition?.[0]
        if(!c)
            throw new Error('No current condition')
        const wwo = parseInt(c.weatherCode)
        const code =
            wwo === 113 ? 0 :
            wwo === 116 ? 2 :
            [ 119, 122 ].includes(wwo) ? 3 :
            [ 143, 248, 260 ].includes(wwo) ? 45 :
            [ 200, 386, 389, 392, 395 ].includes(wwo) ? 95 :
            [ 176, 263, 266, 293, 296, 353 ].includes(wwo) ? 61 :
            wwo >= 299 ? 63 : 3
        const hours = this.malaysiaHours()
        return {
            temperature_2m: parseFloat(c.temp_C),
            apparent_temperature: parseFloat(c.FeelsLikeC),
            relative_humidity_2m: parseFloat(c.humidity),
            precipitation: parseFloat(c.precipMM),
            cloud_cover: parseFloat(c.cloudcover),
            wind_speed_10m: parseFloat(c.windspeedKmph),
            weather_code: code,
            is_day: hours >= 7 && hours < 19.3 ? 1 : 0,
        }
    }

    // Real Open-Meteo values → engine weather properties
    fromLive(d)
    {
        const code = d.weather_code
        const storm = code >= 95
        const wetCode = (code >= 51 && code <= 67) || (code >= 80 && code <= 82)
        let rain = clamp01(Math.sqrt(d.precipitation / 8))
        if(wetCode) rain = Math.max(rain, 0.35)
        if(storm) rain = Math.max(rain, 0.75)

        return {
            temperature: d.temperature_2m,
            humidity: clamp01(d.relative_humidity_2m / 100),
            clouds: (d.cloud_cover / 100) * 2 - 1,
            wind: clamp01(d.wind_speed_10m / 35),
            rain,
            electricField: storm ? 1 : 0,
        }
    }

    applyMode()
    {
        if(this.mode === 'off')
            this.targets = null
        else if(PRESETS[this.mode])
            this.targets = PRESETS[this.mode]
        else if(this.data)
            this.targets = this.fromLive(this.data)
        else
            this.targets = null
        this.onChange?.(this.status())
    }

    setMode(mode)
    {
        this.mode = mode
        this.write('cheah:weather-mode', mode)
        this.applyMode()
    }

    setCity(id)
    {
        this.city = CITIES.find(c => c.id === id) ?? CITIES[0]
        this.write('cheah:weather-city', this.city.id)
        this.data = null
        this.onChange?.(this.status())
        this.fetch()
    }

    setTimeSyncEnabled(enabled)
    {
        this.syncTime = enabled
        this.write('cheah:weather-time', enabled ? '1' : '0')
        this.onChange?.(this.status())
    }

    // Malaysia time (UTC+8) → engine day progress (0 day, .25 dusk, .35-.6 night, .8 dawn)
    malaysiaHours()
    {
        const now = new Date()
        return ((now.getUTCHours() + 8) % 24) + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600
    }

    hoursToProgress(hours)
    {
        const anchors = [ [ 5.5, 0.6 ], [ 7, 0.8 ], [ 8, 0.9 ], [ 17.5, 1.15 ], [ 19.25, 1.25 ], [ 20.5, 1.35 ], [ 29.5, 1.6 ] ]
        let h = hours < 5.5 ? hours + 24 : hours
        for(let i = 0; i < anchors.length - 1; i++)
        {
            const [ h0, p0 ] = anchors[i]
            const [ h1, p1 ] = anchors[i + 1]
            if(h >= h0 && h <= h1)
                return (p0 + (h - h0) / (h1 - h0) * (p1 - p0)) % 1
        }
        return 0
    }

    setTimeSync()
    {
        const day = this.game.dayCycles
        const binding = day?.newAbsoluteProgressBinding
        if(!binding)
            return
        const original = binding.update
        binding.update = () =>
        {
            if(this.syncTime && this.mode !== 'off' && !binding.manual)
            {
                const days = Math.floor(Date.now() / 86400000)
                day.newAbsoluteProgress = days + this.hoursToProgress(this.malaysiaHours())
            }
            else
                original()
        }
    }

    update()
    {
        const weather = this.game.weather
        if(!weather)
            return

        // Fade the live layer in/out smoothly
        const goal = this.targets ? 1 : 0
        this.strength += (goal - this.strength) * Math.min(1, this.game.ticker.delta * 0.6)
        if(this.strength < 0.001 && !this.targets)
            return

        // Story overrides (circuit race, tornado...) keep priority
        const s = this.strength * (1 - weather.override.strength)
        const targets = this.targets ?? this.lastTargets
        if(!targets)
            return
        this.lastTargets = targets

        for(const name of [ 'temperature', 'humidity', 'clouds', 'wind', 'rain', 'electricField' ])
            if(weather[name] && typeof targets[name] === 'number')
                weather[name].value = lerp(weather[name].value, targets[name], s)

        // No snow in Malaysia
        if(weather.snow)
            weather.snow.value = lerp(weather.snow.value, -1, s)
    }

    status()
    {
        const preset = PRESETS[this.mode]
        let label = 'Weather'
        let icon = '🌤️'
        let temp = null
        if(this.mode === 'off')
        {
            label = 'Engine weather'
            icon = '🎲'
        }
        else if(preset)
        {
            label = preset.label
            icon = preset.icon
            temp = preset.temperature
        }
        else if(this.data)
        {
            [ label, icon ] = describe(this.data.weather_code, this.data.is_day)
            temp = Math.round(this.data.temperature_2m)
        }
        return { mode: this.mode, label, icon, temp, data: this.data, error: this.error, city: this.city, cities: CITIES, presets: PRESETS, syncTime: this.syncTime }
    }
}
