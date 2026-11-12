# Ludo

A browser Ludo board game for 2 to 4 players, built with plain HTML, CSS and JavaScript. No build step, no dependencies.

![Ludo mid-game](docs/screenshot.png)

## Features

- 2, 3 or 4 players, each corner human, computer or empty
- One setup screen: name, picture and chip colour per player, with a live preview on the board
- Two spinners per turn; play each number or both as one
- Tap a chip to see where it can land, then tap the square; captures are marked before you commit
- Chips hop square by square, captured chips fly back to base, and the board is never covered
- Three safe-square rules: stars are safe, nowhere is safe, or no capturing
- Computer players that weigh captures, safety and progress over the whole turn
- Table sounds made in the browser (no audio files), with a mute button
- Game saved after every move; resume with Continue game
- Layouts for phones, sideways phones, tablets and wide screens; keyboard playable; respects reduced motion

## Rules in short

1. Spin both spinners. A 6 on either one lets a chip out of base.
2. Move one chip by each number, or a single chip by the two added together.
3. Land on a rival chip outside a safe square to send it back to base.
4. A double (same number on both spinners) gives you another turn.
5. A chip needs the exact count, or less, to reach the centre. Bring all four home to finish. The game ends when one player is left.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

Any static file server works.

## Tests

The rules are plain functions with no DOM, tested with Node's built-in runner:

```sh
node --test
```

## Project structure

```
index.html      page markup, SEO metadata
style.css       table, board, spinners, setup and layouts
engine.js       rules and the computer player (no DOM)
app.js          drawing the board, the turn loop, setup and saving
sound.js        synthesised table sounds
icons.css       the five footer icons
tests/          engine tests
images/         avatars and social preview
docs/           README screenshot and the earlier overhaul plan
manifest.json   web app manifest
```

After changing a stylesheet or script, bump the `?v=` number on its tag in `index.html` so returning visitors get the new file.

## License

MIT, see [LICENSE](LICENSE).
