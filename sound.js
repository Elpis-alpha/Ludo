// Table sounds, synthesised with Web Audio so the game ships no audio files.
// Wooden knocks for chips, peg ticks for the spinners, small chimes for good news.
const LudoSound = (function () {
  'use strict'

  const KEY = 'ludo-sound'

  let context = null
  let master = null
  let noise = null
  let enabled = true

  try { enabled = localStorage.getItem(KEY) !== 'off' } catch (e) { }

  const ready = () => {
    if (!enabled) return false

    if (!context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext
      if (!AudioCtor) return false

      context = new AudioCtor()
      master = context.createGain()
      master.gain.value = 0.5
      master.connect(context.destination)

      // One second of white noise, reused for every knock and tick
      noise = context.createBuffer(1, context.sampleRate, context.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }

    if (context.state === 'suspended') context.resume()

    return context.state !== 'closed'
  }

  const envelope = (peak, attack, decay, at) => {
    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(peak, at + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
    gain.connect(master)
    return gain
  }

  const tone = ({ from, to = from, type = 'sine', peak = 0.3, attack = 0.004, decay = 0.12, delay = 0 }) => {
    const at = context.currentTime + delay
    const osc = context.createOscillator()
    osc.type = type
    osc.frequency.setValueAtTime(from, at)
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + attack + decay)
    osc.connect(envelope(peak, attack, decay, at))
    osc.start(at)
    osc.stop(at + attack + decay + 0.02)
  }

  const burst = ({ filter = 'bandpass', freq = 1800, q = 1, peak = 0.3, decay = 0.04, delay = 0 }) => {
    const at = context.currentTime + delay
    const source = context.createBufferSource()
    source.buffer = noise
    const shape = context.createBiquadFilter()
    shape.type = filter
    shape.frequency.value = freq
    shape.Q.value = q
    source.connect(shape)
    shape.connect(envelope(peak, 0.002, decay, at))
    source.start(at, Math.random() * 0.5)
    source.stop(at + decay + 0.05)
  }

  const knock = (pitch, level = 1, delay = 0) => {
    tone({ from: pitch, to: pitch * 0.62, peak: 0.34 * level, decay: 0.07, delay })
    burst({ freq: pitch * 5.5, q: 1.4, peak: 0.16 * level, decay: 0.025, delay })
  }

  const sounds = {
    // n rises with each square so a long move sounds like a little run
    step: (n = 0) => knock(250 + Math.min(n, 11) * 9),

    out: () => { knock(210); knock(315, 0.9, 0.09) },

    tick: () => burst({ filter: 'highpass', freq: 2600, q: 0.7, peak: 0.13, decay: 0.014 }),

    settle: () => { knock(180, 0.8); tone({ from: 660, peak: 0.1, decay: 0.16, delay: 0.02 }) },

    capture: () => {
      knock(120, 1.4)
      burst({ filter: 'lowpass', freq: 700, peak: 0.3, decay: 0.09 })
      tone({ from: 520, to: 130, type: 'triangle', peak: 0.2, decay: 0.34, delay: 0.05 })
    },

    home: () => [784, 988, 1319].forEach((freq, i) => tone({ from: freq, peak: 0.2, decay: 0.42, delay: i * 0.08 })),

    turn: () => { tone({ from: 587, peak: 0.13, decay: 0.14 }); tone({ from: 880, peak: 0.13, decay: 0.22, delay: 0.1 }) },

    again: () => [660, 880].forEach((freq, i) => tone({ from: freq, type: 'triangle', peak: 0.16, decay: 0.16, delay: i * 0.09 })),

    pass: () => tone({ from: 300, to: 200, type: 'triangle', peak: 0.14, decay: 0.2 }),

    press: () => knock(340, 0.55),

    win: () => [523, 659, 784, 1047, 1319, 1568].forEach((freq, i) => {
      tone({ from: freq, type: 'triangle', peak: 0.2, decay: 0.5, delay: i * 0.11 })
      tone({ from: freq * 2, peak: 0.07, decay: 0.4, delay: i * 0.11 })
    }),
  }

  return {
    play: (name, arg) => {
      try { if (sounds[name] && ready()) sounds[name](arg) } catch (e) { }
    },

    isOn: () => enabled,

    setOn: (value) => {
      enabled = !!value
      try { localStorage.setItem(KEY, enabled ? 'on' : 'off') } catch (e) { }
      if (!enabled && context && context.state === 'running') context.suspend()
    },

    // Browsers only allow sound after a tap or key press
    unlock: () => { try { ready() } catch (e) { } },
  }
})()
