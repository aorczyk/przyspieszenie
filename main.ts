bluetooth.startUartService()

bluetooth.onBluetoothConnected(function () {
    basic.showIcon(IconNames.Happy)
})

let commandValue = 0
let commandName = ""
let commadParts: string[] = []
let command = ""
let running = false;
let maxTime = 1;
let minDistance = 10;
let maxDistance = 0;
let samplingTime = 20;

bluetooth.onUartDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    command = bluetooth.uartReadUntil(serial.delimiters(Delimiters.NewLine))
    commadParts = command.split("=")
    commandName = commadParts[0]
    commandValue = parseFloat(commadParts[1])

    if (commandName == "-v") {
        bluetooth.uartWriteString('clearData' + '\n')
    }

    if (commandName == "a" || commandName == "start") {
        running = true
        basic.showIcon(IconNames.Triangle)
        bluetooth.uartWriteString('clearData' + '\n')
    }
    
    if (commandName == "maxTime") {
        maxTime = commandValue
        bluetooth.uartWriteString(maxTime + '\n')
    }

    if (commandName == "minDistance") {
        minDistance = commandValue
        bluetooth.uartWriteString(minDistance + '\n')
    }

    if (commandName == "maxDistance") {
        maxDistance = commandValue
        bluetooth.uartWriteString(maxDistance + '\n')
    }

})

let data: string[] = []
let startTime = 0;

function getTime() {
    return input.runningTime()/1000
}

basic.forever(function () {
    let distance = sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters)
    if (running && distance > minDistance) { //  && distance > 10
        startTime = getTime()
        let time = startTime;
        let dTime = 0;
        let distance = 0;

        while (dTime <= maxTime && (!maxDistance || distance < maxDistance)) {
            distance = sonar.ping(DigitalPin.P1, DigitalPin.P2, PingUnit.Centimeters)
            time = getTime()
            dTime = time - startTime
            data.push([time, dTime, distance, (dTime**2)/2].join(','))
            basic.pause(samplingTime)
        }

        for (let row of data) {
            bluetooth.uartWriteString(row + '\n')
            basic.pause(20)
        }

        data = []
        running = false
        basic.showIcon(IconNames.Yes)
    }
})