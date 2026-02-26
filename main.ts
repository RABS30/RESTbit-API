//% weight=10 color=#e0dd10 icon="\uf1eb" block="REST API"
namespace restapi {

    const FONNTE_API_URL = "api.fonnte.com"
    let fonnteMessageSent = false

    //% subcategory="Fonnte"
    //% block="Fonnte message sent"
    export function isFonnteMessageSent(): boolean {
        return fonnteMessageSent
    }

    function urlEncode(text: string): string {
        let encoded = ""

        for (let i = 0; i < text.length; i++) {
            let c = text.charAt(i)

            if (c == " ") encoded += "%20"
            else if (c == "\n") encoded += "%0A"
            else if (c == "\r") encoded += "%0D"
            else if (c == "&") encoded += "%26"
            else if (c == "=") encoded += "%3D"
            else encoded += c
        }

        return encoded
    }

    //% subcategory="Fonnte"
    //% block="send WA Fonnte target %target message %message"
    export function sendFonnteMessage(target: string, message: string) {

        fonnteMessageSent = false

        // Pastikan WiFi sudah connect
        if (isWifiConnected() == false) return

        // Set mode single connection
        sendCommand("AT+CIPMUX=0", "OK", 3000)
        sendCommand("AT+CIPMODE=0", "OK", 3000)

        // Open SSL connection
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + FONNTE_API_URL + "\",443", "OK", 15000) == false) {
            sendCommand("AT+CIPCLOSE", "OK", 3000)
            return
        }

        // Encode parameter agar aman
        let body = "target=" + urlEncode(target) +
                   "&message=" + urlEncode(message)

        // Construct HTTP request
        let data = ""
        data += "POST /send HTTP/1.1\r\n"
        data += "Host: " + FONNTE_API_URL + "\r\n"
        data += "Authorization: uvMKVqTmBjdrMoryFZBM\r\n"
        data += "Content-Type: application/x-www-form-urlencoded\r\n"
        data += "Content-Length: " + body.length + "\r\n"
        data += "Connection: close\r\n\r\n"
        data += body

        // Inform ESP berapa byte yang akan dikirim
        if (sendCommand("AT+CIPSEND=" + data.length, ">", 10000) == false) {
            sendCommand("AT+CIPCLOSE", "OK", 3000)
            return
        }

        // Kirim HTTP data setelah muncul prompt >
        sendCommand(data)

        // Tunggu konfirmasi kirim
        if (getResponse("SEND OK", 10000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 3000)
            return
        }

        // Tunggu response HTTP 200
        if (getResponse("200 OK", 15000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 3000)
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 3000)

        fonnteMessageSent = true
    }
}