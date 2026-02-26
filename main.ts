//% weight=10 color=#e0dd10 icon="\uf1eb" block="REST API"
namespace restapi {

    const FONNTE_API_URL = "api.fonnte.com"
    let fonnteMessageSent = false

    // =========================
    // DEBUG LOGGER
    // =========================
    function debugLog(msg: string) {
        serial.writeLine("[DEBUG] " + msg)
    }

    // =========================
    // URL ENCODE (SIMPLE SAFE)
    // =========================
    function urlEncode(text: string): string {
        let result = ""

        for (let i = 0; i < text.length; i++) {
            let c = text.charAt(i)
            let code = text.charCodeAt(i)

            if (
                (code >= 48 && code <= 57) ||  // 0-9
                (code >= 65 && code <= 90) ||  // A-Z
                (code >= 97 && code <= 122) || // a-z
                c == "-" || c == "_" || c == "." || c == "~"
            ) {
                result += c
            } else {
                let hex = code.toString().toUpperCase()
                if (hex.length == 1) hex = "0" + hex
                result += "%" + hex
            }
        }

        return result
    }

    // =========================
    // STATUS CHECK
    // =========================
    //% subcategory="Fonnte"
    //% block="Fonnte message sent"
    export function isFonnteMessageSent(): boolean {
        return fonnteMessageSent
    }

    // =========================
    // MAIN FUNCTION
    // =========================
    //% subcategory="Fonnte"
    //% block="send WA Fonnte target %target message %message"
    export function sendFonnteMessage(target: string, message: string) {

        fonnteMessageSent = false

        debugLog("Starting send WA process")

        if (isWifiConnected() == false) {
            debugLog("WiFi not connected")
            return
        }

        debugLog("WiFi OK")

        // Ensure single connection
        sendCommand("AT+CIPMUX=0", "OK", 5000)
        sendCommand("AT+CIPMODE=0", "OK", 5000)

        // Optional: disable SSL cert validation (IMPORTANT for ESP-AT v4)
        sendCommand("AT+CIPSSLCCONF=0", "OK", 5000)

        // Test DNS
        debugLog("Resolving domain...")
        let dnsResp = sendCommand("AT+CIPDOMAIN=\"" + FONNTE_API_URL + "\"", "OK", 10000)
        if (dnsResp == false) {
            debugLog("DNS FAILED")
            return
        }
        debugLog("DNS OK")

        // Open SSL
        debugLog("Opening SSL connection...")
        let openResp = sendCommand("AT+CIPSTART=\"SSL\",\"" + FONNTE_API_URL + "\",443", "OK", 20000)

        if (openResp == false) {
            debugLog("CIPSTART FAILED")
            debugLog(getResponse("", 10000))
            sendCommand("AT+CIPCLOSE", "OK", 5000)
            return
        }

        debugLog("SSL CONNECTED")

        // Prepare body
        let body = "target=" + urlEncode(target) +
                   "&message=" + urlEncode(message)

        debugLog("Body: " + body)

        let data = ""
        data += "POST /send HTTP/1.1\r\n"
        data += "Host: " + FONNTE_API_URL + "\r\n"
        data += "Authorization: uvMKVqTmBjdrMoryFZBM\r\n"
        data += "Content-Type: application/x-www-form-urlencoded\r\n"
        data += "Content-Length: " + body.length + "\r\n"
        data += "Connection: close\r\n\r\n"
        data += body

        debugLog("Total Length: " + data.length)

        // Send length first
        debugLog("Sending CIPSEND...")
        let sendPrompt = sendCommand("AT+CIPSEND=" + data.length, ">", 15000)

        if (sendPrompt == false) {
            debugLog("CIPSEND PROMPT FAILED")
            debugLog(getResponse("", 10000))
            sendCommand("AT+CIPCLOSE", "OK", 5000)
            return
        }

        debugLog("Prompt OK, sending HTTP data")

        // Send actual data
        sendCommand(data)

        let sendResult = getResponse("", 15000)
        debugLog("SEND RESULT: " + sendResult)

        if (sendResult.indexOf("SEND OK") == -1) {
            debugLog("SEND FAILED")
            sendCommand("AT+CIPCLOSE", "OK", 5000)
            return
        }

        debugLog("Waiting HTTP response...")

        let httpResp = getResponse("", 20000)
        debugLog("HTTP RESPONSE: " + httpResp)

        if (httpResp.indexOf("200 OK") != -1) {
            debugLog("MESSAGE SENT SUCCESS")
            fonnteMessageSent = true
        } else {
            debugLog("HTTP FAILED")
        }

        sendCommand("AT+CIPCLOSE", "OK", 5000)

        debugLog("Process finished")
    }
}