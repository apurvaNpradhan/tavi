//#region src/components/tailwind/hooks/use-suspended-promise.ts
const promiseStates = /* @__PURE__ */ new Map();
function useSuspensedPromise(promiseFn, key) {
	const previousState = promiseStates.get(key);
	if (previousState) {
		if ("error" in previousState) throw previousState.error;
		if ("result" in previousState) return previousState.result;
		throw previousState.promise;
	}
	const state = { promise: promiseFn().then((result) => state.result = result).catch((error) => state.error = error) };
	promiseStates.set(key, state);
	throw state.promise;
}
//#endregion
export { useSuspensedPromise };
