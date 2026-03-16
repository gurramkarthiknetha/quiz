const OpenAI = require("openai");
const { asyncHandler, ApiError } = require("../utils");
const { Quiz, QuizAttempt } = require("../models");

// Lazy-load OpenAI client (initialized on first use after dotenv loads)
let openai = null;

const getOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new ApiError("OpenAI API key not configured", 500);
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

/**
 * @desc    Generate quiz questions from text using AI
 * @route   POST /api/generate/quiz
 * @access  Private
 */
const generateQuiz = asyncHandler(async (req, res) => {
  const { text, settings } = req.body;

  if (!text || text.trim().length < 50) {
    throw new ApiError("Please provide at least 50 characters of text", 400);
  }

  const {
    totalQuestions = 10,
    questionTypes = ["MCQ", "TrueFalse", "ShortAnswer"],
    examMode = "General",
    bloomsMode = false,
    difficultyDistribution = { easy: 50, medium: 30, hard: 20 },
  } = settings || {};

  // Calculate questions per difficulty
  const easyCount = Math.round((totalQuestions * difficultyDistribution.easy) / 100);
  const mediumCount = Math.round((totalQuestions * difficultyDistribution.medium) / 100);
  const hardCount = totalQuestions - easyCount - mediumCount;

  const systemPrompt = `You are an expert quiz generator for educational content. Generate exactly ${totalQuestions} questions based on the provided text.

Requirements:
- Question Types to use: ${questionTypes.join(", ")}
- Exam Mode: ${examMode}
- Difficulty Distribution: ${easyCount} Easy, ${mediumCount} Medium, ${hardCount} Hard
${bloomsMode ? "- Include Bloom's Taxonomy levels (Remember, Understand, Apply, Analyze, Evaluate, Create)" : ""}

For each question, provide:
1. type: One of ${questionTypes.join(", ")}
2. question: The question text
3. options: Array of 4 options (only for MCQ type)
4. correctAnswer: The correct answer (must match one of the options for MCQ)
5. difficulty: Easy, Medium, or Hard
6. tag: A relevant topic tag
7. explanation: Brief explanation of why the answer is correct
${bloomsMode ? "8. bloomLevel: The Bloom's Taxonomy level" : ""}

Return ONLY a valid JSON object with this structure:
{
  "questions": [...],
  "topics": ["topic1", "topic2", ...]
}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate questions from this text:\n\n${text}` },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);

    // Validate and add IDs to questions
    const questions = result.questions.map((q, index) => ({
      id: `q_${Date.now()}_${index}`,
      ...q,
      options: q.type === "MCQ" ? q.options : undefined,
      bloomLevel: bloomsMode ? q.bloomLevel : undefined,
    }));

    res.json({
      success: true,
      data: {
        questions,
        topics: result.topics || [],
        settings,
      },
    });
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw new ApiError("Failed to generate quiz. Please try again.", 500);
  }
});

/**
 * @desc    Enhance/regenerate specific questions
 * @route   POST /api/generate/enhance
 * @access  Private
 */
const enhanceQuestions = asyncHandler(async (req, res) => {
  const { questions, sourceText, enhancement } = req.body;

  if (!questions || questions.length === 0) {
    throw new ApiError("Please provide questions to enhance", 400);
  }

  const systemPrompt = `You are an expert quiz editor. Enhance the provided questions based on the requested changes.

Enhancement requested: ${enhancement || "improve quality and clarity"}

Return ONLY a valid JSON object with the enhanced questions:
{
  "questions": [...]
}

Keep the same structure for each question (type, question, options, correctAnswer, difficulty, tag, explanation).`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Original text context:\n${sourceText || "Not provided"}\n\nQuestions to enhance:\n${JSON.stringify(questions, null, 2)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: {
        questions: result.questions,
      },
    });
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw new ApiError("Failed to enhance questions. Please try again.", 500);
  }
});

/**
 * @desc    Extract topics from text
 * @route   POST /api/generate/topics
 * @access  Private
 */
const extractTopics = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim().length < 50) {
    throw new ApiError("Please provide at least 50 characters of text", 400);
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Extract the main topics and key concepts from the provided text. Return ONLY a valid JSON object:
{
  "topics": ["topic1", "topic2", ...],
  "summary": "Brief 2-3 sentence summary of the content"
}`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.5,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw new ApiError("Failed to extract topics. Please try again.", 500);
  }
});

/**
 * @desc    Generate explanation for a question
 * @route   POST /api/generate/explanation
 * @access  Private
 */
const generateExplanation = asyncHandler(async (req, res) => {
  const { question, correctAnswer, sourceText } = req.body;

  if (!question || !correctAnswer) {
    throw new ApiError("Please provide question and correct answer", 400);
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate a clear, educational explanation for why the given answer is correct. Keep it concise but informative. Return ONLY a valid JSON object:
{
  "explanation": "Your explanation here"
}`,
        },
        {
          role: "user",
          content: `Question: ${question}\nCorrect Answer: ${correctAnswer}${sourceText ? `\nContext: ${sourceText}` : ""}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("OpenAI Error:", error);
    throw new ApiError("Failed to generate explanation. Please try again.", 500);
  }
});

module.exports = {
  generateQuiz,
  enhanceQuestions,
  extractTopics,
  generateExplanation,
};
