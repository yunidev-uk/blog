import path from "path";
import fs from "fs";
import { minify } from "html-minifier-terser";

export default function (eleventyConfig) {
    eleventyConfig.addShortcode("minify", function (filePath) {
        const resolvedPath = path.join(path.dirname(this.page.inputPath), filePath);
        return `<render-include src="${resolvedPath}"></render-include>`;
    });

    eleventyConfig.addTransform("minifyIncludes", async function (content, outputPath) {
        if (!outputPath || !outputPath.endsWith(".html")) return content;

        const placeholderRegex = /<render-include src="([^"]+)"><\/render-include>/g;
        const matches = [...content.matchAll(placeholderRegex)];

        if (!matches.length) return content;

        let newContent = content;

        await Promise.all(
            matches.map(async (match) => {
                const [placeholder, filePath] = match;

                try {
                    const raw = await fs.promises.readFile(filePath, "utf8");
                    const minifiedContent = await minify(raw, {
                        collapseWhitespace: true,
                        removeComments: true,
                        minifyJS: true,
                        minifyCSS: true,
                    });
                    newContent = newContent.replace(placeholder, minifiedContent);
                } catch (err) {
                    console.error(`[Render Transform] Error processing file: ${filePath}`, err);
                    newContent = newContent.replace(placeholder, `<p style="color: red; font-weight: bold;">Error rendering file: ${filePath}</p>`);
                }
            }),
        );

        return newContent;
    },
    );
}