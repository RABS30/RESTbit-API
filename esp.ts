namespace esp {
    const FONNTE_API_URL = "api.fonnte.com"

    let fonnteMessageSent = false

    /**
     * Return true if Fonnte message was sent successfully.
     */
    //% subcategory="Fonnte"
    //% block="Fonnte message sent"
    export function isFonnteMessageSent(): boolean {
        return fonnteMessageSent
    }

    /**
     * Send WhatsApp message via Fonnte
     */
    //% subcategory="Fonnte"
    //% block="send WA Fonnte target %target message %message"
    export function sendFonnteMessage(target: string, message: string) {

        fonnteMessageSent = false

        if (isWifiConnected() == false) return


        sendCommand("AT+CIPSSLCCONF=0")
        
        // Open SSL connection
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + FONNTE_API_URL + "\",443", "OK", 10000) == false) return

        // Prepare POST body
        let body = "target=" + target + "&message=" + message

        // Construct HTTP POST request
        let data = "POST /send HTTP/1.1\r\n"
        data += "Host: " + FONNTE_API_URL + "\r\n"
        data += "Authorization: uvMKVqTmBjdrMoryFZBM\r\n"
        data += "Content-Type: application/x-www-form-urlencoded\r\n"
        data += "Content-Length: " + body.length + "\r\n\r\n"
        data += body

        // Inform ESP8266 how many bytes to send
        sendCommand("AT+CIPSEND=" + data.length)

        // Send request
        sendCommand(data)

        // Check if data sent successfully
        if (getResponse("SEND OK", 3000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 2000)
            return
        }

        // Check HTTP success (status 200)
        let response = getResponse("200 OK", 5000)
        if (response == "") {
            sendCommand("AT+CIPCLOSE", "OK", 2000)
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 2000)

        fonnteMessageSent = true
    }
}