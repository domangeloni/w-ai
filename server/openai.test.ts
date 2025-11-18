import { describe, it, expect } from "vitest";
import { invokeLLM } from "./_core/llm";

describe("OpenAI API Integration", () => {
  it("should validate OpenAI API key by making a simple request", async () => {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "user",
            content: "Respond with 'API key valid' if you can read this.",
          },
        ],
      });

      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.choices.length).toBeGreaterThan(0);
      expect(response.choices[0].message).toBeDefined();
      
      console.log("✅ OpenAI API key is valid and working");
    } catch (error) {
      console.error("❌ OpenAI API key validation failed:", error);
      throw new Error(
        "OpenAI API key is invalid or missing. Please provide a valid OPENAI_API_KEY."
      );
    }
  });
});
