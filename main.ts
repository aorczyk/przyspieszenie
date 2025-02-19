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
let samplingTime = 20;
music.setVolume(50)

function start() {
    if (!running) {
        running = true
        basic.showIcon(IconNames.Target)

        bluetooth.uartWriteString(['maxTime', maxTime, '\n'].join(','))
        bluetooth.uartWriteString(['samplingTime', samplingTime,'\n'].join(','))

        if (!silent) {
            music.play(music.tonePlayable(Note.C, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
        }
    }
}

input.onButtonPressed(Button.B, function() {
    start()
})

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

})

let data: string[] = []
let startTime = 0;
let trigger = false;
let silent = false;

function getTime() {
    return input.runningTime()
}

basic.forever(function () {
    let distance = sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters) / 100

    if (distance > 0 && distance < 7) {
        if (running && !trigger && distance < 0.10) {
            trigger = true;
            if (!silent) {
                music.play(music.tonePlayable(Note.A, music.beat(BeatFraction.Whole)), music.PlaybackMode.UntilDone)
            }
        }

        if (running && trigger) {
            bluetooth.uartWriteString('clearData' + '\n')

            startTime = input.runningTime()
            let time = startTime;
            let fallTime = 0;
            let distance = 0;

            while (fallTime <= maxTime) {
                distance = sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters) / 100
                time = input.runningTime()
                fallTime = (time - startTime) / 1000

                if (distance > 0 && distance < 7) {
                    data.push([time, fallTime, Math.pow(fallTime, 2) / 2, distance].join(','))
                    basic.pause(samplingTime)
                } else {
                    basic.pause(20)
                }
            }

            for (let row of data) {
                bluetooth.uartWriteString(row + '\n')
                basic.pause(20)
            }

            data = []
            running = false
            basic.showIcon(IconNames.Yes)
        }
    }




})