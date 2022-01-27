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
    boardMessageValues: UICtrl.findElement('.BBM-board-values'),
    dieBtnHolder: UICtrl.findElement('.die-btn-hol'),
    dieSpinner: UICtrl.findElement('.die-spinner'),


    // Die Spinners
    leftSpinner: UICtrl.findElement('.left-spinner'),
    rightSpinner: UICtrl.findElement('.right-spinner'),

  }

  const sizeEvents = function () {

    SpecialCtrl.OSmallAspect(UICtrl.UIVars.boardHolder, (15 / 16))

    SpecialCtrl.smallAspect(UICtrl.UIVars.boardHolder, (15 / 16))

    SpecialCtrl.OHeightAspect(UIVars.leftSpinner, 1)

    SpecialCtrl.heightAspect(UIVars.leftSpinner, 1)

    SpecialCtrl.OHeightAspect(UIVars.rightSpinner, 1)

    SpecialCtrl.heightAspect(UIVars.rightSpinner, 1)

  }

  const BoardCtrl = (() => {

    let CVtheBoardDataHexB3E = {}

    const fetchOriginalData = async () => {

      // const originalData = await APICtrl.getAPI_Json('The URL')

      const originalData = {

        uniqueID: 'Board-L234',

        players: [
          {
            name: 'Elpis',
            color: '#0000ff',
            avatar: 'images/Screenshot (104).png',
            chips: [
              { name: 'chip-A-1', started: true, finished: false, location: 'A-4' },
              { name: 'chip-A-2', started: true, finished: false, location: '50' },
              { name: 'chip-A-3', started: true, finished: false, location: '24' },
              { name: 'chip-A-4', started: false, finished: false, location: 'holder' },
            ],
            base: 'A',
            inGame: true,
            turn: true,
            playing: true,
            isHuman: true
          },
          {
            name: 'AnathemA',
            color: '#008000',
            avatar: 'images/cat.jpg',
            chips: [
              { name: 'chip-B-1', started: true, finished: false, location: '27' },
              { name: 'chip-B-2', started: false, finished: false, location: 'holder' },
              { name: 'chip-B-3', started: false, finished: false, location: 'holder' },
              { name: 'chip-B-4', started: false, finished: false, location: 'holder' },
            ],
            base: 'B',
            inGame: true,
            turn: false,
            playing: true,
            isHuman: true
          },
          {
            name: 'Bolu',
            color: '#ff9400',
            avatar: 'images/eren.PNG',
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
            isHuman: true
          },
          {
            name: 'Queen',
            color: '#800000',
            avatar: 'images/Screenshot (52).png',
            chips: [
              // { name: 'chip-D-1', started: false, finished: false, location: 'holder' },
              // { name: 'chip-D-2', started: true, finished: false, location: '39' },
              // { name: 'chip-D-3', started: true, finished: false, location: '29' },
              // { name: 'chip-D-4', started: true, finished: false, location: 'D-2' },
            ],
            base: 'D',
            inGame: true,
            turn: false,
            playing: false,
            isHuman: false
          },
        ],

        gameStart: new Date(),

        gameEnd: undefined,

        gameSafe: 'special' // [nowhere, special, anywhere]

      }

      return originalData

    }

    const fetchData = () => {

      return JSON.parse(JSON.stringify(CVtheBoardDataHexB3E))

    }

    const setData = async (newData) => {

      CVtheBoardDataHexB3E = newData

    }

    const saveData = async () => {

      await APICtrl.postAPI_Json('The URL', fetchData())

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

    const loadBoardText = async (data, dieData) => {

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

          if (baseItem[3].innerText != dieMessage) {

            SpecialCtrl.addLetters(dieMessage, baseItem[3], 40, 0, '')

          }

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
        ['A', 02, 52,],
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

      UICtrl.findBy(UIVars.dieBtnHolder, 'button').innerText = `${data.players.find(item => item.turn).name} Spin Me`

      // Waits for user to click the button
      await new Promise((resolve, reject) => {

        UICtrl.findBy(UIVars.dieBtnHolder, 'button').addEventListener('click', e => {

          UICtrl.removeClass(UIVars.dieBtnHolder, 'show')

          resolve('Clicked')

        })

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

    const configureDieChoosing = async (data, dieData) => {

      await new Promise(resolve => {

        // Very Complex Code

        // Gets all the Die Values
        const allValues = Array.from(UIVars.boardMessageValues.children).filter(item => item.classList.contains('BBMBV-die-value'))

        // Gets all the player chips
        const allChips = data.players.find(item => item.turn).chips.map(item => UICtrl.findElement(`#${item.name}`))

        const boardDetails = [
          ['A', 02, 0,],
          ['B', 15, 13,],
          ['C', 28, 26,],
          ['D', 41, 39,],
        ]

        const allValuesValues = allValues.map(item => parseInt(item.innerText)); dieData = [...dieData, dieData[0] + dieData[1]]; const correctOnes = []

        // Create correct ones
        allValuesValues.forEach(async item => { if (dieData.includes(item)) { correctOnes.push(item) } })

        const movePoppies = async (e) => {

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

            const isActivated = !item.classList.contains('activated')

            allValues.forEach(item => UICtrl.removeClass(item, 'activated'))

            allChips.forEach(item => UICtrl.removeClass(item, 'poppy'))

            allChips.forEach(item => item.dataset['value'] = null)

            UIVars.board.removeEventListener('click', movePoppies)

            if (isActivated) {

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

                UIVars.board.addEventListener('click', movePoppies)

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

      const boardDetails = [
        ['A', 02, 0,],
        ['B', 15, 13,],
        ['C', 28, 26,],
        ['D', 41, 39,],
      ]

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

      await new Promise(resolve => {

        const player = data.players.find(item => item.turn)

        const boardDetails = [
          ['A', 02, 52,],
          ['B', 15, 13,],
          ['C', 28, 26,],
          ['D', 41, 39,],
        ]

        const checkChipAgainstDie = (dieValue) => {

          for (let i = 0; i < player.chips.length; i++) {

            const chipData = player.chips[i];

            const chipLocation = parseInt(chipData.location)

            const allOtherChips = []

            data.players.forEach(item => { if (player.name !== item.name) { item.chips.forEach(chip => { allOtherChips.push(chip) }) } })

            const boardDet = boardDetails.find(item => item[0] == player.base)

            // Check for a chip to eat
            if (!isNaN(chipLocation)) {

              let finalDestination = (chipLocation + dieValue)

              if (chipLocation <= boardDet[2] && finalDestination > boardDet[2]) {

                finalDestination = NaN

              } else {

                finalDestination = finalDestination % 52

              }

              console.log(finalDestination);

              console.log(dieValue);

            }

          }

        }

        checkChipAgainstDie(dieData[0])

        // console.log(data);
        console.log("I'm an AI");

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

            while (!nextPlayer.playing) {

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

        let boardData = await BoardCtrl.fetchData()

        await loadBoardColors(boardData)

        await setBoardChips(boardData)

        while (true) {

          let boardData = await BoardCtrl.fetchData()

          const player = boardData.players.find(item => item.turn)

          await BoardCtrl.loadBoardText(boardData, `${player.name} Turn`)

          if (player.isHuman) {

            await queryPlayerDie(boardData)

            const dieData = await spinTheDie(boardData)

            if (aChipCanMove(boardData, dieData)) {

              await displayDieData(boardData, dieData)

              await configureDieChoosing(boardData, dieData)

            } else {

              noChipCanMove()

            }

          } else {

            // const dieData = await spinTheDie(boardData)
            const dieData = [6, 3]

            if (aChipCanMove(boardData, dieData)) {

              await moveAIChip(boardData, dieData)

            } else {

              noChipCanMove()

            }

          }

          await changeTurn()

        }

        console.log('New Turn');

      })

    }


    return {

      saveData: () => saveData(),

      fetchData: () => fetchData(),

      configureTheGame: () => configureTheGame(),

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

    }

  })()

  const applicationCore = async () => {

    let boardData = await BoardCtrl.fetchOriginalData()

    BoardCtrl.setData(boardData)

    await BoardCtrl.configureTheGame()

    console.log('Board Loaded');

  }

  return {
    init: () => {

      sizeEvents()

      applicationCore()

      console.log('Second application is successfully running...')

    }
  }
})
  (UICtrl, APICtrl, GlobalCtrl, SpecialCtrl, WebSocketCtrl, MessageCtrl)


// Initialize Application
document.addEventListener('DOMContentLoaded', Application.init)