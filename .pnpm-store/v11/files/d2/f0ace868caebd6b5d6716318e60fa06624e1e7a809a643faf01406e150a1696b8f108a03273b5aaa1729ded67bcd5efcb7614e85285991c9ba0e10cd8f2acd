//#region src/components/tailwind/utils/compatibility/sanitize-class-name.ts
const digitToNameMap = {
	"0": "zero",
	"1": "one",
	"2": "two",
	"3": "three",
	"4": "four",
	"5": "five",
	"6": "six",
	"7": "seven",
	"8": "eight",
	"9": "nine"
};
/**
* Replaces special characters to avoid problems on email clients.
*
* @param className - This should not come with any escaped charcters, it should come the same
* as is on the `className` attribute on React elements.
*/
function sanitizeClassName(className) {
	return className.replaceAll("+", "plus").replaceAll("[", "").replaceAll("%", "pc").replaceAll("]", "").replaceAll("(", "").replaceAll(")", "").replaceAll("!", "imprtnt").replaceAll(">", "gt").replaceAll("<", "lt").replaceAll("=", "eq").replace(/^[0-9]/, (digit) => {
		return digitToNameMap[digit];
	}).replace(/[^a-zA-Z0-9\-_]/g, "_");
}
//#endregion
export { sanitizeClassName };
