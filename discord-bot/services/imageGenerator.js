const { InferenceClient } = require('@huggingface/inference');

// Initialize the client using your existing environment token
const client = new InferenceClient(process.env.HF_TOKEN);

/**
 * Generates an image using Hugging Face's official Inference SDK
 * @param {string} prompt The text prompt
 * @returns {Promise<Buffer>} The image data buffer for Discord
 */
async function generateImage(prompt) {
    try {
        console.log('🤗 Requesting image via official Hugging Face SDK...');

        if (!process.env.HF_TOKEN) {
            throw new Error("HF_TOKEN is missing from your .env file!");
        }

        // Use your exact SDK setup
        const blob = await client.textToImage({
            provider: "together",
            model: "black-forest-labs/FLUX.1-schnell",
            inputs: prompt,
            parameters: { num_inference_steps: 5 },
        });

        // Convert the web Blob into a Node.js compatible Buffer
        const arrayBuffer = await blob.arrayBuffer();
        return Buffer.from(arrayBuffer);

    } catch (error) {
        throw new Error(`SDK Generation failed: ${error.message}`);
    }
}

module.exports = { generateImage };