// For Minify
const htmlmin = require("html-minifier-terser");

// luxon
const { DateTime } = require("luxon");

// Config
module.exports = function(eleventyConfig) {
    // Passthrough
    eleventyConfig.addPassthroughCopy("bundle.css");
    eleventyConfig.addPassthroughCopy("ico")
    eleventyConfig.addPassthroughCopy("asset/img")
    eleventyConfig.addPassthroughCopy("asset/art")
    eleventyConfig.addPassthroughCopy("CNAME")
	eleventyConfig.addPassthroughCopy("robots.txt")

    // Minify
    eleventyConfig.addTransform("htmlmin", function (content) {
		if ((this.page.outputPath || "").endsWith(".html")) {
			let minified = htmlmin.minify(content, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true,
			});

			return minified;
		}

		// If not an HTML output, return content as-is
		return content;
	});

	// Modified version of https://bnijenhuis.nl/notes/dates-in-eleventy/
	eleventyConfig.addFilter("readablePostDate", (dateObj) => {
		return DateTime.fromJSDate(dateObj, {
			zone: "America/New_York",
		}).setLocale('en').toLocaleString(DateTime.DATETIME_FULL);
	});
};