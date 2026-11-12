// Run with: node --test
const test = require('node:test')
const assert = require('node:assert/strict')
const Ludo = require('../engine.js')

const seats = (count = 4) => [0, 1, 2, 3].map(i => ({
  active: i < count, human: false, name: `P${i + 1}`, color: '#000000', avatar: '',
}))

const game = (rule = 'special', count = 4) => Ludo.newGame({ rule, seats: seats(count) })

const setDice = (state, a, b) => { state.dice = { a, b, usedA: false, usedB: false } }

// Small deterministic generator so failures can be replayed
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

test('each seat walks from its start square to its home entrance', () => {
  assert.equal(Ludo.square(0, 0), 2)
  assert.equal(Ludo.square(0, 50), 52)
  assert.equal(Ludo.square(1, 0), 15)
  assert.equal(Ludo.square(1, 50), 13)
  assert.equal(Ludo.square(2, 50), 26)
  assert.equal(Ludo.square(3, 50), 39)
  assert.equal(Ludo.square(0, 51), 0, 'home column is off the shared track')
  assert.equal(Ludo.square(0, -1), 0, 'base is off the shared track')
})

test('a chip leaves base only with a spinner showing 6, never with the sum', () => {
  const state = game()

  setDice(state, 2, 4)
  assert.deepEqual(Ludo.options(state), [])

  setDice(state, 6, 3)
  const moves = Ludo.options(state)
  assert.equal(moves.length, 4)
  assert.ok(moves.every(move => move.kind === 'out' && move.die === 'a' && move.to === 0))
})

test('either number or their sum can move a chip on the track', () => {
  const state = game()
  state.seats[0].chips = [10, -1, -1, -1]

  setDice(state, 3, 4)
  assert.deepEqual(Ludo.options(state).map(move => [move.die, move.to]), [['a', 13], ['b', 14], ['sum', 17]])
})

test('using one spinner leaves the other; using the sum uses both', () => {
  const state = game()
  state.seats[0].chips = [10, -1, -1, -1]
  setDice(state, 3, 4)

  Ludo.applyMove(state, Ludo.options(state).find(move => move.die === 'a'))
  assert.deepEqual(Ludo.values(state), [{ die: 'b', value: 4 }])

  setDice(state, 3, 4)
  Ludo.applyMove(state, Ludo.options(state).find(move => move.die === 'sum'))
  assert.deepEqual(Ludo.values(state), [])
})

test('a double offers one spinner at a time, then the other', () => {
  const state = game()
  state.seats[0].chips = [10, -1, -1, -1]
  setDice(state, 5, 5)

  assert.deepEqual(Ludo.values(state), [{ die: 'a', value: 5 }, { die: 'sum', value: 10 }])

  Ludo.applyMove(state, Ludo.options(state).find(move => move.die === 'a'))
  assert.deepEqual(Ludo.values(state), [{ die: 'b', value: 5 }])
})

test('a chip cannot overshoot the centre', () => {
  const state = game()
  state.seats[0].chips = [53, -1, -1, -1]

  setDice(state, 4, 5)
  assert.deepEqual(Ludo.options(state), [])

  setDice(state, 3, 1)
  const moves = Ludo.options(state)
  assert.deepEqual(moves.map(move => [move.die, move.to, move.kind]), [['a', 56, 'home'], ['b', 54, 'move']])
})

test('landing on a rival sends it back to base, except on safe squares', () => {
  // Seat B starts on square 15, so progress 5 is square 20 (not a star)
  const open = game('special')
  open.seats[0].chips = [15, -1, -1, -1]   // square 17
  open.seats[1].chips = [5, 5, -1, -1]     // two chips on square 20
  setDice(open, 3, 1)

  const hit = Ludo.options(open).find(move => move.die === 'a')
  assert.equal(hit.captures.length, 2)
  Ludo.applyMove(open, hit)
  assert.deepEqual(open.seats[1].chips, [-1, -1, -1, -1])

  // Square 23 is a star: safe under the star rule, open under "nowhere"
  const onStar = (rule) => {
    const state = game(rule)
    state.seats[0].chips = [18, -1, -1, -1]  // square 20
    state.seats[1].chips = [8, -1, -1, -1]   // square 23
    setDice(state, 3, 1)
    return Ludo.options(state).find(move => move.die === 'a').captures.length
  }

  assert.equal(onStar('special'), 0)
  assert.equal(onStar('nowhere'), 1)
  assert.equal(onStar('anywhere'), 0)
})

