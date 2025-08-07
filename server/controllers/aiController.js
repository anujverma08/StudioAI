import OpenAI from "openai";
import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import pdf from "pdf-parse/lib/pdf-parse.js";

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const FREE_LIMIT = 5; // Define your free usage limit

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth; // Fixed: removed () call
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // Fixed: proper free usage logic
    if (plan !== "premium" && free_usage >= FREE_LIMIT) {
      return res.status(403).json({
        success: false,
        message:
          "Free usage limit exceeded. Upgrade to premium for more requests.",
      });
    }

    // Fixed: renamed variable to    avoid conflict
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: length,
    });
    if (!response.choices || response.choices.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No response from AI.",
      });
    }

    // Fixed: using correct variable name
    const content = response.choices[0].message.content;
    console.log("Generated content:", content);
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, ${prompt}, ${content}, 'article')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.status(200).json({ success: true, content });
  } catch (error) {
    console.error("Error generating article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate article.",
    });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth; // Fixed: removed () call
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // Fixed: proper free usage logic
    if (plan !== "premium" && free_usage >= FREE_LIMIT) {
      return res.status(403).json({
        success: false,
        message:
          "Free usage limit exceeded. Upgrade to premium for more requests.",
      });
    }

    // Fixed: renamed variable to    avoid conflict
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    });
    if (!response.choices || response.choices.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No response from AI.",
      });
    }

    // Fixed: using correct variable name
    const content = response.choices[0].message.content;

    console.log("Generated content:", content);
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1,
        },
      });
    }

    res.status(200).json({ success: true, content });
  } catch (error) {
    console.error("Error generating article:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate article.",
    });
  }
};

export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth; // Fixed: removed () call
    const { prompt, publish } = req.body;
    const plan = req.plan;

    // Fixed: proper free usage logic
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    // Fixed: renamed variable to    avoid conflict
    const formData = new FormData();
    formData.append("prompt", prompt);
    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
        responseType: "arraybuffer",
      }
    );

    const base64Image = `data:image/png;base64,${Buffer.from(
      data,
      "binary"
    ).toString("base64")}`;

    const { secure_url } = await cloudinary.uploader.upload(base64Image);

    console.log("Generated content:", secure_url);
    await sql`INSERT INTO creations (user_id, prompt, content, type, publish) 
                  VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${
      publish ?? false
    })`;

    res.status(200).json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate image.",
    });
  }
};

export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth; // Fixed: removed () call
    const { image } = req.file;
    const plan = req.plan;

    // Fixed: proper free usage logic
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: "background_removal",
          background_removal: "remove_the_background",
        },
      ],
    });

    console.log("Generated content:", secure_url);

    await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, 'Remove background from Image, ${secure_url}, 'image')`;

    res.status(200).json({ success: true, content: secure_url });
  } catch (error) {
    console.error("Error removing background:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove background.",
    });
  }
};

export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { object } = req.body; // Fixed: removed () call
    const { image } = req.file;
    const plan = req.plan;

    // Fixed: proper free usage logic
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    const { public_id } = await cloudinary.uploader.upload(image.path);
    const image_url = cloudinary.url(public_id, {
      transformation: [
        {
          effect: `gen_remove:${object}`,
        },
      ],
      resource_type: "image",
    });

    console.log("Generated content:", image_url);

    await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, ${`Removed ${object} from Image`}, ${image_url}, 'image')`;

    res.status(200).json({ success: true, content: image_url });
  } catch (error) {
    console.error("Error removing object:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove object.",
    });
  }
};

export const resumeReview = async (req, res) => {
  try {
    const { userId } = req.auth;
    const resume = req.file;
    const plan = req.plan;

    // Fixed: proper free usage logic
    if (plan !== "premium") {
      return res.status(403).json({
        success: false,
        message: "This feature is only available for premium users.",
      });
    }

    if (resume.size > 5 * 1024 * 1024) {
      // 5MB limit
      return res.status(400).json({
        success: false,
        message: "Resume file size exceeds the limit of 5MB.",
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);
    const prompt = `As an expert career advisor, analyze this resume and provide structured feedback: **RESUME:**${pdfData.text} **PROVIDE:**
    1. **Strengths** (3-4 key points)
    2. **Critical Issues** (3-4 main problems)
    3. **Improvement Actions** (5 specific, actionable items)
    4. **Rewrite Examples** (2-3 before/after bullet point improvements)
    5. **ATS Optimization** (keyword and formatting suggestions)
    6. **Overall Score** (X/10 with brief justification)
    Focus on actionable advice that will immediately improve the resume's impact and ATS compatibility.`;

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash-exp",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: prompt.length + 500, // Adjusted to allow for detailed response
    });
    if (!response.choices || response.choices.length === 0) {
      return res.status(500).json({
        success: false,
        message: "No response from AI.",
      });
    }
    const content = response.choices[0].message.content;
    console.log("Generated content:", content);

    await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

    res.status(200).json({ success: true, content });
  } catch (error) {
    console.error("Error reviewing resume:", error);
    res.status(500).json({
      success: false,
      message: "Failed to review resume.",
    });
  }
};
