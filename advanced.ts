//% weight=10 color=#ff8000 icon="\uf1eb" block="ESP Advanced"
namespace rest {
    // Flag indikator apakah ESP telah terhubung atau tidak
    let espConnected = false

    // buffer data yang masuk
    let receivedData = ""

    // return untuk memberitahu apakah command berhasil atau tidak
    let result = false
    
    enum Esp {
    //% block="ESP32"
    ESP32,
    //% block="ESP8266"
    ESP8266
    }


    // Mengirim AT Command ke ESP dengan ekspektasi response
    //% blockHidden=true
    //%blockId=esp_send_command
    export function sendCommand(command: string, expected_response: string = null, timeout: number = 100): boolean {
        // memastikan command sebelumnya selesai
        basic.pause(10)

        // Kosongkan buffer
        serial.readString()
        receivedData = ""


        // Mengirim Command ke ESP
        serial.writeString(command + "\r\n")

        // menghitung waktu tunggu timeout
        let waktuMulai = input.runningTime()

        // Jika pengguna tidak mengharapkan expected_response, langsung anggap berhasil, return true
        if (expected_response == null) {
            return true
        }


        while (true) {
            // Ketika tidak mendapat respons lebih dari timeout hentikan looping
            if (input.runningTime() - waktuMulai > timeout) {
                break
            }

            // Menerima data dari ESP 
            receivedData += serial.readString()

            // Cek data yang masuk apakah sesuai atau tidak dengan response yang diharapkan
            if (receivedData.includes("\r\n")) {
                // Jika sesuai dengan respons yang diharapkan
                if (receivedData.slice(0, receivedData.indexOf("\r\n")).includes(expected_response)) {
                    result = true
                    break
                }

                // Jika kita mengharapkan "OK" tetapi menerima "ERROR", maka hentikan looping
                if (expected_response == "OK") {
                    if (receivedData.slice(0, receivedData.indexOf("\r\n")).includes("ERROR")) {
                        result = false
                        break
                    }
                }

                receivedData = receivedData.slice(receivedData.indexOf("\r\n")+2)
            }
        }

        return result
    }


    // Mengambil response dari ESP
    //% blockHidden=true
    //% blockId=esp_get_response
    export function  getResponse(expected_response: string = "", timeout: number = 100): string {
        let waktuMulai  = input.runningTime()
        let buffer = ""
        
        while ((input.runningTime() - waktuMulai) < timeout) {
            // Mengambil potongan data dari readString
            let chunk = serial.readString()
            // Jika terdapat potongan data, maka simpan di variable buffer
            if (chunk.length > 0) {
                buffer += chunk

                // Response yang diinginkan
                if (expected_response != "") {
                    // Jika di dalam buffer terdapat response yang diinginkan
                    if (buffer.includes(expected_response)) {
                        basic.pause(100)
                        buffer += serial.readString()
                        return buffer
                    }
                }
            }
            basic.pause(10)
        }
        return expected_response == "" ? buffer : ""
    }


    //% blockHidden=true
    //% blockId=esp8266_format_url
    export function formatUrl(url: string): string {
        url = url.replaceAll("%", "%25")
        url = url.replaceAll(" ", "%20")
        url = url.replaceAll("!", "%21")
        url = url.replaceAll("\"", "%22")
        url = url.replaceAll("#", "%23")
        url = url.replaceAll("$", "%24")
        url = url.replaceAll("&", "%26")
        url = url.replaceAll("'", "%27")
        url = url.replaceAll("(", "%28")
        url = url.replaceAll(")", "%29")
        url = url.replaceAll("*", "%2A")
        url = url.replaceAll("+", "%2B")
        url = url.replaceAll(",", "%2C")
        url = url.replaceAll("-", "%2D")
        url = url.replaceAll(".", "%2E")
        url = url.replaceAll("/", "%2F")
        url = url.replaceAll(":", "%3A")
        url = url.replaceAll(";", "%3B")
        url = url.replaceAll("<", "%3C")
        url = url.replaceAll("=", "%3D")
        url = url.replaceAll(">", "%3E")
        url = url.replaceAll("?", "%3F")
        url = url.replaceAll("@", "%40")
        url = url.replaceAll("[", "%5B")
        url = url.replaceAll("\\", "%5C")
        url = url.replaceAll("]", "%5D")
        url = url.replaceAll("^", "%5E")
        url = url.replaceAll("_", "%5F")
        url = url.replaceAll("`", "%60")
        url = url.replaceAll("{", "%7B")
        url = url.replaceAll("|", "%7C")
        url = url.replaceAll("}", "%7D")
        url = url.replaceAll("~", "%7E")
        return url
    }


    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_is_esp8266_initialized
    //% block="Is ESP Connect ?"
    export function espConnect(): boolean {
        return espConnected
    }


    //% weight=30
    //% blockGap=8
    //% blockId=connect_to_esp
    //% block="connect to ESP: TX %tx RX %rx Baudrate %baudrate Type %type"
    export function connect(tx: SerialPin, rx: SerialPin, baudrate: BaudRate, type: Esp = Esp.ESP32) {
        // Menghubungkan Serial Port
        serial.redirect(tx, rx, baudrate)
        serial.setRxBufferSize(128)
        serial.setTxBufferSize(128)

        // Reset status koneksi ESP
        espConnected = false

        // Restore ESP ke factory settings, jika gagal return
        if (sendCommand("AT+RESTORE", "ready", 5000) == false) return 
        
        // Matikan Echo, jika gagal return 
        if (sendCommand("ATE0", "OK") == false) return

        // inisialisasi berhasil
        espConnected = true
    }

    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_connect_wifi
    //% block="connect to WiFi: SSID %ssid Password %password"
    export function connectWiFi(ssid: string, password: string) {
        // Atur ke mode station
        sendCommand("AT+CWMODE=1", "OK")
    
        // Hubungkan ke WiFi
        sendCommand("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"", "OK", 20000)
    }


    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_is_wifi_connected
    //% block="WiFi connected"
    export function isWifiConnected(): boolean {
        // informasi status 
        sendCommand("AT+CIPSTATUS")
        let status = getResponse("STATUS:", 1000)

        // Menunggu hingga menerima "OK"
        getResponse("OK")

        // Me-return status koneksi wifi
        if ((status == "") || status.includes(
            "STATUS:5")) {
            return false
        } else {
            return true
        }
    }


    export function rawCommand(cmd: string, timeout: number = 100, expected_response: string = "OK"): string {
        // Penyimpanan data response dari ESP
        let buffer = ""
        let waktuMulai = input.runningTime()

        // jalankan command
        serial.writeString(cmd + "\r\n")
        basic.pause(2000)



        while ((input.runningTime() - waktuMulai) < timeout) {
            let chunk = serial.readString()
            if (chunk.length > 0) {
                buffer += chunk
            }

            if (expected_response != "") {
                if (buffer.includes(expected_response)) {
                    basic.pause(100)
                    buffer += serial.readString()
                    return buffer
                }
            }
        }
        // Simpan data response dari ESP
        buffer = serial.readString()

        return buffer
    }




}