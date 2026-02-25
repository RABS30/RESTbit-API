//% weight=10 color=#e0dd10 icon="\uf1eb" block="ESP8266"
namespace esp8266 {

    let _rxPin: SerialPin
    let _txPin: SerialPin

    /**
     * Initialize ESP8266 serial connection
     */
    //% block="init ESP8266 RX %rx TX %tx baud %baud"
    export function init(rx: SerialPin, tx: SerialPin, baud: BaudRate): String {
        _rxPin = rx
        _txPin = tx
        serial.redirect(tx, rx, baud)
        basic.pause(2000)
        sendCommand("AT")
        basic.pause(2000)
        sendCommand("ATE0")

        return serial.readString()
    }

    /**
     * Send raw AT command
     */
    //% block="send AT command %cmd"
    export function sendCommand(cmd: string): string {
        serial.writeString(cmd + "\r\n")
        basic.pause(2000)
        return serial.readString()
    }

    /**
     * Connect to WiFi
     */
    //% block="connect wifi ssid %ssid password %password"
    export function connectWiFi(ssid: string, password: string): string {
        sendCommand("AT+CWMODE=1")
        basic.pause(1000)
        serial.writeString("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"\r\n")
        basic.pause(6000)
        return serial.readString()
    }

    /**
     * Send HTTP GET request
     */
    //% block="http get host %host path %path"
    export function httpGet(host: string, path: string): string {
        sendCommand("AT+CIPMUX=0")
        serial.writeString("AT+CIPSTART=\"TCP\",\"" + host + "\",80\r\n")
        basic.pause(3000)

        let request = "GET " + path + " HTTP/1.1\r\nHost: " + host + "\r\n\r\n"

        serial.writeString("AT+CIPSEND=" + request.length + "\r\n")
        basic.pause(2000)
        serial.writeString(request)

        basic.pause(5000)
        return serial.readString()
    }

}

// namespace esp {
//     // Variable untuk mengetahui apakah esp8266 berhasil terinisialisasi
//     let espInitialized = false;

//     // Buffer untuk menerima data dari UART
//     let dataCome = ""

//     export function sendCommand(command: string, response: string = null, timeout: number = 100): boolean {
//         // Jeda sesaat untuk menunggu command sebelumnya
//         basic.pause(10);

//         // Mengosongkan buffer data yang diterima UART
//         serial.readString()
//         dataCome = ""

//         // Mengirim command dan diakhiri dengan "\r\n"
//         serial.writeString(command + "\r\n")

//         //
        

//         return
//     }

// }


