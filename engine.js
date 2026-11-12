// Ludo rules: pure functions over a plain state object. No DOM in here, so it
// runs in the browser (window.LudoEngine) and in Node (tests/engine.test.js).
;(function (root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.LudoEngine = api
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  const SEAT_IDS = ['A', 'B', 'C', 'D']

  // Track squares are numbered 1 to 52. Each seat enters on its start square,
  // walks 50 squares round to its home entrance, then 5 home squares and the centre.
  const START = [2, 15, 28, 41]
  const STAR_SQUARES = [10, 23, 36, 49]
  const SAFE_SQUARES = new Set([...START, ...STAR_SQUARES])

  // A chip's position is its progress: -1 in base, 0 on the start square,
  // 50 on the last track square, 51 to 55 in the home column, 56 home.
  const BASE = -1
  const LAST_TRACK = 50
  const HOME = 56

  const RULES = ['special', 'nowhere', 'anywhere']

  const clone = (value) => JSON.parse(JSON.stringify(value))

  const square = (seat, progress) =>
    progress < 0 || progress > LAST_TRACK ? 0 : ((START[seat] - 1 + progress) % 52) + 1

  const isSafe = (state, sq) =>
    state.rule === 'anywhere' || (state.rule === 'special' && SAFE_SQUARES.has(sq))

  const newGame = (setup) => {
    const seats = SEAT_IDS.map((id, i) => {
      const source = (setup.seats && setup.seats[i]) || {}
      return {
        id,
        active: !!source.active,
        human: !!source.human,
        name: String(source.name || `Player ${i + 1}`).slice(0, 16),
        color: source.color || '#888888',
        avatar: source.avatar || '',
        chips: [BASE, BASE, BASE, BASE],
        place: 0,
      }
    })

    const first = seats.findIndex(seat => seat.active)

    if (seats.filter(seat => seat.active).length < 2) throw new Error('Ludo needs at least two players')

    return {
      v: 2,
      rule: RULES.includes(setup.rule) ? setup.rule : 'special',
      seats,
      turn: first,
      dice: null,
      moved: false,
      winners: [],
      over: false,
      turns: 0,
    }
  }

  const roll = (state, rng = Math.random) => {
    const spin = () => Math.floor(rng() * 6) + 1
    state.dice = { a: spin(), b: spin(), usedA: false, usedB: false }
    state.moved = false
    return state.dice
  }

  // The numbers the current player may still play: each unused spinner, and
  // their sum while neither has been used.
  const values = (state) => {
    const dice = state.dice
    if (!dice) return []

    const list = []
    if (!dice.usedA) list.push({ die: 'a', value: dice.a })
    // On a double the two spinners are interchangeable, so offer only one
    if (!dice.usedB && !(dice.a === dice.b && !dice.usedA)) list.push({ die: 'b', value: dice.b })
    if (!dice.usedA && !dice.usedB) list.push({ die: 'sum', value: dice.a + dice.b })
    return list
  }

  const capturesAt = (state, seat, progress) => {
    const sq = square(seat, progress)
    if (!sq || isSafe(state, sq)) return []

    const hits = []
    state.seats.forEach((other, i) => {
      if (i === seat || !other.active) return
      other.chips.forEach((p, chip) => { if (square(i, p) === sq) hits.push({ seat: i, chip }) })
    })
    return hits
  }

  // Every legal move for the current player with the numbers still in hand
  const options = (state) => {
    if (state.over || !state.dice) return []

    const seat = state.turn
    const list = []

    values(state).forEach(({ die, value }) => {
      state.seats[seat].chips.forEach((progress, chip) => {
        let to
        let kind

        if (progress === BASE) {
          // Only a spinner showing 6 lets a chip out; the sum never does
          if (die === 'sum' || value !== 6) return
          to = 0
          kind = 'out'
        } else {
          to = progress + value
          if (progress === HOME || to > HOME) return
          kind = to === HOME ? 'home' : 'move'
        }

        list.push({ seat, chip, die, value, from: progress, to, kind, captures: capturesAt(state, seat, to) })
      })
    })

    return list
  }

  const applyMove = (state, move) => {
    const dice = state.dice

    state.seats[move.seat].chips[move.chip] = move.to
    move.captures.forEach(hit => { state.seats[hit.seat].chips[hit.chip] = BASE })

    if (move.die === 'a' || move.die === 'sum') dice.usedA = true
    if (move.die === 'b' || move.die === 'sum') dice.usedB = true

    state.moved = true
    return move
  }

  const remaining = (state) => state.seats
    .map((seat, i) => ({ seat, i }))
    .filter(({ seat }) => seat.active && !seat.place)

  // Closes the current turn: records a finish, ends the game when one player
  // is left, and hands the spinners on (or back, after a double).
  const endTurn = (state) => {
    const seat = state.seats[state.turn]
    const dice = state.dice
    const result = { seat: state.turn, won: false, over: false, again: false, last: -1 }

    if (!seat.place && seat.chips.every(p => p === HOME)) {
      state.winners.push(state.turn)
      seat.place = state.winners.length
      result.won = true
    }

    const left = remaining(state)

    if (left.length <= 1) {
      if (left.length === 1) {
        state.winners.push(left[0].i)
        left[0].seat.place = state.winners.length
        result.last = left[0].i
      }
      state.over = true
      state.dice = null
      result.over = true
      return result
    }

    result.again = !!dice && dice.a === dice.b && !result.won

    if (!result.again) {
      let next = state.turn
      do { next = (next + 1) % 4 } while (!state.seats[next].active || state.seats[next].place)
      state.turn = next
    }

    state.dice = null
    state.moved = false
    state.turns++
    return result
  }

  // Computer player: looks at every way to play the whole turn and keeps the best

  const evaluate = (state, me) => {
    let score = 0

    state.seats.forEach((seat, i) => {
      if (!seat.active) return
      seat.chips.forEach(p => {
        const worth = p < 0 ? 0 : 12 + p + (p === HOME ? 30 : 0)
        score += i === me ? worth : -worth * 0.55
      })
    })

    state.seats[me].chips.forEach(p => {
      if (p < 0 || p > LAST_TRACK) return

      const sq = square(me, p)
      if (isSafe(state, sq)) { score += 4; return }

      let risk = 0
      state.seats.forEach((rival, j) => {
        if (j === me || !rival.active || rival.place) return
        rival.chips.forEach(q => {
          if (q < 0) { if (sq === START[j]) risk += 0.25; return }
          if (q > LAST_TRACK) return
          const gap = (sq - square(j, q) + 52) % 52
          if (gap >= 1 && gap <= 12 && q + gap <= LAST_TRACK) risk += gap <= 6 ? 0.3 : 0.14
        })
      })

      score -= Math.min(risk, 0.9) * (12 + p)
    })

    return score
  }

  const chooseMove = (state, rng = Math.random) => {
    const me = state.turn
    let best = null
    let bestScore = -Infinity

    options(state).forEach(first => {
      const afterFirst = clone(state)
      applyMove(afterFirst, first)

      const followUps = options(afterFirst)
      let score

      if (!followUps.length) {
        score = evaluate(afterFirst, me)
      } else {
        score = Math.max(...followUps.map(second => {
          const afterSecond = clone(afterFirst)
          applyMove(afterSecond, second)
          return evaluate(afterSecond, me)
        }))
      }

      score += rng() * 1.5

      if (score > bestScore) { bestScore = score; best = first }
    })

    return best
  }

  // Plays one whole turn for the current seat with no animation (demo warm-up, tests)
  const autoTurn = (state, rng = Math.random) => {
    roll(state, rng)
    let move
    while ((move = chooseMove(state, rng))) applyMove(state, move)
    return endTurn(state)
  }

  // Saves written by the first version of the game ({ players, gameSafe, ... })
  const fromLegacy = (old) => {
    if (!old || !Array.isArray(old.players) || old.players.length !== 4) return null

    const seats = old.players.map((player, i) => {
      const avatar = /images\/avatar\/avatar\d+\.png/.exec(String(player.avatar || ''))
      return {
        active: player.playing !== false,
        human: !!player.isHuman,
        name: player.name,
        color: player.color,
        avatar: avatar ? avatar[0] : '',
      }
    })

    if (seats.filter(seat => seat.active).length < 2) return null

    const state = newGame({ rule: old.gameSafe, seats })

    old.players.forEach((player, i) => {
      (player.chips || []).slice(0, 4).forEach((chip, c) => {
        let progress = BASE
        const where = String(chip.location)

        if (chip.finished) progress = HOME
        else if (!chip.started || where === 'holder') progress = BASE
        else if (/^[A-D]-[1-6]$/.test(where)) progress = LAST_TRACK + Number(where[2])
        else if (Number(where) >= 1 && Number(where) <= 52) progress = (Number(where) - START[i] + 52) % 52

        state.seats[i].chips[c] = progress
      })
    })

    ;(old.winners || []).forEach(name => {
      const i = state.seats.findIndex(seat => seat.active && !seat.place && seat.name === name)
      if (i >= 0) { state.winners.push(i); state.seats[i].place = state.winners.length }
    })

    const turn = old.players.findIndex(player => player.turn && player.playing !== false)
    if (turn >= 0 && !state.seats[turn].place) state.turn = turn
    else state.turn = state.seats.findIndex(seat => seat.active && !seat.place)

    if (state.turn < 0 || remaining(state).length < 2) return null

    return state
  }

  return {
    SEAT_IDS, START, STAR_SQUARES, BASE, LAST_TRACK, HOME, RULES,
    clone, square, isSafe, newGame, roll, values, options, applyMove, endTurn,
    chooseMove, autoTurn, fromLegacy,
  }
})
