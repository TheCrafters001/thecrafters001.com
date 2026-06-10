// For Minify
const htmlmin = require("html-minifier-terser");

// luxon
const { DateTime } = require("luxon");

// RSS
const { feedPlugin } = require("@11ty/eleventy-plugin-rss");

// git commit
const childProcess = require('child_process');

// filesystem
const fs = require('fs');


// Config
module.exports = function (eleventyConfig) {
	// Passthrough
	eleventyConfig.addPassthroughCopy("bundle.css");
	eleventyConfig.addPassthroughCopy("ico");
	eleventyConfig.addPassthroughCopy("asset/img");
	eleventyConfig.addPassthroughCopy("asset/art");
	eleventyConfig.addPassthroughCopy("asset/js/prism.js");
	eleventyConfig.addPassthroughCopy("asset/css/prism.css");
	eleventyConfig.addPassthroughCopy("asset/char/");
	eleventyConfig.addPassthroughCopy("CNAME");
	eleventyConfig.addPassthroughCopy("robots.txt");

	//	https://infosec.exchange/@d3v1an7/116719038502073726
	eleventyConfig.addPairedShortcode("charTalk", function (content, name, expression) {
		const data = fs.readFileSync(`./asset/char/` + name + `.json`, 'utf8');
		
		const char = JSON.parse(data); // NOTE: do things here to find the file based on supplied {name}
		const charName = char.name;
		const charImg = char.expression[expression] || char.expression["failsafe"]; // NOTE: use an object/dict for expressions, not an array!
		/* return `<img src="${charImg}" alt="${charName} is ${expression}"><p>${charName}</p><p>${content}</p>`; */
		return `<table>
    <thead>
        <tr>
            <th class="top-bar" style="text-align:left" colspan="2">${charName}</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="sub-content-page" colspan="1" width="150px" ><img src="${charImg}" alt="${charName} is ${expression}"></td>
            <td class="sub-content-page" colspan="1">${content}</td>
        </tr>
    </tbody>
</table>`;
	});

	// Inverse of above.
	eleventyConfig.addPairedShortcode("charTalkResponse", function (content, name, expression) {
		const data = fs.readFileSync(`./asset/char/` + name + `.json`, 'utf8');
		
		const char = JSON.parse(data); // NOTE: do things here to find the file based on supplied {name}
		const charName = char.name;
		const charImg = char.expression[expression] || char.expression["failsafe"]; // NOTE: use an object/dict for expressions, not an array!
		/* return `<img src="${charImg}" alt="${charName} is ${expression}"><p>${charName}</p><p>${content}</p>`; */
		return `<table>
    <thead>
        <tr>
            <th class="top-bar" style="text-align:right" colspan="2">${charName}</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td class="sub-content-page" colspan="1" style="text-align:right;">${content}</td>
			<td class="sub-content-page" colspan="1" width="150px" ><img src="${charImg}" alt="${charName} is ${expression}" style="transform:scaleX(-1);"></td>
        </tr>
    </tbody>
</table>`;
	});

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

	// Original snippet by https://github.com/BluePraise/magaliechetrit.com	
	// Add a shortcode to get the latest git commit date
    eleventyConfig.addShortcode('lastCommitHash', function () {
        const lastCommitHash = childProcess.execSync(`git rev-parse --short HEAD`).toString().trim();
        return lastCommitHash;
    });
	// Modified version of above shortcode.
    eleventyConfig.addShortcode('lastLongCommitHash', function () {
        const lastCommitHash = childProcess.execSync(`git rev-parse HEAD`).toString().trim();
        return lastCommitHash;
    });

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