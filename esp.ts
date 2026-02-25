//% weight=10 color=#e0dd10 icon="\uf1eb" block="ESP"
namespace esp {

    /**
     * Show Hello text
     */
    //% block="say hello"
    export function sayHello(): void {
        basic.showString("Hello")
    }

}