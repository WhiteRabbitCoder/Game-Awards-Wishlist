const fs = require("fs");
const cheerio = require("cheerio");
const path = require("path");

const filePath = path.join(__dirname, "tga.html");

try {
    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);

    const categories = [];
    const content = $(".mw-parser-output");

    content.children("h3").each((i, h3) => {
        const h3El = $(h3);

        const categoryName = h3El.find("a").first().text().trim();
        if (!categoryName) return;

        const nextEl = h3El.next();

        const nominees = [];

        // -------------------------------
        // 💠 FORMATO A: TARJETAS
        // -------------------------------
        if (nextEl.hasClass("awards-flex-container")) {
            nextEl.find(".awards-nominee-card").each((j, card) => {
                const $card = $(card);

                const imgEl = $card.find(".awards-card-image img");
                const imageUrl = imgEl.attr("data-src") || imgEl.attr("src");

                let titleEl = $card.find(".awards-card-title a");
                let gameName = titleEl.text().trim();

                if (!gameName) {
                    gameName = $card.find(".awards-card-title").text().trim();
                }

                const gameLink = titleEl.attr("href") || null;

                const developer = $card.find(".smalltext").text().trim();

                nominees.push({
                    id: gameName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                    name: gameName,
                    developer,
                    link: gameLink,
                    image: imageUrl,
                    winner: false
                });
            });
        }

        // -------------------------------
        // 💠 FORMATO B: LISTAS <ul>
        // -------------------------------
        else if (nextEl.is("ul")) {
            nextEl.find("li").each((j, li) => {
                const text = $(li).text().trim();
                if (!text) return;

                nominees.push({
                    id: text.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                    name: text,
                    developer: null,
                    link: null,
                    image: null,
                    winner: false
                });
            });
        }

        if (nominees.length > 0) {
            categories.push({
                id: categoryName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                name: categoryName,
                nominees
            });
        }
    });

    fs.writeFileSync(
        path.join(__dirname, "tga_data.json"),
        JSON.stringify(categories, null, 2)
    );

    console.log("🔥 Scraping COMPLETO: todas las categorías incluidas");

} catch (err) {
    console.error("❌ Error:", err.message);
}
