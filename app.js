// App Controller
const Application = (function (UICtrl, APICtrl, GlobalCtrl, SpecialCtrl, WebSocketCtrl, MessageCtrl) {

  const UIVars = {

    // Board Styles
    styleA: UICtrl.findElement('#board-colors-A'),
    styleB: UICtrl.findElement('#board-colors-B'),
    styleC: UICtrl.findElement('#board-colors-C'),
    styleD: UICtrl.findElement('#board-colors-D'),
    styleBBM: UICtrl.findElement('#board-colors-BBM'),


    // Player Bases
    baseA: UICtrl.findElement('.base-A'),
    baseAName: UICtrl.findElement('.base-A .player-name'),
    baseAText: UICtrl.findElement('.base-A .player-text'),

    baseB: UICtrl.findElement('.base-B'),
    baseBName: UICtrl.findElement('.base-B .player-name'),
    baseBText: UICtrl.findElement('.base-B .player-text'),

    baseC: UICtrl.findElement('.base-C'),
    baseCName: UICtrl.findElement('.base-C .player-name'),
    baseCText: UICtrl.findElement('.base-C .player-text'),

    baseD: UICtrl.findElement('.base-D'),
    baseDName: UICtrl.findElement('.base-D .player-name'),
    baseDText: UICtrl.findElement('.base-D .player-text'),

    board: UICtrl.findElement('.board'),
    boardMessage: UICtrl.findElement('.BBM-board-text'),
    boardHolder: UICtrl.findElement('.board-holder'),
    boardMessageValues: UICtrl.findElement('.BBM-board-values'),
    dieBtnHolder: UICtrl.findElement('.die-btn-hol'),
    dieSpinner: UICtrl.findElement('.die-spinner'),


    // Die Spinners
    leftSpinner: UICtrl.findElement('.left-spinner'),
    rightSpinner: UICtrl.findElement('.right-spinner'),

    // Input
    startGame: UICtrl.findElement('.start-game'),

    welcomePhase: UICtrl.findElement('.welcome-phase'),
    numberPlayersPhase: UICtrl.findElement('.number-players-phase'),
    playerInputPhase: UICtrl.findElement('.player-input-phase'),
    safeSpotPhase: UICtrl.findElement('.safe-spot-phase'),

    newGame: UICtrl.findElement('#new-game'),
    continueGame: UICtrl.findElement('#continue-game'),

    numbPlytwo: UICtrl.findElement('#nx-two'),
    numbPlythree: UICtrl.findElement('#nx-three'),
    numbPlyfour: UICtrl.findElement('#nx-four'),
    numbPlynext: UICtrl.findElement('#numb-ply-next'),

    playerImage: UICtrl.findElement('#player-image'),
    playerName: UICtrl.findElement('#player-name'),
    playerColor: UICtrl.findElement('#player-color'),
    isHuman: UICtrl.findElement('#isHuman'),
    plyInpNext: UICtrl.findElement('#ply-inp-next'),

    gameSEspe: UICtrl.findElement('#nxsafe-spe'),
    gameSEany: UICtrl.findElement('#nxsafe-any'),
    gameSEnow: UICtrl.findElement('#nxsafe-now'),
    startGameX: UICtrl.findElement('#start-game'),

    // Links
    linkNew: UICtrl.findElement('#link-new'),
    linkExit: UICtrl.findElement('#link-exit'),

    live: UICtrl.findElement('#game-live'),

  }

  let sizeBound = false

  const sizeEvents = function () {

    const holder = UICtrl.UIVars.boardHolder

    // Clear sizes left over from earlier layouts (resize while the menu was open)
    holder.style.height = null
    holder.style.maxHeight = null
    holder.style.width = null
    holder.style.maxWidth = null

    SpecialCtrl.OSmallAspect(holder, (15 / 16))

    SpecialCtrl.OHeightAspect(UIVars.leftSpinner, 1)

    SpecialCtrl.OHeightAspect(UIVars.rightSpinner, 1)

    // Resize listeners are bound only once
    if (sizeBound) return

    sizeBound = true

    SpecialCtrl.smallAspect(holder, (15 / 16))

    SpecialCtrl.heightAspect(UIVars.leftSpinner, 1)

    SpecialCtrl.heightAspect(UIVars.rightSpinner, 1)

  }

  const PROGRESS_KEY = 'ludo-in-progress'

  const isGameInProgress = () => {

    try { return StorageCtrl.retreiveData(PROGRESS_KEY) === '1' } catch (e) { return false }

  }

  const setGameInProgress = (value) => {

    try { StorageCtrl.storeData(PROGRESS_KEY, value ? '1' : '0') } catch (e) { }

    refreshContinue()

  }

  const refreshContinue = () => {

    const can = isGameInProgress()

    UIVars.continueGame.disabled = !can

    UIVars.continueGame.title = can ? '' : 'No saved game yet'

  }

  // Asks before leaving a running game (uses the existing message system)
  const confirmLeave = (message, onYes) => {

    const boardVisible = UIVars.boardHolder.classList.contains('show')

    if (!boardVisible || !isGameInProgress()) { onYes(); return }

    const box = document.createElement('div')

    box.className = 'confirm-box'

    box.innerHTML = `<p>${message}</p><div class="confirm-actions"><button type="button" class="stay">Keep playing</button><button type="button" class="primary leave">Leave</button></div>`

    box.querySelector('.stay').addEventListener('click', () => MessageCtrl.removeNormalMessage())

    box.querySelector('.leave').addEventListener('click', () => { MessageCtrl.removeNormalMessage(); onYes() })

    MessageCtrl.sendNormalMessage(box)

    box.querySelector('.stay').focus()

  }

  const entryEvents = () => {

    refreshContinue()

    const allPhase = [
      UIVars.welcomePhase,
      UIVars.numberPlayersPhase,
      UIVars.playerInputPhase,
      UIVars.safeSpotPhase
    ]

    const goNew = async () => {

      BoardCtrl.boardToggle(false)

      UICtrl.addClass(UIVars.startGame, 'show')

      UICtrl.removeClass(UIVars.boardHolder, 'show')

      allPhase.forEach(item => UICtrl.removeClass(item, 'show'))

      UICtrl.addClass(UIVars.numberPlayersPhase, 'show')

      let boardData = await BoardCtrl.fetchOriginalData()

      boardData.players.forEach((player, index) => {

        if (index == 2) {

          if (player.playing == false) {

            UIVars.numbPlytwo.checked = true

          }

        } else if (index == 3) {

          if (player.playing == false) {

            if (boardData.players[2].playing == false) {

              UIVars.numbPlytwo.checked = true

            } else {

              UIVars.numbPlythree.checked = true

            }


          } else {

            UIVars.numbPlyfour.checked = true

          }

          if (UIVars.numbPlytwo.checked || UIVars.numbPlythree.checked) {

            player.playing = false

          }

        }

      })

      BoardCtrl.setData(boardData)

      BoardCtrl.saveData()

    }

    UIVars.linkNew.addEventListener('click', e => {

      e.preventDefault()

      confirmLeave('A game is in progress. Start a new game? Your current game stays saved until you begin the new one.', goNew)

    })

    const goExit = async () => {

      BoardCtrl.boardToggle(false)

      UICtrl.addClass(UIVars.startGame, 'show')

      UICtrl.removeClass(UIVars.boardHolder, 'show')

      allPhase.forEach(item => UICtrl.removeClass(item, 'show'))

      UICtrl.addClass(UIVars.welcomePhase, 'show')

      refreshContinue()

    }

    UIVars.linkExit.addEventListener('click', e => {

      e.preventDefault()

      confirmLeave('Leave the game and return to the menu? You can pick up where you left off with Continue Game.', goExit)

    })

    UIVars.newGame.addEventListener('click', async e => {

      UICtrl.addClass(UIVars.startGame, 'show')

      allPhase.forEach(item => UICtrl.removeClass(item, 'show'))

      UICtrl.addClass(UIVars.numberPlayersPhase, 'show')

      let boardData = await BoardCtrl.fetchOriginalData()

      boardData.players.forEach((player, index) => {

        if (index == 2) {

          if (player.playing == false) {

            UIVars.numbPlytwo.checked = true

          }

        } else if (index == 3) {

          if (player.playing == false) {

            if (boardData.players[2].playing == false) {

              UIVars.numbPlytwo.checked = true

            } else {

              UIVars.numbPlythree.checked = true

            }


          } else {

            UIVars.numbPlyfour.checked = true

          }

          if (UIVars.numbPlytwo.checked || UIVars.numbPlythree.checked) {

            player.playing = false

          }

        }

      })

      BoardCtrl.setData(boardData)

      BoardCtrl.saveData()

    })

    UIVars.continueGame.addEventListener('click', e => {

      UICtrl.removeClass(UIVars.startGame, 'show')

      allPhase.forEach(item => UICtrl.removeClass(item, 'show'))

      UICtrl.addClass(UIVars.boardHolder, 'show')

      sizeEvents()

      BoardCtrl.boardToggle(true)

      BoardCtrl.configureTheGame()

    })

    UIVars.playerColor.addEventListener('input', e => {

      e.currentTarget.parentElement.style.backgroundColor = e.target.value

      UIVars.playerImage.parentElement.style.backgroundColor = e.target.value

    })

    UIVars.playerImage.addEventListener('keydown', e => {

      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); UIVars.playerImage.click() }

    })

    UIVars.playerImage.addEventListener('click', e => {

      const avatarList = [
        "images/avatar/avatar01.png",
        "images/avatar/avatar02.png",
        "images/avatar/avatar03.png",
        "images/avatar/avatar04.png",
        "images/avatar/avatar05.png",
        "images/avatar/avatar06.png",
        "images/avatar/avatar07.png",
        "images/avatar/avatar08.png",
        "images/avatar/avatar09.png",
        "images/avatar/avatar10.png",
        "images/avatar/avatar11.png",
        "images/avatar/avatar12.png",
        "images/avatar/avatar13.png",
        "images/avatar/avatar14.png",
      ]

      e.currentTarget.src = SpecialCtrl.chooseFrom(avatarList)

    })

    UIVars.numbPlytwo.addEventListener('input', async e => {

      let boardData = await BoardCtrl.fetchOriginalData()

      boardData.players[2].playing = false

      boardData.players[3].playing = false

      BoardCtrl.setData(boardData)

      BoardCtrl.saveData()

    })

    UIVars.numbPlythree.addEventListener('input', async e => {

      let boardData = await BoardCtrl.fetchOriginalData()

      boardData.players[2].playing = true

      boardData.players[3].playing = false

      BoardCtrl.setData(boardData)

      BoardCtrl.saveData()

    })

    UIVars.numbPlyfour.addEventListener('input', async e => {

      let boardData = await BoardCtrl.fetchOriginalData()

      boardData.players[2].playing = true

      boardData.players[3].playing = true

      BoardCtrl.setData(boardData)

      BoardCtrl.saveData()

    })

    UIVars.numbPlynext.addEventListener('click', async e => {

      UICtrl.addClass(UIVars.startGame, 'show')

      allPhase.forEach(item => UICtrl.removeClass(item, 'show'))

      UICtrl.addClass(UIVars.playerInputPhase, 'show')

      UIVars.playerInputPhase.dataset.currentplayer = 0


      let boardData = await BoardCtrl.fetchOriginalData()

      const currentPlayer = parseInt(UIVars.playerInputPhase.dataset.currentplayer)

      UIVars.playerImage.src = boardData.players[currentPlayer].avatar

      UIVars.playerName.value = boardData.players[currentPlayer].name

      UIVars.playerColor.value = boardData.players[currentPlayer].color

      UIVars.playerColor.parentElement.style.backgroundColor = boardData.players[currentPlayer].color

      UIVars.playerImage.parentElement.style.backgroundColor = boardData.players[currentPlayer].color

      UIVars.isHuman.checked = boardData.players[currentPlayer].isHuman

      UIVars.playerInputPhase.dataset.currentplayer = 0

      if (boardData.gameSafe == 'special') {

        UIVars.gameSEspe.checked = true

      } else if (boardData.gameSafe == 'nowhere') {

        UIVars.gameSEnow.checked = true

      } else {

        UIVars.gameSEany.checked = true

      }


    })

    UIVars.plyInpNext.addEventListener('click', async e => {

      let boardData = await BoardCtrl.fetchOriginalData()

      let currentPlayer = parseInt(UIVars.playerInputPhase.dataset.currentplayer)

      const savePreviousPlayer = () => {

        boardData.players[currentPlayer].avatar = UIVars.playerImage.src

        boardData.players[currentPlayer].name = UIVars.playerName.value

        boardData.players[currentPlayer].color = UIVars.playerColor.value

        boardData.players[currentPlayer].isHuman = UIVars.isHuman.checked

        BoardCtrl.setData(boardData)

        BoardCtrl.saveData()

      }

      savePreviousPlayer()

      if (currentPlayer < 3) {

        if (boardData.players[currentPlayer + 1].playing == true) {

          currentPlayer++

          UIVars.playerImage.src = boardData.players[currentPlayer].avatar

          UIVars.playerName.value = boardData.players[currentPlayer].name

          UIVars.playerColor.value = boardData.players[currentPlayer].color

          UIVars.playerColor.parentElement.style.backgroundColor = boardData.players[currentPlayer].color

          UIVars.playerImage.parentElement.style.backgroundColor = boardData.players[currentPlayer].color

          UIVars.isHuman.checked = boardData.players[currentPlayer].isHuman

          UIVars.playerInputPhase.dataset.currentplayer = currentPlayer

        } else {

          UICtrl.addClass(UIVars.startGame, 'show')

          allPhase.forEach(item => UICtrl.removeClass(item, 'show'))

          UICtrl.addClass(UIVars.safeSpotPhase, 'show')

          UIVars.playerInputPhase.dataset.currentplayer = 0

        }

      } else {

        UICtrl.addClass(UIVars.startGame, 'show')

        allPhase.forEach(item => UICtrl.removeClass(item, 'show'))

        UICtrl.addClass(UIVars.safeSpotPhase, 'show')

        UIVars.playerInputPhase.dataset.currentplayer = 0

        UIVars.gameSEany.checked = false;

        UIVars.gameSEnow.checked = false;

        UIVars.gameSEspe.checked = false;

        switch (boardData.gameSafe) {

          case "special":

            UIVars.gameSEspe.checked = true;

            break;

          case "nowhere":

            UIVars.gameSEnow.checked = true;

            break;

          case "anywhere":

            UIVars.gameSEany.checked = true;

            break;

          default:
            break;
        }

      }

    })

    UIVars.startGameX.addEventListener('click', async e => {

      let boardData = await BoardCtrl.fetchOriginalData()

      if (UIVars.gameSEspe.checked) {

        boardData.gameSafe = 'special'

      } else if (UIVars.gameSEnow.checked) {

        boardData.gameSafe = 'nowhere'

      } else {

        boardData.gameSafe = 'anywhere'

      }

      boardData.gameStart = new Date()

      boardData.winners = []

      boardData.players.forEach(item => { item.won = false })

      boardData.players[0].chips = [
        { name: 'chip-A-1', started: false, finished: false, location: 'holder' },
        { name: 'chip-A-2', started: false, finished: false, location: 'holder' },
        { name: 'chip-A-3', started: false, finished: false, location: 'holder' },
        { name: 'chip-A-4', started: false, finished: false, location: 'holder' },
      ]

      boardData.players[1].chips = [
        { name: 'chip-B-1', started: false, finished: false, location: 'holder' },
        { name: 'chip-B-2', started: false, finished: false, location: 'holder' },
        { name: 'chip-B-3', started: false, finished: false, location: 'holder' },
        { name: 'chip-B-4', started: false, finished: false, location: 'holder' },
      ]

      boardData.players[2].chips = [
        { name: 'chip-C-1', started: false, finished: false, location: 'holder' },
        { name: 'chip-C-2', started: false, finished: false, location: 'holder' },
        { name: 'chip-C-3', started: false, finished: false, location: 'holder' },
        { name: 'chip-C-4', started: false, finished: false, location: 'holder' },
      ]

      boardData.players[3].chips = [
        { name: 'chip-D-1', started: false, finished: false, location: 'holder' },
        { name: 'chip-D-2', started: false, finished: false, location: 'holder' },
        { name: 'chip-D-3', started: false, finished: false, location: 'holder' },
        { name: 'chip-D-4', started: false, finished: false, location: 'holder' },
      ]

      boardData.players.forEach((item, index) => {

        if (index == 0) {

          item.turn = true

        } else {

          item.turn = false

        }

      })

      BoardCtrl.setData(boardData)

      BoardCtrl.saveData()

      setGameInProgress(true)

      UICtrl.removeClass(UIVars.startGame, 'show')

      allPhase.forEach(item => UICtrl.removeClass(item, 'show'))

      UICtrl.addClass(UIVars.boardHolder, 'show')

      sizeEvents()

      BoardCtrl.boardToggle(true)

      BoardCtrl.configureTheGame()

    })

  }

  const BoardCtrl = (() => {

    let CVtheBoardDataHexB3E = {}, boardOn = false, gameSession = 0;

    const boardToggle = (value) => {

      boardOn = value

    }

    const createFirstData = async () => {

      const originData = {

        uniqueID: 'Board-L001',

        players: [
          {
            name: 'Player 1',
            color: '#0000ff',
            avatar: 'images/avatar/avatar03.png',
            chips: [
              { name: 'chip-A-1', started: false, finished: false, location: 'holder' },
              { name: 'chip-A-2', started: false, finished: false, location: 'holder' },
              { name: 'chip-A-3', started: false, finished: false, location: 'holder' },
              { name: 'chip-A-4', started: false, finished: false, location: 'holder' },
            ],
            base: 'A',
            inGame: true,
            turn: true,
            playing: true,
            isHuman: true
          },
          {
            name: 'Player 2',
            color: '#008000',
            avatar: 'images/avatar/avatar06.png',
            chips: [
              { name: 'chip-B-1', started: false, finished: false, location: 'holder' },
              { name: 'chip-B-2', started: false, finished: false, location: 'holder' },
              { name: 'chip-B-3', started: false, finished: false, location: 'holder' },
              { name: 'chip-B-4', started: false, finished: false, location: 'holder' },
            ],
            base: 'B',
            inGame: true,
            turn: false,
            playing: true,
            isHuman: false
          },
          {
            name: 'Player 3',
            color: '#ff9400',
            avatar: 'images/avatar/avatar14.png',
            chips: [
              { name: 'chip-C-1', started: false, finished: false, location: 'holder' },
              { name: 'chip-C-2', started: false, finished: false, location: 'holder' },
              { name: 'chip-C-3', started: false, finished: false, location: 'holder' },
              { name: 'chip-C-4', started: false, finished: false, location: 'holder' },
            ],
            base: 'C',
            inGame: true,
            turn: false,
            playing: true,
            isHuman: false
          },
          {
            name: 'Player 4',
            color: '#800000',
            avatar: 'images/avatar/avatar10.png',
            chips: [
              { name: 'chip-D-1', started: false, finished: false, location: 'holder' },
              { name: 'chip-D-2', started: false, finished: false, location: 'holder' },
              { name: 'chip-D-3', started: false, finished: false, location: 'holder' },
              { name: 'chip-D-4', started: false, finished: false, location: 'holder' },
            ],
            base: 'D',
            inGame: true,
            turn: false,
            playing: true,
            isHuman: false
          },
        ],

        gameStart: new Date(),

        gameEnd: undefined,

        gameSafe: 'special' // [nowhere, special, anywhere]

      }

      return originData

    }

    const fetchOriginalData = async () => {

      const originalData = StorageCtrl.retreiveJSON('board')

      return originalData

    }

    const fetchData = () => {

      return JSON.parse(JSON.stringify(CVtheBoardDataHexB3E))

    }

    const setData = async (newData) => {

      CVtheBoardDataHexB3E = newData

    }

    const saveData = async () => {

      StorageCtrl.storeJSON('board', fetchData())

    }

    const loadBoardColors = async (data) => {

      const colorMatching = [
        ['A', UIVars.styleA, '2'],
        ['B', UIVars.styleB, '15'],
        ['C', UIVars.styleC, '28'],
        ['D', UIVars.styleD, '41'],
        ['BBM', UIVars.styleBBM, ''],
      ]

      data.players.forEach(item => {

        const colorIndex = colorMatching.findIndex(colorBatch => colorBatch[0] == item.base)

        colorMatching[colorIndex][1].innerHTML = `
        div.base-${item.base},
        div.home-track-${item.base},
        div.board div.home-end-triangle-${item.base}>div,
        div.board-holder>div.board div.track-${colorMatching[colorIndex][2]},
        div.board-holder>div.board div div.chip-${item.base} {
          background-color: ${item.color}
        }`

        if (item.turn) {

          const BBMIndex = colorMatching.findIndex(colorBatch => colorBatch[0] == 'BBM')

          colorMatching[BBMIndex][1].innerHTML = `div.board-holder>div.board div.board-base-message {box-shadow: 0 0 30px 4px inset ${item.color}}`

        }

      });

    }

    const loadBoardText = async (data, dieData, generalMessage) => {

      const baseMatching = [
        ['A', UIVars.baseA, UIVars.baseAName, UIVars.baseAText,],
        ['B', UIVars.baseB, UIVars.baseBName, UIVars.baseBText,],
        ['C', UIVars.baseC, UIVars.baseCName, UIVars.baseCText,],
        ['D', UIVars.baseD, UIVars.baseDName, UIVars.baseDText,],
      ]

      let messageTime = 0

      data.players.forEach(item => {

        const baseItem = baseMatching[baseMatching.findIndex(baseBatch => baseBatch[0] == item.base)]

        const isWaitText = `${item.name} is waiting...`

        if (baseItem[2].innerText != item.name) {

          SpecialCtrl.addLetters(item.name, baseItem[2], 50, 0, '')

          messageTime = messageTime > (item.name.length * 50) ? messageTime : (item.name.length * 50)

        }

        if (baseItem[3].innerText != isWaitText && !item.turn) {

          SpecialCtrl.addLetters(isWaitText, baseItem[3], 50, 0, '')

          messageTime = messageTime > (isWaitText.length * 50) ? messageTime : (isWaitText.length * 50)

        }

        if (item.turn) {

          let dieMessage

          if (typeof dieData == 'string') {

            dieMessage = dieData

          } else {

            dieMessage = `${item.name} has rolled a ${dieData[0]} and a ${dieData[1]}`

            if (dieData[0] == dieData[1]) {

              dieMessage = `${item.name} has rolled a double ${dieData[0]}`

            }

          }

          UIVars.live.textContent = dieMessage

          if (baseItem[3].innerText != dieMessage) {

            SpecialCtrl.addLetters(dieMessage, baseItem[3], 40, 0, '')

          }

        }

        if (generalMessage) {

          SpecialCtrl.addLetters(generalMessage, UIVars.boardMessage, 50, 0, '')

          messageTime = messageTime > (generalMessage.length * 50) ? messageTime : (generalMessage.length * 50)

        }


      });

      messageTime = messageTime + 500

      return new Promise(resolve => setTimeout(resolve, messageTime))

    }

    const setBoardChips = async (data) => {

      const baseMatching = [
        ['A', UIVars.baseA],
        ['B', UIVars.baseB],
        ['C', UIVars.baseC],
        ['D', UIVars.baseD],
      ]

      const numMatching = [
        'zero-chips', 'one-chip',
        'two-chips', "three-chips",
        "four-chips", "five-chips",
        "six-chips", "ten-chips"
      ]

      data.players.forEach(player => {

        const playerBase = baseMatching[baseMatching.findIndex(baseBatch => baseBatch[0] == player.base)][1]

        player.chips.forEach(item => {

          const chip = UICtrl.findElement(`#${item.name}`)

          chip.remove()

          if (item.started == false) {

            const holdingCells = Array.from(UICtrl.findBy(playerBase, '.holding-cells').children)

            for (let i = 0; i < holdingCells.length; i++) {

              const holder = holdingCells[i];

              if (holder.children.length < 1) {

                holder.appendChild(chip)

                break

              }

            }

          } else if (item.finished == false) {

            let chipLocation = item.location

            if (isNaN(parseInt(chipLocation))) {

              chipLocation = `home-track-${chipLocation}`

            } else {

              chipLocation = `track-${chipLocation}`

            }

            chipLocation = '.' + chipLocation

            const chipHouse = UICtrl.findElement(chipLocation)

            chipHouse.appendChild(chip)

            UICtrl.removeClass(chipHouse, numMatching[chipHouse.childElementCount - 1])

            UICtrl.addClass(chipHouse, numMatching[chipHouse.childElementCount])

          } else {

            let chipLocation = `.home-track-${player.base}-6`

            const chipHouse = UICtrl.findElement(chipLocation)

            chipHouse.appendChild(chip)

            UICtrl.removeClass(chipHouse, numMatching[chipHouse.childElementCount - 1])

            UICtrl.addClass(chipHouse, numMatching[chipHouse.childElementCount])

          }

        })

        // Set Player Images
        // console.log(playerBase);

        const img = UICtrl.findBy(playerBase, ".player-profile img")

        img.setAttribute("src", player.avatar)

        img.setAttribute("alt", player.name + " picture")

      })

    }

    const landTheChip = async (chipData) => {

      const data = fetchData();

      const playerIndex = data.players.findIndex(item => item.base == chipData.name[5])

      const chipIndex = data.players[playerIndex].chips.findIndex(item => item.name == chipData.name)

      const allChips = []

      const numMatching = [
        'zero-chips', 'one-chip',
        'two-chips', "three-chips",
        "four-chips", "five-chips",
        "six-chips", "ten-chips"
      ]

      data.players.forEach(item => { item.chips.forEach(chip => { allChips.push(chip) }) })

      chipData = data.players[playerIndex].chips[chipIndex]

      const baseMatching = [
        ['A', UIVars.baseA],
        ['B', UIVars.baseB],
        ['C', UIVars.baseC],
        ['D', UIVars.baseD],
      ]

      switch (data.gameSafe) {

        case "anywhere":

          // Chip is safe

          break;

        case "special":

          const specialLocations = [2, 10, 15, 23, 28, 36, 41, 49]

          if (!specialLocations.includes(parseInt(chipData.location))) {

            allChips.forEach(item => {

              if (item.location == chipData.location && item.name[5] != chipData.name[5]) {

                const removeMe = data.players.find(player => player.base == item.name[5]).chips.find(chip => chip.name == item.name)

                const eatenDie = UICtrl.findElement(`#${removeMe.name}`)

                removeMe.started = false

                removeMe.location = 'holder'

                eatenDie.remove()

                const playerBase = baseMatching[baseMatching.findIndex(baseBatch => baseBatch[0] == item.name[5])][1]

                const holdingCells = Array.from(UICtrl.findBy(playerBase, '.holding-cells').children)

                for (let i = 0; i < holdingCells.length; i++) {

                  const holder = holdingCells[i];

                  if (holder.children.length < 1) {

                    holder.appendChild(eatenDie)

                    break

                  }

                }

                const holdingN = UICtrl.findElement(`.track-${chipData.location}`)

                numMatching.forEach(num => UICtrl.removeClass(holdingN, num))

              }

            })

            setData(data)

          }

          break;

        case "nowhere":

          allChips.forEach(item => {

            if (item.location == chipData.location && item.name[5] != chipData.name[5]) {

              const removeMe = data.players.find(player => player.base == item.name[5]).chips.find(chip => chip.name == item.name)

              const eatenDie = UICtrl.findElement(`#${removeMe.name}`)

              removeMe.started = false

              removeMe.location = 'holder'

              eatenDie.remove()

              const playerBase = baseMatching[baseMatching.findIndex(baseBatch => baseBatch[0] == item.name[5])][1]

              const holdingCells = Array.from(UICtrl.findBy(playerBase, '.holding-cells').children)

              for (let i = 0; i < holdingCells.length; i++) {

                const holder = holdingCells[i];

                if (holder.children.length < 1) {

                  holder.appendChild(eatenDie)

                  break

                }

              }

              const holdingN = UICtrl.findElement(`.track-${chipData.location}`)

              numMatching.forEach(num => UICtrl.removeClass(holdingN, num))

            }

          })

          setData(data)

          break;

        default:

          console.log("Die Landed 'UNKNOWN: " + data.gameSafe + "'");

          break;
      }

    }

    const moveBoardChips = async (chipData, count, newChip) => {

      const boardDetails = [
        ['A', 0o2, 52,],
        ['B', 15, 13,],
        ['C', 28, 26,],
        ['D', 41, 39,],
      ]

      const numMatching = [
        'zero-chips', 'one-chip',
        'two-chips', "three-chips",
        "four-chips", "five-chips",
        "six-chips", "ten-chips"
      ]

      const chip = UICtrl.findElement(`#${chipData.name}`)

      let chipNumber = chip.parentElement.dataset['track']

      const boardDet = boardDetails[boardDetails.findIndex(boarD => boarD[0] == chipData.name[5])]

      const data = fetchData()

      const playerIndex = data.players.findIndex(item => item.base == chipData.name[5])

      const chipIndex = data.players[playerIndex].chips.findIndex(item => item.name == chipData.name)

      if (newChip && count == 6) {

        chip.remove(); let newParent = undefined;

        newParent = UICtrl.findElement(`.track-${boardDet[1]}`)

        newParent.appendChild(chip)

        data.players[playerIndex].chips[chipIndex].location = boardDet[1]

        data.players[playerIndex].chips[chipIndex].started = true

        setData(data)

        landTheChip(chipData)

        UICtrl.removeClass(newParent, numMatching[newParent.childElementCount - 1])

        UICtrl.addClass(newParent, numMatching[newParent.childElementCount])

        return new Promise(resolve => setTimeout(resolve, 0))

      }

      while (count > 0) {

        const oldParent = chip.parentElement

        chip.remove(); let newParent = undefined;

        if (!isNaN(parseInt(chipNumber))) {

          chipNumber = parseInt(chipNumber)

          if (chipNumber == boardDet[2]) {

            newParent = UICtrl.findElement(`.home-track-${chipData.name[5]}-1`)

            chipNumber = `${chipData.name[5]}-1`

          } else if (chipNumber == 52) {

            newParent = UICtrl.findElement(`.track-1`)

            chipNumber = 1

          } else {

            newParent = UICtrl.findElement(`.track-${parseInt(chipNumber) + 1}`)

            chipNumber++

          }

        } else {

          chipNumber = parseInt(chipNumber[2]) + 1

          chipNumber = chipNumber > 6 ? 6 : chipNumber

          newParent = UICtrl.findElement(`.home-track-${chipData.name[5]}-${chipNumber}`)

          chipNumber = `${chipData.name[5]}-${chipNumber}`

        }

        data.players[playerIndex].chips[chipIndex].location = chipNumber

        if (chipNumber[2] == '6') {

          data.players[playerIndex].chips[chipIndex].finished = true

        }

        setData(data)

        newParent.appendChild(chip)

        if (count == 1) {

          landTheChip(chipData)

        }

        // Setting appropriate class name based on number of housed chips
        UICtrl.removeClass(oldParent, numMatching[oldParent.childElementCount + 1])

        UICtrl.addClass(oldParent, numMatching[oldParent.childElementCount])

        UICtrl.removeClass(newParent, numMatching[newParent.childElementCount - 1])

        UICtrl.addClass(newParent, numMatching[newParent.childElementCount])

        await new Promise(resolve => setTimeout(resolve, 200))

        count--

      }

      return new Promise(resolve => setTimeout(resolve, 0))

    }

    const queryPlayerDie = async (data) => {

      UICtrl.addClass(UIVars.dieBtnHolder, 'show')

      const spinBtn = UICtrl.findBy(UIVars.dieBtnHolder, 'button')

      spinBtn.innerText = `${data.players.find(item => item.turn).name}\nSpin Me`

      spinBtn.focus({ preventScroll: true })

      // Waits for user to click the button
      await new Promise((resolve, reject) => {

        spinBtn.addEventListener('click', e => {

          UICtrl.removeClass(UIVars.dieBtnHolder, 'show')

          resolve('Clicked')

        }, { once: true })

      })

      return new Promise(resolve => resolve(''))

    }

    const spinTheDie = async (data) => {

      const dieValue = [SpecialCtrl.randomAmong(1, 6), SpecialCtrl.randomAmong(1, 6)]

      // Shows spinner animations
      await new Promise(async (resolve, reject) => {

        UICtrl.addClass(UIVars.dieSpinner, 'show')

        SpecialCtrl.OHeightAspect(UIVars.leftSpinner, 1)

        SpecialCtrl.OHeightAspect(UIVars.rightSpinner, 1)

        UICtrl.addClass(UICtrl.findBy(UIVars.leftSpinner, '.spinner-hand'), 'show')

        UICtrl.addClass(UICtrl.findBy(UIVars.rightSpinner, '.spinner-hand'), 'show')

        UICtrl.findBy(UIVars.leftSpinner, '.spinner-hand').style.transform = `rotate(${(dieValue[0] / 6) * 360 + 720}deg)`

        UICtrl.findBy(UIVars.rightSpinner, '.spinner-hand').style.transform = `rotate(${(dieValue[1] / 6) * 360 + 720}deg)`

        await new Promise(resolve => setTimeout(resolve, 2000))

        UICtrl.removeClass(UICtrl.findBy(UIVars.leftSpinner, '.spinner-hand'), 'show')

        UICtrl.removeClass(UICtrl.findBy(UIVars.rightSpinner, '.spinner-hand'), 'show')

        UICtrl.findBy(UIVars.leftSpinner, '.spinner-value').innerText = dieValue[0]

        UICtrl.findBy(UIVars.rightSpinner, '.spinner-value').innerText = dieValue[1]

        UICtrl.addClass(UICtrl.findBy(UIVars.leftSpinner, '.spinner-value'), 'show')

        UICtrl.addClass(UICtrl.findBy(UIVars.rightSpinner, '.spinner-value'), 'show')

        await new Promise(resolve => setTimeout(resolve, 1000))

        UICtrl.removeClass(UIVars.dieSpinner, 'show')

        resolve('')

        UICtrl.findBy(UIVars.leftSpinner, '.spinner-hand').style.transform = null

        UICtrl.findBy(UIVars.rightSpinner, '.spinner-hand').style.transform = null

        UICtrl.findBy(UIVars.leftSpinner, '.spinner-value').innerText = ''

        UICtrl.findBy(UIVars.rightSpinner, '.spinner-value').innerText = ''

      })

      return new Promise(resolve => resolve(dieValue))

    }

    const displayDieData = async (data, dieData) => {

      loadBoardText(data, dieData)

      UIVars.boardMessage.innerText = ''

      UIVars.boardMessageValues.innerHTML = ''

      UIVars.boardMessageValues.appendChild(UICtrl.createElement('div.BBMBV-die-value', dieData[0]))

      UIVars.boardMessageValues.appendChild(UICtrl.createElement('div.BBMBV-die-value', dieData[1]))

      UIVars.boardMessageValues.appendChild(UICtrl.createElement('div.BBMBV-die-value.X', dieData[0] + dieData[1]))

    }

    const displayAIDieData = async (data, dieData) => {

      loadBoardText(data, dieData)

      UIVars.boardMessage.innerText = ''

      UIVars.boardMessageValues.innerHTML = ''

    }

    const configureDieChoosing = async (data, dieData) => {

      await new Promise(resolve => {

        // Very Complex Code

        // Gets all the Die Values
        const allValues = Array.from(UIVars.boardMessageValues.children).filter(item => item.classList.contains('BBMBV-die-value'))

        // Gets all the player chips
        const allChips = data.players.find(item => item.turn).chips.map(item => UICtrl.findElement(`#${item.name}`))

        const boardDetails = [
          ['A', 0o2, 0,],
          ['B', 15, 13,],
          ['C', 28, 26,],
          ['D', 41, 39,],
        ]

        const allValuesValues = allValues.map(item => parseInt(item.innerText)); dieData = [...dieData, dieData[0] + dieData[1]]; const correctOnes = []

        // Create correct ones
        allValuesValues.forEach(async item => { if (dieData.includes(item)) { correctOnes.push(item) } })

        const sessionAtStart = gameSession

        const movePoppies = async (e) => {

          if (sessionAtStart !== gameSession) { UIVars.board.removeEventListener('click', movePoppies); return }

          if (e.target.classList.contains('poppy')) {

            const myValues = Array.from(UIVars.boardMessageValues.children).filter(item => item.classList.contains('BBMBV-die-value'))

            UIVars.board.removeEventListener('click', movePoppies)

            const chipData = data.players.find(item => item.turn).chips.find(item => item.name == e.target.id)

            const datasetValue = e.target.dataset['value']

            allChips.forEach(item => UICtrl.removeClass(item, 'poppy'))

            allChips.forEach(item => item.dataset['value'] = null)

            const pickedValue = myValues.find(item => {

              if (datasetValue == item.innerHTML && item.classList.contains('activated')) {

                return true

              } else if (datasetValue == 'H' && item.innerHTML == 6 && item.classList.contains('activated')) {

                return true

              } else {

                return false

              }

            })

            if (pickedValue.classList.contains('X')) {

              UIVars.boardMessageValues.innerHTML = ''

            } else {

              pickedValue.remove()

              if (UIVars.boardMessageValues.children.length > 1) {

                UICtrl.findElement('.BBMBV-die-value.X').remove()

              }

            }

            allValues.forEach(item => UICtrl.removeClass(item, 'activated'))

            if (datasetValue == 'H') {

              await moveBoardChips(chipData, 6, true)

            } else {

              await moveBoardChips(chipData, datasetValue)

            }

            if (UIVars.boardMessageValues.children.length == 0) {

              resolve('Elpis is Great')

            }

          }

        }

        allValues.forEach((item, index) => {

          item.addEventListener('click', e => {

            let numberOfMoves = []

            const isNotActivated = !item.classList.contains('activated')

            allValues.forEach(item => UICtrl.removeClass(item, 'activated'))

            allChips.forEach(item => UICtrl.removeClass(item, 'poppy'))

            allChips.forEach(item => item.dataset['value'] = null)

            UIVars.board.removeEventListener('click', movePoppies)

            UIVars.board.addEventListener('click', movePoppies)

            if (isNotActivated) {

              UICtrl.addClass(item, 'activated')

              allChips.forEach(chip => {

                let countExit

                if (chip.parentElement.classList.contains('holder')) {

                  countExit = 'H'

                } else {

                  const dataTrack = chip.parentElement.dataset['track']

                  if (isNaN(parseInt(dataTrack))) {

                    countExit = 6 - parseInt(dataTrack[2])

                  } else {

                    let distToHomeEntranceFrom52 = boardDetails.find(item => item[0] == data.players.find(item => item.turn).base)[2]

                    distToHomeEntranceFrom52 = distToHomeEntranceFrom52

                    if (distToHomeEntranceFrom52 > parseInt(dataTrack)) {

                      countExit = distToHomeEntranceFrom52 - parseInt(dataTrack) + 6

                    } else if (distToHomeEntranceFrom52 == parseInt(dataTrack)) {

                      countExit = 6

                    } else if (distToHomeEntranceFrom52 == 0 && parseInt(dataTrack) == 52) {

                      countExit = 6

                    } else {

                      countExit = 52 - parseInt(dataTrack) + distToHomeEntranceFrom52 + 6

                    }

                  }

                }

                if (!isNaN(parseInt(countExit))) {

                  if (countExit >= correctOnes[index]) {

                    UICtrl.addClass(chip, 'poppy')

                    chip.dataset['value'] = correctOnes[index]

                    numberOfMoves.push(chip)

                  }

                } else {

                  if (!item.classList.contains('X') && correctOnes[index] == 6) {

                    UICtrl.addClass(chip, 'poppy')

                    chip.dataset['value'] = "H"

                    numberOfMoves.push(chip)

                  }

                }

              })


              if (numberOfMoves.length > 0) {

                // UIVars.board.addEventListener('click', movePoppies)

              } else {

                if (dieData.slice(0, 2).includes(6) && UIVars.boardMessageValues.children.length > 1) {

                  const housedChip = allChips.find(chip => chip.parentElement.classList.contains('holder'))

                  if (housedChip == undefined) {

                    item.remove()

                    UICtrl.findElement('.BBMBV-die-value.X').remove()

                  } else {

                    MessageCtrl.sendMiniMessage('Hint: Use the other die', 2000)

                  }

                } else {

                  if (item.classList.contains('X')) {

                    MessageCtrl.sendMiniMessage('Hint: Use the other die', 2000)

                  } else if (UIVars.boardMessageValues.children.length > 1) {

                    item.remove()

                    UICtrl.findElement('.BBMBV-die-value.X').remove()

                  } else {

                    item.remove()

                    resolve('Elpis is Great')

                  }

                }

              }

            }

          })

        })

      })

    }

    const aChipCanMove = (data, dieData) => {

      // Gets all the player chips
      const allChips = data.players.find(item => item.turn).chips

      let chipCanMove = false

      allChips.forEach(item => {

        if (!isNaN(item.location)) {

          chipCanMove = true

        } else if (item.location == "holder") {

          dieData.forEach(item => {

            if (item == 6) {

              chipCanMove = true

            }

          })

        } else if (item.location.startsWith(`${item.name[5]}-`)) {

          const spaceLeft = 6 - parseInt(item.location[2])

          dieData.forEach(item => {

            if (item <= spaceLeft) {

              chipCanMove = true

            }

          })

        }

      })

      return chipCanMove

    }

    const noChipCanMove = () => {

      UIVars.boardMessage.innerText = ''

      UIVars.boardMessageValues.innerHTML = ''

    }

    const moveAIChip = async (data, dieData) => {

      await new Promise(async resolve => {

        const player = data.players.find(item => item.turn)

        const boardDetails = [
          ['A', 0o2, 52,],
          ['B', 15, 13,],
          ['C', 28, 26,],
          ['D', 41, 39,],
        ]

        const numMatching = [
          'one-chip',
          'two-chips', "three-chips",
          "four-chips", "five-chips",
          "six-chips", "ten-chips"
        ]

        const checkChipAgainstDie = async (dieValue) => {

          const player = fetchData().players.find(item => item.turn)

          const actionList = []

          for (let i = 0; i < player.chips.length; i++) {

            const chipData = player.chips[i];

            const chipLocation = parseInt(chipData.location)

            const allOtherChips = []

            data.players.forEach(item => { if (player.name !== item.name) { item.chips.forEach(chip => { allOtherChips.push(chip) }) } })

            const boardDet = boardDetails.find(item => item[0] == player.base)

            if (dieValue == 6 && chipData.location == 'holder') {

              // Check for a chip to bring out

              actionList.push({
                priority: 2,
                action: "bringout",
                chipData: chipData
              })

            } else if (!isNaN(chipLocation)) {

              let finalDestination = (chipLocation + dieValue)

              if (chipLocation <= boardDet[2] && finalDestination > boardDet[2]) {

                actionList.push({
                  priority: 3,
                  action: "takehome",
                  chipData: chipData
                })

              } else {

                finalDestination = finalDestination % 52

                finalDestination = finalDestination == 0 ? 52 : finalDestination

                finalDestination = UICtrl.findElement(`.track-${finalDestination}`)

                if (finalDestination.children.length >= 1) {

                  actionList.push({
                    priority: 1,
                    action: "eat",
                    chipData: chipData
                  })

                } else {

                  actionList.push({
                    priority: 4,
                    action: "movenorm",
                    chipData: chipData
                  })

                }

              }

            } else if (chipData.location.startsWith(`${chipData.name[5]}-`)) {

              const spaceLeft = 6 - parseInt(chipData.location[2])

              if (dieValue <= spaceLeft) {

                actionList.push({
                  priority: 5,
                  action: "lazyhome",
                  chipData: chipData
                })

              }

            }

          }

          actionList.sort((item1, item2) => item1.priority - item2.priority)

          if (actionList.length > 0) {

            const actionTaken = actionList[0]

            if (actionTaken.action == "bringout") {

              await moveBoardChips(actionTaken.chipData, dieValue, true)

            } else {

              await moveBoardChips(actionTaken.chipData, dieValue)

            }

            // console.log(actionTaken);

          }

        }


        if (dieData[1] == 6) {

          await checkChipAgainstDie(dieData[1])

          await checkChipAgainstDie(dieData[0])

        } else {

          await checkChipAgainstDie(dieData[0])

          await checkChipAgainstDie(dieData[1])

        }

        resolve("I'm an AI");

      })

    }

    const changeTurn = async () => {

      await new Promise(async resolve => {

        let boardData = await BoardCtrl.fetchData()

        for (let playerIndex = 0; playerIndex < boardData.players.length; playerIndex++) {

          const player = boardData.players[playerIndex];

          if (player.turn) {

            let nextIndex = (playerIndex + 1) % boardData.players.length

            let nextPlayer = boardData.players[nextIndex]

            while (!nextPlayer.playing || nextPlayer.won) {

              nextIndex = (nextIndex + 1) % boardData.players.length

              nextPlayer = boardData.players[nextIndex]

            }

            nextPlayer.turn = true

            player.turn = false

            break

          }

        }

        await setData(boardData)

        resolve('Done')

      })

    }

    const configureTheGame = async () => {

      return new Promise(async resolve => {

        const mySession = ++gameSession

        const stale = () => !boardOn || mySession !== gameSession

        let boardData = await BoardCtrl.fetchData()

        UICtrl.addClass(UIVars.boardHolder, 'show')

        sizeEvents()

        await setBoardChips(boardData)

        UICtrl.findElements('.chip.poppy').forEach(item => UICtrl.removeClass(item, 'poppy'))

        while (true) {

          if (stale()) break

          let boardData = await BoardCtrl.fetchData()

          await loadBoardColors(boardData)

          const player = boardData.players.find(item => item.turn)

          let dieData

          if (player.isHuman) {

            await loadBoardText(boardData, `${player.name} Turn`)

            await queryPlayerDie(boardData)

            if (stale()) break

            dieData = await spinTheDie(boardData)

            if (stale()) break

            if (aChipCanMove(boardData, dieData)) {

              await displayDieData(boardData, dieData)

              await configureDieChoosing(boardData, dieData)

            } else {

              noChipCanMove()

            }

          } else {

            await loadBoardText(boardData, `${player.name} Turn`, `${player.name} Turn`)

            if (stale()) break

            dieData = await spinTheDie(boardData)

            if (stale()) break

            if (aChipCanMove(boardData, dieData)) {

              await displayAIDieData(boardData, dieData)

              await moveAIChip(boardData, dieData)

            } else {

              noChipCanMove()

            }

          }

          if (stale()) break

          // boardData above is a stale copy: moves were written to the live data
          const after = fetchData()

          const played = after.players.find(item => item.base == player.base)

          if (played.chips.every(item => item.finished) && !played.won) {

            played.won = true

            after.winners = after.winners || []

            after.winners.push(played.name)

          }

          setData(after)

          if (dieData[0] != dieData[1] || played.won) {

            await changeTurn()

          }

          saveData()

          if (played.won) {

            await loadBoardText(fetchData(), `${played.name} has won`, `${played.name} has won`)

          }

          const stillPlaying = fetchData().players.filter(item => item.playing && !item.won)

          // Game is over when at most one player is left
          if (stillPlaying.length <= 1) {

            const finalData = fetchData()

            if (stillPlaying.length == 1) {

              stillPlaying[0].won = true

              finalData.winners.push(stillPlaying[0].name)

              finalData.players.find(item => item.base == stillPlaying[0].base).won = true

            }

            finalData.gameEnd = new Date()

            setData(finalData)

            saveData()

            setGameInProgress(false)

            boardToggle(false)

            const board = document.createElement('div')

            board.className = 'confirm-box'

            board.innerHTML = `<p><strong>Game over</strong></p><ol style="text-align:left;margin:0 0 1rem 1.2rem"></ol><div class="confirm-actions"><button type="button" class="primary">Back to menu</button></div>`

            finalData.winners.forEach(name => { const li = document.createElement('li'); li.textContent = name; board.querySelector('ol').appendChild(li) })

            board.querySelector('button').addEventListener('click', () => { MessageCtrl.removeNormalMessage(); UIVars.linkExit.click() })

            MessageCtrl.sendNormalMessage(board)

            resolve('ended')

            break

          }

        }

      })

    }


    return {

      saveData: () => saveData(),

      fetchData: () => fetchData(),

      configureTheGame: () => configureTheGame(),

      boardToggle: (value) => boardToggle(value),

      setData: (data) => setData(data),

      spinTheDie: (data) => spinTheDie(data),

      setBoardChips: (data) => setBoardChips(data),

      queryPlayerDie: (data) => queryPlayerDie(data),

      loadBoardColors: (data) => loadBoardColors(data),

      loadBoardText: (data, dieData) => loadBoardText(data, dieData),

      displayDieData: (data, dieData) => displayDieData(data, dieData),

      configureDieChoosing: (data, dieData) => configureDieChoosing(data, dieData),

      moveBoardChips: (chipData, count, newChip) => moveBoardChips(chipData, count, newChip),

      fetchOriginalData: () => fetchOriginalData(),

      createFirstData: () => createFirstData(),

    }

  })()

  const applicationCore = async () => {

    let boardData = await BoardCtrl.fetchOriginalData()

    if (typeof boardData == "string" || Object.keys(boardData).length == 0) {

      boardData = await BoardCtrl.createFirstData()

      BoardCtrl.setData(boardData)

      BoardCtrl.saveData()

    }

    BoardCtrl.setData(boardData)

    // await BoardCtrl.configureTheGame()

  }

  return {
    init: () => {

      applicationCore()

      entryEvents()

      console.log('Second application is successfully running...')

    }
  }
})
  (UICtrl, APICtrl, GlobalCtrl, SpecialCtrl, WebSocketCtrl, MessageCtrl)


// Initialize Application
document.addEventListener('DOMContentLoaded', Application.init)