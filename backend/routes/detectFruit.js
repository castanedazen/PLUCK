const express = require("express")
const OpenAI = require("openai")

const router = express.Router()

function detectFruitFromText(text = "") {
  const input = String(text).toLowerCase()

  const fruitMap = [
    { fruit: "Lemons", tags: ["citrus", "fresh", "local"], keywords: ["lemon", "lemons", "meyer"] },
    { fruit: "Avocados", tags: ["avocados", "organic", "creamy"], keywords: ["avocado", "avocados"] },
    { fruit: "Oranges", tags: ["citrus", "sweet", "juice"], keywords: ["orange", "oranges", "valencia"] },
    { fruit: "Limes", tags: ["citrus", "tart", "cocktails"], keywords: ["lime", "limes"] },
    { fruit: "Grapefruit", tags: ["citrus", "breakfast", "fresh"], keywords: ["grapefruit"] },
    { fruit: "Strawberries", tags: ["berries", "sweet", "fresh"], keywords: ["strawberry", "strawberries"] },
    { fruit: "Peaches", tags: ["stone-fruit", "sweet", "summer"], keywords: ["peach", "peaches"] },
    { fruit: "Apples", tags: ["orchard", "crisp", "fresh"], keywords: ["apple", "apples"] },
    { fruit: "Pears", tags: ["orchard", "juicy", "fresh"], keywords: ["pear", "pears"] },
    { fruit: "Watermelon", tags: ["melon", "summer", "fresh"], keywords: ["watermelon"] },
    { fruit: "Bananas", tags: ["ripe", "snack", "fresh"], keywords: ["banana", "bananas"] },
  ]

  for (const item of fruitMap) {
    if (item.keywords.some((keyword) => input.includes(keyword))) {
      return {
        fruit: item.fruit,
        confidence: 0.72,
        tags: item.tags,
        title: `Fresh ${item.fruit}`,
        source: "fallback",
      }
    }
  }

  return {
    fruit: "Fruit",
    confidence: 0.3,
    tags: ["fresh", "local"],
    title: "Fresh Local Fruit",
    source: "fallback",
  }
}

router.post("/", async (req, res) => {
  try {
    const { imageUrl, originalName, fileName } = req.body || {}
    const lookupText = [imageUrl, originalName, fileName].filter(Boolean).join(" ")

    if (!process.env.OPENAI_API_KEY) {
      return res.json(detectFruitFromText(lookupText))
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "imageUrl is required when AI detection is enabled." })
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Identify the primary fruit in this image. Return JSON with keys fruit, confidence, tags, and title. Keep fruit plural if appropriate, confidence between 0 and 1, tags as 3 short lowercase tags, and title like 'Fresh Lemons'.",
            },
            {
              type: "input_image",
              image_url: imageUrl,
            },
          ],
        },
      ],
    })

    const text = response.output_text || ""

    try {
      const parsed = JSON.parse(text)
      return res.json({
        fruit: parsed.fruit || "Fruit",
        confidence: Number(parsed.confidence) || 0.8,
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["fresh", "local"],
        title: parsed.title || `Fresh ${parsed.fruit || "Fruit"}`,
        source: "openai",
      })
    } catch {
      return res.json({
        ...detectFruitFromText(text),
        source: "openai-fallback",
      })
    }
  } catch (error) {
    console.error("POST /api/detect-fruit failed:", error)
    res.status(500).json({ error: "Failed to detect fruit." })
  }
})

module.exports = router
