module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("bundle.css");
    eleventyConfig.addPassthroughCopy("ico")
    eleventyConfig.addPassthroughCopy("asset/img")
    eleventyConfig.addPassthroughCopy("asset/art")
    eleventyConfig.addPassthroughCopy(".CNAME")
};