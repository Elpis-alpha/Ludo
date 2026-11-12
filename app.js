// Ludo screen: draws the board, runs the turn loop and handles setup.
// The rules live in engine.js (LudoEngine); sounds in sound.js (LudoSound).
(function () {
  'use strict'

  const Engine = LudoEngine
  const Sound = LudoSound
  const { BASE, HOME, LAST_TRACK, START, STAR_SQUARES, SEAT_IDS } = Engine

  const $ = (selector, root = document) => root.querySelector(selector)
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector))

  const el = {
    root: document.documentElement,
    body: document.body,
    brand: $('#brand'),
    rulesBtn: $('#btn-rules'),
    soundBtn: $('#btn-sound'),
    leaveBtn: $('#btn-leave'),
    continueBtn: $('#btn-continue'),
    newBtn: $('#btn-new'),
    setup: $('#setup'),
    seats: $('#seats'),
    setupBack: $('#btn-setup-back'),
    startBtn: $('#btn-start'),
    setupNote: $('#setup-note'),
    ruleNote: $('#rule-note'),
    scoreList: $('#score-list'),
    log: $('#log'),
    boardWrap: $('#board-wrap'),
    board: $('#board'),
    art: $('#board-art'),
    pieces: $('#pieces'),
    status: $('#status'),
    dials: { a: $('#dial-a'), b: $('#dial-b') },
    spin: $('#btn-spin'),
    sum: $('#btn-sum'),
    rules: $('#rules'),
    rulesSafe: $('#rules-safe'),
    results: $('#results'),
    resultsTitle: $('#results-title'),
    podium: $('#podium'),
    againBtn: $('#btn-again'),
    changeBtn: $('#btn-change'),
    confetti: $('#confetti'),
    live: $('#live'),
  }

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const canHover = window.matchMedia('(hover: hover)').matches
  const calm = () => motion.matches

  // Small helpers

  const h = (tag, props = {}, ...children) => {
    const node = document.createElement(tag)
    Object.entries(props).forEach(([key, value]) => {
      if (key === 'class') node.className = value
      else if (key === 'text') node.textContent = value
      else if (key === 'style') node.style.cssText = value
      else if (value === true) node.setAttribute(key, '')
      else if (value !== false && value != null) node.setAttribute(key, value)
    })
    children.forEach(child => node.append(child))
    return node
  }

  const store = {
    read: (key) => { try { return JSON.parse(localStorage.getItem(key)) } catch (e) { return null } },
    write: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) { } },
    remove: (key) => { try { localStorage.removeItem(key) } catch (e) { } },
  }

  const SAVE_KEY = 'ludo-save'
  const SETUP_KEY = 'ludo-setup'

  const ordinal = (n) => ['', '1st', '2nd', '3rd', '4th'][n] || `${n}th`

  // White or ink, whichever reads better on the given colour
  const readableOn = (hex) => {
    const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
    const light = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
    return 1.05 / (light + 0.05) >= (light + 0.05) / 0.066 ? '#ffffff' : '#2a211b'
  }

  // Setup defaults

  const AVATARS = Array.from({ length: 14 }, (_, i) => `images/avatar/avatar${String(i + 1).padStart(2, '0')}.png`)

  const PALETTE = ['#2b62c4', '#2e8b57', '#e9a23b', '#c0392b', '#7a4aa0', '#2aa7b8', '#d95f8a', '#4b5360']

  const RULE_NOTES = {
    special: "A chip on a star or a start square can't be captured.",
    nowhere: 'Any chip on the track can be captured.',
    anywhere: 'Every square is safe. A straight race home.',
  }

  const CORNERS = ['Bottom right corner', 'Bottom left corner', 'Top left corner', 'Top right corner']

  const defaultSetup = () => ({
    rule: 'special',
    seats: [
      { active: true, human: true, name: 'You', color: PALETTE[0], avatar: AVATARS[2] },
      { active: true, human: false, name: 'Tobi', color: PALETTE[1], avatar: AVATARS[5] },
      { active: true, human: false, name: 'Ada', color: PALETTE[2], avatar: AVATARS[13] },
      { active: true, human: false, name: 'Kemi', color: PALETTE[3], avatar: AVATARS[9] },
    ],
  })

  const cleanSetup = (raw) => {
    const base = defaultSetup()
    if (!raw || !Array.isArray(raw.seats) || raw.seats.length !== 4) return base

    const seats = raw.seats.map((seat, i) => ({
      active: !!seat.active,
      human: !!seat.human,
      name: String(seat.name || base.seats[i].name).slice(0, 16),
      color: /^#[0-9a-f]{6}$/i.test(seat.color) ? seat.color.toLowerCase() : base.seats[i].color,
      avatar: AVATARS.includes(seat.avatar) ? seat.avatar : base.seats[i].avatar,
    }))

    if (seats.filter(seat => seat.active).length < 2) return base

    return { rule: Engine.RULES.includes(raw.rule) ? raw.rule : 'special', seats }
  }

  const setupOf = (state) => cleanSetup({ rule: state.rule, seats: state.seats })

  // Board geometry: cells on a 15 by 15 grid, [column, row] from the top left

  const TRACK = (() => {
    const cells = [null]
    for (let k = 1; k <= 52; k++) {
      if (k <= 6) cells.push([15 - k, 8])
      else if (k <= 12) cells.push([8, k + 2])
      else if (k === 13) cells.push([7, 14])
      else if (k === 14) cells.push([6, 14])
      else if (k <= 19) cells.push([6, 28 - k])
      else if (k <= 25) cells.push([25 - k, 8])
      else if (k === 26) cells.push([0, 7])
      else if (k === 27) cells.push([0, 6])
      else if (k <= 32) cells.push([k - 27, 6])
      else if (k <= 38) cells.push([6, 38 - k])
      else if (k === 39) cells.push([7, 0])
      else if (k === 40) cells.push([8, 0])
      else if (k <= 45) cells.push([8, k - 40])
      else if (k <= 51) cells.push([k - 37, 6])
      else cells.push([14, 7])
    }
    return cells
  })()

  // Home column cell k (1 to 5) for each seat; 6 is the centre
  const LANE = [
    k => [14 - k, 7],
    k => [7, 14 - k],
    k => [k, 7],
    k => [7, k],
  ]

  const BASE_ORIGIN = [[9, 9], [0, 9], [0, 0], [9, 0]]

  // Finished chips line up inside their triangle of the centre, kept centred
  // on its outer edge: n is the chip's place in the row, of count chips
  const homeSlot = (seat, n, count) => {
    const along = 7 + (n - (count - 1) / 2) * 0.5
    return [[8.1, along], [along, 8.1], [5.9, along], [along, 5.9]][seat]
  }

  const cellOf = (seat, progress) =>
    progress <= LAST_TRACK ? TRACK[Engine.square(seat, progress)] : LANE[seat](progress - LAST_TRACK)

  // Board artwork (SVG, drawn once)

  const starPath = (cx, cy, outer = 0.3, inner = 0.13) => {
    const points = []
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 ? inner : outer
      const angle = (-90 + i * 36) * Math.PI / 180
      points.push(`${(cx + radius * Math.cos(angle)).toFixed(3)},${(cy + radius * Math.sin(angle)).toFixed(3)}`)
    }
    return `M${points.join('L')}Z`
  }

  const drawBoard = () => {
    const parts = []

    for (let k = 1; k <= 52; k++) {
      const [x, y] = TRACK[k]
      const seat = START.indexOf(k)
      parts.push(`<rect class="sq${seat >= 0 ? ` start seat-${SEAT_IDS[seat]}` : ''}" x="${x}" y="${y}" width="1" height="1"/>`)
      if (seat >= 0) parts.push(`<path class="star on-start seat-${SEAT_IDS[seat]}" d="${starPath(x + 0.5, y + 0.5)}"/>`)
      if (STAR_SQUARES.includes(k)) parts.push(`<path class="star" d="${starPath(x + 0.5, y + 0.5)}"/>`)
    }

    SEAT_IDS.forEach((id, seat) => {
      for (let k = 1; k <= 5; k++) {
        const [x, y] = LANE[seat](k)
        parts.push(`<rect class="sq lane seat-${id}" x="${x}" y="${y}" width="1" height="1"/>`)
      }
    })

    // Arrows on the last track square, pointing into each home column
    const arrows = [
      'M14.68,7.3 L14.68,7.7 L14.32,7.5Z',
      'M7.3,14.68 L7.7,14.68 L7.5,14.32Z',
      'M0.32,7.3 L0.32,7.7 L0.68,7.5Z',
      'M7.3,0.32 L7.7,0.32 L7.5,0.68Z',
    ]
    arrows.forEach((d, seat) => parts.push(`<path class="arrow seat-${SEAT_IDS[seat]}" d="${d}"/>`))

    const triangles = ['9,6 9,9 7.5,7.5', '6,9 9,9 7.5,7.5', '6,6 6,9 7.5,7.5', '6,6 9,6 7.5,7.5']
    triangles.forEach((points, seat) => parts.push(`<polygon class="tri seat-${SEAT_IDS[seat]}" points="${points}"/>`))

    parts.push('<circle class="hub" cx="7.5" cy="7.5" r="0.6"/>')
    parts.push('<path class="crown" d="M7.2,7.7 L7.14,7.36 L7.34,7.52 L7.5,7.26 L7.66,7.52 L7.86,7.36 L7.8,7.7Z"/>')

    SEAT_IDS.forEach((id, seat) => {
      const [bx, by] = BASE_ORIGIN[seat]
      const top = by === 0
      const sockets = [[2, 2], [4, 2], [2, 4], [4, 4]]
        .map(([dx, dy]) => `<circle class="socket" cx="${bx + dx}" cy="${by + dy}" r="0.58"/>`).join('')

      parts.push(`
        <g class="base seat-${id}" data-seat="${seat}">
          <rect class="base-bg" x="${bx}" y="${by}" width="6" height="6"/>
          <rect class="yard" x="${bx + 1}" y="${by + 1}" width="4" height="4" rx="0.7"/>
          <rect class="yard-turn" x="${bx + 0.78}" y="${by + 0.78}" width="4.44" height="4.44" rx="0.9"/>
          ${sockets}
          <clipPath id="face-${id}"><circle cx="${bx + 3}" cy="${by + 3}" r="0.74"/></clipPath>
          <circle class="face-bg" cx="${bx + 3}" cy="${by + 3}" r="0.78"/>
          <image class="face" x="${bx + 2.26}" y="${by + 2.3}" width="1.48" height="1.48" clip-path="url(#face-${id})" preserveAspectRatio="xMidYMax slice"/>
          <text class="base-name" x="${bx + 3}" y="${top ? by + 0.52 : by + 5.5}"></text>
          <g class="place"><circle cx="${bx + 3}" cy="${by + 3}" r="0.95"/><text x="${bx + 3}" y="${by + 3.02}"></text></g>
        </g>`)
    })

    el.art.innerHTML = parts.join('')
  }

  const drawDial = (dial) => {
    const polar = (radius, degrees) => {
      const angle = degrees * Math.PI / 180
      return [radius * Math.sin(angle), -radius * Math.cos(angle)]
    }

    const parts = ['<circle class="rim" r="47"/>']

    // Six wedges, each centred on its number; the 6 sits at the top
    for (let n = 1; n <= 6; n++) {
      const [x1, y1] = polar(42, n * 60 - 30)
      const [x2, y2] = polar(42, n * 60 + 30)
      parts.push(`<path class="wedge${n === 6 ? ' six' : ''}" data-n="${n}" d="M0,0 L${x1.toFixed(2)},${y1.toFixed(2)} A42,42 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)}Z"/>`)
    }

    for (let n = 1; n <= 6; n++) {
      const [x, y] = polar(32.5, n * 60)
      const [px, py] = polar(42, n * 60 + 30)
      parts.push(`<text class="num" data-n="${n}" x="${x.toFixed(2)}" y="${y.toFixed(2)}">${n}</text>`)
      parts.push(`<circle class="peg" cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="1.5"/>`)
    }

    // The needle stops short of the numbers so the one it points at stays readable
    parts.push('<g class="needle"><path d="M0,-24 L4.6,-13 L1.9,-13 L1.9,7 L-1.9,7 L-1.9,-13 L-4.6,-13Z"/></g>')
    parts.push('<circle class="pin" r="4.5"/>')
    parts.push('<g class="result"><circle r="15.5"/><text y="1"></text></g>')

    dial.innerHTML = `<svg viewBox="-50 -50 100 100" aria-hidden="true">${parts.join('')}</svg>`
  }

  const chipEls = SEAT_IDS.map((id, seat) => [0, 1, 2, 3].map(chip => {
    const node = h('button', { type: 'button', class: `chip seat-${id}`, 'data-seat': seat, 'data-chip': chip, disabled: true },
      h('span', { class: 'chip-body' }))
    return node
  }))

  // Game on the table

  let game = null        // { state, demo, preview, fast }
  let session = null     // cancels the running turn loop when the table changes
  let pick = null        // the human's choice in progress
  let waitingSpin = null // resolves when the human spins
  let spinning = false
  let hoverChip = -1
  let focusOnBoard = false // keyboard players keep their place between moves
  const needle = { a: 0, b: 0 }

  const CANCEL = Symbol('cancelled')

  const newSession = () => ({ cancelled: false, hooks: new Set() })

  const cancelSession = (s) => {
    if (!s || s.cancelled) return
    s.cancelled = true
    Array.from(s.hooks).forEach(hook => hook())
    s.hooks.clear()
  }

  const onCancel = (s, hook) => { s.hooks.add(hook); return () => s.hooks.delete(hook) }

  const sleep = (s, ms) => new Promise((resolve, reject) => {
    if (s.cancelled) { reject(CANCEL); return }
    const timer = setTimeout(() => { off(); resolve() }, ms)
    const off = onCancel(s, () => { clearTimeout(timer); reject(CANCEL) })
  })

  const pace = () => (game.demo ? 1.3 : game.fast ? 0.4 : 1)

  const humans = () => game.state.seats.filter(seat => seat.active && seat.human).length

  // "You" when one person is playing against computers, otherwise the name
  const isYou = (seat) => !game.demo && seat.human && humans() === 1
  const subject = (seat) => (isYou(seat) ? 'You' : seat.name)
  const possessive = (seat) => (isYou(seat) ? 'your' : `${seat.name}'s`)

  // Painting

  // An empty corner is printed in plain card colour, lane and all
  const EMPTY_COLOR = '#ddd2bc'

  const applyColors = (seats) => {
    seats.forEach(seat => {
      const color = seat.active ? seat.color : EMPTY_COLOR
      el.root.style.setProperty(`--c${seat.id}`, color)
      el.root.style.setProperty(`--on${seat.id}`, readableOn(color))
    })
  }

  const paintSeats = () => {
    const { state } = game

    applyColors(state.seats)
    el.board.dataset.rule = state.rule

    state.seats.forEach((seat, i) => {
      const base = $(`.base[data-seat="${i}"]`, el.art)
      base.classList.toggle('is-empty', !seat.active)
      base.classList.toggle('is-placed', !!seat.place)
      $('.base-name', base).textContent = seat.name
      $('.face', base).setAttribute('href', seat.avatar)
      $('.place text', base).textContent = seat.place ? ordinal(seat.place) : ''
      chipEls[i].forEach((chip, c) => {
        chip.classList.toggle('is-absent', !seat.active)
        chip.setAttribute('aria-label', `${seat.name}, chip ${c + 1}`)
      })
    })

    el.scoreList.replaceChildren(...state.seats.map((seat, i) => {
      if (!seat.active) return ''
      return h('li', { 'data-seat': i, style: `--c:${seat.color}` },
        h('img', { src: seat.avatar, alt: '' }),
        h('span', { class: 'score-name' }, seat.name, h('small', { text: seat.human ? '' : 'computer' })),
        h('span', { class: 'pips' }, h('i'), h('i'), h('i'), h('i')))
    }).filter(Boolean))
  }

  const paintScore = () => {
    const { state } = game

    $$('li', el.scoreList).forEach(row => {
      const i = Number(row.dataset.seat)
      const seat = state.seats[i]
      const sorted = seat.chips.slice().sort((a, b) => b - a)

      $$('.pips i', row).forEach((pip, c) => {
        pip.className = sorted[c] === HOME ? 'is-home' : sorted[c] > BASE ? 'is-out' : ''
      })

      row.setAttribute('aria-current', String(!state.over && state.turn === i))
      $('small', row).textContent = seat.place ? ordinal(seat.place) : seat.human ? '' : 'computer'
    })

    state.seats.forEach((seat, i) => {
      const base = $(`.base[data-seat="${i}"]`, el.art)
      base.classList.toggle('is-placed', !!seat.place)
      $('.place text', base).textContent = seat.place ? ordinal(seat.place) : ''
    })
  }

  const paintTurn = () => {
    const { state } = game
    const seat = state.seats[state.turn]

    el.root.style.setProperty('--turn', seat.color)
    el.root.style.setProperty('--turn-on', readableOn(seat.color))

    $$('.base', el.art).forEach(base => {
      base.classList.toggle('is-turn', !game.preview && !state.over && Number(base.dataset.seat) === state.turn)
    })

    paintScore()
  }

  const place = (node, x, y, scale = 1) => {
    node.style.setProperty('--x', x)
    node.style.setProperty('--y', y)
    node.style.setProperty('--s', scale)
  }

  // Offsets for chips sharing one square, in cells from the square's centre
  const STACKS = {
    1: { scale: 1, at: [[0, 0]] },
    2: { scale: 0.68, at: [[-0.2, 0], [0.2, 0]] },
    3: { scale: 0.6, at: [[-0.21, -0.19], [0.21, -0.19], [0, 0.19]] },
    4: { scale: 0.56, at: [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]] },
  }

  const stackFor = (count) => {
    if (STACKS[count]) return STACKS[count]
    const columns = count <= 9 ? 3 : 4
    const step = 0.86 / columns
    const at = Array.from({ length: count }, (_, i) =>
      [(i % columns - (columns - 1) / 2) * step, (Math.floor(i / columns) - (columns - 1) / 2) * step])
    return { scale: 1.15 / columns, at }
  }

  // Puts every chip where the state says it is
  const layoutChips = () => {
    const { state } = game
    const squares = new Map()

    state.seats.forEach((seat, i) => {
      if (!seat.active) return

      const homeCount = seat.chips.filter(p => p === HOME).length
      let homeIndex = 0

      seat.chips.forEach((progress, c) => {
        const node = chipEls[i][c]

        if (progress === BASE) {
          const [bx, by] = BASE_ORIGIN[i]
          place(node, bx + 1.5 + 2 * (c % 2), by + 1.5 + 2 * (c >> 1))
        } else if (progress === HOME) {
          const [x, y] = homeSlot(i, homeIndex++, homeCount)
          place(node, x, y, 0.55)
        } else {
          const [x, y] = cellOf(i, progress)
          const key = `${x},${y}`
          if (!squares.has(key)) squares.set(key, { x, y, nodes: [] })
          squares.get(key).nodes.push(node)
        }
      })
    })

    squares.forEach(({ x, y, nodes }) => {
      const stack = stackFor(nodes.length)
      nodes.forEach((node, n) => place(node, x + stack.at[n][0], y + stack.at[n][1], stack.scale))
    })
  }

  // Status line, log and screen reader announcements

  // lead is set in bold after the player's colour dot; hint is what to do next
  // and is left out of the log
  const tell = (seatIndex, lead, rest = '', { log = true, hint = '' } = {}) => {
    const seat = game.state.seats[seatIndex]
    const who = h('span', { class: 'who', style: `--c:${seat.color}` })
    if (lead) who.append(h('b', { text: lead }))

    const line = h('span', {}, who, [rest, hint].filter(Boolean).map(part => ` ${part}`).join(''))
    el.status.replaceChildren(line)

    if (game.demo) return

    const text = `${lead} ${rest}`.trim()
    el.live.textContent = `${text} ${hint}`.trim()

    if (log) {
      el.log.prepend(h('li', { text }))
      while (el.log.children.length > 5) el.log.lastElementChild.remove()
    }
  }

  // Spinners

  const dialDie = (key) => {
    const dice = game.state.dice
    // On an untouched double both spinners play the same number
    return key === 'b' && dice && dice.a === dice.b && !dice.usedA && !dice.usedB ? 'a' : key
  }

  const paintDials = () => {
    const dice = game && !game.preview ? game.state.dice : null
    const shown = !!dice && !spinning

    Object.entries(el.dials).forEach(([key, dial]) => {
      const value = dice ? dice[key] : 0
      const used = !!dice && dice[key === 'a' ? 'usedA' : 'usedB']
      const usable = !!pick && shown && !used && pick.opts.some(move => move.die === dialDie(key))

      dial.classList.toggle('has-value', shown)
      dial.classList.toggle('is-used', shown && used)
      dial.classList.toggle('is-stuck', !!pick && shown && !used && !usable)
      dial.classList.toggle('is-selected', usable && pick.dial === key)
      dial.disabled = !(usable || waitingSpin)

      $('.result text', dial).textContent = shown ? value : ''
      $$('.wedge, .num', dial).forEach(node => node.classList.toggle('is-hit', shown && !used && Number(node.dataset.n) === value))

      dial.setAttribute('aria-label', waitingSpin ? 'Spin the spinners'
        : shown ? `Spinner showing ${value}${used ? ', played' : usable ? '. Play this number' : ''}` : 'Spinner')
      if (usable) dial.setAttribute('aria-pressed', String(pick.dial === key))
      else dial.removeAttribute('aria-pressed')
    })

    const sumOpen = shown && !dice.usedA && !dice.usedB
    const sumUsable = !!pick && sumOpen && pick.opts.some(move => move.die === 'sum')

    el.sum.hidden = !sumOpen
    el.sum.disabled = !sumUsable
    el.sum.classList.toggle('is-selected', sumUsable && pick.die === 'sum')

    if (sumOpen) {
      el.sum.replaceChildren(h('small', { text: 'both' }), h('b', { text: dice.a + dice.b }))
      el.sum.setAttribute('aria-label', `Play both numbers as ${dice.a + dice.b}`)
      el.sum.setAttribute('aria-pressed', String(sumUsable && pick.die === 'sum'))
    }

    el.spin.hidden = !waitingSpin
  }

  const setNeedle = (key, degrees) => {
    needle[key] = degrees
    $('.needle', el.dials[key]).style.transform = `rotate(${degrees}deg)`
  }

  const spinDials = (s, dice) => new Promise((resolve, reject) => {
    const quiet = game.demo
    const plan = ['a', 'b'].map((key, i) => {
      const from = needle[key] % 360
      const settle = dice[key] * 60 + (Math.random() * 30 - 15)
      return { key, from, to: 360 * (3 + i) + settle, time: (calm() ? 60 : 1050 + i * 320) * pace(), wedge: Math.floor((from + 30) / 60), done: false }
    })

    let frame = 0
    let lastTick = 0
    const began = performance.now()

    spinning = true
    paintDials()

    const off = onCancel(s, () => { cancelAnimationFrame(frame); spinning = false; reject(CANCEL) })

    const step = (now) => {
      plan.forEach(dial => {
        if (dial.done) return

        const t = Math.min((now - began) / dial.time, 1)
        const angle = dial.from + (dial.to - dial.from) * (1 - Math.pow(1 - t, 3))
        const wedge = Math.floor((angle + 30) / 60)

        setNeedle(dial.key, angle)

        // A tick each time the needle passes a peg
        if (wedge !== dial.wedge && now - lastTick > 34 && !quiet) { Sound.play('tick'); lastTick = now }
        dial.wedge = wedge

        if (t === 1) { dial.done = true; if (!quiet) Sound.play('settle') }
      })

      if (plan.every(dial => dial.done)) {
        off()
        spinning = false
        paintDials()
        resolve()
      } else {
        frame = requestAnimationFrame(step)
      }
    }

    frame = requestAnimationFrame(step)
  })

  const waitForSpin = (s) => new Promise((resolve, reject) => {
    const off = onCancel(s, () => { waitingSpin = null; paintDials(); reject(CANCEL) })

    waitingSpin = () => { waitingSpin = null; off(); paintDials(); resolve() }
    paintDials()

    // Keep Space and Enter working without stealing focus from a form or dialog
    const active = document.activeElement
    if (!active || active === el.body || el.board.contains(active) || active.closest('.tray')) {
      el.spin.focus({ preventScroll: true })
    }
  })

  // Choosing a move

  const clearMarkers = () => $$('.dest', el.pieces).forEach(node => node.remove())

  const markerSpot = (move) => (move.to === HOME ? LANE[move.seat](6) : cellOf(move.seat, move.to))

  const showMarkers = (moves, preview) => {
    clearMarkers()

    const seen = new Set()

    moves.forEach(move => {
      const [x, y] = markerSpot(move)
      const key = `${x},${y}`
      if (seen.has(key)) return
      seen.add(key)

      // Chips already on the square that will still be there after the move
      const shared = !move.captures.length && move.to < HOME && game.state.seats.some((seat, i) =>
        seat.active && seat.chips.some((p, c) => {
          if (i === move.seat) return c !== move.chip && p === move.to
          return move.to <= LAST_TRACK && p >= 0 && p <= LAST_TRACK && Engine.square(i, p) === Engine.square(move.seat, move.to)
        }))

      const label = `Move ${move.value}${move.kind === 'home' ? ', reaches home' : ''}${move.captures.length ? ', captures a rival chip' : ''}`
      const marker = h('button', {
        type: 'button',
        class: `dest${move.captures.length ? ' is-capture' : ''}${shared ? ' is-shared' : ''}${preview ? ' is-preview' : ''}`,
        'aria-label': label,
        tabindex: preview ? -1 : 0,
      }, h('span', { text: move.value }))

      place(marker, x, y)
      marker.move = move
      el.pieces.append(marker)
    })
  }

  const paintPick = () => {
    const { state } = game
    const seat = state.turn

    chipEls.forEach((row, i) => row.forEach((node, c) => {
      const movable = !!pick && i === seat && pick.opts.some(move => move.chip === c && (!pick.die || move.die === pick.die))
      node.classList.toggle('can-move', movable)
      node.classList.toggle('is-picked', !!pick && i === seat && pick.chip === c)
      node.disabled = !movable
    }))

    paintDials()

    if (!pick) { clearMarkers(); return }

    const byDie = (move) => !pick.die || move.die === pick.die

    if (pick.chip >= 0) showMarkers(pick.opts.filter(move => move.chip === pick.chip && byDie(move)), false)
    else if (pick.die) showMarkers(pick.opts.filter(byDie), false)
    else if (hoverChip >= 0) showMarkers(pick.opts.filter(move => move.chip === hoverChip), true)
    else clearMarkers()
  }

  const pickMove = (s, opts) => new Promise((resolve, reject) => {
    const off = onCancel(s, () => { pick = null; hoverChip = -1; paintPick(); reject(CANCEL) })

    pick = {
      opts,
      die: null,
      dial: null,
      chip: -1,
      choose: (move) => {
        // Tapping the second spinner of a double marks that one as played
        const played = move.die === 'a' && pick.dial === 'b' ? Object.assign({}, move, { die: 'b' }) : move
        focusOnBoard = el.pieces.contains(document.activeElement)
        pick = null
        hoverChip = -1
        off()
        paintPick()
        resolve(played)
      },
    }

    paintPick()

    if (focusOnBoard) {
      focusOnBoard = false
      const next = $('.chip.can-move', el.pieces)
      if (next) next.focus({ preventScroll: true })
    }
  })

  const tapChip = (chip) => {
    if (!pick) return

    const moves = pick.opts.filter(move => move.chip === chip && (!pick.die || move.die === pick.die))
    if (!moves.length) return

    if (moves.length === 1) { pick.choose(moves[0]); return }

    pick.chip = pick.chip === chip ? -1 : chip
    const seat = game.state.seats[game.state.turn]
    tell(game.state.turn, '', pick.chip >= 0 ? 'Choose where it goes.' : `Tap one of ${possessive(seat)} chips.`, { log: false })
    paintPick()

    // Markers come after the chips in the page, so bring keyboard focus to them
    if (pick.chip >= 0 && el.pieces.contains(document.activeElement)) {
      const marker = $('.dest', el.pieces)
      if (marker) marker.focus({ preventScroll: true })
    }
  }

  const tapDie = (die, dial) => {
    if (!pick || !pick.opts.some(move => move.die === die)) return

    const same = pick.die === die && pick.dial === dial
    pick.die = same ? null : die
    pick.dial = same ? null : dial

    if (pick.die && pick.chip >= 0) {
      const move = pick.opts.find(option => option.chip === pick.chip && option.die === die)
      if (move) { pick.choose(move); return }
      pick.chip = -1
    }

    paintPick()
  }

  const clearPick = () => {
    if (!pick || (pick.chip < 0 && !pick.die)) return
    pick.chip = -1
    pick.die = null
    pick.dial = null
    paintPick()
  }

  // Moving chips

  const hop = (node, lift, time) => {
    if (calm() || !node.firstElementChild.animate) return
    node.firstElementChild.animate({ translate: ['0 0', `0 -${lift}%`, '0 0'] }, { duration: time, easing: 'ease-out' })
  }

  const ring = (x, y) => {
    const node = h('span', { class: 'fx-ring' })
    place(node, x, y)
    el.pieces.append(node)
    setTimeout(() => node.remove(), 700)
  }

  const centreOf = (node) => {
    const box = node.getBoundingClientRect()
    return [box.left + box.width / 2, box.top + box.height / 2]
  }

  const animateMove = async (s, move) => {
    const { state } = game
    const node = chipEls[move.seat][move.chip]
    const quiet = game.demo
    const stepTime = 150 * pace()

    node.classList.add('is-moving')

    if (calm()) {
      layoutChips()
      await sleep(s, 220)
    } else if (move.kind === 'out') {
      const [x, y] = cellOf(move.seat, 0)
      node.style.setProperty('--glide', '.3s')
      place(node, x, y)
      hop(node, 60, 300)
      if (!quiet) Sound.play('out')
      await sleep(s, 320 * pace())
      node.style.removeProperty('--glide')
    } else {
      for (let progress = move.from + 1; progress <= move.to; progress++) {
        const [x, y] = progress === HOME ? LANE[move.seat](6) : cellOf(move.seat, progress)
        place(node, x, y)
        hop(node, 30, stepTime)
        if (!quiet) Sound.play('step', progress - move.from - 1)
        await sleep(s, stepTime)
      }
    }

    if (move.captures.length) {
      const [x, y] = cellOf(move.seat, move.to)
      ring(x, y)
      if (!quiet) {
        Sound.play('capture')
        if (navigator.vibrate) navigator.vibrate(40)
      }

      move.captures.forEach(hit => chipEls[hit.seat][hit.chip].classList.add('is-captured'))
      layoutChips()
      await sleep(s, calm() ? 200 : 520)
      move.captures.forEach(hit => chipEls[hit.seat][hit.chip].classList.remove('is-captured'))
    }

    if (move.kind === 'home' && !quiet) {
      Sound.play('home')
      const [cx, cy] = centreOf(node)
      confetti.burst(cx, cy, [state.seats[move.seat].color, '#f8f3e8', '#e9a23b'], 26)
    }

    node.classList.remove('is-moving')
    layoutChips()
    paintScore()
  }

  // Confetti, for chips reaching home and players finishing

  const confetti = (() => {
    const canvas = el.confetti
    const ctx = canvas.getContext('2d')
    let bits = []
    let frame = 0
    let last = 0

    const fit = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.04)
      last = now

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

      bits = bits.filter(bit => bit.life > 0 && bit.y < window.innerHeight + 40)

      bits.forEach(bit => {
        bit.vy += 900 * dt
        bit.vx *= 0.985
        bit.x += bit.vx * dt
        bit.y += bit.vy * dt
        bit.spin += bit.turn * dt
        bit.life -= dt

        ctx.save()
        ctx.translate(bit.x, bit.y)
        ctx.rotate(bit.spin)
        ctx.globalAlpha = Math.min(1, bit.life * 2)
        ctx.fillStyle = bit.color
        ctx.fillRect(-bit.size / 2, -bit.size / 4, bit.size, bit.size / 2)
        ctx.restore()
      })

      if (bits.length) frame = requestAnimationFrame(tick)
      else { frame = 0; ctx.clearRect(0, 0, window.innerWidth, window.innerHeight) }
    }

    const add = (list) => {
      if (calm()) return
      if (!frame) { fit(); last = performance.now(); frame = requestAnimationFrame(tick) }
      bits.push(...list)
    }

    const bit = (x, y, vx, vy, colors, life) => ({
      x, y, vx, vy, life,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 7,
      spin: Math.random() * 6,
      turn: (Math.random() - 0.5) * 16,
    })

    return {
      burst: (x, y, colors, count) => add(Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2
        const speed = 120 + Math.random() * 300
        return bit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 220, colors, 1 + Math.random() * 0.6)
      })),

      rain: (colors) => add(Array.from({ length: 170 }, () =>
        bit(Math.random() * window.innerWidth, -20 - Math.random() * window.innerHeight * 0.5,
          (Math.random() - 0.5) * 160, 80 + Math.random() * 260, colors, 3 + Math.random() * 1.5))),
    }
  })()

  // The turn loop

  const persist = () => {
    if (game.demo || game.preview) return
    if (game.state.over) store.remove(SAVE_KEY)
    else store.write(SAVE_KEY, game.state)
  }

  const rollText = (dice) => (dice.a === dice.b ? `rolled double ${dice.a}.` : `rolled ${dice.a} and ${dice.b}.`)

  const play = async (s) => {
    const { state } = game

    try {
      while (!state.over) {
        const turn = state.turn
        const seat = state.seats[turn]
        const human = seat.human && !game.demo

        game.fast = !game.demo && !state.seats.some(other => other.active && other.human && !other.place)

        paintTurn()
        paintDials()

        if (!state.dice) {
          if (human) {
            if (isYou(seat)) tell(turn, 'Your turn.', 'Tap Spin.', { log: false })
            else tell(turn, `${seat.name},`, 'your turn. Tap Spin.', { log: false })
            Sound.play('turn')
            await waitForSpin(s)
            Sound.play('press')
          } else {
            tell(turn, seat.name, 'is spinning.', { log: false })
            await sleep(s, 450 * pace())
          }

          Engine.roll(state)
          persist()
          await spinDials(s, state.dice)
          await sleep(s, 260 * pace())
        }

        const dice = Object.assign({}, state.dice)

        while (true) {
          const opts = Engine.options(state)
          if (!opts.length) break

          let move

          if (human) {
            if (!state.moved) tell(turn, subject(seat), rollText(dice), { hint: 'Tap a chip to move it.' })
            else tell(turn, '', `Now play the ${Engine.values(state)[0].value}.`, { log: false })
            move = await pickMove(s, opts)
          } else {
            if (!state.moved) tell(turn, seat.name, rollText(dice))
            await sleep(s, 420 * pace())
            move = Engine.chooseMove(state)
          }

          Engine.applyMove(state, move)
          persist()
          paintDials()
          await animateMove(s, move)

          if (move.captures.length) {
            const rivals = Array.from(new Set(move.captures.map(hit => hit.seat)))
            const whose = rivals.length === 1 ? possessive(state.seats[rivals[0]]) : 'rival'
            const what = move.captures.length === 1 ? `${whose} chip` : `${move.captures.length} ${whose} chips`
            tell(turn, subject(seat), `sent ${what} back to base.`)
            await sleep(s, 650 * pace())
          } else if (move.kind === 'home') {
            tell(turn, subject(seat), `brought a chip home. ${seat.chips.filter(p => p === HOME).length} of 4.`)
            await sleep(s, 500 * pace())
          }
        }

        if (!state.moved) {
          const stuckInBase = seat.chips.every(p => p === BASE || p === HOME)
          tell(turn, subject(seat), `${rollText(dice)} ${stuckInBase ? 'No six, so no chip gets out.' : 'No move.'}`)
          if (!game.demo) Sound.play('pass')
          await sleep(s, (human ? 1500 : 1000) * pace())
        }

        const result = Engine.endTurn(state)
        persist()
        paintScore()

        if (result.won) {
          tell(turn, subject(seat), `finished ${ordinal(seat.place)}.`)
          if (!game.demo) {
            Sound.play('win')
            confetti.rain([seat.color, '#f8f3e8', '#e9a23b'])
            if (navigator.vibrate) navigator.vibrate([60, 60, 120])
          }
          await sleep(s, 1600 * pace())
        }

        if (result.over) break

        if (result.again) {
          tell(turn, `Double ${dice.a}.`, isYou(seat) ? 'Spin again.' : `${seat.name} spins again.`, { log: false })
          if (!game.demo) Sound.play('again')
          await sleep(s, 800 * pace())
        } else {
          await sleep(s, 320 * pace())
        }
      }

      paintTurn()
      paintDials()

      if (game.demo) {
        await sleep(s, 3000)
        startDemo()
      } else {
        showResults()
      }
    } catch (error) {
      if (error !== CANCEL) throw error
    }
  }

  // Putting a game on the table

  const mount = (next) => {
    cancelSession(session)
    session = newSession()
    game = next
    pick = null
    waitingSpin = null
    spinning = false
    hoverChip = -1

    clearMarkers()
    $$('.fx-ring', el.pieces).forEach(node => node.remove())
    chipEls.flat().forEach(node => { node.classList.remove('can-move', 'is-picked', 'is-moving', 'is-captured'); node.disabled = true })
    el.status.replaceChildren()
    el.log.replaceChildren()

    paintSeats()
    layoutChips()
    paintTurn()
    paintDials()

    return session
  }

  const startDemo = () => {
    const setup = defaultSetup()
    setup.seats.forEach((seat, i) => { seat.human = false; if (i === 0) seat.name = 'Sade' })

    let state = Engine.newGame(setup)

    // Skip ahead so visitors arrive mid-game rather than at an empty board
    for (let i = 0; i < 44; i++) {
      if (Engine.autoTurn(state).over) { state = Engine.newGame(setup); i = 0 }
    }

    const s = mount({ state, demo: true })

    // With reduced motion the board stays as a still mid-game position
    if (!calm()) play(s)
  }

  const showPreview = () => {
    const seats = setup.seats.map(seat => Object.assign({}, seat, { active: true }))
    const state = Engine.newGame({ rule: setup.rule, seats })
    state.seats.forEach((seat, i) => { seat.active = setup.seats[i].active })
    mount({ state, preview: true })
  }

  const startGame = (state) => {
    const s = mount({ state, demo: false })
    persist()
    setMode('play')
    play(s)
  }

  const loadSave = () => {
    const saved = store.read(SAVE_KEY)
    const sound = saved && saved.v === 2 && !saved.over && Array.isArray(saved.seats) && saved.seats.length === 4 &&
      saved.seats.every(seat => Array.isArray(seat.chips) && seat.chips.length === 4) &&
      saved.seats[saved.turn] && saved.seats[saved.turn].active
    return sound ? saved : null
  }

  // Games saved by the first version of this page
  const adoptLegacySave = () => {
    let inProgress = false
    try { inProgress = localStorage.getItem('ludo-in-progress') === '1' } catch (e) { }

    const old = store.read('board')
    if (!old) return

    const state = Engine.fromLegacy(old)

    if (state) {
      if (!store.read(SETUP_KEY)) store.write(SETUP_KEY, setupOf(state))
      if (inProgress && !loadSave()) store.write(SAVE_KEY, state)
    }

    store.remove('board')
    store.remove('ludo-in-progress')
  }

  // Modes: title (demo on a tilted board), setup, play

  const setMode = (mode) => {
    const before = el.boardWrap.getBoundingClientRect()

    el.body.dataset.mode = mode
    window.scrollTo(0, 0)

    const after = el.boardWrap.getBoundingClientRect()

    // Slide the board from where it was to where it now sits
    if (before.width && after.width && !calm() && el.boardWrap.animate) {
      const scale = before.width / after.width
      el.boardWrap.animate(
        [{ transform: `translate(${before.left - after.left}px, ${before.top - after.top}px) scale(${scale})` }, { transform: 'none' }],
        { duration: 950, easing: 'cubic-bezier(.2, .8, .2, 1)' })
    }
  }

  const refreshHero = () => {
    const saved = !!loadSave()
    el.continueBtn.hidden = !saved
    el.newBtn.classList.toggle('btn-primary', !saved)
    el.newBtn.classList.toggle('btn-ghost', saved)
    el.setupNote.hidden = !saved
  }

  const goTitle = () => {
    if (el.results.open) el.results.close()
    refreshHero()
    setMode('title')
    startDemo()
  }

  // Setup screen

  let setup = defaultSetup()

  const buildSeats = () => {
    el.seats.replaceChildren(...SEAT_IDS.map((id, i) => {
      const kinds = [['human', 'Human'], ['computer', 'Computer'], ['off', 'Empty']].map(([value, text]) =>
        h('label', {}, h('input', { type: 'radio', name: `kind-${i}`, value }), h('span', { text })))

      const avatars = AVATARS.map((src, n) =>
        h('label', {}, h('input', { type: 'radio', name: `avatar-${i}`, value: src, 'aria-label': `Picture ${n + 1}` }), h('img', { src, alt: '', loading: 'lazy' })))

      const colors = PALETTE.map((color, n) =>
        h('label', { style: `--sw:${color}` }, h('input', { type: 'radio', name: `color-${i}`, value: color, 'aria-label': `Colour ${n + 1}` }), h('span')))

      colors.push(h('label', { class: 'custom', title: 'Any colour' }, h('input', { type: 'color', 'data-custom': i, 'aria-label': 'Any colour' })))

      return h('fieldset', { class: `seat seat-${id}`, 'data-seat': i },
        h('legend', { class: 'visually-hidden', text: CORNERS[i] }),
        h('button', { type: 'button', class: 'seat-face', 'aria-expanded': 'false', 'aria-controls': `seat-more-${i}`, 'aria-label': `${CORNERS[i]}: change picture and colour` },
          h('img', { alt: '' })),
        h('input', { class: 'seat-name', type: 'text', maxlength: 12, autocomplete: 'off', spellcheck: 'false', 'aria-label': `${CORNERS[i]}: name` }),
        h('div', { class: 'seat-kind', role: 'radiogroup', 'aria-label': `${CORNERS[i]}: who plays` }, ...kinds),
        h('div', { class: 'seat-more', id: `seat-more-${i}`, hidden: true },
          h('div', { class: 'avatars', role: 'radiogroup', 'aria-label': 'Picture' }, ...avatars),
          h('div', { class: 'colors', role: 'radiogroup', 'aria-label': 'Chip colour' }, ...colors)))
    }))
  }

  // Writes the setup model into the form, without touching what is being typed
  const paintSetup = () => {
    const seated = setup.seats.filter(seat => seat.active).length

    setup.seats.forEach((seat, i) => {
      const row = $(`.seat[data-seat="${i}"]`, el.seats)
      const kind = !seat.active ? 'off' : seat.human ? 'human' : 'computer'
      const name = $('.seat-name', row)

      row.style.setProperty('--c', seat.color)
      row.classList.toggle('is-off', !seat.active)
      $('.seat-face img', row).src = seat.avatar

      if (document.activeElement !== name) name.value = seat.name
      name.disabled = !seat.active

      $$(`input[name="kind-${i}"]`, row).forEach(input => {
        input.checked = input.value === kind
        // Never fewer than two players
        input.disabled = input.value === 'off' && seat.active && seated <= 2
      })

      $$(`input[name="avatar-${i}"]`, row).forEach(input => { input.checked = input.value === seat.avatar })

      $$(`input[name="color-${i}"]`, row).forEach(input => {
        input.checked = input.value === seat.color
        input.disabled = setup.seats.some((other, j) => j !== i && other.active && other.color === input.value)
      })

      $('input[type="color"]', row).value = seat.color
    })

    $$('input[name="rule"]', el.setup).forEach(input => { input.checked = input.value === setup.rule })
    el.ruleNote.textContent = RULE_NOTES[setup.rule]
  }

  const setupChanged = () => {
    paintSetup()
    store.write(SETUP_KEY, setup)
    showPreview()
  }

  const openSetup = () => {
    if (el.results.open) el.results.close()
    setup = cleanSetup(store.read(SETUP_KEY))
    $$('.seat-more', el.seats).forEach(more => { more.hidden = true })
    $$('.seat-face', el.seats).forEach(face => face.setAttribute('aria-expanded', 'false'))
    refreshHero()
    paintSetup()
    showPreview()
    setMode('setup')
  }

  // Results

  const showResults = () => {
    const { state } = game
    const winner = state.seats[state.winners[0]]

    el.resultsTitle.textContent = isYou(winner) ? 'You win' : `${winner.name} wins`

    el.podium.replaceChildren(...state.winners.map((index, n) => {
      const seat = state.seats[index]
      return h('li', { style: `--c:${seat.color}` },
        h('span', { class: 'rank', text: ordinal(n + 1) }),
        h('img', { src: seat.avatar, alt: '' }),
        h('span', { text: seat.name }))
    }))

    refreshHero()
    el.results.returnValue = ''
    el.results.showModal()
    el.againBtn.focus()
  }

  // Events

  const bind = () => {
    el.newBtn.addEventListener('click', () => { Sound.unlock(); Sound.play('press'); openSetup() })

    el.continueBtn.addEventListener('click', () => {
      const saved = loadSave()
      Sound.unlock()
      Sound.play('press')
      if (saved) startGame(saved)
      else openSetup()
    })

    el.setupBack.addEventListener('click', goTitle)
    el.brand.addEventListener('click', goTitle)
    el.leaveBtn.addEventListener('click', goTitle)

    // On the start screen the whole board is an invitation to play
    el.board.addEventListener('click', (event) => {
      if (el.body.dataset.mode === 'title') { (el.continueBtn.hidden ? el.newBtn : el.continueBtn).click(); return }
      if (!event.target.closest('.chip, .dest')) clearPick()
    })

    el.setup.addEventListener('submit', (event) => {
      event.preventDefault()
      Sound.unlock()
      Sound.play('press')
      setup.seats.forEach(seat => { seat.name = seat.name.trim() || 'Player' })
      store.write(SETUP_KEY, setup)
      startGame(Engine.newGame(setup))
    })

    el.setup.addEventListener('click', (event) => {
      const face = event.target.closest('.seat-face')
      if (!face) return

      const more = $(`#${face.getAttribute('aria-controls')}`)
      const open = more.hidden

      $$('.seat-more', el.seats).forEach(other => { other.hidden = true })
      $$('.seat-face', el.seats).forEach(other => other.setAttribute('aria-expanded', 'false'))

      more.hidden = !open
      face.setAttribute('aria-expanded', String(open))
    })

    el.setup.addEventListener('input', (event) => {
      const input = event.target
      const row = input.closest('.seat')

      if (input.name === 'rule') { setup.rule = input.value; setupChanged(); return }
      if (!row) return

      const seat = setup.seats[Number(row.dataset.seat)]

      if (input.classList.contains('seat-name')) seat.name = input.value.slice(0, 12)
      else if (input.name.startsWith('kind-')) { seat.active = input.value !== 'off'; if (seat.active) seat.human = input.value === 'human' }
      else if (input.name.startsWith('avatar-')) seat.avatar = input.value
      else if (input.name.startsWith('color-') || input.type === 'color') seat.color = input.value.toLowerCase()

      setupChanged()
    })

    el.spin.addEventListener('click', () => { if (waitingSpin) waitingSpin() })

    Object.entries(el.dials).forEach(([key, dial]) => {
      dial.addEventListener('click', () => {
        if (waitingSpin) waitingSpin()
        else tapDie(dialDie(key), key)
      })
    })

    el.sum.addEventListener('click', () => tapDie('sum', 'sum'))

    el.pieces.addEventListener('click', (event) => {
      const marker = event.target.closest('.dest')
      if (marker && pick) { pick.choose(marker.move); return }

      const chip = event.target.closest('.chip')
      if (chip && Number(chip.dataset.seat) === game.state.turn) tapChip(Number(chip.dataset.chip))
    })

    if (canHover) {
      el.pieces.addEventListener('pointerover', (event) => {
        const chip = event.target.closest('.chip.can-move')
        const next = chip ? Number(chip.dataset.chip) : -1
        if (next === hoverChip || !pick) return
        hoverChip = next
        if (pick.chip < 0 && !pick.die) paintPick()
      })

      el.pieces.addEventListener('pointerleave', () => {
        if (hoverChip < 0 || !pick) return
        hoverChip = -1
        if (pick.chip < 0 && !pick.die) paintPick()
      })
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') clearPick()

      const idle = !document.activeElement || document.activeElement === el.body
      if ((event.key === ' ' || event.key === 'Enter') && waitingSpin && idle && !el.rules.open) {
        event.preventDefault()
        waitingSpin()
      }
    })

    el.soundBtn.addEventListener('click', () => {
      Sound.setOn(!Sound.isOn())
      el.soundBtn.setAttribute('aria-pressed', String(Sound.isOn()))
      Sound.play('press')
    })

    el.rulesBtn.addEventListener('click', () => {
      const rule = el.body.dataset.mode === 'play' ? game.state.rule : el.body.dataset.mode === 'setup' ? setup.rule : ''
      el.rulesSafe.textContent = {
        special: 'In this game a chip on a star or a start square is safe.',
        nowhere: 'In this game no square is safe.',
        anywhere: 'In this game capturing is switched off, so every square is safe.',
      }[rule] || 'You choose which squares are safe when you set up a game.'
      el.rules.showModal()
    })

    // Click on the dimmed backdrop closes a sheet
    ;[el.rules].forEach(sheet => sheet.addEventListener('click', (event) => { if (event.target === sheet) sheet.close() }))

    el.againBtn.addEventListener('click', () => {
      const next = Engine.newGame(setupOf(game.state))
      el.results.close('again')
      startGame(next)
    })

    el.changeBtn.addEventListener('click', () => { el.results.close('change'); openSetup() })

    // Escape on the results sheet goes back to the start screen
    el.results.addEventListener('close', () => { if (!el.results.returnValue && el.body.dataset.mode === 'play') goTitle() })
  }

  const init = () => {
    drawBoard()
    drawDial(el.dials.a)
    drawDial(el.dials.b)
    el.pieces.append(...chipEls.flat())
    buildSeats()

    adoptLegacySave()
    setup = cleanSetup(store.read(SETUP_KEY))

    el.soundBtn.setAttribute('aria-pressed', String(Sound.isOn()))

    bind()
    refreshHero()
    startDemo()

    // One entrance, on first load only: the board is set down on the table
    el.body.classList.add('is-arriving')
    setTimeout(() => el.body.classList.remove('is-arriving'), 1400)
  }

  init()
})()