test('a double earns another turn; otherwise play passes to the next seat', () => {
  const state = game('special', 3)

  setDice(state, 4, 4)
  assert.equal(Ludo.endTurn(state).again, true)
  assert.equal(state.turn, 0)

  setDice(state, 4, 2)
  assert.equal(Ludo.endTurn(state).again, false)
  assert.equal(state.turn, 1)

  setDice(state, 1, 2)
  Ludo.endTurn(state)
  setDice(state, 1, 2)
  Ludo.endTurn(state)
  assert.equal(state.turn, 0, 'empty seat D is skipped')
})

test('bringing the last chip home places the player and ends a two-player game', () => {
  const state = game('special', 2)
  state.seats[0].chips = [56, 56, 56, 54]
  setDice(state, 2, 5)

  Ludo.applyMove(state, Ludo.options(state).find(move => move.kind === 'home'))
  const result = Ludo.endTurn(state)

  assert.equal(result.won, true)
  assert.equal(result.over, true)
  assert.deepEqual(state.winners, [0, 1])
  assert.equal(state.seats[0].place, 1)
  assert.equal(state.seats[1].place, 2)
})

test('the computer takes a capture when one is on offer', () => {
  const state = game('nowhere')
  state.seats[0].chips = [15, 3, -1, -1]
  state.seats[1].chips = [5, -1, -1, -1]   // 3 squares ahead of the first chip
  setDice(state, 3, 2)

  const move = Ludo.chooseMove(state, () => 0)
  assert.equal(move.captures.length, 1)
})

test('computer-only games always finish with every player placed', () => {
  for (const rule of Ludo.RULES) {
    for (let count = 2; count <= 4; count++) {
      for (let seed = 1; seed <= 12; seed++) {
        const rng = seeded(seed * 7919 + count)
        const state = game(rule, count)
        let turns = 0

        while (!state.over) {
          Ludo.autoTurn(state, rng)
          assert.ok(++turns < 20000, `game ran away (${rule}, ${count} players, seed ${seed})`)

          state.seats.forEach(seat => seat.chips.forEach(p => assert.ok(p >= -1 && p <= 56)))
        }

        assert.equal(state.winners.length, count)
        assert.equal(new Set(state.winners).size, count)
      }
    }
  }
})

test('saves from the first version of the game are carried over', () => {
  const chip = (started, finished, location) => ({ started, finished, location })
  const old = {
    gameSafe: 'nowhere',
    winners: [],
    players: [
      { name: 'Ann', color: '#2b62c4', avatar: 'http://x.test/images/avatar/avatar03.png', isHuman: true, playing: true, turn: false,
        chips: [chip(true, false, 52), chip(true, false, 'A-3'), chip(true, true, 'A-6'), chip(false, false, 'holder')] },
      { name: 'Ben', color: '#2e8b57', avatar: 'images/avatar/avatar06.png', isHuman: false, playing: true, turn: true,
        chips: [chip(true, false, 13), chip(true, false, 15), chip(false, false, 'holder'), chip(false, false, 'holder')] },
      { name: 'Cy', color: '#e9a23b', avatar: '', isHuman: false, playing: false, turn: false, chips: [] },
      { name: 'Di', color: '#c0392b', avatar: '', isHuman: false, playing: false, turn: false, chips: [] },
    ],
  }

  const state = Ludo.fromLegacy(old)

  assert.equal(state.rule, 'nowhere')
  assert.equal(state.turn, 1)
  assert.deepEqual(state.seats[0].chips, [50, 53, 56, -1])
  assert.deepEqual(state.seats[1].chips, [50, 0, -1, -1])
  assert.equal(state.seats[0].avatar, 'images/avatar/avatar03.png')
  assert.equal(state.seats[2].active, false)

  assert.equal(Ludo.fromLegacy(null), null)
  assert.equal(Ludo.fromLegacy({ players: [] }), null)
})
