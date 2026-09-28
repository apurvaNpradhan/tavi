//#region src/components/heading/utils/spaces.ts
const withMargin = (props) => {
	const candidates = [
		withSpace(props.m, ["margin"]),
		withSpace(props.mx, ["marginLeft", "marginRight"]),
		withSpace(props.my, ["marginTop", "marginBottom"]),
		withSpace(props.mt, ["marginTop"]),
		withSpace(props.mr, ["marginRight"]),
		withSpace(props.mb, ["marginBottom"]),
		withSpace(props.ml, ["marginLeft"])
	];
	const mergedStyles = {};
	for (const style of candidates) if (Object.keys(style).length > 0) Object.assign(mergedStyles, style);
	return mergedStyles;
};
const withSpace = (value, properties) => {
	const styles = {};
	if (value === void 0) return styles;
	if (Number.isNaN(Number.parseFloat(String(value)))) return styles;
	for (const property of properties) styles[property] = `${value}px`;
	return styles;
};
//#endregion
exports.withMargin = withMargin;
