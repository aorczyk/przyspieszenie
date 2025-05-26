bluetooth.startUartService()

bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.House)
})

let commandValue = 0
let commandName = ""
let commadParts: string[] = []
let command = ""
let running = false;
let maxTime = 1;
let samplingTime = 50;
let measure = false;
let data: string[] = []
let startTime = 0;
let trigger = false;
let silent = false;

music.setVolume(50)

function start() {
    if (!running) {
        running = true
        basic.showArrow(ArrowNames.South)

        bluetooth.uartWriteString(['maxTime', maxTime, '\n'].join(','))
        bluetooth.uartWriteString(['samplingTime', samplingTime,'\n'].join(','))

        if (!silent) {
            music.play(music.tonePlayable(Note.C, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        }
    }
}

input.onButtonPressed(Button.A, function () {
    start()
})

input.onButtonPressed(Button.B, function() {
    running = false
    basic.clearScreen()
})

function send(text: String) {
    bluetooth.uartWriteString(text + '\n')
}

bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    command = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
    commadParts = command.split("=")
    commandName = commadParts[0]
    commandValue = parseFloat(commadParts[1])

    if (commandName == "-v") {
        bluetooth.uartWriteString('clearData' + '\n')
    }

    if (commandName == "a" || commandName == "start") {
        start()
    }
    
    if (commandName == "maxTime") {
        maxTime = commandValue
        bluetooth.uartWriteString(maxTime + '\n')
    }

    if (commandName == "samplingTime") {
        samplingTime = commandValue
        bluetooth.uartWriteString(samplingTime + '\n')
    }

    if (commandName == "measure" || commandName == "m") {
        measure = !measure

        if (!silent) {
            music.play(music.tonePlayable(Note.C, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        }
    }

    if (commandName == "trigger" || commandName == "t") {
        start()
        basic.pause(500)
        trigger = true
    }

    if (commandName == "silent" || commandName == "s") {
        silent = !silent
        bluetooth.uartWriteString(silent + '\n')
    }
})



function getTime() {
    return input.runningTime()
}

basic.forever(function () {
    let distance = sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters) / 100

    if (distance > 0 && distance < 7) {
        if (running && !trigger && distance < 0.10) {
            trigger = true;
        }

        if (running && trigger) {
            bluetooth.uartWriteString('clearData' + '\n')
            if (!silent) {
                music.play(music.tonePlayable(Note.A, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
            }

            startTime = input.runningTime()
            let time = startTime;
            let fallTime = 0;
            let distance = 0;

            while (fallTime <= maxTime) {
                distance = sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters) / 100
                time = input.runningTime()
                fallTime = (time - startTime) / 1000

                if (distance > 0 && distance < 7) {
                    data.push([
                        time, 
                        fallTime, 
                        Math.pow(fallTime, 2), 
                        distance
                    ].join(','))
                    basic.pause(samplingTime)
                } else {
                    basic.pause(20)
                }
            }

            if (!silent) {
                music.play(music.tonePlayable(Note.A, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
            }

            basic.showIcon(IconNames.Yes)

            for (let row of data) {
                bluetooth.uartWriteString(row + '\n')
                basic.pause(20)
            }

            data = []
            running = false
            trigger = false
        }

        if (measure) {
            bluetooth.uartWriteString([input.runningTime(), distance].join(',') + '\n')
        }
    }

    if (measure) {
        basic.pause(samplingTime)
    } else {
        basic.pause(500)
    }
})