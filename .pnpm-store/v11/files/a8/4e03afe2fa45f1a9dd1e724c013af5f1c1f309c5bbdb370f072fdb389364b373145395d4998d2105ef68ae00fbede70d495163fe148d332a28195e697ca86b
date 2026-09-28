const require_runtime = require("../../../../_virtual/_rolldown/runtime.cjs");
const require_is_component = require("./is-component.cjs");
let react = require("react");
react = require_runtime.__toESM(react, 1);
//#region src/components/tailwind/utils/react/map-react-tree.ts
/**
* A function made for deep mapping a React tree from a node, even through its components.
* For all the components it finds, it renders them by directly calling them. This has a few issues
* with hooks, and the only solution is `renderAsync` here, which will probably be done in the future.
*
* @param process - The callback that will be called every time a new element has been reached.
*
* For components, this is going to be called, most of the time, two times. This is because the best
* approach is to process *both* before rendering the components (i.e. on the props.children of a component element)
* and after rendering them because the children themselves might have been modified in the component's
* rendering.
*/
function mapReactTree(value, process) {
	const mapped = react.default.Children.map(value, (node) => {
		if (react.default.isValidElement(node)) {
			const newProps = { ...node.props };
			if (node.props.children && !require_is_component.isComponent(node)) newProps.children = mapReactTree(node.props.children, process);
			const processed = process(react.default.cloneElement(node, newProps, newProps.children));
			if (react.default.isValidElement(processed) && require_is_component.isComponent(processed)) return mapReactTree((typeof processed.type === "object" ? processed.type.render : processed.type)(processed.props), process);
			return processed;
		}
		return process(node);
	});
	return mapped && mapped.length === 1 ? mapped[0] : mapped;
}
//#endregion
exports.mapReactTree = mapReactTree;
