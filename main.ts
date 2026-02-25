//% weight=10 color=#ff8000 icon="\uf1eb" block="REST API"
namespace restapi {

    /**
     * Show Hello text
     */
    //% block="say hello"
    export function sayHello(): void {
        basic.showString("Hello")
    }

}