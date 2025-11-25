export const formatNumber = (value) => {
	const number = Number(value);

	if (isNaN(number)) return value;

	return number.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export const formatToPeso = (value) => {
	const number = Number(value);

	if (isNaN(number)) return value;

	return `₱${number.toLocaleString("en-PH", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
};
