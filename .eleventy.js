// For Minify
const htmlmin = require("html-minifier-terser");

// luxon
const { DateTime } = require("luxon");

// RSS
const { feedPlugin } = require("@11ty/eleventy-plugin-rss");

// Config
module.exports = function (eleventyConfig) {
	// Passthrough
	eleventyConfig.addPassthroughCopy("bundle.css");
	eleventyConfig.addPassthroughCopy("ico");
	eleventyConfig.addPassthroughCopy("asset/img");
	eleventyConfig.addPassthroughCopy("asset/art");
	eleventyConfig.addPassthroughCopy("CNAME");
	eleventyConfig.addPassthroughCopy("robots.txt");

	// Modified version of https://bnijenhuis.nl/notes/dates-in-eleventy/
	eleventyConfig.addFilter("readablePostDate", (dateObj) => {
		return DateTime.fromJSDate(dateObj, {
			zone: "America/New_York",
		}).setLocale('en').toLocaleString(DateTime.DATETIME_FULL);
	});

	// Shortcode
	// Credit: https://www.aleksandrhovhannisyan.com/blog/custom-markdown-components-in-11ty/

	// Blockquote
	eleventyConfig.addPairedShortcode('quote', (text) => `<blockquote class="quote">${text}</blockquote>`);

	// Blockquote Alert
	eleventyConfig.addPairedShortcode('quotewarning', (text) => `<blockquote class="quote warning">${text}</blockquote>`);

	// End Shortcode

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

	// RSS
	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", // or "rss", "json"
		outputPath: "/notes/feed.xml",
		collection: {
			name: "post", // iterate over `collections.posts`
			limit: 0,     // 0 means no limit
		},
		metadata: {
			language: "en-US",
			title: "Notes",
			subtitle: "Just a bunch of ramblings or blog posts.",
			base: "https://TheCrafters001.com/",
			author: {
				name: "TheCrafters001",
				email: "", // Optional
			}
		}
	});
};