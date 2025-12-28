import { HtmlBasePlugin } from "@11ty/eleventy";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import mathjaxPlugin from "eleventy-plugin-mathjax";
import minifyEmbedPlugin from "./minify-embed-plugin.js";
import fs from "node:fs";
import path from "node:path";

export default async function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ "public": "/" });
    
    // Dynamically passthrough copy any subdirectories in content/posts
    // IF they contain a .static-post file.
    const postsDir = path.join("content", "posts");
    if (fs.existsSync(postsDir)) {
        const entries = fs.readdirSync(postsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const dirPath = path.join(postsDir, entry.name).replace(/\\/g, "/");
                // Check for marker file
                if (fs.existsSync(path.join(dirPath, ".static-post"))) {
                    // Map content/posts/folder -> posts/folder
                    const outputPath = path.join("posts", entry.name).replace(/\\/g, "/");
                    eleventyConfig.addPassthroughCopy({ [dirPath]: outputPath });
                    
                    // Ignore these folders from template processing so they are just copied
                    eleventyConfig.ignores.add(path.join(dirPath, "**").replace(/\\/g, "/"));
                }
            }
        }
    }

    eleventyConfig.addPlugin(eleventyImageTransformPlugin);
    eleventyConfig.addPlugin(HtmlBasePlugin);
    eleventyConfig.addPlugin(syntaxHighlight);
    eleventyConfig.addPlugin(mathjaxPlugin);
    eleventyConfig.addPlugin(minifyEmbedPlugin); // This NEEDS to go last

    eleventyConfig.setInputDirectory("./content");
    eleventyConfig.setIncludesDirectory("../_includes");
    eleventyConfig.setDataDirectory("../_data");

    eleventyConfig.setTemplateFormats(["md", "njk", "html", "liquid", "11ty.js"]);

    eleventyConfig.addFilter("formatDate", date => {
        return new Intl.DateTimeFormat("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    });

    eleventyConfig.on('eleventy.after', async ({ dir }) => {
        const removeMarkerFiles = (directory) => {
             if (!fs.existsSync(directory)) return;
             const files = fs.readdirSync(directory);
             for (const file of files) {
                 const fullPath = path.join(directory, file);
                 if (fs.statSync(fullPath).isDirectory()) {
                     removeMarkerFiles(fullPath);
                 } else if (file === '.static-post') {
                     fs.unlinkSync(fullPath);
                 }
             }
        };
        removeMarkerFiles(dir.output);
    });

    return {
        pathPrefix: "/blog/"
    }
}