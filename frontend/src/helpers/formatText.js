export const formatFirstLetterToUppercase = (unit) => {
	if (!unit) return "";

	return unit
		.toLowerCase()
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};
